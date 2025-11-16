/* eslint-disable no-console */
import { network } from "hardhat";

/**
 * Call rebalance() on HyperEVM mainnet with staticCall first.
 *
 * Env:
 *  - VAULT_ADDRESS (required)
 *
 * Usage:
 *  npx hardhat run contracts/scripts/vault-rebalance-mainnet.ts --network hyperEvm
 */
async function main() {
  const VAULT = process.env.VAULT_ADDRESS;
  if (!VAULT) throw new Error("VAULT_ADDRESS env required");

  const { ethers } = (await network.connect()) as any;
  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();
  console.log("Signer:", addr);

  const vault = await ethers.getContractAt("LoopGuardVault", VAULT, signer);

  const before = await vault.getVaultAccountData();
  console.log("HF before:", before[5].toString());

  console.log("--- staticCall rebalance ---");
  await vault.rebalance.staticCall();
  console.log("staticCall OK → sending real tx");

  const tx = await vault.rebalance();
  console.log("tx.hash:", tx.hash);
  await tx.wait();
  console.log("✅ rebalance mined");

  const after = await vault.getVaultAccountData();
  console.log("HF after:", after[5].toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


