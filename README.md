LoopGuard – HyperEVM leverage vault + Polymarket Macro Guard

What this repo is

- Contracts: deleverage-only HF-banded vault (`contracts/`) with mainnet helper scripts.
- Frontend: Next.js app for deposits, HF view, and strategy dashboard (`app/`).
- Keeper: Polymarket “macro guard” that can trigger safe `rebalance()`/`pauseDeposits()` (`keeper/`).

Prerequisites

- Node.js ≥ 18 and npm (or pnpm)
- Wallet on HyperEVM (chainId 999)

Install

1. Install root tooling (Hardhat, scripts, guard):

```bash
npm install
```

2. Install frontend deps:

```bash
cd app
npm install
```

Env (root .env)
Copy `.env.example` → `.env` and set at least:

- HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
- VAULT_ADDRESS=0xYourVaultAddress
- NEXT_PUBLIC_POLYMARKET_GUARD_URL=http://localhost:8787

Optional:

- POLYMARKET_MARKET_SLUG=will-china-invade-taiwan-before-2027
- POLYMARKET_MARKET_ID=<gamma-market-id>
- ENABLE_TX=1 (only if you want the guard to send txs)
- VAULT_OWNER_PRIVATE_KEY=0x... (required only when ENABLE_TX=1)

Point the UI at your vault
Generate frontend env from on-chain vault config (writes `app/.env.local`):

```bash
npm run sync:frontend-env
```

Start the apps

- Frontend (Next.js):

```bash
cd app
npm run dev
# → http://localhost:3000
```

- Optional: Polymarket guard (HTTP on :8787):

```bash
cd /Users/m/Desktop/dev/hyperliquid-hackathon
npm run polymarket-guard
```

CLI scripts (simulate-first)
From repo root:

- Status: `npm run vault:status`
- Deposit (deposit-only if router=0): `npm run vault:deposit`
- Deposit + Borrow (no swap): `npm run vault:depositBorrow`
- Withdraw: `npm run vault:withdraw`
- Rebalance: `npm run vault:rebalance`

2‑minute plan for the HYPE/USDXL demo

1. Deploy a fresh vault with collateral = HYPE/WHYPE ERC20, debt = USDXL, router = 0x0, and your desired HF bands. Set its address in `VAULT_ADDRESS`.
2. Run `npm run sync:frontend-env` to auto-point the UI to the new vault and correct tokens.
3. Start the UI, deposit a tiny amount (e.g., 0.001 HYPE). Toggle “Borrow (no swap)” ~5% to show leverage. Use Rebalance if needed.
4. (Optional) Run the Polymarket guard and open the dashboard tab to view the risk card.

Polymarket Macro Guard – quick start

Prereqs

- Node.js ≥ 18 (for global fetch) and pnpm/npm
- A running Next.js app (frontend) on http://localhost:3000

Env (root .env)

- Required:
  - HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
  - VAULT_ADDRESS=0xYourVaultAddress
  - NEXT_PUBLIC_POLYMARKET_GUARD_URL=http://localhost:8787
- Optional defaults (can be set at runtime via UI/API too):
  - POLYMARKET_MARKET_SLUG=<polymarket-market-slug> (e.g., will-china-invade-taiwan-before-2027)
  - or POLYMARKET_MARKET_ID=<gamma-market-id>
- Optional actions:
  - ENABLE_TX=1 (to allow on-chain actions)
  - VAULT_OWNER_PRIVATE_KEY=0x... (required only if ENABLE_TX=1)

Install + run the guard (repo root)

```bash
npm install
npm run polymarket-guard
```

Verify guard

```bash
curl http://localhost:8787/risk-status
# → { "marketId": "...", "yesProbability": 0.73, "riskState": "PANIC", ... }
```

Frontend

- Ensure NEXT_PUBLIC_POLYMARKET_GUARD_URL matches the guard URL (http://localhost:8787).
- Open the Strategy “Dashboard” tab:
  - http://localhost:3000/strategy/<strategyId>?tab=dashboard
- The “Polymarket Macro Guard” card shows:
  - Risk state (SAFE | CAUTION | PANIC), YES probability, updated time, optional banner image, and an “Open” button to the Polymarket page.
- Click “Change” to paste any market slug at runtime (no restart).

Runtime selection (no restart)

- UI: use the “Change” button in the card and paste a slug (e.g., will-china-invade-taiwan-before-2027).
- API:

```bash
curl -X POST http://localhost:8787/configure-market \
  -H "content-type: application/json" \
  -d '{"slug":"will-china-invade-taiwan-before-2027"}'
```

```bash
curl http://localhost:8787/config
```

How to get a slug or ID

- Slug: from the Polymarket URL after /market/ (or the event’s page, pick the child market you want).
- ID (optional): resolve from slug via Gamma:

```bash
curl "https://gamma-api.polymarket.com/markets/slug/<slug>" | jq -r .id
```

What the guard does

- Polls the chosen binary market and maps YES price p (0–1) → SAFE/CAUTION/PANIC.
- Reads vault HF from chain.
- Actions (with staticCall checks and throttles):
  - CAUTION: if HF < hfTarget → rebalance()
  - PANIC: if HF < hfSoftFloor → rebalance(); if still weak (HF < hfHardFloor) → pauseDeposits()
- If ENABLE_TX=0 (default), it only simulates and logs.

Endpoints (for debugging/integration)

- GET /risk-status → current state JSON (includes marketUrl, optional marketImageUrl)
- GET /config → currently selected market
- POST /configure-market { slug | id } → updates selection

Common issues

- “Failed to fetch” in the UI → guard not running or URL mismatch; ensure http://localhost:8787 is correct.
- Neutral data (p=0.5, marketId: “unset”) → select a market via UI or POST /configure-market.
- Large HF numbers on dev chains are fine; real vault data will normalize on a live pool.

# Build What’s Next on HyperEVM

Welcome to the **HyperEVM Hackathon** — a 24-hour sprint to **build, create, and grow the Hyperliquid ecosystem**.
Whether you’re writing smart contracts, designing integrations, or sparking cultural movements — this is your chance to **shape the future of HyperEVM**.

---

## Hackathon Details

| Detail          | Info                                                 |
| --------------- | ---------------------------------------------------- |
| **Duration**    | 24 hours                                             |
| **Access**      | 24/7 venue access (secured overnight)                |
| **Teams**       | Up to 5 members                                      |
| **Submissions** | Pull Request (PR) to this repository before deadline |
| **Judging**     | Each bounty judged by sponsor + external mentor      |
| **WiFi**        | MarriotBonvoy_Conference: heavylooping               |

---

## Agenda

### Day 1 – Nov 15

- **8:30** Doors open (coffee + setup)
- **9:30** Opening ceremony + sponsor track presentations
- **10:00** Hacking begins
- **12:00 - 15:00** Lunch
- **18:00** Sound bath to reset your brain

**Hack all night.**

### Day 2 – Nov 16

- **12:00 - 15:00** Lunch
- **15:00** Project submissions due
- **17:30** Closing Ceremony

---

## Sponsored Bounties

There are **four sponsored tasks** and **one wildcard track** open to any idea that pushes the HyperEVM ecosystem forward.

Each sponsor will post their **specific task and bounty** in the `/tasks/` folder.

---

## Rules

1. **Team Formation**

   - Max **5 participants per team**.
   - Teams are self-organized; solo builders welcome.

2. **Bounty Ownership**

   - Each **sponsor** selects a **winner** for their bounty with **one external mentor**.

3. **Submission Process**

   - Fork this repository.
   - Create a new branch with your project name.
   - Add your project folder under `/submissions/your-project-name/`.
   - Submit a **Pull Request** before the hackathon deadline.
   - Include a `README.md` in your folder describing your idea, tech stack, and demo.
   - **All submissions must be open source licensed** (MIT, Apache 2.0, or similar). Unless the sponsor requires otherwiese. Include a `LICENSE` file in your submission folder.

4. **Conduct**

   - Be respectful.
   - Collaborate and help others.
   - No plagiarism or use of pre-built projects.

---

## Repository Structure

```
/tasks/
  looping-collective.md
  gluex.md
  hypurrfi.md
  lava.md
  wildcard.md

/submissions/
  your-project-name/
    README.md
    demo/
    contracts/
```

---

## Let’s Build What’s Next

HyperEVM is your canvas.
Build fast, think bold, and **push the boundaries of on-chain coordination**.
Good luck, and see you on the leaderboard.
