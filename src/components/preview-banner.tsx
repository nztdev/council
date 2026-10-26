"use client";

import { useAuth } from "@/lib/auth";

export function PreviewBanner() {
  const { isPreview } = useAuth();
  if (!isPreview) return null;

  return (
    <div className="banner-warm text-center text-xs font-mono uppercase tracking-wide py-1.5">
      Preview mode · sample data, nothing is saved
    </div>
  );
}
