// scripts/show-vault-status-mainnet.ts
import { network } from "hardhat";

const VAULT_ADDRESS = "0xd3C5F422FC8644F0bcC150e5D74a514CFf1abe84"; // from deployment log

async function main() {
  const { ethers } = await network.connect();
  const vault = await ethers.getContractAt("LoopGuardVault", VAULT_ADDRESS);

  const [
    totalShares,
    collateralPrincipal,
    debtPrincipal,
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    healthFactor,
  ] = await vault.getVaultStatus();

  console.log("Vault status (HyperEVM mainnet):");
  console.log("  totalShares           :", totalShares.toString());
  console.log("  collateralPrincipal   :", collateralPrincipal.toString());
  console.log("  debtPrincipal         :", debtPrincipal.toString());
  console.log("  totalCollateralBase   :", totalCollateralBase.toString());
  console.log("  totalDebtBase         :", totalDebtBase.toString());
  console.log("  availableBorrowsBase  :", availableBorrowsBase.toString());
  console.log("  healthFactor          :", healthFactor.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
