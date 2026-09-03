"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signUp(email.trim(), password, name.trim());
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    router.replace("/queue");
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 pt-16 pb-10 flex-1 flex flex-col">
      <p className="font-mono text-xs tracking-widest uppercase text-ink-soft mb-3">
        Council
      </p>
      <h1 className="font-display font-semibold tracking-tight text-4xl leading-tight mb-2">
        Ask the people whose judgement you trust.
      </h1>
      <p className="text-ink-soft mb-10">Create an account to get started.</p>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Reyes"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink-soft">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose mb-4">{error}</p>}

      <button
        onClick={submit}
        disabled={
          !name.trim() || !email.trim() || password.length < 6 || submitting
        }
        className="btn-primary rounded-xl py-3 text-sm font-medium mb-6"
      >
        Create account
      </button>

      <p className="text-sm text-ink-soft text-center">
        Already have an account?{" "}
        <Link href="/signin" className="text-indigo font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
