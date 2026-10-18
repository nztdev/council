import type { ReactNode } from "react";

type Tone = "indigo" | "rose" | "brass" | "neutral";

const toneClasses: Record<Tone, string> = {
  indigo: "bg-indigo-soft text-indigo",
  rose: "bg-rose-soft text-rose",
  brass: "bg-brass-soft text-brass",
  neutral: "bg-stone text-ink-soft border border-border",
};

/** Small status/label pill - open/closed badges, "Supreme" tag, vote
 * choice labels. One place to keep the pill shape and tone palette. */
export function Badge({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wide px-2 py-1 rounded-full ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
