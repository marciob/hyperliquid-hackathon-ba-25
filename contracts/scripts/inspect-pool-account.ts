/* eslint-disable no-console */
import { network } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT || process.env.VAULT_ADDRESS;
  const POOL = process.env.POOL || process.env.HYPU_POOL_ADDRESS || "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b";
  if (!VAULT) throw new Error("Set VAULT or VAULT_ADDRESS");

  const { ethers } = (await network.connect()) as any;
  const pool = new ethers.Contract(
    POOL,
    [
      {
        inputs: [{ type: "address" }],
        name: "getUserAccountData",
        outputs: [
          { type: "uint256" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    ethers.provider
  );

  const [collBase, debtBase, avail, lt, ltv, hf] = await pool.getUserAccountData(VAULT);
  console.log("Vault:", VAULT);
  console.log("totalCollateralBase   :", collBase.toString());
  console.log("totalDebtBase         :", debtBase.toString());
  console.log("availableBorrowsBase  :", avail.toString());
  console.log("currentLiquidationThr :", lt.toString());
  console.log("ltv                   :", ltv.toString());
  console.log("healthFactor          :", hf.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


