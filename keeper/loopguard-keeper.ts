/* eslint-disable no-console */
import "dotenv/config";
/**
 * LoopGuard Vault Keeper
 *
 * - Connects to HyperEVM (HYPEREVM_RPC_URL)
 * - Reads HF and config from LoopGuardVault
 * - Fetches Polymarket probability for a binary market
 * - Computes a simple risk score
 * - Policies:
 *    * If HF < hfSoftFloor -> (simulate and optionally) call rebalance()
 *    * If riskScore > threshold and HF < mid(hfTarget, hfSoftFloor) -> (simulate and optionally) pauseDeposits()
 *    * If riskScore < low threshold and HF well above hfTarget -> optionally unpauseDeposits()
 *
 * Env:
 *  - HYPEREVM_RPC_URL: RPC endpoint for HyperEVM
 *  - KEEPER_SEND_TX=1 to actually send transactions (otherwise simulate only)
 *  - KEEPER_PRIVATE_KEY: signer key (required if sending transactions)
 *  - MARKET_ID: Polymarket market id (binary market preferred)
 *  - VAULT_ADDRESS: LoopGuardVault address (default: 0xd3C5F422FC8644F0bcC150e5D74a514CFf1abe84)
 *  - RISK_THRESHOLD=0.7 (pause threshold)
 *  - LOW_RISK_THRESHOLD=0.3 (unpause threshold)
 *  - INTERVAL_MS=60000 polling interval
 */

import { getMarketProbability } from "./polymarket-client.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { ethers } from "ethers";

const VAULT_ADDRESS =
  process.env.VAULT_ADDRESS ||
  "0xd3C5F422FC8644F0bcC150e5D74a514CFf1abe84";
const RPC_URL =
  process.env.HYPEREVM_RPC_URL || "https://rpc.hyperliquid.xyz/evm";
const SEND_TX = process.env.KEEPER_SEND_TX === "1";
const PK =
  process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY || "0x00"; // will be validated if SEND_TX
const MARKET_ID = process.env.MARKET_ID || "example-market-id";
const INTERVAL_MS = Number(process.env.INTERVAL_MS || "60000");
const RISK_THRESHOLD = Number(process.env.RISK_THRESHOLD || "0.7");
const LOW_RISK_THRESHOLD = Number(process.env.LOW_RISK_THRESHOLD || "0.3");

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function loadVaultAbi(): any {
  // Load ABI from Hardhat artifacts
  const here = path.dirname(fileURLToPath(import.meta.url));
  const abiPath = path.resolve(
    here,
    "../contracts/artifacts/contracts/LoopGuardVault.sol/LoopGuardVault.json"
  );
  // Fallback path if script is executed from repo root
  let json: any;
  if (fs.existsSync(abiPath)) {
    json = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  } else {
    const alt = path.resolve(
      here,
      "../contracts/artifacts/contracts/LoopGuardVault.sol/LoopGuardVault.json"
    );
    json = JSON.parse(fs.readFileSync(alt, "utf8"));
  }
  return json.abi;
}

async function getProviderAndSigner() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  if (!SEND_TX) return { provider, signer: null as any };
  if (!PK || PK === "0x00")
    throw new Error("KEEPER_PRIVATE_KEY/PRIVATE_KEY required to send tx");
  const wallet = new ethers.Wallet(PK, provider);
  return { provider, signer: wallet };
}

async function main() {
  console.log(
    `[keeper] start: VAULT=${VAULT_ADDRESS} RPC=${RPC_URL} SEND_TX=${SEND_TX}`
  );
  const { provider, signer } = await getProviderAndSigner();
  const abi = loadVaultAbi();
  const vault = new ethers.Contract(
    VAULT_ADDRESS,
    abi,
    signer ?? provider
  ) as any;

  // Preload config
  const cfg = await vault.getConfig();
  const hfTarget = cfg[4] as bigint;
  const hfSoft = cfg[5] as bigint;
  const hfHard = cfg[6] as bigint;

  console.log(
    `[keeper] config hfTarget=${hfTarget} hfSoft=${hfSoft} hfHard=${hfHard}`
  );

  // Poll loop
  for (;;) {
    try {
      const t0 = Date.now();

      const [
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        ,
        ,
        healthFactor,
      ] = await vault.getVaultAccountData();

      const paused: boolean = await vault.depositsPaused();
      const hf = Number(healthFactor) / 1e18;
      const target = Number(hfTarget) / 1e18;
      const soft = Number(hfSoft) / 1e18;
      const hard = Number(hfHard) / 1e18;

      const pm = await getMarketProbability(MARKET_ID);
      const hfNorm = clamp(hf / target, 0, 1);
      const onchainRisk = 1 - hfNorm;
      const externalRisk = clamp(pm.probability, 0, 1);
      const riskScore = 0.6 * onchainRisk + 0.4 * externalRisk;

      console.log(
        `[keeper] hf=${hf.toFixed(
          4
        )} target=${target} soft=${soft} hard=${hard} paused=${paused}`
      );
      console.log(
        `[keeper] polymarket(${pm.marketId}) prob=${externalRisk.toFixed(
          3
        )} riskScore=${riskScore.toFixed(3)} onchainRisk=${onchainRisk.toFixed(
          3
        )}`
      );

      // Policy 1: deleverage if HF below soft
      if (hf < soft) {
        console.log("[keeper] HF < softFloor → attempting rebalance()");
        try {
          await vault.rebalance.staticCall();
          if (SEND_TX) {
            const tx = await vault.rebalance();
            console.log(`[keeper] rebalance tx sent: ${tx.hash}`);
            await tx.wait();
            console.log("[keeper] rebalance confirmed");
          } else {
            console.log("[keeper] staticCall OK (simulation only)");
          }
        } catch (err) {
          console.warn(
            `[keeper] rebalance simulation failed: ${(err as Error).message}`
          );
        }
      }

      // Policy 2: pause when external risk + onchain risk are both high
      const mid = (target + soft) / 2;
      if (riskScore > RISK_THRESHOLD && hf < mid) {
        console.log(
          `[keeper] riskScore=${riskScore.toFixed(
            3
          )} and hf=${hf.toFixed(3)} near soft → attempt pauseDeposits()`
        );
        try {
          await vault.pauseDeposits.staticCall();
          if (SEND_TX) {
            const tx = await vault.pauseDeposits();
            console.log(`[keeper] pause tx: ${tx.hash}`);
            await tx.wait();
            console.log("[keeper] pause confirmed");
          } else {
            console.log("[keeper] pause staticCall OK (simulation only)");
          }
        } catch (err) {
          console.warn(
            `[keeper] pauseDeposits simulation failed: ${
              (err as Error).message
            }`
          );
        }
      }

      // Policy 3: unpause when low risk and HF comfortably above target
      if (paused && riskScore < LOW_RISK_THRESHOLD && hf > target * 1.05) {
        console.log(
          `[keeper] low risk (${riskScore.toFixed(
            3
          )}) and hf=${hf.toFixed(3)} > 1.05*target → attempt unpauseDeposits()`
        );
        try {
          await vault.unpauseDeposits.staticCall();
          if (SEND_TX) {
            const tx = await vault.unpauseDeposits();
            console.log(`[keeper] unpause tx: ${tx.hash}`);
            await tx.wait();
            console.log("[keeper] unpause confirmed");
          } else {
            console.log("[keeper] unpause staticCall OK (simulation only)");
          }
        } catch (err) {
          console.warn(
            `[keeper] unpauseDeposits simulation failed: ${
              (err as Error).message
            }`
          );
        }
      }

      const dt = Date.now() - t0;
      const sleep = Math.max(0, INTERVAL_MS - dt);
      await delay(sleep);
    } catch (err) {
      console.error(`[keeper] loop error: ${(err as Error).message}`);
      await delay(INTERVAL_MS);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


