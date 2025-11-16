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
  const accentText =
    accent === "mint"
      ? "text-brand-mint"
      : accent === "sky"
      ? "text-brand-sky"
      : accent === "yellow"
      ? "text-brand-yellow"
      : "text-brand-pink";
  const borderGlow =
    accent === "mint"
      ? "shadow-[0_0_14px_rgba(186,252,226,0.15)]"
      : accent === "sky"
      ? "shadow-[0_0_14px_rgba(198,239,255,0.15)]"
      : accent === "yellow"
      ? "shadow-[0_0_14px_rgba(247,239,154,0.15)]"
      : "shadow-[0_0_14px_rgba(249,168,212,0.15)]";
  const borderColor =
    accent === "mint"
      ? "border-[#BAFCE233]"
      : accent === "sky"
      ? "border-[#C6EFFF33]"
      : accent === "yellow"
      ? "border-[#F7EF9A33]"
      : "border-[#F9A8D433]";

  return (
    <div
      className={`rounded-3xl border bg-[#0C0F13] px-5 py-4 ${borderColor} ${borderGlow}`}
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 10% 0%, rgba(198,239,255,0.08) 0%, rgba(12,15,19,0) 60%), radial-gradient(120% 80% at 90% 100%, rgba(186,252,226,0.07) 0%, rgba(12,15,19,0) 60%)",
      }}
    >
      <div className={`text-[11px] uppercase tracking-wide ${accentText}`}>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold text-text-main">{value}</div>
    </div>
  );
}


