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
    <div className="rounded-2xl bg-gradient-to-br from-brand-mint/5 to-brand-sky/5 p-[2px] shadow-panel-soft">
      <div className="rounded-2xl bg-panel p-5 sm:p-7">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="inline-flex rounded-full bg-gradient-to-r from-brand-mint/10 to-brand-sky/10 p-1 text-sm">
          <button
            className={cn(
              "rounded-full px-4 py-2 transition",
              activeTab === "deposit"
                ? "bg-brand-mint/30 text-white shadow-mint-glow-sm"
                : "text-brand-mint/80 hover:text-brand-mint"
            )}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit
          </button>
          <button
            className={cn(
              "rounded-full px-4 py-2 transition",
              activeTab === "exit"
                ? "bg-brand-sky/30 text-white shadow-sky-glow"
                : "text-brand-sky/80 hover:text-brand-sky"
            )}
            onClick={() => setActiveTab("exit")}
          >
            Exit
          </button>
        </div>
        <StatusBadge text="🟢 SAFE (HF 2.07)" variant="mint" />
      </div>

      {activeTab === "deposit" ? (
        <div className="space-y-3">
          <label className="block text-sm text-slate-300">Amount to deposit (UBTC)</label>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full rounded-xl border border-border-dim bg-panel-2 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-brand-mint/60 focus:ring-2 focus:ring-brand-mint/30 hover:shadow-mint-glow-sm"
            />
            <button
              className="rounded-xl border border-white/10 bg-panel-2 px-3 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
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
              "mt-3 w-full rounded-full bg-gradient-to-r from-[#BAFCE2] to-[#C6EFFF] px-6 py-3.5 text-base font-semibold text-[#050608] shadow-[0_0_14px_rgba(186,252,226,0.5)] transition",
              "hover:shadow-[0_0_22px_rgba(186,252,226,0.55)] hover:scale-[1.015]",
              !canDeposit && "opacity-60 shadow-none hover:scale-100"
            )}
          >
            {isDepositing ? "Depositing…" : "Deposit & Loop"}
          </button>
          <div className="text-sm text-brand-yellow/90">
            Est. leverage after deposit: 2.6× · Est. HF: 2.0
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-slate-300">
            Exit your share of the vault back to UBTC.
          </div>
          <button
            type="button"
            onClick={onExit}
            disabled={isExiting}
            className={cn(
              "mt-2 w-full rounded-xl border border-brand-sky/50 bg-transparent px-5 py-3 text-base font-semibold text-brand-sky transition",
              "hover:bg-brand-sky/10 hover:shadow-sky-glow",
              isExiting && "opacity-60 hover:bg-transparent hover:shadow-none"
            )}
          >
            {isExiting ? "Exiting…" : "Exit to UBTC"}
          </button>
        </div>
      )}

      <div className="mt-7 border-t border-border-dim pt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-3 text-base font-semibold text-slate-200">My Position</div>
            <div className="space-y-2 text-base">
              <Row icon="📈" label="Effective UBTC exposure" value="1.2 UBTC" accent="mint" />
              <Row icon="🪙" label="Deposited UBTC" value="0.5 UBTC" accent="sky" />
              <Row icon="⚡" label="Implied leverage" value="2.4×" accent="yellow" />
              <Row icon="🎯" label="Share of vault" value="0.22%" accent="mint" />
            </div>
          </div>
          <div>
            <div className="mb-3 text-base font-semibold text-slate-200">Actions</div>
            <button
              type="button"
              onClick={onExit}
              disabled={isExiting}
              className={cn(
                "w-full rounded-xl border border-brand-sky/50 bg-transparent px-5 py-3 text-base font-semibold text-brand-sky transition",
                "hover:bg-brand-sky/10 hover:shadow-sky-glow",
                isExiting && "opacity-60 hover:bg-transparent hover:shadow-none"
              )}
            >
              {isExiting ? "Exiting…" : "Exit to UBTC"}
            </button>
            <div className="mt-2 text-sm text-brand-yellow/90">
              LoopGuard keeps HF within safety bands automatically. Rebalancing may repay debt
              or unwind part of the loop to avoid liquidation.
            </div>
          </div>
        </div>
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
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
      <span className="flex items-center gap-2 text-brand-sky/80">
        <span className="text-base">{icon}</span>
        {label}
      </span>
      <span className={`rounded-full px-2.5 py-1 text-sm font-semibold text-slate-900 ${bubbleBg} ${bubbleShadow}`}>
        {value}
      </span>
    </div>
  );
}


