/* eslint-disable no-console */
import { network } from "hardhat";

/**
 * Withdraw shares from the vault on HyperEVM mainnet.
 * - Reads user's shares
 * - Picks a conservative portion to withdraw (default: all)
 * - Runs staticCall first; only sends tx if simulation passes.
 *
 * Env:
 *  - VAULT_ADDRESS (required)
 *  - WITHDRAW_SHARES (optional, raw shares; if unset, withdraw all)
 *
 * Usage:
 *  npx hardhat run contracts/scripts/vault-withdraw-mainnet.ts --network hyperEvm
 */
async function main() {
  const VAULT = process.env.VAULT_ADDRESS;
  if (!VAULT) throw new Error("VAULT_ADDRESS env required");

  const { ethers } = (await network.connect()) as any;
  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();

  const vault = await ethers.getContractAt("LoopGuardVault", VAULT, signer);

  const pos = await vault.getUserPosition(addr);
  const userShares: bigint = pos[0];
  console.log("User:", addr);
  console.log("User shares:", userShares.toString());
  if (userShares === 0n) {
    console.log("No shares to withdraw.");
    return;
  }

  const withdrawShares =
    (process.env.WITHDRAW_SHARES ? BigInt(process.env.WITHDRAW_SHARES) : undefined) ??
    userShares;

  console.log("Withdrawing (shares):", withdrawShares.toString());
  if (withdrawShares > userShares) {
    throw new Error("WITHDRAW_SHARES exceeds user shares");
  }

  // Show HF before
  const accBefore = await vault.getVaultAccountData();
  console.log("HF before:", accBefore[5].toString());

  // Static simulate
  console.log("--- staticCall withdraw ---");
  await vault.withdraw.staticCall(withdrawShares);
  console.log("staticCall OK → sending real tx");

  const tx = await vault.withdraw(withdrawShares);
  console.log("tx.hash:", tx.hash);
  await tx.wait();
  console.log("✅ withdraw mined");

  const accAfter = await vault.getVaultAccountData();
  console.log("HF after:", accAfter[5].toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


