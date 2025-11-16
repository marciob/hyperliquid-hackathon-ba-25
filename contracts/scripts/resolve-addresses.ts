/* eslint-disable no-console */
import { network } from "hardhat";

/**
 * Resolve the current HypurrFi Pool from the PoolAddressesProvider and
 * print env lines you can paste into contracts/.env
 *
 * Usage:
 *   npx hardhat run scripts/resolve-addresses.ts --network hyperEvm
 *
 * Optional env:
 *   HYPU_ADDRESSES_PROVIDER: override provider address
 */

async function main() {
  const { ethers } = (await network.connect()) as any;
  const providerAddress =
    process.env.HYPU_ADDRESSES_PROVIDER ||
    "0xA73ff12D177D8F1Ec938c3ba0e87D33524dD5594"; // from docs

  const providerAbi = ["function getPool() view returns (address)"];
  const provider = await ethers.getContractAt(providerAbi, providerAddress);
  const pool = await provider.getPool();

  console.log("Resolved Pool from PoolAddressesProvider:");
  console.log("HYPU_ADDRESSES_PROVIDER =", providerAddress);
  console.log("HYPU_POOL_ADDRESS       =", pool);

  // Quick optional sanity for WHYPE (collateral) address
  const WHYPE = process.env.HYPE_ADDRESS || "0x5555555555555555555555555555555555555555";
  const erc20Abi = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ];
  try {
    const whype = new ethers.Contract(WHYPE, erc20Abi, (await ethers.getSigners())[0]);
    const symbol: string = await whype.symbol();
    const decimals: bigint = await whype.decimals();
    console.log("\nWHYPE check:");
    console.log("HYPE_ADDRESS            =", WHYPE);
    console.log("symbol                  =", symbol);
    console.log("decimals                =", decimals.toString());
  } catch {
    console.log("\nWHYPE check skipped or failed. Ensure HYPE_ADDRESS is correct if needed.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


