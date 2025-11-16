import hre from "hardhat";

const UBTC = "0x9fdbda0a5e284c32744d2f17ee5c74b284993463";
const VAULT = "0xd3C5F422FC8644F0bcC150e5D74a514CFf1abe84";

async function main() {
  // Hardhat v3 pattern: connect() gives you { ethers, viem, ... } for the selected network
  const { ethers } = (await network.connect()) as any;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);

  const ubtc = await ethers.getContractAt("IERC20", UBTC, deployer);
  const vault = await ethers.getContractAt("LoopGuardVault", VAULT, deployer);

  const decimals = await ubtc.decimals();
  const balance = await ubtc.balanceOf(deployerAddress);

  console.log("UBTC decimals:", decimals);
  console.log("UBTC balance (raw):", balance.toString());

  // Use the same amountIn logic you used before, but keep it explicit
  const amountIn = 100n; // 100 raw units = 1e-6 UBTC (with 8 decimals)
  console.log("Trying amountIn:", amountIn.toString());

  console.log("\n--- Static call (no gas spent, just simulation) ---");
  try {
    // ethers v6 style static call
    await vault.depositAndLoop.staticCall(amountIn);
    console.log("✅ staticCall succeeded: the tx *would* succeed on-chain.");
  } catch (e: any) {
    console.error("❌ staticCall reverted");
    console.error("shortMessage:", e.shortMessage);
    console.error("message:", e.message);
    if (e.data) console.error("data:", e.data);
    if (e.info) console.error("info:", e.info);
    if (e.errorName) console.error("errorName:", e.errorName);
    if (e.errorArgs) console.error("errorArgs:", e.errorArgs);
    // We stop here; no real tx sent
    return;
  }

  console.log("\n--- Sending real tx (only if staticCall succeeded) ---");
  const tx = await vault.depositAndLoop(amountIn);
  console.log("depositAndLoop tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ depositAndLoop mined");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
