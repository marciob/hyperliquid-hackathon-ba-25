import { network } from "hardhat";

async function main() {
  // This gives you { ethers } for the selected network (e.g. hyperEvm)
  const { ethers } = await network.connect();

  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Block number:", blockNumber.toString());

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
