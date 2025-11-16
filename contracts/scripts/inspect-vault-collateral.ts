/* eslint-disable no-console */
import { network } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT || process.env.VAULT_ADDRESS;
  if (!VAULT) throw new Error("Set VAULT or VAULT_ADDRESS");

  const { ethers } = (await network.connect()) as any;
  const iface = [
    {
      inputs: [],
      name: "getConfig",
      outputs: [
        { type: "address" },
        { type: "address" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "collateral",
      outputs: [{ type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  const vault = new ethers.Contract(VAULT, iface, ethers.provider);
  let collateral: string;
  let cfgAll: any[] | null = null;
  try {
    const cfg = await vault.getConfig();
    cfgAll = cfg as any[];
    collateral = cfg[0];
  } catch {
    collateral = await vault.collateral();
  }

  console.log("VAULT        :", VAULT);
  console.log("COLLATERAL   :", collateral);
  if (cfgAll) {
    console.log("DEBT         :", cfgAll[1]);
    console.log("POOL         :", cfgAll[2]);
    console.log("ROUTER       :", cfgAll[3]);
  }
  const code = await ethers.provider.getCode(collateral);
  console.log("code length  :", code.length);

  const erc = new ethers.Contract(
    collateral,
    [
      {
        inputs: [],
        name: "symbol",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [{ type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    ethers.provider
  );
  try {
    console.log("symbol       :", await erc.symbol());
  } catch {
    console.log("symbol       : <error>");
  }
  try {
    console.log("decimals     :", await erc.decimals());
  } catch {
    console.log("decimals     : <error>");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
