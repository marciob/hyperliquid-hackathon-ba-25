import React from "react";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border-dim bg-panel/70 p-4 transition-colors hover:border-border-dim-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-[10px] text-slate-500">{hint}</div> : null}
    </div>
  );
}


