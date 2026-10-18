import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClasses =
  "w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo transition-colors";

export function Label({ children }: { children: string }) {
  return (
    <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClasses} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${fieldClasses} resize-none ${props.className ?? ""}`}
    />
  );
}
