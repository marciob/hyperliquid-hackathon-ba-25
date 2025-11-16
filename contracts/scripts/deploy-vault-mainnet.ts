import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);

  // --- Real HyperEVM addresses (these are the ones you already wired in Ignition) ---
  const collateral = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463"; // UBTC
  const debt = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645"; // USDXL
  const pool = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b"; // HypurrFi Pool

  // TEMP router placeholder – we will replace this with a real DEX router
  // before calling depositAndLoop on mainnet.
  const router = "0x375b33942f93B26450301Bc7De9D32d2a4DBD37F";

  const hfTarget = ethers.parseUnits("1.9", 18);
  const hfSoftFloor = ethers.parseUnits("1.6", 18);
  const hfHardFloor = ethers.parseUnits("1.4", 18);

  const VaultFactory = await ethers.getContractFactory("LoopGuardVault");

  const vault = await VaultFactory.deploy(
    collateral,
    debt,
    pool,
    router,
    hfTarget,
    hfSoftFloor,
    hfHardFloor
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("LoopGuardVault deployed on HyperEVM at:", vaultAddress);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
