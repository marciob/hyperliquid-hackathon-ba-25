"use client";

import React, { useMemo, useState } from "react";
import { MetricCard } from "./MetricCard";
import { useVaultStatus, useVaultThresholds } from "../hooks/useVault";
import { useRebalance, type TxState } from "../hooks/useTx";
import { PolymarketGuardCard } from "./PolymarketGuardCard";

export default function VaultDashboard() {
  const { status, isLoading } = useVaultStatus();
  const thresholds = useVaultThresholds();
  const { run } = useRebalance();
  const [tx, setTx] = useState<TxState>({ phase: "idle" });

  const hf = status?.healthFactor;
  const hfSoft = thresholds.data.hfSoftFloor;
  const canRebalance = Boolean(hf && hfSoft && hf < hfSoft);

  const leverage = useMemo(() => {
    if (!status) return "-";
    const c = Number(status.totalCollateralBase) / 1e18;
    const d = Number(status.totalDebtBase) / 1e18;
    if (c <= 0) return "-";
    const equity = c - d;
    if (equity <= 0) return "-";
    const lev = c / equity;
    return `${lev.toFixed(2)}×`;
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-text-main">
          ✨ Quick Vault Glance
        </h3>
        <div className="text-xs text-text-muted">Friendly metrics and safety rails</div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Vault Collateral (HYPE)"
          value={formatToken(status?.totalCollateralBase)}
          accent="mint"
        />
        <MetricCard
          label="Vault Debt (USDXL)"
          value={formatToken(status?.totalDebtBase)}
          accent="pink"
        />
        <MetricCard
          label="Health Factor"
          value={hf ? formatRay(hf) : "-"}
          accent="yellow"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Available Borrows (base)"
          value={formatToken(status?.availableBorrowsBase)}
          accent="sky"
        />
        <MetricCard label="Leverage (approx)" value={leverage} accent="mint" />
        <div
          className="rounded-3xl border border-[#C6EFFF33] bg-[#0C0F13] px-5 py-4 shadow-[0_0_14px_rgba(198,239,255,0.15)]"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 0% 0%, rgba(198,239,255,0.08) 0%, rgba(12,15,19,0) 60%)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-brand-sky">
              Rebalance (safety)
            </div>
            <span className="text-lg">🐾</span>
          </div>
          <div className="mt-2">
            <button
              onClick={() => run(setTx)}
              disabled={!canRebalance || tx.phase === "rebalancing"}
              className="rounded-full border border-brand-sky/60 bg-transparent px-4 py-2 text-sm font-semibold text-brand-sky transition hover:bg-brand-sky/10 disabled:opacity-60"
            >
              {tx.phase === "rebalancing" ? "Rebalancing…" : "Call rebalance"}
            </button>
            {hf && hfSoft ? (
              <div className="mt-2 text-xs text-[#94A3B8]">
                Enabled when HF &lt; soft floor. HF {formatRay(hf)} · Soft {formatRay(hfSoft)}
              </div>
            ) : null}
            {tx.phase === "error" ? (
              <div className="mt-2 text-xs text-brand-pink">{tx.error}</div>
            ) : tx.phase === "success" && "hash" in tx && tx.hash ? (
              <div className="mt-2 text-xs text-brand-sky break-all">
                Tx: {tx.hash}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <PolymarketGuardCard />
      </div>
    </div>
  );
}

function formatToken(x?: bigint) {
  if (x === undefined) return "-";
  const n = Number(x) / 1e18;
  return n.toFixed(4);
}

function formatRay(x: bigint) {
  const n = Number(x) / 1e18;
  return n.toFixed(2);
}
