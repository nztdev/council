"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { enterPreviewMode } from "@/lib/preview";
import { basePath } from "@/lib/base-path";
import { Button, Input, Label } from "@/components/ui";

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

  function previewDesign() {
    enterPreviewMode();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${basePath}/queue/`;
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
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose mb-4">{error}</p>}

      <Button
        onClick={submit}
        disabled={!email.trim() || !password || submitting}
        className="mb-6 w-full"
      >
        Sign in
      </Button>

      <p className="text-sm text-ink-soft text-center mb-6">
        New here?{" "}
        <Link href="/signup" className="text-indigo font-medium">
          Create an account
        </Link>
      </p>

      <Button
        variant="secondary"
        onClick={previewDesign}
        icon={<Sparkles size={16} />}
        className="w-full border-dashed"
      >
        Preview design (no account needed)
      </Button>
      <p className="text-xs text-ink-soft text-center mt-2">
        Shows the UI with sample data. Nothing you do here is saved.
      </p>
    </div>
  );
}
