// scripts/inspect-mainnet-state.ts
// @ts-nocheck

import { network } from "hardhat";

const USDXL = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645";
const POOL = "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b";
const ROUTER = "0x375b33942f93B26450301Bc7De9D32d2a4DBD37F"; // your MockSwapRouter
const VAULT = "0xd3C5F422FC8644F0bcC150e5D74a514CFf1abe84"; // deployed LoopGuardVault

async function main() {
  const { ethers } = (await network.connect()) as any;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);

  // Resolve collateral token dynamically (prefer from VAULT, else HYPE_ADDRESS)
  let collateral = process.env.HYPE_ADDRESS || "";
  if (VAULT) {
    try {
      const vault = await ethers.getContractAt(
        [
          { type: "function", name: "getConfig", stateMutability: "view", inputs: [], outputs: [{ type: "address" }, { type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }] },
          { type: "function", name: "collateral", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
        ] as any,
        VAULT
      );
      try {
        const cfg = await (vault as any).getConfig();
        collateral = cfg[0];
      } catch {
        collateral = await (vault as any).collateral();
      }
    } catch {}
  }
  if (!collateral) {
    throw new Error("Unable to resolve collateral token; set HYPE_ADDRESS or adjust VAULT");
  }

  const col = await ethers.getContractAt("IERC20", collateral);
  const usdxl = await ethers.getContractAt("IERC20", USDXL);
  const pool = await ethers.getContractAt("IHypurrFiPool", POOL);
  const vault = await ethers.getContractAt("LoopGuardVault", VAULT);

  // --- Basic balances ---
  const colDec = await col.decimals();
  const usdxlDec = await usdxl.decimals();

  console.log("\nDecimals:");
  console.log("  COLL  :", colDec.toString());
  console.log("  USDXL :", usdxlDec.toString());

  console.log("\nBalances:");
  console.log("  COLL deployer :", (await col.balanceOf(deployerAddress)).toString());
  console.log("  COLL router   :", (await col.balanceOf(ROUTER)).toString());
  console.log("  COLL vault    :", (await col.balanceOf(VAULT)).toString());

  console.log(
    "  USDXL deployer:",
    (await usdxl.balanceOf(deployerAddress)).toString()
  );
  console.log("  USDXL router  :", (await usdxl.balanceOf(ROUTER)).toString());
  console.log("  USDXL vault   :", (await usdxl.balanceOf(VAULT)).toString());

  // --- Allowances collateral -> vault (for deposit) ---
  console.log("\nCollateral allowances to vault:");
  console.log("  deployer -> vault:", (await col.allowance(deployerAddress, VAULT)).toString());

  // --- Vault account data on HypurrFi ---
  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLT,
    ltv,
    hf,
  ] = await pool.getUserAccountData(VAULT);

  console.log("\nHypurrFi getUserAccountData(vault):");
  console.log("  totalCollateralBase   :", totalCollateralBase.toString());
  console.log("  totalDebtBase         :", totalDebtBase.toString());
  console.log("  availableBorrowsBase  :", availableBorrowsBase.toString());
  console.log("  currentLiquidationThr :", currentLT.toString());
  console.log("  ltv                   :", ltv.toString());
  console.log("  healthFactor          :", hf.toString());

  // What our contract *would* attempt to borrow for an arbitrary amountIn
  const BPS_DENOMINATOR = 10_000n;
  const BORROW_BPS = 7_000n;

  const borrowAmount = (availableBorrowsBase * BORROW_BPS) / BPS_DENOMINATOR;
  console.log("\nIf we used current availableBorrowsBase:");
  console.log(
    "  Hypothetical borrowAmount (base units):",
    borrowAmount.toString()
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
