// scripts/deposit-and-loop-local.ts
import { network } from "hardhat";

// Replace with your local fork vault address
const VAULT_ADDRESS = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E";
// UBTC token on HyperEVM
const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463";

async function main() {
  const { ethers } = (await network.connect()) as any;

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  const ubtc = await ethers.getContractAt("IERC20", UBTC, deployer);
  const vault = await ethers.getContractAt(
    "LoopGuardVault",
    VAULT_ADDRESS,
    deployer
  );

  const bal: bigint = await ubtc.balanceOf(deployerAddress);
  console.log("UBTC balance before:", bal.toString());

  if (bal === 0n) {
    throw new Error(
      "Deployer has 0 UBTC on fork. Run fund-ubtc-from-whale-local first."
    );
  }

  // Deposit 50% of our UBTC (raw units – we don't need decimals here)
  let amountIn: bigint = bal / 2n;
  if (amountIn === 0n) {
    amountIn = bal;
  }

  console.log("Depositing (raw units):", amountIn.toString());

  // 1) Approve vault to pull UBTC
  const approveTx = await ubtc.approve(VAULT_ADDRESS, amountIn);
  await approveTx.wait();
  console.log("Approved vault to spend UBTC");

  // 2) Call depositAndLoop
  const tx = await vault.depositAndLoop(amountIn);
  const receipt = await tx.wait();

  console.log("depositAndLoop tx hash:", receipt.hash);

  // 3) Read back vault + user state
  const hf: bigint = await vault.getHealthFactor();
  console.log("Vault HF after deposit:", hf.toString());

  const [userCollateralBase, userDebtBase, userHF, userShares] =
    await vault.getUserPosition(deployerAddress);

  console.log("User position:");
  console.log("  collateralBase:", userCollateralBase.toString());
  console.log("  debtBase      :", userDebtBase.toString());
  console.log("  healthFactor  :", userHF.toString());
  console.log("  shares        :", userShares.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
