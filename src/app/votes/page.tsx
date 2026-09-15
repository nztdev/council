"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { voteRepository } from "@/lib/repositories";
import { requestRepository } from "@/lib/hydrate";
import type { CouncilRequest, Vote, VoteChoice } from "@/types";

function choiceColor(choice: VoteChoice) {
  if (choice === "yes") return "text-indigo";
  if (choice === "no") return "text-rose";
  return "text-brass";
}

interface VoteWithRequest {
  vote: Vote;
  request: CouncilRequest | undefined;
}

function VotesContent() {
  const { profile: user } = useAuth();
  const [items, setItems] = useState<VoteWithRequest[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const votes = await voteRepository.listForUser(user.id);
      const withRequests = await Promise.all(
        votes.map(async (vote) => ({
          vote,
          request: await requestRepository.get(vote.requestId),
        }))
      );
      setItems(withRequests);
    })();
  }, [user]);

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <h1 className="font-display font-semibold tracking-tight text-3xl mb-8">My votes</h1>

      {items === null && <p className="text-sm text-ink-soft">Loading…</p>}

      {items && items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-ink-soft text-sm">
          You haven&apos;t voted on anything yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items?.map(({ vote, request }) => (
          <Link
            key={vote.id}
            href={request ? `/requests/view?id=${request.id}` : "#"}
            className="rounded-2xl border border-border bg-surface p-4 hover:border-indigo transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="font-display font-semibold text-lg">
                {request?.title ?? "Deleted request"}
              </p>
              <span
                className={`shrink-0 text-xs font-mono uppercase ${choiceColor(vote.choice)}`}
              >
                {vote.choice}
              </span>
            </div>
            {vote.comment && (
              <p className="text-sm text-ink-soft leading-relaxed">{vote.comment}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function VotesPage() {
  return (
    <RequireAuth>
      <VotesContent />
    </RequireAuth>
  );
}