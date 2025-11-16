Polymarket Macro Guard

Overview
- Polls a Polymarket binary market for YES probability
- Maps p → SAFE | CAUTION | PANIC
- Reads LoopGuardVault HF on HyperEVM
- In CAUTION/PANIC states, optionally calls rebalance() and pauseDeposits() with throttles
- Exposes GET /risk-status for the frontend

Run
1) Copy .env.example → .env and fill values
2) Install deps and run:

```
pnpm install
pnpm polymarket-guard
# or
npm install
npm run polymarket-guard
```

Actions
- CAUTION: if HF < hfTarget and throttle allows → rebalance()
- PANIC: if HF < hfSoftFloor → rebalance(); if still HF < hfHardFloor → pauseDeposits()
- Set ENABLE_TX=1 to actually send txs (requires VAULT_OWNER_PRIVATE_KEY)

Selecting the Polymarket market
- Prefer providing a human-readable slug; the guard resolves it to an id at runtime:
  - Set POLYMARKET_MARKET_SLUG in .env (from the Polymarket URL after /market/).
  - Or set POLYMARKET_MARKET_ID directly if you already know it.
- Slugs/IDs are public and not secrets.

Status Endpoint
GET http://localhost:8787/risk-status

Example response:
```
{
  "marketId": "7132104567...",
  "yesProbability": 0.73,
  "riskState": "PANIC",
  "vaultHealthFactor": "1.45",
  "lastAction": "called_rebalance_and_paused_deposits",
  "lastUpdated": "2025-11-15T20:00:00Z"
}
```


