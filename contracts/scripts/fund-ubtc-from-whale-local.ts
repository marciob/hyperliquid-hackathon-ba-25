// scripts/fund-ubtc-from-whale-local.ts
import { network } from "hardhat";

const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463"; // UBTC on HyperEVM
const UBTC_WHALE = "0xAb59403c721Eaa64a850474e63919573c0F0b767"; // real holder addr from explorer

async function main() {
  // Hardhat v3: network.connect() => { ethers, viem, ... }
  const { ethers } = (await network.connect()) as any;

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);

  // 1) Impersonate UBTC whale on the fork
  await ethers.provider.send("hardhat_impersonateAccount", [UBTC_WHALE]);

  // 2) Give the whale some gas on the fork (from the rich local account)
  await deployer.sendTransaction({
    to: UBTC_WHALE,
    value: ethers.parseEther("1.0"),
  });

  const whaleSigner = await ethers.getSigner(UBTC_WHALE);

  // 3) Attach to UBTC token with the whale signer
  const ubtc = await ethers.getContractAt("IERC20", UBTC, whaleSigner);

  const whaleBalance: bigint = await ubtc.balanceOf(UBTC_WHALE);
  console.log("Whale UBTC raw balance:", whaleBalance.toString());

  if (whaleBalance === 0n) {
    throw new Error("Whale has zero UBTC on this fork, pick another holder");
  }

  // Send 10% of balance (at least 1 unit)
  let amount: bigint = whaleBalance / 10n;
  if (amount === 0n) {
    amount = 1n;
  }

  console.log("Amount to transfer (raw units):", amount.toString());
  console.log(
    "Deployer UBTC before:",
    (await ubtc.balanceOf(deployerAddress)).toString()
  );

  // 4) Transfer UBTC from whale to deployer (on the fork only)
  const tx = await ubtc.transfer(deployerAddress, amount);
  await tx.wait();

  console.log(
    "Whale UBTC after:",
    (await ubtc.balanceOf(UBTC_WHALE)).toString()
  );
  console.log(
    "Deployer UBTC after:",
    (await ubtc.balanceOf(deployerAddress)).toString()
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
