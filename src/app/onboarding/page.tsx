"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Users, CheckCircle2 } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { InviteLinkCard } from "@/components/invite-link-card";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { afterAuthPath } from "@/lib/pending-invite";
import { CIRCLE } from "@/lib/copy";
import {
  circleRepository,
  councilRepository,
  userRepository,
} from "@/lib/repositories";
import type { Council, User } from "@/types";

const TOTAL_STEPS = 3;

function OnboardingContent() {
  const { profile: user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [supremeCouncil, setSupremeCouncil] = useState<Council | null>(null);
  const [circleMembers, setCircleMembers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const councils = await councilRepository.listForUser(user.id);
      setSupremeCouncil(councils.find((c) => c.isSupreme) ?? null);
      setCircleMembers(await circleRepository.listMembers());
    })();
  }, [user]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function inviteAndContinue() {
    setError(null);
    if (supremeCouncil && selected.length > 0) {
      setBusy(true);
      try {
        for (const id of selected) {
          await councilRepository.inviteMember(supremeCouncil.id, id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't send the invitations.");
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setStep(2);
  }

  async function finish() {
    if (!user) return;
    setBusy(true);
    await userRepository.completeOnboarding(user.id);
    await refreshProfile();
    // If they arrived through an invite link, take them back to it.
    router.replace(afterAuthPath());
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-16 pb-10 flex-1 flex flex-col">
      <div className="flex gap-1.5 mb-10">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-indigo" : "bg-border"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-soft flex items-center justify-center mb-6">
              <Crown className="text-indigo" size={28} />
            </div>
            <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
              Meet your Supreme Council
            </h1>
            <p className="text-ink-soft mb-8 leading-relaxed">
              Every account starts with one permanent council: the people
              whose judgement matters most across everything, not just one
              area of your life. You ask the questions; the people you invite
              advise. You can rename it, but it&apos;s always
              here. You can also create as many other councils as you
              like, for anything more specific.
            </p>
            <div className="flex-1" />
            <Button onClick={() => setStep(1)}>Continue</Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-soft flex items-center justify-center mb-6">
              <Users className="text-indigo" size={28} />
            </div>
            <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
              Who belongs here?
            </h1>
            <p className="text-ink-soft mb-6 leading-relaxed">
              Nobody can see you, or be added to a council, without agreeing.
              Send someone an invite link; when they open it, they join your
              Supreme Council and your {CIRCLE}.
            </p>

            <InviteLinkCard
              key={supremeCouncil?.id ?? "none"}
              councilId={supremeCouncil?.id}
              title="Invite your first person"
              description="Someone whose judgement you trust broadly."
            />

            {circleMembers.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-ink-soft mb-3">
                  Or invite someone already in your {CIRCLE}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {circleMembers.map((u) => {
                    const active = selected.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggle(u.id)}
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
            )}

            {error && <p className="text-sm text-rose mb-4">{error}</p>}

            <div className="flex-1" />
            <Button onClick={inviteAndContinue} disabled={busy}>
              {selected.length > 0 ? `Invite ${selected.length} and continue` : "Continue"}
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="done"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-soft flex items-center justify-center mb-6">
              <CheckCircle2 className="text-indigo" size={28} />
            </div>
            <h1 className="font-display font-semibold tracking-tight text-3xl mb-3">
              You&apos;re set up
            </h1>
            <p className="text-ink-soft mb-8 leading-relaxed">
              Your Supreme Council is ready. Post a question anytime, or
              create a more specific council for a particular part of your
              life. You can invite more people from the {CIRCLE} tab.
            </p>
            {supremeCouncil && (
              <Card className="p-4 mb-6">
                <p className="font-display font-semibold">{supremeCouncil.name}</p>
                <p className="text-xs text-ink-soft mt-1">
                  {supremeCouncil.memberIds.length}{" "}
                  {supremeCouncil.memberIds.length === 1 ? "member" : "members"}
                </p>
              </Card>
            )}
            <div className="flex-1" />
            <Button onClick={finish} disabled={busy}>
              Go to your queue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingContent />
    </RequireAuth>
  );
}