import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Not thrown, so the app can still build without credentials present;
  // calls will fail loudly at runtime instead, which is easier to debug
  // than a build failure when someone forks this without Supabase set up yet.
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env.local and fill them in."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
