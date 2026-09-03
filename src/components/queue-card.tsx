"use client";

import { motion, useAnimation, type PanInfo } from "framer-motion";
import { Seal } from "@/components/seal";
import type { RequestWithMeta } from "@/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function QueueCard({
  request,
  onSkip,
  onAnswer,
  index,
}: {
  request: RequestWithMeta;
  onSkip: () => void;
  onAnswer: () => void;
  index: number;
}) {
  const controls = useAnimation();

  async function handleDragEnd(
    _: PointerEvent,
    info: PanInfo
  ) {
    if (info.offset.x > 120) {
      await controls.start({ x: 500, opacity: 0, rotate: 8 });
      onAnswer();
    } else if (info.offset.x < -120) {
      await controls.start({ x: -500, opacity: 0, rotate: -8 });
      onSkip();
    } else {
      controls.start({ x: 0, rotate: 0 });
    }
  }

  return (
    <motion.div
      drag={index === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      style={{
        zIndex: 10 - index,
        scale: 1 - index * 0.04,
        top: index * 10,
      }}
      className="absolute inset-x-0 rounded-3xl border border-border bg-surface p-6 shadow-sm cursor-grab select-none"
    >
      <div className="flex items-center gap-3 mb-4">
        <Seal user={request.author} />
        <div>
          <p className="font-medium leading-tight">{request.author.name}</p>
          <p className="text-xs text-ink-soft font-mono">
            {request.council.name} · {timeAgo(request.createdAt)}
          </p>
        </div>
      </div>
      <h2 className="font-display font-semibold tracking-tight text-2xl leading-snug mb-3">
        {request.title}
      </h2>
      {request.context && (
        <p className="text-ink-soft text-sm leading-relaxed line-clamp-4">
          {request.context}
        </p>
      )}

      {index === 0 && (
        <div className="mt-6 flex items-center justify-between text-xs font-mono uppercase tracking-wide text-ink-soft">
          <button onClick={onSkip} className="hover:text-rose transition-colors">
            ← Skip
          </button>
          <button
            onClick={onAnswer}
            className="hover:text-indigo transition-colors"
          >
            Give opinion →
          </button>
        </div>
      )}
    </motion.div>
  );
}
