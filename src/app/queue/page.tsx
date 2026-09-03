"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { QueueCard } from "@/components/queue-card";
import { useAuth } from "@/lib/auth";
import { requestRepository } from "@/lib/repositories";
import { hydrateRequests } from "@/lib/hydrate";
import type { RequestWithMeta } from "@/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function QueueContent() {
  const { profile: user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RequestWithMeta[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const pending = await requestRepository.listPendingForUser(user.id);
      setItems(await hydrateRequests(pending));
    })();
  }, [user]);

  function skip() {
    setItems((prev) => {
      if (!prev) return prev;
      const [first, ...rest] = prev;
      return first ? [...rest, first] : prev;
    });
  }

  function answer(id: string) {
    router.push(`/requests/view?id=${id}`);
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <p className="font-mono text-xs tracking-widest uppercase text-ink-soft mb-2">
        {greeting()}, {user?.name}
      </p>
      <h1 className="font-display font-semibold tracking-tight text-3xl mb-8">
        {items === null
          ? "Loading your queue…"
          : items.length === 0
            ? "You're all caught up."
            : `${items.length} ${items.length === 1 ? "person needs" : "people need"} your judgement.`}
      </h1>

      <div className="relative flex-1" style={{ minHeight: 320 }}>
        {items && items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-ink-soft text-sm">
            No pending requests right now. Check back later, or ask your own
            council a question.
          </div>
        )}
        {items?.slice(0, 3).map((req, i) => (
          <QueueCard
            key={req.id}
            request={req}
            index={i}
            onSkip={() => skip()}
            onAnswer={() => answer(req.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <RequireAuth>
      <QueueContent />
    </RequireAuth>
  );
}
