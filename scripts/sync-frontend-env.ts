/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";

const ROOT = process.cwd();

function readEnvFile(p: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(p, "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[key] = val;
    }
    return out;
  } catch {
    return {};
  }
}

function mergeEnv(existing: Record<string, string>, updates: Record<string, string>) {
  return { ...existing, ...updates };
}

function serializeEnv(obj: Record<string, string>) {
  const keys = Object.keys(obj);
  keys.sort();
  return keys.map((k) => `${k}=${obj[k]}`).join("\n") + "\n";
}

async function main() {
  const rootEnv = readEnvFile(path.join(ROOT, ".env"));
  const contractsEnv = readEnvFile(path.join(ROOT, "contracts", ".env"));
  const appEnvPath = path.join(ROOT, "app", ".env.local");
  const currentAppEnv = readEnvFile(appEnvPath);

  const VAULT =
    process.env.VAULT_ADDRESS ||
    rootEnv.VAULT_ADDRESS ||
    contractsEnv.VAULT_ADDRESS ||
    "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(VAULT)) {
    throw new Error("VAULT_ADDRESS not set or invalid; set it in .env or contracts/.env");
  }

  const RPC =
    process.env.HYPEREVM_RPC_URL ||
    rootEnv.HYPEREVM_RPC_URL ||
    contractsEnv.HYPEREVM_RPC_URL ||
    "https://rpc.hyperliquid.xyz/evm";

  const provider = new ethers.JsonRpcProvider(RPC);
  const vaultAbi = [
    // getConfig() optional
    {
      type: "function",
      name: "getConfig",
      stateMutability: "view",
      inputs: [],
      outputs: [
        { name: "collateralToken", type: "address" },
        { name: "debtToken", type: "address" },
        { name: "hypurrPool", type: "address" },
        { name: "swapRouter", type: "address" },
        { name: "hfTarget", type: "uint256" },
        { name: "hfSoftFloor", type: "uint256" },
        { name: "hfHardFloor", type: "uint256" },
      ],
    },
    // fallback
    { type: "function", name: "collateral", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  ];
  const vault = new ethers.Contract(VAULT, vaultAbi, provider);

  let collateral = "";
  try {
    const cfg = await vault.getConfig();
    collateral = cfg[0] as string;
  } catch {
    try {
      collateral = (await vault.collateral()) as string;
    } catch {
      // noop
    }
  }

  // Fallback to existing app env if present
  if (!/^0x[0-9a-fA-F]{40}$/.test(collateral)) {
    const fromApp = currentAppEnv.NEXT_PUBLIC_HYPE_ADDRESS;
    if (fromApp && /^0x[0-9a-fA-F]{40}$/.test(fromApp)) {
      collateral = fromApp;
    }
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(collateral)) {
    throw new Error("Could not resolve collateral token (getConfig/collateral/app .env fallback failed)");
  }

  const updates: Record<string, string> = {
    NEXT_PUBLIC_LOOP_GUARD_VAULT_ADDRESS: VAULT,
    NEXT_PUBLIC_HYPE_ADDRESS: collateral,
  };
  // USDXL default known address unless already set
  const defaultUsdxl = "0xca79db4b49f608ef54a5cb813fbed3a6387bc645";
  if (!currentAppEnv.NEXT_PUBLIC_USDXL_ADDRESS) {
    updates.NEXT_PUBLIC_USDXL_ADDRESS = defaultUsdxl;
  }

  const merged = mergeEnv(currentAppEnv, updates);
  fs.mkdirSync(path.dirname(appEnvPath), { recursive: true });
  fs.writeFileSync(appEnvPath, serializeEnv(merged), "utf8");

  console.log("Wrote app/.env.local:");
  console.log("  NEXT_PUBLIC_LOOP_GUARD_VAULT_ADDRESS =", merged.NEXT_PUBLIC_LOOP_GUARD_VAULT_ADDRESS);
  console.log("  NEXT_PUBLIC_HYPE_ADDRESS            =", merged.NEXT_PUBLIC_HYPE_ADDRESS);
  console.log("  NEXT_PUBLIC_USDXL_ADDRESS          =", merged.NEXT_PUBLIC_USDXL_ADDRESS || defaultUsdxl);
  console.log("Restart your Next.js dev server to pick up changes.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


