"use client";

import React, { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Tab = "deposit" | "exit";

export function UserPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const canDeposit = useMemo(() => amount.trim().length > 0 && !isDepositing, [amount, isDepositing]);

  function handleMax() {
    // Mock available balance
    setAmount("0.50");
  }

  function simulateDelay(cb: () => void) {
    window.setTimeout(cb, 1200);
  }

  function onDeposit() {
    if (!canDeposit) return;
    setIsDepositing(true);
    simulateDelay(() => setIsDepositing(false));
  }

  function onExit() {
    if (isExiting) return;
    setIsExiting(true);
    simulateDelay(() => setIsExiting(false));
  }

  return (
    <div className="rounded-xl border border-border-dim bg-panel p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="inline-flex rounded-full bg-panel-2 p-1 text-xs">
          <button
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              activeTab === "deposit" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
            )}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit
          </button>
          <button
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              activeTab === "exit" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
            )}
            onClick={() => setActiveTab("exit")}
          >
            Exit
          </button>
        </div>
        <StatusBadge text="Safe · HF 2.07" variant="mint" />
      </div>

      {activeTab === "deposit" ? (
        <div className="space-y-3">
          <label className="block text-xs text-slate-400">Amount to deposit (UBTC)</label>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full rounded-lg border border-border-dim bg-panel-2 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-mint/60 focus:ring-2 focus:ring-brand-mint/30"
            />
            <button
              className="rounded-lg border border-white/10 bg-panel-2 px-3 py-2 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              onClick={handleMax}
              type="button"
            >
              Max
            </button>
          </div>
          <button
            type="button"
            onClick={onDeposit}
            disabled={!canDeposit}
            className={cn(
              "mt-2 w-full rounded-lg bg-brand-mint/90 px-4 py-2 text-sm font-medium text-bg-base shadow-mint-glow transition",
              "hover:bg-brand-mint",
              !canDeposit && "opacity-60 shadow-none hover:bg-brand-mint/90"
            )}
          >
            {isDepositing ? "Depositing…" : "Deposit & Loop"}
          </button>
          <div className="text-[11px] text-slate-400">
            Est. leverage after deposit: 2.6× · Est. HF: 2.0
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Exit your share of the vault back to UBTC.
          </div>
          <button
            type="button"
            onClick={onExit}
            disabled={isExiting}
            className={cn(
              "mt-1 w-full rounded-lg border border-brand-sky/50 bg-transparent px-4 py-2 text-sm font-medium text-brand-sky transition",
              "hover:bg-brand-sky/10",
              isExiting && "opacity-60 hover:bg-transparent"
            )}
          >
            {isExiting ? "Exiting…" : "Exit to UBTC"}
          </button>
        </div>
      )}

      <div className="mt-6 border-t border-border-dim pt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-3 text-xs font-medium text-slate-300">My Position</div>
            <div className="space-y-2 text-sm">
              <Row label="Effective UBTC exposure" value="1.2 UBTC" />
              <Row label="Deposited UBTC" value="0.5 UBTC" />
              <Row label="Implied leverage" value="2.4×" />
              <Row label="Share of vault" value="0.22%" />
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-medium text-slate-300">Actions</div>
            <button
              type="button"
              onClick={onExit}
              disabled={isExiting}
              className={cn(
                "w-full rounded-lg border border-brand-sky/50 bg-transparent px-4 py-2 text-sm font-medium text-brand-sky transition",
                "hover:bg-brand-sky/10",
                isExiting && "opacity-60 hover:bg-transparent"
              )}
            >
              {isExiting ? "Exiting…" : "Exit to UBTC"}
            </button>
            <div className="mt-2 text-[11px] text-slate-400">
              LoopGuard keeps HF within safety bands automatically. Rebalancing may repay debt
              or unwind part of the loop to avoid liquidation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100">{value}</span>
    </div>
  );
}


