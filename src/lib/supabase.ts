import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const missingCredentials = !url || !anonKey;

if (missingCredentials) {
  // Not thrown, so the app can still build without credentials present -
  // e.g. before the GitHub Actions secrets are set up, or in a fresh
  // clone with no .env.local yet. @supabase/supabase-js itself throws
  // if given an empty string, so we fall back to a validly-formatted
  // placeholder URL rather than "" - the build succeeds either way, and
  // any real Supabase call will fail loudly and clearly at runtime
  // instead of taking the whole deploy down at build time.
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env.local " +
      "and fill them in (or set them as repo secrets for the GitHub " +
      "Actions build). The app will build, but no data will load until " +
      "this is set."
  );
}

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
