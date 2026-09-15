"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { useAuth } from "@/lib/auth";
import { basePath } from "@/lib/base-path";

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
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      {isPreview && (
        <div className="rounded-xl border border-dashed border-border bg-brass-soft px-4 py-3 mb-6 text-sm text-ink-soft">
          You&apos;re viewing sample data in preview mode. Nothing here is
          saved to a real account.
        </div>
      )}

      <div className="flex items-center gap-4 mb-10">
        <Seal user={profile} size="lg" />
        <div>
          <h1 className="font-display font-semibold tracking-tight text-2xl">
            {profile.name}
          </h1>
          <p className="text-sm text-ink-soft">
            {isPreview ? "Preview mode" : "Signed in"}
          </p>
        </div>
      </div>

      <Link
        href="/votes"
        className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium mb-8 hover:border-indigo transition-colors"
      >
        My votes
      </Link>

      <button
        onClick={handleSignOut}
        className="text-sm text-rose font-medium text-left"
      >
        {isPreview ? "Exit preview" : "Sign out"}
      </button>
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