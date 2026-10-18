"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { requestRepository } from "@/lib/repositories";
import { CLOSE_RULE_OPTIONS } from "@/lib/close-rules";
import { Button, Input, Textarea, Label } from "@/components/ui";
import type { CloseRule } from "@/types";

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function NewRequestInner() {
  const searchParams = useSearchParams();
  const councilId = searchParams.get("councilId") ?? "";
  const router = useRouter();
  const { profile: user } = useAuth();
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [closeRule, setCloseRule] = useState<CloseRule>("manual");
  const [deadline, setDeadline] = useState(() => {
    const inAWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    return toLocalDatetimeInputValue(inAWeek);
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = CLOSE_RULE_OPTIONS.find((o) => o.id === closeRule);

  async function submit() {
    if (!user || !title.trim() || !councilId) return;
    setSubmitting(true);
    const req = await requestRepository.create({
      councilId,
      authorId: user.id,
      title: title.trim(),
      context: context.trim(),
      closeRule,
      deadline: selectedOption?.needsDeadline
        ? new Date(deadline).toISOString()
        : undefined,
    });
    router.replace(`/requests/view?id=${req.id}`);
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 flex-1 flex flex-col">
      <h1 className="font-display font-semibold tracking-tight text-3xl mb-8">
        Ask your council
      </h1>

      <Label>Title</Label>
      <div className="mt-1 mb-5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Should I move to Madrid?"
        />
      </div>

      <Label>Context</Label>
      <div className="mt-1 mb-5">
        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="I've received an offer..."
          rows={5}
        />
      </div>

      <Label>When should this close?</Label>
      <div className="flex flex-col gap-2 mt-2 mb-5">
        {CLOSE_RULE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setCloseRule(option.id)}
            className={`text-left rounded-xl border px-4 py-3 transition-colors ${
              closeRule === option.id
                ? "border-indigo bg-indigo-soft"
                : "border-border bg-surface"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                closeRule === option.id ? "text-indigo" : "text-ink"
              }`}
            >
              {option.label}
            </p>
            <p className="text-xs text-ink-soft mt-0.5">{option.description}</p>
          </button>
        ))}
      </div>

      {selectedOption?.needsDeadline && (
        <>
          <Label>Deadline</Label>
          <div className="mt-1 mb-8">
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </>
      )}

      <Button
        onClick={submit}
        disabled={!title.trim() || submitting || !councilId}
        className="w-full"
      >
        Post to council
      </Button>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <NewRequestInner />
      </Suspense>
    </RequireAuth>
  );
}
