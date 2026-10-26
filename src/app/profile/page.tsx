"use client";

import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { ThemePicker } from "@/components/theme-picker";
import { useAuth } from "@/lib/auth";
import { basePath } from "@/lib/base-path";
import { Card } from "@/components/ui";
import { PageHero } from "@/components/ui/PageHero";
import { ListChecks, LogOut } from "lucide-react";

function ProfileContent() {
  const { profile, signOut, isPreview } = useAuth();

  if (!profile) return null;

  async function handleSignOut() {
    await signOut();
    // Full reload, not router.replace: AuthProvider only checks preview
    // mode once per mount, so leaving preview mode needs a fresh mount
    // to actually clear the signed-in state everywhere in the app.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${basePath}/signin/`;
  }

  return (
    <div className="flex-1 flex flex-col">
      <PageHero
        eyebrow={isPreview ? "Preview mode" : "Signed in"}
        title={profile.name}
      />

      <div className="max-w-md w-full mx-auto px-6 pt-8 flex-1 flex flex-col">
        {isPreview && (
          <div className="rounded-xl border border-dashed border-border bg-brass-soft px-4 py-3 mb-6 text-sm text-ink-soft">
            You&apos;re viewing sample data in preview mode. Nothing here is
            saved to a real account.
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <Seal user={profile} size="lg" />
        </div>

        <ThemePicker />

        <Card href="/votes" className="p-4 mb-8">
          <div className="flex items-center gap-3">
            <ListChecks className="text-indigo" size={20} />
            <span className="text-sm font-medium">My votes</span>
          </div>
        </Card>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm font-medium text-rose hover:opacity-80 transition-opacity"
        >
          <LogOut size={16} />
          {isPreview ? "Exit preview" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
