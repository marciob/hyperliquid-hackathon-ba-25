/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";

export type RiskState = "SAFE" | "CAUTION" | "PANIC";

export type GuardStatus = {
  marketId: string;
  yesProbability: number;
  riskState: RiskState;
  vaultHealthFactor: string;
  marketSlug?: string;
  marketUrl?: string;
  marketImageUrl?: string;
  lastAction: string;
  lastUpdated: string;
};

export function usePolymarketGuard(pollMs = 15000) {
  const [data, setData] = useState<GuardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const base =
    process.env.NEXT_PUBLIC_POLYMARKET_GUARD_URL || "http://localhost:8787";
  const url = `${base.replace(/\/$/, "")}/risk-status`;

  async function fetchOnce() {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GuardStatus;
      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOnce();
    timer.current = setInterval(fetchOnce, pollMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [url, pollMs]);

  return { data, isLoading, error };
}


