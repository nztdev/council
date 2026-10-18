"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Plus, Users2 } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { useAuth } from "@/lib/auth";
import { councilRepository, userRepository } from "@/lib/repositories";
import { Button, Card, Badge, Input, Label, EmptyState } from "@/components/ui";
import type { Council, User } from "@/types";

function CouncilsContent() {
  const { profile: user } = useAuth();
  const [councils, setCouncils] = useState<Council[] | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  async function refresh() {
    if (!user) return;
    setCouncils(await councilRepository.listForUser(user.id));
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      await refresh();
      const u = await userRepository.list();
      setAllUsers(u.filter((x) => x.id !== user.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function toggleMember(id: string) {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function submit() {
    if (!user || !name.trim()) return;
    await councilRepository.create({
      name: name.trim(),
      description: description.trim(),
      ownerId: user.id,
      memberIds,
    });
    setName("");
    setDescription("");
    setMemberIds([]);
    setCreating(false);
    refresh();
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-semibold tracking-tight text-3xl">
          Your councils
        </h1>
        <Button
          variant="secondary"
          onClick={() => setCreating((c) => !c)}
          icon={<Plus size={16} />}
          className="rounded-full py-2 px-3 text-xs uppercase tracking-wide font-mono"
        >
          {creating ? "Cancel" : "Create"}
        </Button>
      </div>

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
            <Label>Invite</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allUsers.map((u) => {
                const active = memberIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
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
          </div>
          <Button onClick={submit} disabled={!name.trim()} className="w-full">
            Create council
          </Button>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {councils?.map((c, i) => (
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
                <div className="flex -space-x-2 shrink-0">
                  {c.memberIds.slice(0, 4).map((id) => {
                    const u =
                      allUsers.find((au) => au.id === id) ??
                      (id === user?.id ? user : undefined);
                    return u ? <Seal key={id} user={u} size="sm" /> : null;
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        {councils?.length === 0 && (
          <EmptyState icon={<Users2 className="text-ink-soft" size={28} />}>
            No councils yet. Create one to start asking for judgement.
          </EmptyState>
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
