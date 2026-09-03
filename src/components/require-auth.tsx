"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/signin");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="max-w-md w-full mx-auto px-6 pt-16">
        <p className="text-ink-soft text-sm">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
