import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  // Real HyperEVM addresses (same as your Ignition module)
  const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463";
  const USDXL = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645";
  const HYPURR_POOL = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b";

  // Local MockSwapRouter you just deployed on the fork
  const MOCK_ROUTER = "0x67d269191c92Caf3cD7723F116c85e6E9bf55933";

  const hfTarget = ethers.toBigInt("1900000000000000000"); // 1.9e18
  const hfSoft = ethers.toBigInt("1600000000000000000"); // 1.6e18
  const hfHard = ethers.toBigInt("1400000000000000000"); // 1.4e18

  const VaultFactory = await ethers.getContractFactory(
    "LoopGuardVault",
    deployer
  );
  const vault = await VaultFactory.deploy(
    UBTC,
    USDXL,
    HYPURR_POOL,
    MOCK_ROUTER,
    hfTarget,
    hfSoft,
    hfHard
  );
  await vault.waitForDeployment();

  const addr = await vault.getAddress();
  console.log("LoopGuardVault deployed at (localhost fork):", addr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
