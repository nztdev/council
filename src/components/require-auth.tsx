"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, profile, loading, isPreview } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // next.config.ts has trailingSlash: true, so a static-export runtime
  // pathname is "/onboarding/", not "/onboarding" - normalize before
  // comparing, or this check silently never matches.
  const isOnboardingPage = pathname === "/onboarding" || pathname === "/onboarding/";

  const needsOnboarding =
    !loading && session && profile && !isPreview && !profile.onboardedAt;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/signin");
      return;
    }
    if (needsOnboarding && !isOnboardingPage) {
      router.replace("/onboarding");
    }
  }, [loading, session, needsOnboarding, isOnboardingPage, router]);

  if (loading || !session || (needsOnboarding && !isOnboardingPage)) {
    return (
      <div className="max-w-md w-full mx-auto px-6 pt-16">
        <p className="text-ink-soft text-sm">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
