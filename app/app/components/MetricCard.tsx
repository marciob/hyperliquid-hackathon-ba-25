import React from "react";

export function MetricCard({
  label,
  value,
  accent = "mint",
}: {
  label: string;
  value: string;
  accent?: "mint" | "sky" | "yellow" | "pink";
}) {
  const accentColor =
    accent === "mint"
      ? "text-brand-mint"
      : accent === "sky"
      ? "text-brand-sky"
      : accent === "yellow"
      ? "text-brand-yellow"
      : "text-brand-pink";

  return (
    <div className="rounded-2xl border border-[#C6EFFF1F] bg-[#0C0F13] px-4 py-3">
      <div className={`text-xs ${accentColor}`}>{label}</div>
      <div className="mt-1 text-base font-semibold text-text-main">{value}</div>
    </div>
  );
}


