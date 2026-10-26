import type { ReactNode } from "react";

/** Header at the top of the main tabs (Queue, Councils, Profile). In the
 * Chamber theme it's a solid colored band; in the other themes it's just a
 * plain header. See .hero in src/app/globals.css. */
export function PageHero({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="hero">
      <div className="max-w-md w-full mx-auto">
        {eyebrow && (
          <p className="hero-eyebrow font-mono text-xs tracking-widest uppercase mb-2">
            {eyebrow}
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display font-semibold tracking-tight text-3xl leading-tight">
            {title}
          </h1>
          {action}
        </div>
      </div>
    </div>
  );
}
