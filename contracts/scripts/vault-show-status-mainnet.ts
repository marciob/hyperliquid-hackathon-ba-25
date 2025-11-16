/* eslint-disable no-console */
import { network } from "hardhat";

/**
 * Show vault aggregated status on HyperEVM mainnet.
 *
 * Env:
 *  - HYPEREVM_RPC_URL (optional; hardhat network config can also set)
 *  - VAULT_ADDRESS (required)
 *
 * Usage:
 *  npx hardhat run contracts/scripts/vault-show-status-mainnet.ts --network hyperEvm
 */
async function main() {
  const VAULT = process.env.VAULT_ADDRESS;
  if (!VAULT) throw new Error("VAULT_ADDRESS env required");

  const { ethers } = await network.connect();
  const vault = await ethers.getContractAt("LoopGuardVault", VAULT);

  const [totalShares, totalCollateralBase, totalDebtBase, availableBorrowsBase, healthFactor] =
    await vault.getVaultStatus();

  const cfg = await vault.getConfig();

  console.log("Vault status (HyperEVM mainnet):");
  console.log("  address               :", VAULT);
  console.log("  totalShares           :", totalShares.toString());
  console.log("  totalCollateralBase   :", totalCollateralBase.toString());
  console.log("  totalDebtBase         :", totalDebtBase.toString());
  console.log("  availableBorrowsBase  :", availableBorrowsBase.toString());
  console.log("  healthFactor          :", healthFactor.toString());
  console.log("  hfTarget              :", cfg[4].toString());
  console.log("  hfSoftFloor           :", cfg[5].toString());
  console.log("  hfHardFloor           :", cfg[6].toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


