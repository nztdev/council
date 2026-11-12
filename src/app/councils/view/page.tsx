"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Crown, Pencil, Check, MessageSquareText, UserPlus } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { InviteLinkCard } from "@/components/invite-link-card";
import { useAuth } from "@/lib/auth";
import {
  circleRepository,
  councilRepository,
  userRepository,
} from "@/lib/repositories";
import { hydrateRequests, requestRepository } from "@/lib/hydrate";
import { computeRequestStatus } from "@/lib/close-rules";
import { CIRCLE } from "@/lib/copy";
import {
  ROLE_LABEL,
  canAskIn,
  councilLabel,
  firstName,
  roleIn,
} from "@/lib/council-labels";
import { Button, Card, Badge, Input, EmptyState } from "@/components/ui";
import type { AskPolicy, Council, RequestWithMeta, User } from "@/types";

const ASK_OPTIONS: { id: AskPolicy; label: string; description: string }[] = [
  { id: "owner", label: "Only me", description: "Members advise; only you ask." },
  { id: "members", label: "Anyone in the council", description: "Every member can ask and answer." },
];

function CouncilInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { profile: me } = useAuth();
  const [council, setCouncil] = useState<Council | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestWithMeta[]>([]);
  const [circleMembers, setCircleMembers] = useState<User[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(council && me && council.ownerId === me.id);

  async function refresh() {
    if (!id) return;
    const c = await councilRepository.get(id);
    if (!c) return;
    setCouncil(c);
    const allUsers = await userRepository.list();
    setMembers(allUsers.filter((u) => c.memberIds.includes(u.id)));
    const reqs = await requestRepository.listForCouncil(c.id);
    setRequests(await hydrateRequests(reqs));
    if (me && c.ownerId === me.id) {
      setCircleMembers(await circleRepository.listMembers());
      setPendingIds(await councilRepository.listPendingInvitees(c.id));
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me?.id]);

  async function saveRename() {
    if (!council || !nameDraft.trim()) return;
    await councilRepository.rename(council.id, nameDraft.trim());
    setEditingName(false);
    refresh();
  }

  async function changeAskPolicy(policy: AskPolicy) {
    if (!council || council.askPolicy === policy) return;
    setError(null);
    try {
      await councilRepository.setAskPolicy(council.id, policy);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  async function invite(userId: string) {
    if (!council) return;
    setError(null);
    try {
      await councilRepository.inviteMember(council.id, userId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the invitation.");
    }
  }

  async function leave() {
    if (!council) return;
    const ok = window.confirm(
      `Leave ${council.name}? You'll stop seeing its questions, and you'd need a new invitation to rejoin.`
    );
    if (!ok) return;
    setError(null);
    try {
      await councilRepository.leave(council.id);
      window.history.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't leave the council.");
    }
  }

  if (!council) return null;

  const owner = members.find((m) => m.id === council.ownerId);
  const ownerFirst = owner ? firstName(owner.name) : "the owner";
  const role = roleIn(council, me?.id);
  const canAsk = canAskIn(council, me?.id);
  const invitable = circleMembers.filter((p) => !council.memberIds.includes(p.id));

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        {council.isSupreme && isOwner && <Crown className="text-brass shrink-0" size={20} />}
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
              {councilLabel(council, owner, me?.id)}
            </h1>
            {isOwner && (
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
            )}
          </>
        )}
      </div>

      {!isOwner && (
        <div className="flex items-center gap-2 mb-2">
          {owner && <Seal user={owner} size="sm" />}
          <span className="text-sm text-ink-soft">Owned by {ownerFirst}</span>
          <Badge tone="neutral">{ROLE_LABEL[role]}</Badge>
        </div>
      )}
      {council.isSupreme && (
        <p className="text-xs text-ink-soft mb-2">
          {isOwner
            ? "Your permanent council - always here, can be renamed, never deleted. Only you ask questions here; the people you invite advise."
            : `${ownerFirst}'s permanent council. You advise here: you answer the questions ${ownerFirst} asks.`}
        </p>
      )}
      <p className="text-ink-soft mb-5">{council.description}</p>

      <div className="flex flex-wrap gap-3 mb-8">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <Seal user={m} size="sm" />
            <span className="text-sm">{m.name}</span>
            {m.id === council.ownerId && <Badge tone="brass">Owner</Badge>}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-rose mb-4">{error}</p>}

      {canAsk ? (
        <Link
          href={`/councils/new?councilId=${council.id}`}
          className="ui-btn btn-primary py-3 text-center text-sm font-medium mb-8"
        >
          Ask your council
        </Link>
      ) : (
        <Card className="p-4 mb-8">
          <p className="text-sm text-ink-soft">
            Only {ownerFirst} asks questions in this council. You advise by
            answering them - they&apos;ll show up in your queue.
          </p>
        </Card>
      )}

      {isOwner && (
        <div className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
            Who can ask questions?
          </h2>
          {council.isSupreme ? (
            <Card className="p-4">
              <p className="text-sm text-ink-soft">
                Only you. A Supreme Council is always the people who advise you.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {ASK_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => changeAskPolicy(option.id)}
                  className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                    council.askPolicy === option.id
                      ? "border-indigo bg-indigo-soft"
                      : "border-border bg-surface"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      council.askPolicy === option.id ? "text-indigo" : "text-ink"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
            Invite people
          </h2>
          {invitable.length > 0 && (
            <Card className="p-4 mb-4">
              <p className="text-sm text-ink-soft mb-3">
                From your {CIRCLE} - they&apos;ll get an invitation to accept:
              </p>
              <div className="flex flex-col gap-2">
                {invitable.map((p) => {
                  const pending = pendingIds.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Seal user={p} size="sm" />
                      <span className="flex-1 text-sm">{p.name}</span>
                      {pending ? (
                        <Badge tone="neutral">Invited</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => invite(p.id)}
                          icon={<UserPlus size={14} />}
                          className="py-1.5 px-3 text-xs"
                        >
                          Invite
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          <InviteLinkCard
            councilId={council.id}
            title="Invite someone new"
            description={`A link that adds them to your ${CIRCLE} and to ${council.name} when they open it.`}
          />
        </div>
      )}

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

      {!isOwner && (
        <button
          onClick={leave}
          className="mt-10 text-sm font-medium text-rose text-left hover:opacity-80 transition-opacity"
        >
          Leave this council
        </button>
      )}
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