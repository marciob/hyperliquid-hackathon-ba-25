"use client";

import React, { useEffect, useState } from "react";
import { usePolymarketGuard } from "../hooks/usePolymarketGuard";

export function PolymarketMarketPicker({
  open,
  onClose,
  onConfigured,
}: {
  open: boolean;
  onClose: () => void;
  onConfigured?: () => void;
}) {
  const { data } = usePolymarketGuard(0);
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base =
    process.env.NEXT_PUBLIC_POLYMARKET_GUARD_URL || "http://localhost:8787";

  useEffect(() => {
    if (open) {
      setError(null);
      setIsSubmitting(false);
      setSlug(data?.marketSlug ?? "");
    }
  }, [open, data?.marketSlug]);

  async function submit() {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await fetch(`${base.replace(/\/$/, "")}/configure-market`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      onConfigured?.();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#C6EFFF33] bg-[#0C0F13] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-brand-sky">
            Select Polymarket market
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[#C6EFFF33] px-3 py-1 text-xs text-[#94A3B8] hover:bg-[#C6EFFF1A]"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="text-sm text-[#E2E8F0]">
            Market slug
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. will-china-invade-taiwan-before-2027"
              className="mt-1 w-full rounded-lg border border-[#233146] bg-[#0F1319] px-3 py-2 text-sm text-[#E2E8F0] outline-none ring-1 ring-inset ring-white/5 focus:ring-2 focus:ring-brand-sky"
            />
          </label>
          <div className="text-xs text-[#94A3B8]">
            Paste the slug from the URL after /market/. Example:{" "}
            <code className="rounded bg-[#10141A] px-1">
              will-china-invade-taiwan-before-2027
            </code>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              className="rounded-full border border-[#C6EFFF33] px-3 py-1 text-[#94A3B8] hover:bg-[#C6EFFF1A]"
              onClick={() =>
                setSlug("bitcoin-up-or-down-november-16-11am-et")
              }
            >
              Suggest: BTC Up/Down (hourly)
            </button>
            <button
              className="rounded-full border border-[#C6EFFF33] px-3 py-1 text-[#94A3B8] hover:bg-[#C6EFFF1A]"
              onClick={() => setSlug("will-china-invade-taiwan-before-2027")}
            >
              Suggest: China–Taiwan (by 2026)
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-[#F9A8D440] bg-[#2A0E16] px-3 py-2 text-xs text-brand-pink">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={submit}
            disabled={!slug || isSubmitting}
            className="rounded-full bg-gradient-to-r from-brand-mint to-brand-sky px-4 py-2 text-sm font-semibold text-[#050608] disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Use this market"}
          </button>
        </div>
      </div>
    </div>
  );
}


