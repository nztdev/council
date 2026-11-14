"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  Crown,
  ListChecks,
  MessageSquareText,
  Users,
  X,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui";
import { GUIDE_SLIDES, type GuideIcon } from "@/lib/guide-content";

const ICONS: Record<GuideIcon, typeof Crown> = {
  crown: Crown,
  circle: CircleDot,
  users: Users,
  ask: MessageSquareText,
  answer: ListChecks,
};

// A read-only walkthrough: it never saves anything, so it's safe to open
// at any time, unlike the one-time onboarding.
function GuideContent() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = GUIDE_SLIDES[index];
  const Icon = ICONS[slide.icon];
  const isFirst = index === 0;
  const isLast = index === GUIDE_SLIDES.length - 1;

  function close() {
    if (window.history.length > 1) router.back();
    else router.push("/profile/");
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-10 pb-6 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          How Council works · {index + 1} of {GUIDE_SLIDES.length}
        </p>
        <button
          onClick={close}
          aria-label="Close the guide"
          className="text-ink-soft hover:text-ink transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex gap-1.5 mb-10">
        {GUIDE_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`h-1 flex-1 rounded-full ${i <= index ? "bg-indigo" : "bg-border"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="flex-1 flex flex-col"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-soft flex items-center justify-center mb-6">
            <Icon className="text-indigo" size={28} />
          </div>
          <h1 className="font-display font-semibold tracking-tight text-3xl mb-4">
            {slide.title}
          </h1>
          {slide.body.map((paragraph, i) => (
            <p key={i} className="text-ink-soft leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={() => setIndex((i) => i - 1)}
          disabled={isFirst}
          icon={<ArrowLeft size={16} />}
          className="flex-1"
        >
          Back
        </Button>
        {isLast ? (
          <Button onClick={close} className="flex-1">
            Done
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)} className="flex-1">
            Next
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <RequireAuth>
      <GuideContent />
    </RequireAuth>
  );
}