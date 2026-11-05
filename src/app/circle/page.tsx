"use client";

import { useEffect, useState } from "react";
import { Mail, UserMinus, Users2 } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { InviteLinkCard } from "@/components/invite-link-card";
import { Button, Card, EmptyState } from "@/components/ui";
import { PageHero } from "@/components/ui/PageHero";
import { circleRepository, councilRepository } from "@/lib/repositories";
import { YOUR_CIRCLE, CIRCLE } from "@/lib/copy";
import type { CouncilInvitation, User } from "@/types";

function CircleContent() {
  const [members, setMembers] = useState<User[] | null>(null);
  const [invitations, setInvitations] = useState<CouncilInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setMembers(await circleRepository.listMembers());
    setInvitations(await councilRepository.listMyInvitations());
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load your Circle.");
      }
    })();
  }, []);

  async function respond(id: string, accept: boolean) {
    setError(null);
    try {
      await councilRepository.respondToInvitation(id, accept);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  async function remove(person: User) {
    const ok = window.confirm(
      `Remove ${person.name} from your ${CIRCLE}?\n\nThey will also leave any council you own, and you will leave any council they own.`
    );
    if (!ok) return;
    setError(null);
    try {
      await circleRepository.remove(person.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <PageHero eyebrow="The people you trust" title={YOUR_CIRCLE} />
      <div className="max-w-md w-full mx-auto px-6 pt-6 flex-1 flex flex-col">
        {error && <p className="text-sm text-rose mb-4">{error}</p>}

        {invitations.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
              Invitations
            </p>
            <div className="flex flex-col gap-3">
              {invitations.map((inv) => (
                <Card key={inv.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Mail className="text-indigo shrink-0 mt-0.5" size={18} />
                    <p className="text-sm">
                      <span className="font-medium">{inv.inviterName}</span> invited you to
                      join <span className="font-medium">{inv.councilName}</span>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => respond(inv.id, true)} className="flex-1 py-2">
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => respond(inv.id, false)}
                      className="flex-1 py-2"
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <InviteLinkCard
          title={`Invite someone to your ${CIRCLE}`}
          description="Send them the link. When they open it, you're connected, and you can then invite them to your councils."
        />

        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          {members ? `${members.length} ${members.length === 1 ? "person" : "people"}` : "People"}
        </p>

        {members && members.length === 0 && (
          <EmptyState icon={<Users2 className="text-ink-soft" size={28} />}>
            Your {CIRCLE} is empty. Create an invite link above and send it to
            someone whose judgement you trust.
          </EmptyState>
        )}

        <div className="flex flex-col gap-3">
          {members?.map((m) => (
            <Card key={m.id} className="p-3 flex items-center gap-3">
              <Seal user={m} />
              <span className="flex-1 font-medium">{m.name}</span>
              <button
                onClick={() => remove(m)}
                aria-label={`Remove ${m.name} from your ${CIRCLE}`}
                className="text-ink-soft hover:text-rose transition-colors p-2"
              >
                <UserMinus size={18} />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CirclePage() {
  return (
    <RequireAuth>
      <CircleContent />
    </RequireAuth>
  );
}