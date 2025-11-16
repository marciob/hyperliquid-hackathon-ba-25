import { network } from "hardhat";

const VAULT_ADDRESS = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E";

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
