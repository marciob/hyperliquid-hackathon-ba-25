/* eslint-disable no-console */
import "dotenv/config";
/**
 * Polymarket Macro Guard
 *
 * - Polls a single Polymarket binary market for YES probability
 * - Maps probability to riskState: SAFE | CAUTION | PANIC
 * - Reads LoopGuardVault HF and config (hfTarget/Soft/Hard)
 * - Decision policy:
 *   * SAFE: log only
 *   * CAUTION: if HF < hfTarget and throttle allows → rebalance()
 *   * PANIC: if HF < hfSoftFloor → rebalance(); if HF < hfHardFloor → pauseDeposits()
 * - Exposes GET /risk-status with current view for frontend
 *
 * Env (.env):
 *  HYPEREVM_RPC_URL=...
 *  VAULT_ADDRESS=0x...
 *  VAULT_OWNER_PRIVATE_KEY=0x...   # required to send owner actions
 *  ENABLE_TX=0|1                   # default 0 (dry-run)
 *  POLYMARKET_MARKET_ID=...        # Gamma markets id for chosen binary market
 *  POLL_INTERVAL_SEC=60
 *  REBALANCE_THROTTLE_SEC=300
 *  PAUSE_THROTTLE_SEC=900
 *  PORT=8787
 *  SAFE_MAX=0.4                    # p < SAFE_MAX  => SAFE
 *  PANIC_MIN=0.65                  # p >= PANIC_MIN => PANIC; otherwise CAUTION
 */

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import {
  getMarketProbability,
  resolveMarketIdFromSlug,
} from "./polymarket-client.js";

const RPC_URL =
  process.env.HYPEREVM_RPC_URL || "https://rpc.hyperliquid.xyz/evm";
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";
const OWNER_PK =
  process.env.VAULT_OWNER_PRIVATE_KEY || process.env.KEEPER_PRIVATE_KEY || "";
const ENABLE_TX = process.env.ENABLE_TX === "1";
const MARKET_ID =
  process.env.POLYMARKET_MARKET_ID || process.env.MARKET_ID || "";
const MARKET_SLUG = process.env.POLYMARKET_MARKET_SLUG || "";
const POLL_INTERVAL_SEC = Number(process.env.POLL_INTERVAL_SEC || "60");
const REBALANCE_THROTTLE_SEC = Number(
  process.env.REBALANCE_THROTTLE_SEC || "300"
);
const PAUSE_THROTTLE_SEC = Number(process.env.PAUSE_THROTTLE_SEC || "900");
const PORT = Number(process.env.PORT || "8787");
const SAFE_MAX = Number(process.env.SAFE_MAX || "0.4");
const PANIC_MIN = Number(process.env.PANIC_MIN || "0.65");

type RiskState = "SAFE" | "CAUTION" | "PANIC";

type RiskStatus = {
  marketId: string;
  yesProbability: number; // 0..1
  riskState: RiskState;
  vaultHealthFactor: string; // decimal string
  marketSlug?: string;
  marketUrl?: string;
  marketImageUrl?: string;
  lastAction: string;
  lastUpdated: string;
};

function loadVaultAbi(): any {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const a = path.resolve(
    here,
    "../contracts/artifacts/contracts/LoopGuardVault.sol/LoopGuardVault.json"
  );
  const alt = path.resolve(
    here,
    "../contracts/artifacts/contracts/LoopGuardVault.sol/LoopGuardVault.json"
  );
  const p = fs.existsSync(a) ? a : alt;
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  return json.abi;
}

function toRisk(pYes: number): RiskState {
  if (pYes < SAFE_MAX) return "SAFE";
  if (pYes >= PANIC_MIN) return "PANIC";
  return "CAUTION";
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

async function main() {
  if (!VAULT_ADDRESS) throw new Error("VAULT_ADDRESS required");
  if (!MARKET_ID) {
    console.warn(
      "[guard] POLYMARKET_MARKET_ID not set. Defaulting to neutral 0.5."
    );
  }
  console.log(
    `[guard] start VAULT=${VAULT_ADDRESS} RPC=${RPC_URL} ENABLE_TX=${ENABLE_TX} PORT=${PORT}`
  );

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = ENABLE_TX
    ? new ethers.Wallet(
        OWNER_PK && OWNER_PK !== ""
          ? OWNER_PK
          : "0x0000000000000000000000000000000000000000000000000000000000000000",
        provider
      )
    : null;
  if (ENABLE_TX && (!OWNER_PK || OWNER_PK.length < 10)) {
    throw new Error("VAULT_OWNER_PRIVATE_KEY is required when ENABLE_TX=1");
  }

  const abi = loadVaultAbi();
  const vault = new ethers.Contract(
    VAULT_ADDRESS,
    abi,
    signer ?? provider
  ) as any;

  const cfg = await vault.getConfig();
  const hfTarget = Number(cfg[4]) / 1e18;
  const hfSoft = Number(cfg[5]) / 1e18;
  const hfHard = Number(cfg[6]) / 1e18;
  console.log(
    `[guard] config hfTarget=${hfTarget} hfSoft=${hfSoft} hfHard=${hfHard}`
  );

  // Resolve market id from env (prefer ID, fall back to SLUG)
  let marketIdResolved = MARKET_ID;
  let marketSlugResolved = MARKET_SLUG || "";
  if (!marketIdResolved && MARKET_SLUG) {
    try {
      marketIdResolved = await resolveMarketIdFromSlug(MARKET_SLUG);
      console.log(
        `[guard] resolved slug "${MARKET_SLUG}" → id ${marketIdResolved}`
      );
      marketSlugResolved = MARKET_SLUG;
    } catch (e) {
      console.warn(
        `[guard] failed to resolve slug "${MARKET_SLUG}": ${
          (e as Error).message
        }`
      );
    }
  }
  if (!marketIdResolved) {
    console.warn(
      "[guard] No POLYMARKET_MARKET_ID or POLYMARKET_MARKET_SLUG set. Using neutral p=0.5."
    );
  }

  // Selected market (mutable via /configure-market)
  let selectedMarketId = marketIdResolved || "";
  let selectedMarketSlug = marketSlugResolved || "";

  let lastRebalanceAt = 0;
  let lastPauseAt = 0;
  let lastAction = "none";
  let status: RiskStatus = {
    marketId: selectedMarketId || "unset",
    yesProbability: 0.5,
    riskState: "CAUTION",
    vaultHealthFactor: "0",
    marketSlug: selectedMarketSlug || undefined,
    marketUrl: selectedMarketSlug
      ? `https://polymarket.com/market/${selectedMarketSlug}`
      : undefined,
    marketImageUrl: undefined,
    lastAction,
    lastUpdated: new Date().toISOString(),
  };

  // Minimal HTTP server for /risk-status
  const server = http.createServer((_req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (_req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (
      _req.method === "POST" &&
      _req.url &&
      _req.url.startsWith("/configure-market")
    ) {
      let body = "";
      _req.on("data", (chunk) => {
        body += chunk;
      });
      _req.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const slug: string | undefined = payload.slug || payload.marketSlug;
          const id: string | undefined = payload.id || payload.marketId;
          if (!slug && !id) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Provide slug or id" }));
            return;
          }
          let newId = id || "";
          let newSlug = slug || "";
          if (!newId && newSlug) {
            try {
              newId = await resolveMarketIdFromSlug(newSlug);
            } catch (e) {
              res.writeHead(400);
              res.end(
                JSON.stringify({
                  error: `Failed to resolve slug: ${(e as Error).message}`,
                })
              );
              return;
            }
          }
          selectedMarketId = newId;
          selectedMarketSlug = newSlug;
          console.log(
            `[guard] configured market → id=${selectedMarketId} slug=${selectedMarketSlug}`
          );
          res.setHeader("content-type", "application/json");
          res.writeHead(200);
          res.end(
            JSON.stringify({
              ok: true,
              marketId: selectedMarketId,
              marketSlug: selectedMarketSlug || undefined,
              marketUrl: selectedMarketSlug
                ? `https://polymarket.com/market/${selectedMarketSlug}`
                : undefined,
            })
          );
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: (e as Error).message }));
        }
      });
      return;
    }
    if (_req.method === "GET" && _req.url && _req.url.startsWith("/config")) {
      res.setHeader("content-type", "application/json");
      res.writeHead(200);
      res.end(
        JSON.stringify({
          marketId: selectedMarketId || "unset",
          marketSlug: selectedMarketSlug || undefined,
          marketUrl: selectedMarketSlug
            ? `https://polymarket.com/market/${selectedMarketSlug}`
            : undefined,
        })
      );
      return;
    }
    if (
      _req.method === "GET" &&
      _req.url &&
      _req.url.startsWith("/risk-status")
    ) {
      const body = JSON.stringify(status);
      res.setHeader("content-type", "application/json");
      res.writeHead(200);
      res.end(body);
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });
  server.listen(PORT, () => {
    console.log(`[guard] HTTP listening on :${PORT} GET /risk-status`);
  });

  async function maybeRebalance(hf: number) {
    const now = Date.now() / 1000;
    if (now - lastRebalanceAt < REBALANCE_THROTTLE_SEC) {
      console.log("[guard] rebalance throttle active - skipping");
      return false;
    }
    if (hf <= 1.0) {
      console.log("[guard] HF <= 1.0, not attempting rebalance()");
      return false;
    }
    try {
      await vault.rebalance.staticCall();
      if (ENABLE_TX) {
        const tx = await vault.rebalance();
        console.log(`[guard] rebalance tx: ${tx.hash}`);
        await tx.wait();
        lastAction = "called_rebalance";
      } else {
        console.log("[guard] rebalance staticCall OK (dry-run)");
        lastAction = "would_call_rebalance";
      }
      lastRebalanceAt = now;
      return true;
    } catch (e) {
      console.warn(
        `[guard] rebalance simulation failed: ${(e as Error).message}`
      );
      return false;
    }
  }

  async function maybePause() {
    const now = Date.now() / 1000;
    if (now - lastPauseAt < PAUSE_THROTTLE_SEC) {
      console.log("[guard] pause throttle active - skipping");
      return false;
    }
    try {
      await vault.pauseDeposits.staticCall();
      if (ENABLE_TX) {
        const tx = await vault.pauseDeposits();
        console.log(`[guard] pause tx: ${tx.hash}`);
        await tx.wait();
        lastAction = "called_pauseDeposits";
      } else {
        console.log("[guard] pause staticCall OK (dry-run)");
        lastAction = "would_call_pauseDeposits";
      }
      lastPauseAt = now;
      return true;
    } catch (e) {
      console.warn(
        `[guard] pauseDeposits simulation failed: ${(e as Error).message}`
      );
      return false;
    }
  }

  // Polling loop
  for (;;) {
    try {
      const pm = selectedMarketId
        ? await getMarketProbability(selectedMarketId)
        : { marketId: "unset", probability: 0.5, source: "polymarket" };
      const p = clamp01(pm.probability);
      const riskState = toRisk(p);

      const [, , , , , hfRaw] = await vault.getVaultAccountData();
      const hf = Number(hfRaw) / 1e18;
      const paused: boolean = await vault.depositsPaused();

      console.log(
        `[guard] market=${pm.marketId} pYes=${p.toFixed(
          3
        )} → ${riskState} | HF=${hf.toFixed(3)} paused=${paused}`
      );

      // Decision logic
      if (riskState === "SAFE") {
        // no-op
      } else if (riskState === "CAUTION") {
        if (hf < hfTarget) {
          await maybeRebalance(hf);
        }
      } else {
        // PANIC
        if (hf < hfSoft) {
          const did = await maybeRebalance(hf);
          if (did) {
            // refresh HF after action
            const [, , , , , hf2] = await vault.getVaultAccountData();
            const hfAfter = Number(hf2) / 1e18;
            if (hfAfter < hfHard) {
              await maybePause();
            }
          } else if (hf < hfHard) {
            await maybePause();
          }
        } else if (hf < hfHard) {
          await maybePause();
        }
      }

      status = {
        marketId: pm.marketId,
        yesProbability: p,
        riskState,
        vaultHealthFactor: hf.toString(),
        marketSlug: pm.slug || selectedMarketSlug || undefined,
        marketUrl:
          pm.slug || selectedMarketSlug
            ? `https://polymarket.com/market/${pm.slug || selectedMarketSlug}`
            : undefined,
        marketImageUrl: pm.imageUrl || status.marketImageUrl,
        lastAction,
        lastUpdated: new Date().toISOString(),
      };
    } catch (e) {
      console.warn(`[guard] loop error: ${(e as Error).message}`);
    } finally {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_SEC * 1000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
