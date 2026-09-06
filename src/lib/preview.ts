// A lightweight escape hatch for looking at the UI without a real
// Supabase account. Entirely separate from real auth/data - nothing
// here ever touches Supabase, and it's off by default for everyone
// until someone explicitly clicks "Preview design" on the sign-in page.
const KEY = "council:preview";

export function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function enterPreviewMode() {
  window.localStorage.setItem(KEY, "1");
}

export function exitPreviewMode() {
  window.localStorage.removeItem(KEY);
}
