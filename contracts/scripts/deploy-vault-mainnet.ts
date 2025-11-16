import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);

  // --- Real HyperEVM addresses ---
  // Collateral (HYPE/WHYPE ERC20) should be provided via env HYPE_ADDRESS
  const collateral = process.env.HYPE_ADDRESS!;
  const debt = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645"; // USDXL
  const pool = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b"; // HypurrFi Pool

  // No DEX router for demo; borrow-only/repay flows handle safety
  const router = "0x0000000000000000000000000000000000000000";

  const hfTarget = ethers.parseUnits("1.9", 18);
  const hfSoftFloor = ethers.parseUnits("1.6", 18);
  const hfHardFloor = ethers.parseUnits("1.4", 18);

  const VaultFactory = await ethers.getContractFactory("LoopGuardVault");

  // Set explicit EIP-1559 fees to avoid provider fee history issues
  const latest = await ethers.provider.getBlock("latest");
  const base: bigint =
    (latest?.baseFeePerGas as bigint) ?? ethers.parseUnits("1", "gwei");
  const priority: bigint = ethers.parseUnits("2", "gwei");
  const feeOverrides = {
    maxPriorityFeePerGas: priority,
    maxFeePerGas: base * 2n + priority,
  };

  const vault = await VaultFactory.deploy(
    collateral,
    debt,
    pool,
    router,
    hfTarget,
    hfSoftFloor,
    hfHardFloor,
    feeOverrides
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("LoopGuardVault deployed on HyperEVM at:", vaultAddress);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
