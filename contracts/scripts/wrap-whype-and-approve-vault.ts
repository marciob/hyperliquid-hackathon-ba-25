/* eslint-disable no-console */
import { network } from "hardhat";

/**
 * Wrap a tiny amount of native HYPE into WHYPE and approve the vault.
 *
 * Env:
 *  - HYPE_ADDRESS (WHYPE ERC20 address)
 *  - VAULT_ADDRESS (LoopGuardVault address)
 *  - WRAP_WEI (optional; default 1000000000000000 = 0.001 HYPE)
 */
async function main() {
  const WHYPE = process.env.HYPE_ADDRESS;
  const VAULT = process.env.VAULT_ADDRESS;
  if (!WHYPE) throw new Error("HYPE_ADDRESS (WHYPE) required");
  if (!VAULT) throw new Error("VAULT_ADDRESS required");
  const WRAP_WEI =
    (process.env.WRAP_WEI ? BigInt(process.env.WRAP_WEI) : undefined) ??
    1_000_000_000_000_000n; // 0.001

  const { ethers } = (await network.connect()) as any;
  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();
  console.log("Signer:", addr);

  const erc20 = await ethers.getContractAt(
    [
      { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
      { inputs: [{ type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
      { inputs: [{ type: "address" }, { type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
      { inputs: [{ type: "address" }, { type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
    ],
    WHYPE,
    signer
  );

  // deposit() payable on WHYPE
  const whype = new ethers.Contract(
    WHYPE,
    [{ inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" }],
    signer
  );

  console.log("Wrapping HYPE -> WHYPE:", WRAP_WEI.toString());
  const latest = await ethers.provider.getBlock("latest");
  const base: bigint =
    (latest?.baseFeePerGas as bigint) ?? ethers.parseUnits("1", "gwei");
  const priority: bigint = ethers.parseUnits("2", "gwei");
  const feeOverrides = {
    maxPriorityFeePerGas: priority,
    maxFeePerGas: base * 2n + priority,
    value: WRAP_WEI,
  };
  const tx = await whype.deposit(feeOverrides);
  console.log("deposit() tx:", tx.hash);
  await tx.wait();

  const bal = await erc20.balanceOf(addr);
  console.log("WHYPE balance (raw):", bal.toString());

  const allowanceBefore = await erc20.allowance(addr, VAULT);
  console.log("Allowance before:", allowanceBefore.toString());
  if (allowanceBefore < WRAP_WEI) {
    const tx2 = await erc20.approve(VAULT, WRAP_WEI);
    console.log("approve() tx:", tx2.hash);
    await tx2.wait();
    console.log("Approved WRAP_WEI for vault");
  } else {
    console.log("Sufficient allowance already set");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


