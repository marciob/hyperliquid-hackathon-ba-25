"use client";

import React, { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useApproveAndDeposit, useDepositBorrowNoSwap, type TxState } from "../hooks/useTx";
import { useVaultStatus, useVaultThresholds } from "../hooks/useVault";
import { hyperEvm } from "../providers/WagmiProvider";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DepositPanel({ strategyName, riskSummary }: { strategyName: string; riskSummary: string }) {
  const [amount, setAmount] = useState<string>("");
  const [enableBorrow, setEnableBorrow] = useState<boolean>(false);
  const [borrowPct, setBorrowPct] = useState<string>("5"); // % of available borrows
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { run } = useApproveAndDeposit();
  const { run: runNoSwap } = useDepositBorrowNoSwap();
  const { status } = useVaultStatus();
  const thresholds = useVaultThresholds();

  const hf = status?.healthFactor;
  const hfHard = thresholds.data.hfHardFloor;
  const hfSoft = thresholds.data.hfSoftFloor;
  const isBlockedByHF = useMemo(() => {
    if (!hf || !hfHard) return false;
    return hf < hfHard;
  }, [hf, hfHard]);

  const parsedAmount = useMemo(() => {
    try {
      if (!amount || !amount.trim()) return 0n;
      return parseUnits(amount as `${number}`, 18);
    } catch {
      return 0n;
    }
  }, [amount]);

  const canDeposit =
    amount.trim().length > 0 &&
    parsedAmount > 0n &&
    isConnected &&
    chainId === hyperEvm.id &&
    !isBlockedByHF &&
    (tx.phase === "idle" || tx.phase === "success" || tx.phase === "error");

  const onDeposit = async () => {
    if (!canDeposit) return;
    setTx({ phase: "idle" });
    if (enableBorrow) {
      const pct = Number(borrowPct);
      const bps = Number.isFinite(pct) && pct > 0 ? Math.min(Math.floor(pct * 100), 7000) : 500; // cap to 70%
      await runNoSwap(parsedAmount, bps, setTx);
    } else {
    await run(parsedAmount, setTx);
    }
  };

  const needsSwitch = isConnected && chainId !== hyperEvm.id;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px]">
        <div className="rounded-2xl bg-panel p-5 sm:p-6">
          <label className="block text-sm text-slate-300">Amount to deposit (HYPE)</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full rounded-xl border border-border-dim bg-panel-2 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-brand-mint/60 focus:ring-2 focus:ring-brand-mint/30 hover:shadow-mint-glow-sm"
            />
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={enableBorrow}
                  onChange={(e) => setEnableBorrow(e.target.checked)}
                />
                Borrow (no swap)
              </label>
              {enableBorrow ? (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">Borrow %</span>
                  <input
                    value={borrowPct}
                    onChange={(e) => setBorrowPct(e.target.value)}
                    inputMode="decimal"
                    className="w-14 rounded-md border border-white/10 bg-panel-2 px-2 py-1 text-slate-100"
                  />
                </div>
              ) : null}
            </div>
          </div>
          {needsSwitch ? (
            <div className="mt-3 text-sm text-brand-yellow">Please switch to HyperEVM (chainId 999) to deposit.</div>
          ) : null}
          {isBlockedByHF ? (
            <div className="mt-3 text-sm text-brand-pink">
              Deposits blocked until vault deleverages (HF below hard floor).
            </div>
          ) : null}
          <button
            type="button"
            onClick={onDeposit}
            disabled={!canDeposit}
            className={cn(
              "mt-4 w-full rounded-full bg-gradient-to-r from-[#BAFCE2] to-[#C6EFFF] px-6 py-3.5 text-base font-semibold text-[#050608] shadow-[0_0_14px_rgba(186,252,226,0.5)] transition",
              "hover:shadow-[0_0_22px_rgba(186,252,226,0.55)] hover:scale-[1.015]",
              !canDeposit && "opacity-60 shadow-none hover:scale-100"
            )}
          >
            {tx.phase === "approving"
              ? "Approving…"
              : tx.phase === "depositing"
              ? "Depositing…"
              : tx.phase === "withdrawing"
              ? "Withdrawing…"
              : "Deposit & Loop"}
          </button>
          {tx.phase === "error" ? (
            <div className="mt-2 text-sm text-brand-pink">{tx.error}</div>
          ) : tx.phase !== "idle" && "hash" in tx && tx.hash ? (
            <div className="mt-2 text-sm text-brand-sky break-all">Tx: {tx.hash}</div>
          ) : null}
          {hf && hfSoft ? (
            <div className="mt-2 text-sm text-brand-yellow/90">
              Current HF: {formatRay(hf)} · Soft floor: {formatRay(hfSoft)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px]">
        <div className="rounded-2xl bg-panel p-5 sm:p-6">
          <div className="text-sm text-slate-300">You are depositing into:</div>
          <div className="mt-1 text-base font-semibold text-slate-100">{strategyName}</div>
          <div className="mt-2 text-sm text-slate-300">{riskSummary}</div>
        </div>
      </div>
    </div>
  );
}

function formatRay(x: bigint) {
  // Values are ~1.x * 1e18
  const int = Number(x) / 1e18;
  return int.toFixed(2);
}

