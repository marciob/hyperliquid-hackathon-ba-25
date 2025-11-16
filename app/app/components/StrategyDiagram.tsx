import React from "react";
import { StatusBadge } from "./StatusBadge";

function Connector() {
  return (
    <div className="mx-auto h-6 w-0.5 bg-gradient-to-b from-white/10 via-white/10 to-transparent" />
  );
}

export function StrategyDiagram() {
  return (
    <div className="rounded-xl border border-border-dim bg-panel p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">Strategy Diagram</h2>
        <StatusBadge text="Visual only · mock" variant="slate" withDot={false} />
      </div>

      <div className="flex flex-col items-stretch">
        <div className="mx-auto w-full max-w-sm rounded-xl bg-gradient-to-r from-brand-mint/30 to-brand-sky/30 p-[1px] shadow-mint-glow">
          <div className="rounded-xl bg-panel-2/80 px-4 py-3 text-center backdrop-blur">
            <div className="text-sm font-semibold text-slate-100">LoopGuard Vault</div>
            <div className="mt-0.5 text-xs text-slate-300">UBTC / USDXL leverage loop</div>
          </div>
        </div>

        <Connector />

        <div className="mx-auto w-full max-w-sm rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3">
          <div className="text-sm font-semibold text-brand-yellow">HF Bands</div>
          <div className="mt-1 space-y-0.5 text-xs text-brand-yellow/90">
            <div>Target: 1.90</div>
            <div>Soft floor: 1.60</div>
            <div>Hard floor: 1.40</div>
          </div>
        </div>

        <Connector />

        <div className="mx-auto w-full max-w-sm rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-4 py-3">
          <div className="text-sm font-semibold text-brand-pink">Polymarket BTC Odds</div>
          <div className="mt-1 space-y-0.5 text-xs text-brand-pink/90">
            <div>“BTC down 12–1am”</div>
            <div>Current odds (mock): 70% down</div>
          </div>
        </div>

        <Connector />

        <div className="mx-auto w-full max-w-sm rounded-xl border border-brand-sky/40 bg-brand-sky/10 px-4 py-3">
          <div className="text-sm font-semibold text-brand-sky">Keeper Rebalance</div>
          <div className="mt-1 text-xs text-brand-sky/90">
            If HF &lt; soft floor or odds &gt; threshold → repay debt / unwind.
          </div>
          <div className="mt-3">
            <StatusBadge text="Enabled (off-chain bot)" variant="mint" />
          </div>
        </div>
      </div>
    </div>
  );
}


