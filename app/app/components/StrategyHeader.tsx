import React from "react";
import { Strategy } from "../data/strategies";

function RiskPill({ level }: { level: "Low" | "Moderate" | "High" }) {
  const cls =
    level === "Low"
      ? "bg-[#D6F3D220] border border-[#D6F3D240] text-[#D6F3D2]"
      : level === "Moderate"
      ? "bg-[#F7EF9A20] border border-[#F7EF9A40] text-[#F7EF9A]"
      : "bg-[#F9A8D420] border border-[#F9A8D440] text-[#F9A8D4]";
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>Risk: {level}</span>;
}

export function StrategyHeader({ s }: { s: Strategy }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0A0C10] to-[#050608] border border-[#BAFCE220] shadow-[0_0_25px_rgba(186,252,226,0.20)] px-6 py-7 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-text-main tracking-tight">
            {s.name} {s.variant ? `(${s.variant})` : ""}
          </h1>
          <div className="text-sm text-text-muted">Powered by HypurrFi on HyperEVM</div>
        </div>
        <RiskPill level={s.riskLevel} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#0C0F13] border border-[#BAFCE215] px-4 py-3">
          <div className="text-xs text-text-soft">Est. leverage</div>
          <div className="text-base font-semibold text-text-main">{s.estLeverage.toFixed(1)}×</div>
        </div>
        <div className="rounded-2xl bg-[#0C0F13] border border-[#BAFCE215] px-4 py-3">
          <div className="text-xs text-text-soft">HF target · band</div>
          <div className="text-base font-semibold text-text-main">
            <span className="text-brand-sky">HF target {s.hfTarget.toFixed(1)}</span> · {s.hfBandMin.toFixed(1)}–{s.hfBandMax.toFixed(1)}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0C0F13] border border-[#BAFCE215] px-4 py-3">
          <div className="text-xs text-text-soft">Supported assets</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {s.assets.split("·").map((t, i) => (
              <span key={i} className="rounded-full bg-[#10141A] border border-[#C6EFFF26] px-2.5 py-0.5 text-xs text-brand-sky">
                {t.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


