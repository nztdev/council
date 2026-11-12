"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Plus, Users2 } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { useAuth } from "@/lib/auth";
import {
  circleRepository,
  councilRepository,
  userRepository,
} from "@/lib/repositories";
import { CIRCLE } from "@/lib/copy";
import { ROLE_LABEL, councilLabel, firstName, roleIn } from "@/lib/council-labels";
import { Button, Card, Badge, Input, Label, EmptyState } from "@/components/ui";
import { PageHero } from "@/components/ui/PageHero";
import type { AskPolicy, Council, User } from "@/types";

const ASK_OPTIONS: { id: AskPolicy; label: string; description: string }[] = [
  {
    id: "owner",
    label: "Only me",
    description: "You ask the questions; the people you invite advise.",
  },
  {
    id: "members",
    label: "Anyone in the council",
    description: "Every member can ask questions and answer them.",
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
      {children}
    </p>
  );
}

function CouncilsContent() {
  const { profile: user } = useAuth();
  const [councils, setCouncils] = useState<Council[] | null>(null);
  const [people, setPeople] = useState<User[]>([]);
  const [circleMembers, setCircleMembers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [askPolicy, setAskPolicy] = useState<AskPolicy>("owner");
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    if (!user) return;
    setCouncils(await councilRepository.listForUser(user.id));
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      await refresh();
      setPeople(await userRepository.list());
      setCircleMembers(await circleRepository.listMembers());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function toggleInvite(id: string) {
    setInviteIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function submit() {
    if (!user || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const council = await councilRepository.create({
        name: name.trim(),
        description: description.trim(),
        askPolicy,
      });
      for (const id of inviteIds) {
        await councilRepository.inviteMember(council.id, id);
      }
      setName("");
      setDescription("");
      setAskPolicy("owner");
      setInviteIds([]);
      setCreating(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the council.");
    } finally {
      setSaving(false);
    }
  }

  const mine = councils?.filter((c) => c.ownerId === user?.id) ?? [];
  const joined = councils?.filter((c) => c.ownerId !== user?.id) ?? [];

  function memberSeals(c: Council) {
    return c.memberIds.slice(0, 4).map((id) => {
      const u = people.find((p) => p.id === id) ?? (id === user?.id ? user : undefined);
      return u ? <Seal key={id} user={u} size="sm" /> : null;
    });
  }

  return (
    <div className="flex-1 flex flex-col">
      <PageHero
        title="Your councils"
        action={
          <Button
            variant="secondary"
            onClick={() => setCreating((c) => !c)}
            icon={<Plus size={16} />}
            className="py-2 px-3 text-xs uppercase tracking-wide font-mono"
          >
            {creating ? "Cancel" : "Create"}
          </Button>
        }
      />
      <div className="max-w-md w-full mx-auto px-6 pt-6 flex-1 flex flex-col">
        {creating && (
          <Card className="p-5 mb-8 flex flex-col gap-4">
            <div>
              <Label>Name</Label>
              <div className="mt-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Business Council"
                  className="bg-stone"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <div className="mt-1">
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="People whose business judgement I trust."
                  className="bg-stone"
                />
              </div>
            </div>
            <div>
              <Label>Who can ask questions?</Label>
              <div className="mt-2 flex flex-col gap-2">
                {ASK_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAskPolicy(option.id)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                      askPolicy === option.id
                        ? "border-indigo bg-indigo-soft"
                        : "border-border bg-surface"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        askPolicy === option.id ? "text-indigo" : "text-ink"
                      }`}
                    >
                      {option.label}
                    </p>
                    <p className="text-xs text-ink-soft mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-soft mt-2">You can change this later.</p>
            </div>
            <div>
              <Label>{`Invite from your ${CIRCLE}`}</Label>
              {circleMembers.length === 0 ? (
                <p className="text-sm text-ink-soft mt-2">
                  Your {CIRCLE} is empty.{" "}
                  <Link href="/circle/" className="text-indigo font-medium">
                    Invite someone first
                  </Link>{" "}
                  - you can add them to this council afterwards.
                </p>
              ) : (
                <>
                  <p className="text-xs text-ink-soft mt-1">
                    They&apos;ll get an invitation they can accept or decline.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {circleMembers.map((u) => {
                      const active = inviteIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleInvite(u.id)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                            active
                              ? "border-indigo bg-indigo-soft text-indigo"
                              : "border-border text-ink-soft"
                          }`}
                        >
                          <Seal user={u} size="sm" />
                          {u.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
            <Button onClick={submit} disabled={!name.trim() || saving} className="w-full">
              Create council
            </Button>
          </Card>
        )}

        {councils?.length === 0 && (
          <EmptyState icon={<Users2 className="text-ink-soft" size={28} />}>
            No councils yet. Create one to start asking for judgement.
          </EmptyState>
        )}

        {mine.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Your councils</SectionLabel>
            <div className="flex flex-col gap-3">
              {mine.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card href={`/councils/view?id=${c.id}`} className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {c.isSupreme && <Crown className="text-brass shrink-0" size={16} />}
                      <h2 className="font-display font-semibold text-lg">{c.name}</h2>
                      {c.isSupreme && <Badge tone="brass">Supreme</Badge>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-ink-soft flex-1 min-w-0">{c.description}</p>
                      <div className="flex -space-x-2 shrink-0">{memberSeals(c)}</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {joined.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Councils you&apos;ve joined</SectionLabel>
            <div className="flex flex-col gap-3">
              {joined.map((c, i) => {
                const owner = people.find((p) => p.id === c.ownerId);
                const role = roleIn(c, user?.id);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card href={`/councils/view?id=${c.id}`} className="p-4">
                      <div className="flex items-center gap-3">
                        {owner && <Seal user={owner} />}
                        <div className="flex-1 min-w-0">
                          <h2 className="font-display font-semibold text-lg leading-tight">
                            {councilLabel(c, owner, user?.id)}
                          </h2>
                          <p className="text-xs text-ink-soft mt-0.5">
                            {owner ? `Owned by ${firstName(owner.name)}` : "Owned by someone else"}
                          </p>
                        </div>
                        <Badge tone="neutral">{ROLE_LABEL[role]}</Badge>
                      </div>
                      {c.description && (
                        <p className="text-sm text-ink-soft mt-3">{c.description}</p>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function CouncilsPage() {
  return (
    <RequireAuth>
      <CouncilsContent />
    </RequireAuth>
  );
}