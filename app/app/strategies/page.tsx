import Link from "next/link";
import { strategies } from "../data/strategies";

function RiskBadge({ level }: { level: "Low" | "Moderate" | "High" }) {
  const styles =
    level === "Low"
      ? "bg-[#D6F3D220] border border-[#D6F3D240] text-[#D6F3D2]"
      : level === "Moderate"
      ? "bg-[#F7EF9A20] border border-[#F7EF9A40] text-[#F7EF9A]"
      : "bg-[#F9A8D420] border border-[#F9A8D440] text-[#F9A8D4]";
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${styles}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{level}</span>;
}

function variantTint(variant?: string) {
  if (variant === "Core") {
    return {
      border: "border-[#BAFCE220]",
      shadow: "shadow-[0_0_20px_rgba(186,252,226,0.12)]",
    };
  }
  if (variant === "Conservative") {
    return {
      border: "border-[#C6EFFF20]",
      shadow: "shadow-[0_0_20px_rgba(198,239,255,0.12)]",
    };
  }
  // Experimental/default → pink
  return {
    border: "border-[#F9A8D420]",
    shadow: "shadow-[0_0_20px_rgba(249,168,212,0.12)]",
  };
}

export default function StrategiesPage() {
  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-[#E2F5EE]">Choose a strategy</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">Pick a LoopGuard strategy to see details and deposit.</p>
          <div className="mt-3 h-1 w-16 rounded-full bg-[#BAFCE2]" />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {strategies.map((s, idx) => {
            const tint = variantTint(s.variant);
            const icon = idx === 0 ? "🐾" : idx === 1 ? "🛡️" : "✨";
            return (
              <div key={s.id} className={`rounded-3xl bg-[#080A0D] p-6 ${tint.border} ${tint.shadow} border flex flex-col justify-between gap-4 h-full`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <h2 className="text-lg font-semibold text-[#E2F5EE]">
                      {s.name} {s.variant ? `(${s.variant})` : ""}
                    </h2>
                  </div>
                  <RiskBadge level={s.riskLevel} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <div className="text-[#94A3B8]">Est. leverage</div>
                    <div className="text-[#E2F5EE]">{s.estLeverage.toFixed(1)}×</div>
                  </div>
                  <div>
                    <div className="text-[#94A3B8]">Guard rails</div>
                    <div className="text-[#E2F5EE]">HF {s.hfBandMin.toFixed(1)}–{s.hfBandMax.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[#94A3B8]">Yield</div>
                    <div className="text-[#E2F5EE]">Coming soon</div>
                  </div>
                </div>
                <p className="text-sm text-[#CBD5E1]">{s.shortDescription}</p>
                <div className="mt-1 flex items-center gap-3">
                  <Link
                    href={`/strategies/${s.id}`}
                    className="rounded-full bg-gradient-to-r from-[#BAFCE2] to-[#C6EFFF] px-5 py-2.5 text-sm font-semibold text-[#050608] shadow-[0_0_18px_rgba(186,252,226,0.45)] transition hover:shadow-[0_0_22px_rgba(186,252,226,0.5)]"
                  >
                    View details
                  </Link>
                  <Link
                    href={`/strategies/${s.id}`}
                    className="rounded-full px-3 py-2 text-sm text-[#C6EFFF] transition hover:bg-[#C6EFFF1A]"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


