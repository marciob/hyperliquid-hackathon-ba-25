import { notFound } from "next/navigation";
import { strategies } from "../../data/strategies";
import { StrategyHeader } from "../../components/StrategyHeader";
import { Tabs } from "../../components/Tabs";
import { StrategyDiagram } from "../../components/StrategyDiagram";
import { MetricCard } from "../../components/MetricCard";
import { PositionPanel } from "../../components/PositionPanel";
import { DepositPanel } from "../../components/DepositPanel";

function Overview({ s }: { s: any }) {
  return (
    <div className="space-y-5">
      <section className="mt-4 rounded-2xl border border-[#C6EFFF1F] bg-surface p-6 shadow-[0_0_12px_rgba(198,239,255,0.14)]">
        <h3 className="text-lg font-semibold text-brand-sky">✨ What this strategy does</h3>
        <ul className="mt-3 space-y-2 text-base text-text-subtle">
          <li>
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-mint" />
            Loops UBTC on HypurrFi to increase your exposure.
          </li>
          <li>
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-mint" />
            Keeps HF between {s.hfBandMin.toFixed(1)} and {s.hfBandMax.toFixed(1)} using automatic guard rails.
          </li>
          <li>
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-mint" />
            Optionally reacts to Polymarket odds to rebalance earlier.
          </li>
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#F7EF9A20", border: "1px solid #F7EF9A40" }}>
          <div className="text-sm font-semibold text-brand-yellow">Risk level</div>
          <div className="mt-2 text-base text-brand-yellow">{s.riskLevel}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#BAFCE220", border: "1px solid #BAFCE240" }}>
          <div className="text-sm font-semibold text-brand-mint">HF band</div>
          <div className="mt-2 text-base text-text-main">
            <span className="text-brand-sky">target {s.hfTarget.toFixed(1)}</span> · {s.hfBandMin.toFixed(1)}–{s.hfBandMax.toFixed(1)}
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#C6EFFF20", border: "1px solid #C6EFFF40" }}>
          <div className="text-sm font-semibold text-brand-sky">Who is this for?</div>
          <div className="mt-2 text-base text-text-subtle">Users seeking controlled leverage on UBTC with automatic safety rails.</div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-[#F9A8D420] bg-surface p-5 shadow-[0_0_12px_rgba(249,168,212,0.16)]">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-brand-pink">Flow diagram (preview)</h4>
          <button className="rounded-full border border-[#C6EFFF33] bg-[#10141A] px-3 py-1 text-sm text-brand-sky transition hover:bg-[#C6EFFF1A]">
            Show diagram
          </button>
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-brand-mint px-3 py-1 text-[#050608] font-medium">Vault</span>
            <span className="text-text-soft">→</span>
            <span className="rounded-full px-3 py-1 text-brand-yellow" style={{ backgroundColor: "#F7EF9A20" }}>HF Bands</span>
            <span className="text-text-soft">→</span>
            <span className="rounded-full px-3 py-1 text-brand-pink" style={{ backgroundColor: "#F9A8D420" }}>Polymarket</span>
            <span className="text-text-soft">→</span>
            <span className="rounded-full px-3 py-1 text-brand-sky" style={{ backgroundColor: "#C6EFFF20" }}>Keeper</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Vault TVL" value="$175,600" accent="mint" />
        <MetricCard label="Health Factor" value="2.07" accent="yellow" />
        <MetricCard label="Leverage" value="2.4×" accent="sky" />
      </div>
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
  const activeParam = (sp?.tab as "overview" | "deposit" | "dashboard") || "overview";
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


