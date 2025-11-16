import React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "mint" | "yellow" | "pink" | "sky" | "slate";

type StatusBadgeProps = {
  text: string;
  variant?: Variant;
  withDot?: boolean;
  className?: string;
};

const variantStyles: Record<Variant, { bg: string; border: string; text: string; dot: string }> = {
  mint: {
    bg: "bg-brand-mint/10",
    border: "border-brand-mint/40",
    text: "text-brand-mint",
    dot: "bg-brand-mint",
  },
  yellow: {
    bg: "bg-brand-yellow/10",
    border: "border-brand-yellow/40",
    text: "text-brand-yellow",
    dot: "bg-brand-yellow",
  },
  pink: {
    bg: "bg-brand-pink/10",
    border: "border-brand-pink/40",
    text: "text-brand-pink",
    dot: "bg-brand-pink",
  },
  sky: {
    bg: "bg-brand-sky/10",
    border: "border-brand-sky/40",
    text: "text-brand-sky",
    dot: "bg-brand-sky",
  },
  slate: {
    bg: "bg-white/5",
    border: "border-white/10",
    text: "text-slate-300",
    dot: "bg-slate-300",
  },
};

export function StatusBadge({ text, variant = "slate", withDot = true, className }: StatusBadgeProps) {
  const v = variantStyles[variant];
  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", v.bg, v.border, v.text, className)}
    >
      {withDot ? <span className={cn("h-1.5 w-1.5 rounded-full shadow", v.dot)} /> : null}
      <span className="leading-none">{text}</span>
    </span>
  );
}


