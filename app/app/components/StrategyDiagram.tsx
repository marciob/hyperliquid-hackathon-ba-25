import React from "react";

export function StrategyDiagram() {
  return (
    <div className="rounded-2xl border border-[#C6EFFF1F] bg-[#0C0F13] p-5">
      <div className="mb-3 text-base font-semibold text-text-main">Strategy Flow</div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Pill bg="brand-mint" text="#050608">Vault</Pill>
        <Arrow />
        <Pill outline="brand-yellow" text="#F7EF9A">HF Bands</Pill>
        <Arrow />
        <Pill outline="brand-pink" text="#F9A8D4">Polymarket</Pill>
        <Arrow />
        <Pill outline="brand-sky" text="#C6EFFF">Keeper</Pill>
      </div>
      <div className="mt-3 text-sm text-text-subtle">
        Visualizes how deposits route through vault logic and guard rails.
      </div>
    </div>
  );
}

function Pill({
  children,
  bg,
  outline,
  text,
}: {
  children: React.ReactNode;
  bg?: "brand-mint";
  outline?: "brand-yellow" | "brand-pink" | "brand-sky";
  text: string;
}) {
  if (bg) {
    return (
      <span className="rounded-full px-3 py-1 text-sm" style={{ backgroundColor: "#BAFCE2", color: "#050608" }}>
        {children}
      </span>
    );
  }
  const borderColor =
    outline === "brand-yellow"
      ? "#F7EF9A40"
      : outline === "brand-pink"
      ? "#F9A8D440"
      : "#C6EFFF40";
  const bgColor =
    outline === "brand-yellow"
      ? "#F7EF9A20"
      : outline === "brand-pink"
      ? "#F9A8D420"
      : "#C6EFFF20";
  return (
    <span
      className="rounded-full px-3 py-1 text-sm"
      style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, color: text }}
    >
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-[#64748B]">→</span>;
}


