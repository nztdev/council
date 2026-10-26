"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { QueueCard } from "@/components/queue-card";
import { EmptyState } from "@/components/ui";
import { PageHero } from "@/components/ui/PageHero";
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

  const title =
    items === null
      ? "Loading your queue…"
      : items.length === 0
        ? "You're all caught up."
        : `${items.length} ${items.length === 1 ? "person needs" : "people need"} your judgement.`;

  return (
    <div className="flex-1 flex flex-col">
      <PageHero eyebrow={`${greeting()}, ${user?.name ?? ""}`} title={title} />

      {/* In Chamber the first card overlaps the header band
          (--hero-overlap); in the other themes the overlap is 0. */}
      <div
        className="relative z-10 max-w-md w-full mx-auto px-6 flex-1"
        style={{ minHeight: 320, marginTop: "calc(-1 * var(--hero-overlap))" }}
      >
        <div className="relative" style={{ minHeight: 320 }}>
          {items && items.length === 0 && (
            <EmptyState icon={<Inbox className="text-ink-soft" size={28} />}>
              No pending requests right now. Check back later, or ask your
              own council a question.
            </EmptyState>
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
