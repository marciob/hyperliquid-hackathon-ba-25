/* eslint-disable no-console */
import { network } from "hardhat";

/**
 * Deposit collateral and borrow USDXL without swaps via depositAndBorrowNoSwap().
 * - Runs staticCall first; only sends tx if simulation passes.
 *
 * Env:
 *  - VAULT_ADDRESS (required)
 *  - SMALL_DEPOSIT_WEI (optional, default 1e15 = 0.001)
 *  - BORROW_BPS (optional, default 1000 = 10% of available borrows)
 *
 * Usage:
 *  npx hardhat run contracts/scripts/vault-deposit-borrow-noswap.ts --network hyperEvm
 */
async function main() {
  const VAULT = process.env.VAULT_ADDRESS;
  if (!VAULT) throw new Error("VAULT_ADDRESS env required");

  const amountIn =
    (process.env.SMALL_DEPOSIT_WEI ? BigInt(process.env.SMALL_DEPOSIT_WEI) : undefined) ??
    1_000_000_000_000_000n; // 0.001 (18 decimals)
  const borrowBps = Number(process.env.BORROW_BPS || "1000"); // 10%

  const { ethers } = (await network.connect()) as any;
  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();
  console.log("Signer:", addr);

  const vault = await ethers.getContractAt("LoopGuardVault", VAULT, signer);

  // Read collateral token from getConfig()
  const cfg = await vault.getConfig();
  const collateral = cfg[0] as string;
  const hype = await ethers.getContractAt("IERC20", collateral, signer);

  const bal: bigint = await hype.balanceOf(addr);
  console.log("Collateral token:", collateral);
  console.log("Balance (raw):", bal.toString());
  console.log("AmountIn (raw):", amountIn.toString(), "BorrowBps:", borrowBps);
  if (bal < amountIn) {
    throw new Error("Insufficient collateral balance for SMALL_DEPOSIT_WEI");
  }

  // Approve if needed
  const allowance: bigint = await hype.allowance(addr, VAULT);
  if (allowance < amountIn) {
    const approveTx = await hype.approve(VAULT, amountIn);
    console.log("approve hash:", approveTx.hash);
    await approveTx.wait();
  }

  // HF before (for logging)
  const before = await vault.getVaultAccountData();
  console.log("HF before:", before[5].toString());

  // Static simulate
  console.log("--- staticCall depositAndBorrowNoSwap ---");
  await vault.depositAndBorrowNoSwap.staticCall(amountIn, borrowBps);
  console.log("staticCall OK → sending real tx");

  const tx = await vault.depositAndBorrowNoSwap(amountIn, borrowBps);
  console.log("tx.hash:", tx.hash);
  await tx.wait();
  console.log("✅ depositAndBorrowNoSwap mined");

  const after = await vault.getVaultAccountData();
  console.log("HF after:", after[5].toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


