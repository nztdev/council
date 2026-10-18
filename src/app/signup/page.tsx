"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Input, Label } from "@/components/ui";

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
    // A brand-new account has no onboardedAt yet, so RequireAuth on
    // /queue will redirect straight into /onboarding automatically.
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
          <Label>Name</Label>
          <div className="mt-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Reyes"
            />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <div className="mt-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <Label>Password</Label>
          <div className="mt-1">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose mb-4">{error}</p>}

      <Button
        onClick={submit}
        disabled={!name.trim() || !email.trim() || password.length < 6 || submitting}
        className="mb-6 w-full"
      >
        Create account
      </Button>

      <p className="text-sm text-ink-soft text-center">
        Already have an account?{" "}
        <Link href="/signin" className="text-indigo font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
