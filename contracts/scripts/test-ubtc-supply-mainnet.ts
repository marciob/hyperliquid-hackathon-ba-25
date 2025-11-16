// scripts/test-ubtc-supply-mainnet.ts
// @ts-nocheck

import { network } from "hardhat";

const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463";
const POOL = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b"; // HypurrFi Pool

async function main() {
  const { ethers } = (await network.connect()) as any;

  const [deployer] = await ethers.getSigners();
  const addr = await deployer.getAddress();
  console.log("Deployer:", addr);

  const ubtc = await ethers.getContractAt("IERC20", UBTC, deployer);
  const pool = await ethers.getContractAt("IHypurrFiPool", POOL, deployer);

  const decimals = await ubtc.decimals();
  const bal = await ubtc.balanceOf(addr);
  console.log("UBTC decimals:", decimals.toString());
  console.log("UBTC balance (raw):", bal.toString());

  const amount = 100n; // same as vault test: 1e-6 UBTC (0.1 USD-ish)
  if (bal < amount) {
    console.error("Not enough UBTC for this supply test");
    return;
  }

  console.log("\n--- Approve pool for UBTC ---");
  const tx1 = await ubtc.approve(POOL, amount);
  console.log("approve tx hash:", tx1.hash);
  await tx1.wait();
  console.log("✅ approve mined");

  console.log("\n--- pool.supply(UBTC, amount, deployer, 0) staticCall ---");
  try {
    await pool.supply.staticCall(UBTC, amount, addr, 0);
    console.log("✅ staticCall OK: supply(UBTC) would succeed");
  } catch (e: any) {
    console.error("❌ staticCall reverted");
    console.error("message:", e.message);
    if (e.data) console.error("data:", e.data);
    if (e.errorName) console.error("errorName:", e.errorName);
    if (e.errorArgs) console.error("errorArgs:", e.errorArgs);
    return; // don't send real tx
  }

  console.log(
    "\n--- Sending real supply tx (this will ACTUALLY deposit UBTC into HypurrFi) ---"
  );
  const tx2 = await pool.supply(UBTC, amount, addr, 0);
  console.log("supply tx hash:", tx2.hash);
  await tx2.wait();
  console.log("✅ supply mined");

  const [, , availableBorrowsBase, , , hf] = await pool.getUserAccountData(
    addr
  );
  console.log("\nAfter supply:");
  console.log("  availableBorrowsBase:", availableBorrowsBase.toString());
  console.log("  healthFactor         :", hf.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
