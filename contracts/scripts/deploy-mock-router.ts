import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const factory = await ethers.getContractFactory("MockSwapRouter", deployer);
  const router = await factory.deploy();
  await router.waitForDeployment();

  const addr = await router.getAddress();
  console.log("MockSwapRouter deployed at:", addr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
