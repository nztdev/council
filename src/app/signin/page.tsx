"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
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
        Welcome back.
      </h1>
      <p className="text-ink-soft mb-10">Sign in to see your queue.</p>

      <div className="flex flex-col gap-4 mb-6">
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
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-indigo"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose mb-4">{error}</p>}

      <button
        onClick={submit}
        disabled={!email.trim() || !password || submitting}
        className="btn-primary rounded-xl py-3 text-sm font-medium mb-6"
      >
        Sign in
      </button>

      <p className="text-sm text-ink-soft text-center">
        New here?{" "}
        <Link href="/signup" className="text-indigo font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
