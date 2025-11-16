import { notFound } from "next/navigation";
import { strategies } from "../../data/strategies";
import { StrategyHeader } from "../../components/StrategyHeader";
import { Tabs } from "../../components/Tabs";
import { StrategyDiagram } from "../../components/StrategyDiagram";
import { MetricCard } from "../../components/MetricCard";
import { PositionPanel } from "../../components/PositionPanel";
import { DepositPanel } from "../../components/DepositPanel";
import VaultDashboard from "../../components/VaultDashboard";

function Overview({ s }: { s: any }) {
  return (
    <div className="space-y-5">
      <section className="mt-4 rounded-3xl border border-[#C6EFFF1F] bg-surface p-6 shadow-[0_0_12px_rgba(198,239,255,0.14)]">
        <h3 className="text-lg font-semibold text-brand-sky">✨ What is this?</h3>
        <p className="mt-2 text-base text-text-subtle">
          A HypurrFi strategy that loops HYPE for higher exposure with built‑in safety rails.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#F7EF9A20", border: "1px solid #F7EF9A40" }}>
            <div className="text-sm font-semibold text-brand-yellow">Risk</div>
            <div className="mt-1 text-base text-brand-yellow">{s.riskLevel}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#BAFCE220", border: "1px solid #BAFCE240" }}>
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-mint">
              HF band
              <span
                className="cursor-help text-text-soft"
                title="HF (Health Factor) is distance from liquidation. The vault targets this range; higher is safer."
              >
                ⓘ
              </span>
            </div>
            <div className="mt-1 text-base text-text-main">
              <span className="text-brand-sky">target {s.hfTarget.toFixed(1)}</span> · {s.hfBandMin.toFixed(1)}–{s.hfBandMax.toFixed(1)}
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#C6EFFF20", border: "1px solid #C6EFFF40" }}>
            <div className="text-sm font-semibold text-brand-sky">Who is it for?</div>
            <div className="mt-1 text-sm text-text-subtle">Users who want controlled leverage with auto‑guard rails.</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#BAFCE220] bg-surface p-6 shadow-[0_0_12px_rgba(186,252,226,0.16)]">
        <h3 className="text-lg font-semibold text-brand-mint">💸 Deposit</h3>
        <div className="mt-3">
          <DepositPanel
            strategyName={`${s.name}${s.variant ? ` (${s.variant})` : ""}`}
            riskSummary={`Risk: ${s.riskLevel} · HF band: ${s.hfBandMin}-${s.hfBandMax}`}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[#F9A8D420] bg-surface p-6 shadow-[0_0_16px_rgba(249,168,212,0.16)]">
        <h4 className="text-base font-semibold text-brand-pink">Flow diagram</h4>
        <div className="mt-4 scale-[1.08] sm:scale-[1.12] origin-top">
          <StrategyDiagram />
        </div>
      </section>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <VaultDashboard />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <PositionPanel />
        </div>
        <div className="lg:col-span-6">
          <StrategyDiagram />
        </div>
      </div>
    </div>
  );
}

export default async function StrategyDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const s = strategies.find((x) => x.id === id);
  if (!s) return notFound();
  const activeParam = (sp?.tab as "overview" | "deposit" | "dashboard") || "deposit";
  return (
    <main className="min-h-screen w-full pt-8 sm:pt-10">
      <div className="container-lg">
        <StrategyHeader s={s} />
        <div className="mt-6 mb-6">
          <Tabs active={activeParam} baseHref={`/strategy/${s.id}`} />
        </div>
        <div>
          {activeParam === "overview" ? (
            <Overview s={s} />
          ) : activeParam === "deposit" ? (
            <DepositPanel
              strategyName={`${s.name}${s.variant ? ` (${s.variant})` : ""}`}
              riskSummary={`Risk: ${s.riskLevel} · HF band: ${s.hfBandMin}-${s.hfBandMax}`}
            />
          ) : (
            <Dashboard />
          )}
        </div>
      </div>
    </main>
  );
}


