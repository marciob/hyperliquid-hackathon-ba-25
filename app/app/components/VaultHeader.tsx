import React from "react";
import { MetricCard } from "./MetricCard";
import { StatusBadge } from "./StatusBadge";

export function VaultHeader() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-mint">
            LoopGuard – UBTC / USDXL
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-sky/10 px-3 py-1.5 ring-1 ring-brand-sky/30 shadow-sky-glow">
            <span className="inline-flex items-center gap-2 text-sm text-slate-200">
              <span className="h-2 w-2 rounded-full bg-brand-mint shadow-mint-glow-sm" />
              <span>Managed loop on HypurrFi</span>
            </span>
            <span className="mx-2 h-4 w-px bg-white/15" />
            <span className="text-sm text-slate-400">HyperEVM mainnet</span>
            <span className="ml-2 text-base">🐾</span>
          </div>
        </div>
        <div className="sm:pt-1">
          <StatusBadge
            text="Demo · Mock data"
            variant="slate"
            withDot={false}
          />
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* tiny sparkles */}
        <span className="pointer-events-none absolute -left-2 -top-2 text-sm opacity-40">
          ✦
        </span>
        <span className="pointer-events-none absolute right-0 -top-3 text-xs opacity-40">
          ✦
        </span>
        <MetricCard label="Vault TVL" value="$175,600" accent="mint" />
        <MetricCard label="Health Factor" value="2.07" accent="yellow" />
        <MetricCard label="Leverage" value="2.4×" accent="sky" />
      </div>
    </div>
  );
}
