// An invite link opened by someone who isn't signed in yet. We remember the
// code across sign-up/sign-in (and onboarding) so they land back on it.
const KEY = "council:pendingInvite";

export function getPendingInvite(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setPendingInvite(code: string) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    // storage unavailable: the person can just open the link again
  }
}

export function clearPendingInvite() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Where to send someone right after they sign in or finish onboarding. */
export function afterAuthPath(): string {
  const code = getPendingInvite();
  return code ? `/join/?code=${encodeURIComponent(code)}` : "/queue";
}