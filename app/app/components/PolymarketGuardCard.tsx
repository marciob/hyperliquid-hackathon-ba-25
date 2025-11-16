"use client";

import React from "react";
import { usePolymarketGuard } from "../hooks/usePolymarketGuard";
import { PolymarketMarketPicker } from "./PolymarketMarketPicker";

function colorTone(risk?: string) {
  switch (risk) {
    case "SAFE":
      return {
        text: "text-emerald-300",
        border: "border-emerald-500/40",
        ring: "ring-emerald-500/20",
        bar: "bg-emerald-400",
        glow: "shadow-[0_0_24px_rgba(16,185,129,0.25)]",
      };
    case "PANIC":
      return {
        text: "text-red-300",
        border: "border-red-500/40",
        ring: "ring-red-500/20",
        bar: "bg-red-400",
        glow: "shadow-[0_0_24px_rgba(239,68,68,0.25)]",
      };
    case "CAUTION":
    default:
      return {
        text: "text-yellow-300",
        border: "border-yellow-500/40",
        ring: "ring-yellow-500/20",
        bar: "bg-yellow-400",
        glow: "shadow-[0_0_24px_rgba(234,179,8,0.25)]",
      };
  }
}

export function PolymarketGuardCard() {
  const { data, isLoading, error } = usePolymarketGuard(15000);
  const p = data?.yesProbability ?? null;
  const risk = data?.riskState;
  const c = colorTone(risk);
  const pct = p !== null ? Math.round(p * 100) : null;
  const marketUnknown = !data?.marketId || data?.marketId === "unset";
  const marketUrl = data?.marketUrl;
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  function onConfigured() {
    // Trigger one-off refresh by bumping key; hook uses polling but this helps UX
    setRefreshKey((k) => k + 1);
  }

  return (
    <div
      className={`rounded-3xl border bg-[#0C0F13] px-5 py-5 ${c.border} ${c.glow}`}
    >
      {data?.marketImageUrl ? (
        <div className="mb-4 overflow-hidden rounded-2xl ring-1 ring-inset ring-white/5">
          <img
            src={data.marketImageUrl}
            alt="Market cover"
            className="h-32 w-full object-cover sm:h-40"
          />
        </div>
      ) : null}
      <PolymarketMarketPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfigured={onConfigured}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-brand-sky">
          Polymarket Macro Guard
        </div>
        <div className="flex items-center gap-3">
          {marketUrl ? (
            <a
              href={marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 rounded-full border border-[#C6EFFF33] bg-[#10141A] px-3 py-1 text-xs text-brand-sky transition hover:bg-[#C6EFFF1A]"
              title="Open on Polymarket"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3Z" />
                <path d="M5 5h6v2H7v10h10v-4h2v6H5V5Z" />
              </svg>
              <span>Open</span>
            </a>
          ) : null}
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-[#C6EFFF33] bg-[#10141A] px-3 py-1 text-xs text-[#94A3B8] transition hover:bg-[#C6EFFF1A]"
            title="Change market"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M3 5h18v2H3V5zm3 6h12v2H6v-2zm-3 6h18v2H3v-2z" />
            </svg>
            Change
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-sky/80" />
            <span className="text-xs text-[#94A3B8]">Live</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${c.text} ${c.border}`}
          >
            {isLoading ? "Loading…" : risk ?? "-"}
          </div>
          <div className={`text-2xl font-bold sm:text-3xl ${c.text}`}>
            {risk ?? "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#94A3B8]">YES probability</div>
          <div className="text-2xl font-semibold text-[#E2E8F0]">
            {pct !== null ? `${pct}%` : "—"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-[#1B2430] ring-1 ring-inset ring-white/5">
          <div
            className={`h-2 rounded-full ${c.bar}`}
            style={{ width: `${pct ?? 0}%`, transition: "width 300ms ease" }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#0F1319] p-3 ring-1 ring-inset ring-white/5">
          <div className="text-[11px] uppercase tracking-wide text-[#64748B]">
            Market
          </div>
          <div className="mt-1 text-sm text-[#E2E8F0]">
            {marketUnknown ? (
              <span className="text-[#94A3B8]">Not configured</span>
            ) : (
              data?.marketId
            )}
          </div>
        </div>
        <div className="rounded-xl bg-[#0F1319] p-3 ring-1 ring-inset ring-white/5">
          <div className="text-[11px] uppercase tracking-wide text-[#64748B]">
            Updated
          </div>
          <div className="mt-1 text-sm text-[#E2E8F0]">
            {data?.lastUpdated
              ? new Date(data.lastUpdated).toLocaleTimeString()
              : "—"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-[#F9A8D440] bg-[#2A0E16] px-3 py-2 text-xs text-brand-pink">
          Guard error: {error}
        </div>
      ) : null}
    </div>
  );
}


