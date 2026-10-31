"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Users, CheckCircle2 } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Seal } from "@/components/seal";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { councilRepository, userRepository } from "@/lib/repositories";
import type { Council, User } from "@/types";

const TOTAL_STEPS = 3;

function OnboardingContent() {
  const { profile: user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [supremeCouncil, setSupremeCouncil] = useState<Council | null>(null);
  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const councils = await councilRepository.listForUser(user.id);
      setSupremeCouncil(councils.find((c) => c.isSupreme) ?? null);
      const all = await userRepository.list();
      setOtherUsers(all.filter((u) => u.id !== user.id));
    })();
  }, [user]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function goToStep2() {
    setStep(1);
  }

  async function addMembersAndContinue() {
    if (supremeCouncil) {
      setBusy(true);
      for (const id of selected) {
        await councilRepository.addMember(supremeCouncil.id, id);
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
    router.replace("/queue");
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
              area of your life. You can rename it, but it&apos;s always
              here. You can also create as many other councils as you
              like, for anything more specific.
            </p>
            <div className="flex-1" />
            <Button onClick={goToStep2}>Continue</Button>
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
              Add anyone already on Council whose judgement you trust
              broadly. You can always add more later.
            </p>

            {otherUsers.length === 0 ? (
              <p className="text-sm text-ink-soft mb-6">
                No one else has signed up yet - you can add people here
                once they have.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-6">
                {otherUsers.map((u) => {
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
            )}

            <div className="flex-1" />
            <Button onClick={addMembersAndContinue} disabled={busy}>
              {selected.length > 0 ? `Add ${selected.length} and continue` : "Continue"}
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
              life.
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
