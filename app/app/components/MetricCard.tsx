import React from "react";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "mint" | "sky" | "yellow";
};

export function MetricCard({ label, value, hint, accent = "mint" }: MetricCardProps) {
  const glow =
    accent === "mint"
      ? "shadow-mint-glow"
      : accent === "sky"
      ? "shadow-sky-glow"
      : "shadow-yellow-glow";
  const grad =
    accent === "mint"
      ? "from-brand-mint/15 to-transparent"
      : accent === "sky"
      ? "from-brand-sky/15 to-transparent"
      : "from-brand-yellow/15 to-transparent";
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px] ${glow}`}>
      <div className="relative overflow-hidden rounded-2xl bg-panel/70 p-5 transition hover:brightness-110">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${grad}`} />
        <div className="relative text-sm text-slate-300">{label}</div>
        <div className="relative mt-1 text-2xl font-semibold text-slate-100 tracking-tight">{value}</div>
        {hint ? <div className="mt-1 text-[11px] text-slate-400">{hint}</div> : null}
      </div>
    </div>
  );
}


