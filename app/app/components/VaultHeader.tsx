import React from "react";
import { MetricCard } from "./MetricCard";
import { StatusBadge } from "./StatusBadge";

export function VaultHeader() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-mint sm:text-3xl">
            LoopGuard – UBTC / USDXL
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-panel px-3 py-1.5">
            <span className="inline-flex items-center gap-2 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-mint shadow-mint-glow-sm" />
              <span>Managed loop on HypurrFi</span>
            </span>
            <span className="mx-2 h-4 w-px bg-white/10" />
            <span className="text-xs text-slate-400">HyperEVM mainnet</span>
          </div>
        </div>
        <div className="sm:pt-1">
          <StatusBadge text="Demo · Mock data" variant="slate" withDot={false} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Vault TVL" value="$175,600" />
        <MetricCard label="Health Factor" value="2.07" />
        <MetricCard label="Leverage" value="2.4×" />
      </div>
    </div>
  );
}


