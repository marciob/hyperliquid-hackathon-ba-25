LoopGuard (HypurrFi leverage vault on HyperEVM)

Idea (what it is)
- A HypurrFi strategy vault that accepts HYPE (or WHYPE), supplies to HypurrFi, borrows USDXL, and optionally loops (borrow → swap → resupply). The vault enforces deleverage‑only risk controls via health‑factor (HF) bands:
  - hfHardFloor < hfSoftFloor < hfTarget, all ≥ 1.0
  - Permissionless `rebalance()` that only improves HF (never increases risk)
- Optional Polymarket “Macro Guard” (off‑chain) that reads a binary market and triggers safe deleveraging when risk rises.

Tech stack
- Contracts: Solidity (Hardhat), minimal Aave‑style HypurrFi Pool interface
- Frontend: Next.js 15, React 19, wagmi/viem, Tailwind
- Keeper: Node.js (ethers v6), simple HTTP server (Polymarket Gamma API)

How to run (quick)
1) Install:
```bash
npm install
cd app && npm install
```
2) Set root .env (minimum):
```
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
VAULT_ADDRESS=0xYourVaultAddress
NEXT_PUBLIC_POLYMARKET_GUARD_URL=http://localhost:8787
```
3) Sync frontend env:
```bash
npm run sync:frontend-env
```
4) Start UI:
```bash
cd app
npm run dev
```
5) (Optional) Run Polymarket guard:
```bash
cd /Users/m/Desktop/dev/hyperliquid-hackathon
npm run polymarket-guard
```

Demo (≤ 3 min) – placeholder
- Video: https://example.com/demo-loopguard (replace with final link)
- Flow: deposit → position opens → view shares/HF → rebalance (if needed) → full exit

Notes / limitations
- Router can be unset (0x0) for borrow‑only demos; swaps disabled in that mode.
- Shares are internal accounting (non‑ERC‑20) for the hackathon demo.
- Safety: new deposits blocked if HF < hard floor; `rebalance()` must improve HF.

Addresses
- Runs on HyperEVM (chainId 999). Vault/token addresses are synced into `app/.env.local` via `npm run sync:frontend-env`.


