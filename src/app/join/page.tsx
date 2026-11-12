"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleDot, CheckCircle2, AlertCircle } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { circleRepository } from "@/lib/repositories";
import { CIRCLE } from "@/lib/copy";
import { clearPendingInvite, setPendingInvite } from "@/lib/pending-invite";
import type { InvitePreview, InviteStatus } from "@/types";

const PROBLEMS: Partial<Record<InviteStatus, string>> = {
  invalid: "This invite link isn't valid. Check you copied all of it.",
  own: "This is your own invite link. Send it to someone else.",
  revoked: "This invite link was cancelled.",
  expired: "This invite link has expired. Ask for a new one.",
  used: "This invite link has already been used. Ask for a new one.",
  already: "You're already connected with this person.",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md w-full mx-auto px-6 pt-16 pb-10 flex-1 flex flex-col">
      <div className="w-14 h-14 rounded-2xl bg-indigo-soft flex items-center justify-center mb-6">
        <CircleDot className="text-indigo" size={28} />
      </div>
      {children}
    </div>
  );
}

function SignedInJoin({ code }: { code: string }) {
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ councilId?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPreview(await circleRepository.previewInvite(code));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't check this link.");
      }
    })();
  }, [code]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const result = await circleRepository.redeemInvite(code);
      clearPendingInvite();
      setDone(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't accept the invite.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Shell>
        <CheckCircle2 className="text-indigo mb-3" size={24} />
        <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
          You&apos;re connected
        </h1>
        <p className="text-ink-soft mb-8 leading-relaxed">
          {preview?.inviterName ?? "They"} is now in your {CIRCLE}
          {preview?.councilName ? `, and you've joined ${preview.councilName}` : ""}.
        </p>
        <Link
          href={done.councilId ? `/councils/view/?id=${done.councilId}` : "/circle/"}
          className="ui-btn btn-primary py-3 text-center text-sm font-medium"
        >
          {done.councilId ? "Open the council" : `See your ${CIRCLE}`}
        </Link>
      </Shell>
    );
  }

  if (!preview && !error) {
    return (
      <Shell>
        <p className="text-ink-soft text-sm">Checking your invitation…</p>
      </Shell>
    );
  }

  const problem = preview ? PROBLEMS[preview.status] : undefined;

  if (problem) {
    return (
      <Shell>
        <AlertCircle className="text-rose mb-3" size={24} />
        <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
          This link can&apos;t be used
        </h1>
        <p className="text-ink-soft mb-8 leading-relaxed">{problem}</p>
        <Link href="/queue/" className="text-indigo font-medium text-sm">
          Go to your queue
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
        {preview?.inviterName
          ? `${preview.inviterName} invited you`
          : "You've been invited"}
      </h1>
      <p className="text-ink-soft mb-6 leading-relaxed">
        Accepting connects the two of you in each other&apos;s {CIRCLE}
        {preview?.councilName ? (
          <>
            {" "}
            and adds you to the council <span className="font-medium">{preview.councilName}</span>
            {preview.askPolicy === "owner"
              ? ` as an advisor (only ${preview.inviterName ?? "the owner"} asks questions; you answer them)`
              : preview.askPolicy === "members"
                ? " as a member (everyone in it can ask and answer questions)"
                : ""}
            , where members can see each other&apos;s questions and votes
          </>
        ) : null}
        . You can leave or remove them any time.
      </p>
      {error && <p className="text-sm text-rose mb-4">{error}</p>}
      <Button onClick={accept} disabled={busy || !preview}>
        Accept invitation
      </Button>
      <Link href="/queue/" className="text-sm text-ink-soft text-center mt-4">
        Not now
      </Link>
    </Shell>
  );
}

function JoinInner() {
  const code = useSearchParams().get("code") ?? "";
  const { session, loading } = useAuth();

  useEffect(() => {
    // Remember the code so it survives sign-up / sign-in / onboarding.
    if (code && !loading && !session) setPendingInvite(code);
  }, [code, loading, session]);

  if (!code) {
    return (
      <Shell>
        <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
          Missing invite code
        </h1>
        <p className="text-ink-soft">This link looks incomplete. Ask for it again.</p>
      </Shell>
    );
  }

  if (loading) return null;

  if (!session) {
    return (
      <Shell>
        <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
          You&apos;ve been invited to Council
        </h1>
        <p className="text-ink-soft mb-8 leading-relaxed">
          Council is where you ask the people whose judgement you trust. Create
          an account or sign in to accept this invitation - it&apos;ll be waiting for
          you straight after.
        </p>
        <Link href="/signup/" className="ui-btn btn-primary py-3 text-center text-sm font-medium mb-3">
          Create an account
        </Link>
        <Link href="/signin/" className="ui-btn ui-btn-secondary py-3 text-center text-sm font-medium">
          I already have an account
        </Link>
      </Shell>
    );
  }

  return (
    <RequireAuth>
      <SignedInJoin code={code} />
    </RequireAuth>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInner />
    </Suspense>
  );
}