// scripts/test-usdxl-borrow-mainnet.ts
// @ts-nocheck

import { network } from "hardhat";

const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463";
const USDXL = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645";
const POOL = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b";

async function main() {
  const { ethers } = (await network.connect()) as any;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);

  const pool = await ethers.getContractAt("IHypurrFiPool", POOL, deployer);

  const accountData = await pool.getUserAccountData(deployerAddress);
  const availableBorrowsBase = accountData.availableBorrowsBase;

  console.log("availableBorrowsBase:", availableBorrowsBase.toString());

  // Try a range of borrow amounts (USDXL units, as the pool expects)
  const candidates = [
    1n,
    10n,
    100n,
    1_000n,
    10_000n,
    100_000n,
    availableBorrowsBase / 10n,
    (availableBorrowsBase * 7n) / 10n,
  ];

  for (const amount of candidates) {
    console.log(`\n--- Testing borrow(amount = ${amount}) staticCall ---`);
    try {
      await pool.borrow.staticCall(
        USDXL,
        amount,
        2, // variable rate
        0,
        deployerAddress
      );
      console.log("✅ staticCall OK for amount =", amount.toString());
    } catch (e: any) {
      console.log("❌ staticCall reverted for amount =", amount.toString());
      console.log("shortMessage:", e.shortMessage);
      console.log("message:", e.message);
      if (e.data) console.log("data:", e.data);
      if (e.info) console.log("info:", e.info);
      if (e.errorName) console.log("errorName:", e.errorName);
      if (e.errorArgs) console.log("errorArgs:", e.errorArgs);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
