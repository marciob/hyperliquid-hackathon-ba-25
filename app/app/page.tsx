// app/page.tsx
import { VaultHeader } from "./components/VaultHeader";
import { UserPanel } from "./components/UserPanel";
import { StrategyDiagram } from "./components/StrategyDiagram";

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto max-w-[1160px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <VaultHeader />

        <div className="mt-10 grid grid-cols-1 gap-7 lg:mt-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <UserPanel />
          </div>
          <div className="lg:col-span-4">
            <StrategyDiagram />
          </div>
        </div>
      </div>
    </main>
  );
}
