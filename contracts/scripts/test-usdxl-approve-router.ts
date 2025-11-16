// scripts/test-usdxl-approve-router.ts
// @ts-nocheck

import { network } from "hardhat";

const USDXL = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645"; // real USDXL
const ROUTER = "0x375b33942f93B26450301Bc7De9D32d2a4DBD37F"; // your MockSwapRouter

async function main() {
  const { ethers } = (await network.connect()) as any;
  const [deployer] = await ethers.getSigners();
  const addr = await deployer.getAddress();

  console.log("Deployer:", addr);

  const usdxl = await ethers.getContractAt("IERC20", USDXL, deployer);

  const bal = await usdxl.balanceOf(addr);
  console.log("USDXL balance (raw):", bal.toString());

  console.log("\n--- usdxl.approve(router, MaxUint256) staticCall ---");
  try {
    await usdxl.approve.staticCall(ROUTER, ethers.MaxUint256);
    console.log("✅ staticCall OK: approve(router, MaxUint256) would succeed");
  } catch (e: any) {
    console.error("❌ staticCall reverted");
    console.error("message:", e.message);
    if (e.data) console.error("data:", e.data);
    if (e.errorName) console.error("errorName:", e.errorName);
    if (e.errorArgs) console.error("errorArgs:", e.errorArgs);
    return; // do NOT try to send a real tx
  }

  console.log("\n--- Sending real approve tx ---");
  const tx = await usdxl.approve(ROUTER, ethers.MaxUint256);
  console.log("approve tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ approve mined");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
