import Link from "next/link";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

/** Shared surface for anything boxed - request cards, council rows, form
 * sections. Corner radius, border and shadow come from the active theme
 * (.ui-card in src/app/globals.css). */
export function Card({ children, className = "", href }: CardProps) {
  const base = `ui-card transition-colors ${className}`;
  if (href) {
    return (
      <Link href={href} className={`block hover:border-indigo ${base}`}>
        {children}
      </Link>
    );
  }
  return <div className={base}>{children}</div>;
}
