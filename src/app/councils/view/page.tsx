"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Crown, Pencil, Check, MessageSquareText } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { councilRepository, userRepository } from "@/lib/repositories";
import { hydrateRequests, requestRepository } from "@/lib/hydrate";
import { computeRequestStatus } from "@/lib/close-rules";
import { Card, Badge, Input, EmptyState } from "@/components/ui";
import type { Council, RequestWithMeta, User } from "@/types";

function CouncilInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [council, setCouncil] = useState<Council | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestWithMeta[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  async function refresh() {
    if (!id) return;
    const c = await councilRepository.get(id);
    if (!c) return;
    setCouncil(c);
    const allUsers = await userRepository.list();
    setMembers(allUsers.filter((u) => c.memberIds.includes(u.id)));
    const reqs = await requestRepository.listForCouncil(c.id);
    setRequests(await hydrateRequests(reqs));
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveRename() {
    if (!council || !nameDraft.trim()) return;
    await councilRepository.rename(council.id, nameDraft.trim());
    setEditingName(false);
    refresh();
  }

  if (!council) return null;

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        {council.isSupreme && <Crown className="text-brass shrink-0" size={20} />}
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="py-2 text-lg font-display font-semibold"
              autoFocus
            />
            <button onClick={saveRename} className="text-indigo shrink-0" aria-label="Save name">
              <Check size={20} />
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-display font-semibold tracking-tight text-3xl">
              {council.name}
            </h1>
            <button
              onClick={() => {
                setNameDraft(council.name);
                setEditingName(true);
              }}
              className="text-ink-soft hover:text-indigo transition-colors shrink-0"
              aria-label="Rename council"
            >
              <Pencil size={16} />
            </button>
          </>
        )}
      </div>
      {council.isSupreme && (
        <p className="text-xs text-ink-soft mb-2">
          Your permanent council - always here, can be renamed, never deleted.
        </p>
      )}
      <p className="text-ink-soft mb-5">{council.description}</p>

      <div className="flex flex-wrap gap-3 mb-8">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <Seal user={m} size="sm" />
            <span className="text-sm">{m.name}</span>
          </div>
        ))}
      </div>

      <Link href={`/councils/new?councilId=${council.id}`} className="btn-primary rounded-xl py-3 text-center text-sm font-medium mb-8">
        Ask your council
      </Link>

      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
        Past requests
      </h2>
      <div className="flex flex-col gap-3">
        {requests.map((r) => {
          const { status } = computeRequestStatus(r, council.memberIds.length, r.votes);
          return (
            <Card key={r.id} href={`/requests/view?id=${r.id}`} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="font-display font-semibold text-lg">{r.title}</p>
                <Badge tone={status === "closed" ? "rose" : "indigo"}>
                  {status === "closed" ? "Closed" : "Open"}
                </Badge>
              </div>
              <p className="text-xs font-mono text-ink-soft">
                {r.votes.length} {r.votes.length === 1 ? "opinion" : "opinions"}
              </p>
            </Card>
          );
        })}
        {requests.length === 0 && (
          <EmptyState icon={<MessageSquareText className="text-ink-soft" size={24} />}>
            No requests posted to this council yet.
          </EmptyState>
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
