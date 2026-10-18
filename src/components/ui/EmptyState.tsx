import type { ReactNode } from "react";

/** Consistent empty/zero-state treatment - "no requests yet",
 * "you're all caught up", etc. Dashed border distinguishes it at a
 * glance from a real Card. */
export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-8 text-center text-ink-soft text-sm flex flex-col items-center gap-3">
      {icon}
      {children}
    </div>
  );
}
