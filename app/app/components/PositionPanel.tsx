import React from "react";

export function PositionPanel() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px]">
      <div className="rounded-2xl bg-panel p-5 sm:p-6">
        <div className="mb-3 text-base font-semibold text-slate-200">My Position</div>
        <div className="space-y-2 text-base">
          <Row icon="📈" label="Effective UBTC exposure" value="1.2 UBTC" accent="mint" />
          <Row icon="🪙" label="Deposited UBTC" value="0.5 UBTC" accent="sky" />
          <Row icon="⚡" label="Implied leverage" value="2.4×" accent="yellow" />
          <Row icon="🎯" label="Share of vault" value="0.22%" accent="mint" />
        </div>
        <div className="mt-5">
          <button className="w-full rounded-xl border border-brand-sky/50 bg-transparent px-5 py-3 text-base font-semibold text-brand-sky transition hover:bg-brand-sky/10 hover:shadow-sky-glow">
            Exit to UBTC
          </button>
          <div className="mt-2 text-sm text-brand-yellow/90">
            LoopGuard keeps HF within safety bands automatically. Rebalancing may repay debt
            or unwind part of the loop to avoid liquidation.
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


