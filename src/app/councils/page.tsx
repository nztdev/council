"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { useAuth } from "@/lib/auth";
import { councilRepository, userRepository } from "@/lib/repositories";
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
        <h1 className="font-display font-semibold tracking-tight text-3xl">Your councils</h1>
        <button
          onClick={() => setCreating((c) => !c)}
          className="font-mono text-xs uppercase tracking-wide rounded-full border border-border px-3 py-2 hover:border-indigo hover:text-indigo transition-colors"
        >
          {creating ? "Cancel" : "+ Create"}
        </button>
      </div>

      {creating && (
        <div className="rounded-3xl border border-border bg-surface p-5 mb-8 flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Business Council"
              className="mt-1 w-full rounded-xl border border-border bg-stone px-3 py-2 text-sm outline-none focus:border-indigo"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="People whose business judgement I trust."
              className="mt-1 w-full rounded-xl border border-border bg-stone px-3 py-2 text-sm outline-none focus:border-indigo"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
              Invite
            </label>
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
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="btn-primary rounded-xl py-2.5 text-sm font-medium"
          >
            Create council
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {councils?.map((c) => (
          <Link
            key={c.id}
            href={`/councils/view?id=${c.id}`}
            className="rounded-2xl border border-border bg-surface p-4 hover:border-indigo transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-semibold text-lg">{c.name}</h2>
              <div className="flex -space-x-2">
                {c.memberIds.slice(0, 4).map((id) => {
                  const u = allUsers.find((au) => au.id === id) ??
                    (id === user?.id ? user : undefined);
                  return u ? <Seal key={id} user={u} size="sm" /> : null;
                })}
              </div>
            </div>
            <p className="text-sm text-ink-soft">{c.description}</p>
          </Link>
        ))}
        {councils?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-ink-soft text-sm">
            No councils yet. Create one to start asking for judgement.
          </div>
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
