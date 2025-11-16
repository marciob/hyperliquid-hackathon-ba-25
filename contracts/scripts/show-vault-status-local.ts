import { network } from "hardhat";

const VAULT_ADDRESS = "0xYOUR_LOCAL_VAULT_ADDRESS_HERE";

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

  console.log("Vault status (localhost fork):");
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
