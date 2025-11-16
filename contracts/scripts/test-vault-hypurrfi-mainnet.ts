// scripts/test-vault-hypurrfi-mainnet.ts
// @ts-nocheck

import { network } from "hardhat";

const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463";
const USDXL = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645";
const POOL = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b";
const VAULT = "0xd3C5F422FC8644F0bcC150e5D74a514CFf1abe84";

const BORROW_BPS = 7000n;
const BPS = 10000n;

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);
  console.log("Vault   :", VAULT);

  const ubtc = await ethers.getContractAt("IERC20", UBTC, deployer);
  const usdxl = await ethers.getContractAt("IERC20", USDXL, deployer);
  const pool = await ethers.getContractAt("IHypurrFiPool", POOL, deployer);

  const ubtcDecimals = await ubtc.decimals();
  const ubtcBalance = await ubtc.balanceOf(deployerAddress);

  console.log("UBTC decimals:", ubtcDecimals.toString());
  console.log("UBTC balance (raw):", ubtcBalance.toString());

  // Keep it small; you already know 100 raw works on UBTC
  const amountIn = 100n;
  if (ubtcBalance < amountIn) {
    console.error("Not enough UBTC for this test");
    return;
  }

  // 1) Approve pool to pull UBTC from your EOA
  console.log("\n--- approve(POOL, amountIn) for UBTC ---");
  const txApprove = await ubtc.approve(POOL, amountIn);
  console.log("approve tx:", txApprove.hash);
  await txApprove.wait();

  // 2) supply(UBTC, amountIn, VAULT, 0)  [EOA calling, but onBehalfOf = VAULT]
  console.log("\n--- pool.supply(UBTC, amountIn, VAULT, 0) staticCall ---");
  try {
    await pool.supply.staticCall(UBTC, amountIn, VAULT, 0);
    console.log("✅ staticCall OK: supply for VAULT would succeed");
  } catch (e: any) {
    console.error("❌ staticCall reverted on supply-for-vault");
    console.error("message :", e.message);
    if (e.data) console.error("data    :", e.data);
    if (e.shortMessage) console.error("short   :", e.shortMessage);
    if (e.errorName) console.error("error   :", e.errorName);
    if (e.errorArgs) console.error("args    :", e.errorArgs);
    return;
  }

  console.log("--- sending real supply-for-vault tx ---");
  const txSupply = await pool.supply(UBTC, amountIn, VAULT, 0);
  console.log("supply tx:", txSupply.hash);
  await txSupply.wait();

  // 3) Inspect vault's account data after supply
  let [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    ,
    ,
    healthFactor,
  ] = await pool.getUserAccountData(VAULT);

  console.log("\nAfter supply, getUserAccountData(VAULT):");
  console.log("  totalCollateralBase  :", totalCollateralBase.toString());
  console.log("  totalDebtBase        :", totalDebtBase.toString());
  console.log("  availableBorrowsBase :", availableBorrowsBase.toString());
  console.log("  healthFactor         :", healthFactor.toString());

  if (availableBorrowsBase === 0n) {
    console.error(
      "availableBorrowsBase is still 0 for VAULT → HypurrFi isn't treating it as a collateralized user."
    );
    return;
  }

  // 4) Borrow like the vault would: 70% of availableBorrowsBase (capped small)
  let borrowAmount = (availableBorrowsBase * BORROW_BPS) / BPS;
  // Keep borrow small for safety
  if (borrowAmount > 1_000_000n) {
    borrowAmount = 1_000_000n;
  }

  console.log(
    "\nBorrowing USDXL for VAULT with amount =",
    borrowAmount.toString()
  );

  console.log("\n--- pool.borrow(USDXL, amount, 2, 0, VAULT) staticCall ---");
  try {
    await pool.borrow.staticCall(USDXL, borrowAmount, 2, 0, VAULT);
    console.log("✅ staticCall OK: borrow-for-vault would succeed");
  } catch (e: any) {
    console.error("❌ staticCall reverted on borrow-for-vault");
    console.error("message :", e.message);
    if (e.data) console.error("data    :", e.data);
    if (e.shortMessage) console.error("short   :", e.shortMessage);
    if (e.errorName) console.error("error   :", e.errorName);
    if (e.errorArgs) console.error("args    :", e.errorArgs);
    return;
  }

  console.log("--- sending real borrow-for-vault tx ---");
  const txBorrow = await pool.borrow(USDXL, borrowAmount, 2, 0, VAULT);
  console.log("borrow tx:", txBorrow.hash);
  await txBorrow.wait();

  // 5) Final state check
  [totalCollateralBase, totalDebtBase, availableBorrowsBase, , , healthFactor] =
    await pool.getUserAccountData(VAULT);

  const vaultUsdxl = await usdxl.balanceOf(VAULT);

  console.log("\nAfter borrow, getUserAccountData(VAULT):");
  console.log("  totalCollateralBase  :", totalCollateralBase.toString());
  console.log("  totalDebtBase        :", totalDebtBase.toString());
  console.log("  availableBorrowsBase :", availableBorrowsBase.toString());
  console.log("  healthFactor         :", healthFactor.toString());
  console.log("  USDXL balance (vault):", vaultUsdxl.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
