"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { requestRepository } from "@/lib/repositories";

function NewRequestInner() {
  const searchParams = useSearchParams();
  const councilId = searchParams.get("councilId") ?? "";
  const router = useRouter();
  const { profile: user } = useAuth();
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user || !title.trim() || !councilId) return;
    setSubmitting(true);
    const req = await requestRepository.create({
      councilId,
      authorId: user.id,
      title: title.trim(),
      context: context.trim(),
    });
    router.replace(`/requests/view?id=${req.id}`);
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <h1 className="font-display font-semibold tracking-tight text-3xl mb-8">Ask your council</h1>

      <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
        Title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Should I move to Madrid?"
        className="mt-1 mb-5 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo"
      />

      <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
        Context
      </label>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="I've received an offer..."
        rows={5}
        className="mt-1 mb-8 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo resize-none"
      />

      <button
        onClick={submit}
        disabled={!title.trim() || submitting || !councilId}
        className="btn-primary rounded-xl py-3 text-sm font-medium"
      >
        Post to council
      </button>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <NewRequestInner />
      </Suspense>
    </RequireAuth>
  );
}
