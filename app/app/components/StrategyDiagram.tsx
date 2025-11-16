import React from "react";
import { StatusBadge } from "./StatusBadge";

type BubbleProps = {
  title: string;
  icon?: string;
  subtitle?: string;
  lines?: string[];
  accent: "mint" | "yellow" | "pink" | "sky";
  footerBadge?: React.ReactNode;
};

function bubbleClasses(accent: BubbleProps["accent"]) {
  switch (accent) {
    case "mint":
      return "bg-brand-mint/15 shadow-mint-glow";
    case "yellow":
      return "bg-brand-yellow/15 shadow-yellow-glow";
    case "pink":
      return "bg-brand-pink/15 shadow-pink-glow";
    case "sky":
    default:
      return "bg-brand-sky/15 shadow-sky-glow";
  }
}

function titleClasses(accent: BubbleProps["accent"]) {
  switch (accent) {
    case "mint":
      return "text-brand-mint";
    case "yellow":
      return "text-brand-yellow";
    case "pink":
      return "text-brand-pink";
    case "sky":
    default:
      return "text-brand-sky";
  }
}

function Bubble({ title, icon, subtitle, lines, accent, footerBadge }: BubbleProps) {
  return (
    <div className={`mx-auto w-full max-w-md rounded-2xl px-7 py-7 ${bubbleClasses(accent)} backdrop-blur-sm`}>
      <div className={`text-xl font-semibold tracking-tight ${titleClasses(accent)}`}>
        <span className="mr-2">{icon}</span>
        {title}
      </div>
      {subtitle ? <div className="mt-1 text-base text-slate-200/95">{subtitle}</div> : null}
      {lines ? (
        <div className="mt-1 space-y-1 text-base text-slate-200/95">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : null}
      {footerBadge ? <div className="mt-3">{footerBadge}</div> : null}
    </div>
  );
}

export function StrategyDiagram() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-mint/6 to-brand-sky/6 p-[2px] shadow-panel-soft">
      <div className="relative overflow-hidden rounded-2xl bg-[#0C0F13] p-7 sm:p-9">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Strategy Diagram</h2>
          <StatusBadge text="Visual only · mock" variant="slate" withDot={false} />
        </div>

      {/* Faint radial behind top node */}
      <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-48 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(186,252,226,0.18),transparent_60%)]" />
      {/* Tiny pastel shapes */}
      <div className="pointer-events-none absolute right-4 top-10 -z-10 h-20 w-20 rounded-full bg-brand-sky/10 blur-xl" />
      <div className="pointer-events-none absolute bottom-10 left-6 -z-10 h-16 w-16 rounded-full bg-brand-pink/10 blur-xl" />

      {/* Curved animated connectors */}
      <svg className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="connMintSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#BAFCE2" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C6EFFF" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="connYellow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F7EF9A" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F7EF9A" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="connPink" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0.25" />
          </linearGradient>
          <style>
            {`.dash { stroke-dasharray: 8 10; animation: dash 8s linear infinite; }`}
          </style>
        </defs>
        {/* Vault -> HF Bands */}
        <path d="M 50 18 C 38 28, 62 32, 50 40" stroke="url(#connMintSky)" strokeWidth="1.1" fill="none" className="dash" />
        {/* HF Bands -> Odds */}
        <path d="M 50 44 C 40 52, 60 56, 50 64" stroke="url(#connYellow)" strokeWidth="1.1" fill="none" className="dash" />
        {/* Odds -> Keeper */}
        <path d="M 50 68 C 42 76, 58 80, 50 88" stroke="url(#connPink)" strokeWidth="1.1" fill="none" className="dash" />
      </svg>

        {/* Paw watermark */}
        <div className="pointer-events-none absolute right-6 top-6 -z-0 select-none text-8xl opacity-[0.06]">🐾</div>

        <div className="flex flex-col items-stretch gap-9">
        <Bubble
          icon="🐾"
          title="LoopGuard Vault"
          subtitle="UBTC / USDXL leverage loop"
          accent="mint"
        />
        <Bubble
          icon="📏"
          title="HF Bands"
          lines={["Target: 1.90", "Soft floor: 1.60", "Hard floor: 1.40"]}
          accent="yellow"
        />
        <Bubble
          icon="📊"
          title="Polymarket BTC Odds"
          lines={[`“BTC down 12–1am”`, "Current odds (mock): 70% down"]}
          accent="pink"
        />
        <Bubble
          icon="🤖"
          title="Keeper Rebalance"
          lines={["If HF < soft floor or odds > threshold → repay debt / unwind."]}
          accent="sky"
          footerBadge={<StatusBadge text="Enabled (off-chain bot)" variant="mint" />}
        />
        </div>
      </div>
    </div>
  );
}


