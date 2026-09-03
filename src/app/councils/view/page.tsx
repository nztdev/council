"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { councilRepository, userRepository } from "@/lib/repositories";
import { hydrateRequests, requestRepository } from "@/lib/hydrate";
import type { Council, RequestWithMeta, User } from "@/types";

function CouncilInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [council, setCouncil] = useState<Council | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestWithMeta[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const c = await councilRepository.get(id);
      if (!c) return;
      setCouncil(c);
      const allUsers = await userRepository.list();
      setMembers(allUsers.filter((u) => c.memberIds.includes(u.id)));
      const reqs = await requestRepository.listForCouncil(c.id);
      setRequests(await hydrateRequests(reqs));
    })();
  }, [id]);

  if (!council) return null;

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <h1 className="font-display font-semibold tracking-tight text-3xl mb-1">{council.name}</h1>
      <p className="text-ink-soft mb-5">{council.description}</p>

      <div className="flex flex-wrap gap-3 mb-8">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <Seal user={m} size="sm" />
            <span className="text-sm">{m.name}</span>
          </div>
        ))}
      </div>

      <Link
        href={`/councils/new?councilId=${council.id}`}
        className="btn-primary rounded-xl py-3 text-center text-sm font-medium mb-8"
      >
        Ask your council
      </Link>

      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
        Past requests
      </h2>
      <div className="flex flex-col gap-3">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`/requests/view?id=${r.id}`}
            className="rounded-2xl border border-border bg-surface p-4 hover:border-indigo transition-colors"
          >
            <p className="font-display font-semibold text-lg mb-1">{r.title}</p>
            <p className="text-xs font-mono text-ink-soft">
              {r.votes.length} {r.votes.length === 1 ? "opinion" : "opinions"}
            </p>
          </Link>
        ))}
        {requests.length === 0 && (
          <p className="text-sm text-ink-soft">
            No requests posted to this council yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CouncilPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <CouncilInner />
      </Suspense>
    </RequireAuth>
  );
}
