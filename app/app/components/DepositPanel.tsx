"use client";

import React, { useMemo, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DepositPanel({ strategyName, riskSummary }: { strategyName: string; riskSummary: string }) {
  const [amount, setAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const canDeposit = useMemo(() => amount.trim().length > 0 && !isDepositing, [amount, isDepositing]);

  function simulateDelay(cb: () => void) {
    window.setTimeout(cb, 1200);
  }
  function onDeposit() {
    if (!canDeposit) return;
    setIsDepositing(true);
    simulateDelay(() => setIsDepositing(false));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px]">
        <div className="rounded-2xl bg-panel p-5 sm:p-6">
          <label className="block text-sm text-slate-300">Amount to deposit (UBTC)</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full rounded-xl border border-border-dim bg-panel-2 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-brand-mint/60 focus:ring-2 focus:ring-brand-mint/30 hover:shadow-mint-glow-sm"
            />
            <button
              className="rounded-xl border border-white/10 bg-panel-2 px-3 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              type="button"
              onClick={() => setAmount("0.50")}
            >
              Max
            </button>
          </div>
          <button
            type="button"
            onClick={onDeposit}
            disabled={!canDeposit}
            className={cn(
              "mt-4 w-full rounded-full bg-gradient-to-r from-[#BAFCE2] to-[#C6EFFF] px-6 py-3.5 text-base font-semibold text-[#050608] shadow-[0_0_14px_rgba(186,252,226,0.5)] transition",
              "hover:shadow-[0_0_22px_rgba(186,252,226,0.55)] hover:scale-[1.015]",
              !canDeposit && "opacity-60 shadow-none hover:scale-100"
            )}
          >
            {isDepositing ? "Depositing…" : "Deposit & Loop"}
          </button>
          <div className="mt-2 text-sm text-brand-yellow/90">Est. leverage after deposit: 2.6× · Est. HF: 2.0</div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px]">
        <div className="rounded-2xl bg-panel p-5 sm:p-6">
          <div className="text-sm text-slate-300">You are depositing into:</div>
          <div className="mt-1 text-base font-semibold text-slate-100">{strategyName}</div>
          <div className="mt-2 text-sm text-slate-300">{riskSummary}</div>
        </div>
      </div>
    </div>
  );
}


