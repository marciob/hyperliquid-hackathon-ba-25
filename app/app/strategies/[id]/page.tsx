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
      <section className="mt-4 rounded-2xl bg-[#080A0D] border border-[#C6EFFF1F] shadow-[0_0_12px_rgba(198,239,255,0.14)] p-6">
        <h3 className="text-lg font-semibold text-[#C6EFFF]">What this strategy does</h3>
        <ul className="mt-3 space-y-2 text-base text-[#CBD5E1]">
          <li><span className="text-[#F7EF9A]">✦</span> Loops HYPE on HypurrFi to increase your exposure.</li>
          <li><span className="text-[#F7EF9A]">✦</span> Keeps HF between {s.hfBandMin.toFixed(1)} and {s.hfBandMax.toFixed(1)} using automatic guard rails.</li>
          <li><span className="text-[#F7EF9A]">✦</span> Optionally reacts to Polymarket odds to rebalance earlier.</li>
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#F7EF9A20] border border-[#F7EF9A40] p-5">
          <div className="text-sm text-[#F7EF9A] font-semibold">Risk level</div>
          <div className="mt-2 text-base text-[#F7EF9A]">{s.riskLevel}</div>
        </div>
        <div className="rounded-2xl bg-[#BAFCE220] border border-[#BAFCE240] p-5">
          <div className="text-sm text-[#BAFCE2] font-semibold">HF band</div>
          <div className="mt-2 text-base text-[#BAFCE2]">
            min {s.hfBandMin.toFixed(1)} · target {s.hfTarget.toFixed(1)} · max {s.hfBandMax.toFixed(1)}
          </div>
        </div>
        <div className="rounded-2xl bg-[#C6EFFF20] border border-[#C6EFFF40] p-5">
          <div className="text-sm text-[#C6EFFF] font-semibold">Who is this for?</div>
          <div className="mt-2 text-base text-[#CBD5E1]">Users seeking controlled leverage on HYPE with automatic safety rails.</div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl bg-[#080A0D] border border-[#F9A8D420] shadow-[0_0_12px_rgba(249,168,212,0.16)] p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-[#F9A8D4]">Flow diagram preview</h4>
          <button className="rounded-full px-3 py-1 text-sm text-[#C6EFFF] transition hover:bg-[#C6EFFF1A]">Show diagram</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-[#BAFCE220] px-3 py-1 text-[#050608]">Vault</span>
          <span className="text-[#64748B]">→</span>
          <span className="rounded-full bg-[#F7EF9A20] px-3 py-1 text-[#F7EF9A]">HF Bands</span>
          <span className="text-[#64748B]">→</span>
          <span className="rounded-full bg-[#F9A8D420] px-3 py-1 text-[#F9A8D4]">Polymarket</span>
          <span className="text-[#64748B]">→</span>
          <span className="rounded-full bg-[#C6EFFF20] px-3 py-1 text-[#C6EFFF]">Keeper</span>
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

export default function StrategyDetail({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const s = strategies.find((x) => x.id === params.id);
  if (!s) return notFound();
  const activeParam = (searchParams?.tab as "overview" | "deposit" | "dashboard") || "overview";
  return (
    <main className="min-h-screen w-full pt-10">
      <div className="mx-auto max-w-5xl px-4">
        <StrategyHeader s={s} />
        <div className="mt-6 mb-6">
          <Tabs active={activeParam} baseHref={`/strategies/${s.id}`} />
        </div>
        <div>
          {activeParam === "overview" ? (
            <Overview s={s} />
          ) : activeParam === "deposit" ? (
            <DepositPanel strategyName={`${s.name}${s.variant ? ` (${s.variant})` : ""}`} riskSummary={`Risk: ${s.riskLevel} · HF band: ${s.hfBandMin}-${s.hfBandMax}`} />
          ) : (
            <Dashboard />
          )}
        </div>
      </div>
    </main>
  );
}


