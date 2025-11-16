// app/page.tsx
import Link from "next/link";
import { strategies } from "./data/strategies";
import { HomeSafetyStrip } from "./components/HomeSafetyStrip";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <div className="container-lg py-8 sm:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-text-main">
            Safer yields, backed by live signals
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Health Factor guard rails + Polymarket macro signal → friendly, risk‑aware leverage.
          </p>
          <div className="mt-3 h-1 w-16 rounded-full bg-brand-mint shadow-mint-glow-sm" />
        </header>
        <HomeSafetyStrip />

        <div className="mb-3">
          <h2 className="text-xl font-semibold text-text-main">Choose a strategy</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {strategies.map((s, idx) => {
            const isCore = s.variant === "Core";
            const isConservative = s.variant === "Conservative";
            const border =
              isCore
                ? "border-[#BAFCE233]"
                : isConservative
                ? "border-[#C6EFFF33]"
                : "border-[#F9A8D433]";
            const shadow =
              isCore
                ? "shadow-[0_0_20px_rgba(186,252,226,0.35)]"
                : isConservative
                ? "shadow-[0_0_20px_rgba(198,239,255,0.30)]"
                : "shadow-[0_0_20px_rgba(249,168,212,0.35)]";
            const icon = isCore ? "🐾" : isConservative ? "🛡️" : "✨";

            const RiskPill = () => {
              const cls =
                s.riskLevel === "Low"
                  ? "bg-[#D6F3D220] border border-[#D6F3D240] text-[#D6F3D2]"
                  : s.riskLevel === "Moderate"
                  ? "bg-[#F7EF9A20] border border-[#F7EF9A40] text-[#F7EF9A]"
                  : "bg-[#F9A8D420] border border-[#F9A8D440] text-[#F9A8D4]";
              return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{s.riskLevel}</span>;
            };

            return (
              <div
                key={s.id}
                className={`flex h-full flex-col justify-between gap-4 rounded-3xl border bg-surface p-6 ${border} ${shadow}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <h2 className="text-lg font-semibold text-text-main">
                      {s.name} {s.variant ? `(${s.variant})` : ""}
                    </h2>
                  </div>
                  <RiskPill />
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <div>
                    <div className="text-text-muted text-xs">Est. leverage</div>
                    <div className="text-text-main">{s.estLeverage.toFixed(1)}×</div>
                  </div>
                  <span className="text-text-soft">•</span>
                  <div>
                    <div className="text-text-muted text-xs">Guard rails</div>
                    <div className="text-text-main">
                      HF {s.hfBandMin.toFixed(1)}–{s.hfBandMax.toFixed(1)}
                    </div>
                  </div>
                  <span className="text-text-soft">•</span>
                  <div>
                    <div className="text-text-muted text-xs">Yield</div>
                    <div className="text-text-main">Coming soon</div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-text-subtle">{s.shortDescription}</p>

                <div className="mt-1 flex items-center gap-3">
                  <Link
                    href={`/strategy/${s.id}?tab=deposit`}
                    className="rounded-full bg-gradient-to-r from-brand-mint to-brand-sky px-5 py-2.5 text-sm font-semibold text-[#050608] shadow-[0_0_18px_rgba(186,252,226,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_22px_rgba(186,252,226,0.45)]"
                  >
                    Deposit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
