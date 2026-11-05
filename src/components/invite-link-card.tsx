"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { circleRepository } from "@/lib/repositories";
import { basePath } from "@/lib/base-path";

/** Makes an invite link and lets the person share or copy it. With
 * councilId, the link also adds whoever opens it to that council.
 *
 * Creating the link and sharing it are two separate taps on purpose: phones
 * only allow the share sheet right after a tap, not after waiting on the
 * network. */
export function InviteLinkCard({
  councilId,
  title,
  description,
}: {
  councilId?: string;
  title: string;
  description: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  async function create() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const code = await circleRepository.createInvite({ councilId });
      setUrl(`${window.location.origin}${basePath}/join/?code=${encodeURIComponent(code)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the link.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!url) return;
    try {
      await navigator.share({
        title: "Join me on Council",
        text: "I'd like you in my Circle on Council:",
        url,
      });
    } catch {
      // the person closed the share sheet - nothing to do
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("Couldn't copy automatically - select the link and copy it.");
    }
  }

  return (
    <Card className="p-5 mb-8">
      <div className="flex items-start gap-3 mb-4">
        <Link2 className="text-indigo shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-display font-semibold">{title}</p>
          <p className="text-sm text-ink-soft mt-1">{description}</p>
        </div>
      </div>

      {url ? (
        <>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Invite link"
            className="w-full rounded-xl border border-border bg-stone px-3 py-2 text-xs mb-3"
          />
          <div className="flex gap-2">
            {canShare && (
              <Button onClick={share} icon={<Share2 size={16} />} className="flex-1">
                Share
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={copy}
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
              className="flex-1"
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="text-xs text-ink-soft mt-3">
            Works once and expires in 7 days.{" "}
            <button onClick={create} disabled={busy} className="text-indigo font-medium">
              Make a new one
            </button>
          </p>
        </>
      ) : (
        <Button onClick={create} disabled={busy} className="w-full">
          Create invite link
        </Button>
      )}

      {error && <p className="text-sm text-rose mt-3">{error}</p>}
    </Card>
  );
}