"use client";

import React from "react";
import { usePolymarketGuard } from "../hooks/usePolymarketGuard";
import { useVaultThresholds } from "../hooks/useVault";

export function HomeSafetyStrip() {
  const { data: guard } = usePolymarketGuard(15000);
  const thresholds = useVaultThresholds();
  const risk = guard?.riskState ?? "—";
  const p = guard?.yesProbability ?? null;
  const pct = p !== null ? Math.round(p * 100) : null;
  const hfTarget = thresholds.data.hfTarget ? Number(thresholds.data.hfTarget) / 1e18 : undefined;
  const hfSoft = thresholds.data.hfSoftFloor ? Number(thresholds.data.hfSoftFloor) / 1e18 : undefined;
  const hfHard = thresholds.data.hfHardFloor ? Number(thresholds.data.hfHardFloor) / 1e18 : undefined;

  const riskColor =
    risk === "SAFE"
      ? "text-emerald-300 border-emerald-500/40"
      : risk === "PANIC"
      ? "text-red-300 border-red-500/40"
      : "text-yellow-300 border-yellow-500/40";

  return (
    <div
      className="mb-6 rounded-3xl border border-[#C6EFFF33] bg-[#0C0F13] px-5 py-4 shadow-[0_0_14px_rgba(198,239,255,0.15)]"
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 0% 0%, rgba(198,239,255,0.08) 0%, rgba(12,15,19,0) 60%), radial-gradient(120% 80% at 100% 100%, rgba(186,252,226,0.07) 0%, rgba(12,15,19,0) 60%)",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <div className="text-sm font-semibold text-brand-sky">Live guard</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskColor}`}>
            Macro: {risk} {pct !== null ? `(${pct}%)` : ""}
          </div>
          <div
            className="rounded-full border border-[#BAFCE233] px-3 py-1 text-xs text-brand-mint"
            title="HF (Health Factor) targets and bands determine how far from liquidation the strategy stays."
          >
            HF target {hfTarget?.toFixed(1) ?? "—"} · band {hfSoft?.toFixed(1) ?? "—"}–{hfHard?.toFixed(1) ?? "—"}
          </div>
          {guard?.marketUrl ? (
            <a
              href={guard.marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#C6EFFF33] bg-[#10141A] px-3 py-1 text-xs text-brand-sky hover:bg-[#C6EFFF1A]"
            >
              View market
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}


