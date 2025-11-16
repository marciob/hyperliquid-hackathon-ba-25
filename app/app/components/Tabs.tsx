import Link from "next/link";
import React from "react";

type TabKey = "overview" | "deposit" | "dashboard";

export function Tabs({ active, baseHref }: { active: TabKey; baseHref: string }) {
  const Item = ({ k, label }: { k: TabKey; label: string }) => {
    const isActive = active === k;
    const href = `${baseHref}?tab=${k}`;
    return (
      <Link
        href={href}
        className={`${
          isActive
            ? "bg-[#BAFCE2] text-[#050608] shadow-[0_0_12px_rgba(186,252,226,0.45)]"
            : "bg-transparent border border-[#C6EFFF33] text-[#C6EFFF] hover:bg-[#C6EFFF1A]"
        } rounded-full px-5 py-2.5 text-sm transition`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="inline-flex gap-2">
      <Item k="overview" label="Overview" />
      <Item k="deposit" label="Deposit" />
      <Item k="dashboard" label="Dashboard" />
    </div>
  );
}

