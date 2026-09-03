"use client";

import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { useAuth } from "@/lib/auth";

function ProfileContent() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  if (!profile) return null;

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-10">
        <Seal user={profile} size="lg" />
        <div>
          <h1 className="font-display font-semibold tracking-tight text-2xl">
            {profile.name}
          </h1>
          <p className="text-sm text-ink-soft">Signed in</p>
        </div>
      </div>

      <button
        onClick={async () => {
          await signOut();
          router.replace("/signin");
        }}
        className="text-sm text-rose font-medium text-left"
      >
        Sign out
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
