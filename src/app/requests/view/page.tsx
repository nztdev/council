"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { useAuth } from "@/lib/auth";
import { voteRepository } from "@/lib/repositories";
import { hydrateRequest, requestRepository } from "@/lib/hydrate";
import type { RequestWithMeta, Vote, VoteChoice } from "@/types";

const CHOICES: { value: VoteChoice; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

function choiceColor(choice: VoteChoice) {
  if (choice === "yes") return "text-indigo";
  if (choice === "no") return "text-rose";
  return "text-brass";
}

function RequestInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { profile: user } = useAuth();
  const [request, setRequest] = useState<RequestWithMeta | null>(null);
  const [myVote, setMyVote] = useState<Vote | null | undefined>(undefined);
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    if (!id) return;
    const raw = await requestRepository.get(id);
    if (!raw) return;
    setRequest(await hydrateRequest(raw));
    if (user) {
      const v = await voteRepository.getForUserAndRequest(id, user.id);
      setMyVote(v ?? null);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function submitVote() {
    if (!user || !choice || !id) return;
    setSubmitting(true);
    await voteRepository.cast({
      requestId: id,
      userId: user.id,
      choice,
      comment: comment.trim() || undefined,
    });
    await refresh();
    setSubmitting(false);
  }

  if (!request || !user) return null;

  const isAuthor = request.authorId === user.id;
  const hasVoted = Boolean(myVote);
  const showResults = isAuthor || hasVoted;

  const counts = { yes: 0, maybe: 0, no: 0 };
  request.votes.forEach((v) => counts[v.choice]++);
  const total = request.votes.length;

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <Seal user={request.author} />
        <div>
          <p className="font-medium leading-tight">{request.author.name}</p>
          <p className="text-xs text-ink-soft font-mono">
            {request.council.name}
          </p>
        </div>
      </div>

      <h1 className="font-display font-semibold tracking-tight text-3xl leading-tight mb-3">
        {request.title}
      </h1>
      {request.context && (
        <p className="text-ink-soft text-sm leading-relaxed mb-8">
          {request.context}
        </p>
      )}

      {!showResults && (
        <div className="rounded-3xl border border-border bg-surface p-5 mb-8">
          <p className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-3">
            Your opinion
          </p>
          <div className="flex gap-2 mb-4">
            {CHOICES.map((c) => (
              <button
                key={c.value}
                onClick={() => setChoice(c.value)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  choice === c.value
                    ? "border-indigo bg-indigo-soft text-indigo"
                    : "border-border text-ink-soft"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a reason (optional)"
            rows={3}
            className="w-full rounded-xl border border-border bg-stone px-3 py-2 text-sm outline-none focus:border-indigo resize-none mb-4"
          />
          <button
            onClick={submitVote}
            disabled={!choice || submitting}
            className="w-full btn-primary rounded-xl py-2.5 text-sm font-medium"
          >
            Submit opinion
          </button>
        </div>
      )}

      {showResults && (
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            {CHOICES.map((c) => (
              <div key={c.value} className="flex-1 text-center">
                <p className={`font-display font-bold text-2xl ${choiceColor(c.value)}`}>
                  {total === 0 ? 0 : Math.round((counts[c.value] / total) * 100)}%
                </p>
                <p className="text-xs font-mono uppercase tracking-wide text-ink-soft">
                  {c.label}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs font-mono uppercase tracking-widest text-ink-soft mb-3">
            {total} {total === 1 ? "opinion" : "opinions"}
          </p>
          <div className="flex flex-col gap-3">
            {request.votes.map((v) => (
              <VoteRow key={v.id} vote={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VoteRow({ vote }: { vote: Vote }) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    import("@/lib/repositories").then(({ userRepository }) => {
      userRepository.get(vote.userId).then((u) => {
        if (u) setName(u.name);
      });
    });
  }, [vote.userId]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{name}</span>
        <span className={`text-xs font-mono uppercase ${choiceColor(vote.choice)}`}>
          {vote.choice}
        </span>
      </div>
      {vote.comment && (
        <p className="text-sm text-ink-soft leading-relaxed">{vote.comment}</p>
      )}
    </div>
  );
}

export default function RequestPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <RequestInner />
      </Suspense>
    </RequireAuth>
  );
}
