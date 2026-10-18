import Link from "next/link";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  as?: "div" | "link";
}

/** Shared surface for anything boxed - request cards, council rows, form
 * sections. Keeps corner radius, border, and background in one place. */
export function Card({ children, className = "", href }: CardProps) {
  const base = `rounded-2xl border border-border bg-surface transition-colors ${className}`;
  if (href) {
    return (
      <Link href={href} className={`block hover:border-indigo ${base}`}>
        {children}
      </Link>
    );
  }
  return <div className={base}>{children}</div>;
}
