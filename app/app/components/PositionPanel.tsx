 "use client";
 
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useUserPosition } from "../hooks/useVault";
import { useWithdrawAll, type TxState } from "../hooks/useTx";

export function PositionPanel() {
  const { isConnected } = useAccount();
  const { position, isLoading } = useUserPosition();
  const { run } = useWithdrawAll();
  const [tx, setTx] = useState<TxState>({ phase: "idle" });

  const onWithdrawAll = async () => {
    const shares = position?.userShares ?? 0n;
    await run(shares, setTx);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px]">
      <div className="rounded-2xl bg-panel p-5 sm:p-6">
        <div className="mb-3 text-base font-semibold text-slate-200">My Position</div>
        {!isConnected ? (
          <div className="text-sm text-[#94A3B8]">Connect your wallet to view your position.</div>
        ) : isLoading ? (
          <div className="text-sm text-[#94A3B8]">Loading…</div>
        ) : (
          <div className="space-y-2 text-base">
            <Row icon="🎯" label="My shares" value={formatToken(position?.userShares)} accent="mint" />
            <Row icon="🪙" label="My HYPE collateral (share)" value={formatToken(position?.userShareOfCollateralBase)} accent="sky" />
            <Row icon="💵" label="My USDXL debt (share)" value={formatToken(position?.userShareOfDebtBase)} accent="yellow" />
            <Row icon="⚖️" label="My est. HF" value={formatRay(position?.userHealthFactorEstimate)} accent="mint" />
          </div>
        )}
        <div className="mt-5">
          <button
            onClick={onWithdrawAll}
            disabled={!position || (position?.userShares ?? 0n) === 0n || tx.phase === "withdrawing"}
            className="w-full rounded-xl border border-brand-sky/50 bg-transparent px-5 py-3 text-base font-semibold text-brand-sky transition hover:bg-brand-sky/10 hover:shadow-sky-glow disabled:opacity-60"
          >
            {tx.phase === "withdrawing" ? "Withdrawing…" : "Withdraw all"}
          </button>
          <div className="mt-2 text-sm text-brand-yellow/90">
            LoopGuard keeps HF within safety bands automatically. Rebalancing may repay debt
            or unwind part of the loop to avoid liquidation.
          </div>
          {tx.phase === "error" ? (
            <div className="mt-2 text-sm text-brand-pink">{tx.error}</div>
          ) : tx.phase === "success" && "hash" in tx && tx.hash ? (
            <div className="mt-2 text-sm text-brand-sky break-all">Tx: {tx.hash}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  accent = "mint",
}: {
  icon: string;
  label: string;
  value: string;
  accent?: "mint" | "sky" | "yellow";
}) {
  const bubbleBg =
    accent === "mint"
      ? "bg-brand-mint/20"
      : accent === "sky"
      ? "bg-brand-sky/20"
      : "bg-brand-yellow/20";
  const bubbleShadow =
    accent === "mint"
      ? "shadow-mint-glow"
      : accent === "sky"
      ? "shadow-sky-glow"
      : "shadow-yellow-glow";
  const bubbleText =
    accent === "mint"
      ? "text-brand-mint"
      : accent === "sky"
      ? "text-brand-sky"
      : "text-brand-yellow";
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
      <span className="flex items-center gap-2 text-brand-sky/80">
        <span className="text-base">{icon}</span>
        {label}
      </span>
      <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${bubbleText} ${bubbleBg} ${bubbleShadow}`}>
        {value}
      </span>
    </div>
  );
}

function formatToken(x?: bigint) {
  if (x === undefined) return "-";
  // 18 decimals
  const n = Number(x) / 1e18;
  return `${n.toFixed(6)} `;
}

function formatRay(x?: bigint) {
  if (x === undefined) return "-";
  const n = Number(x) / 1e18;
  return n.toFixed(2);
}


