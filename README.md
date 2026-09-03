# Council

Personal advisory councils: create a trusted "council" of people, then post a
question, get quick judgment back. This build has a real Supabase backend
and real accounts (email/password) — no demo users.

## Stack

- Next.js (App Router) + TypeScript + Tailwind v4
- **Static export** (`output: "export"`) — the app builds to plain
  HTML/CSS/JS with no Node server required, which is what makes it
  deployable to GitHub Pages and, later, wrappable in Capacitor for
  iOS/Android.
- **Supabase**: Postgres + Auth, called directly from the browser with
  Row Level Security enforcing who can see what (see `supabase/schema.sql`).
  All data access goes through repository interfaces
  (`src/lib/repositories/types.ts`) — the Supabase implementation lives in
  `src/lib/repositories/supabase.ts`, and swapping backends later means
  writing one new file, not touching the UI.
- Real auth (`src/lib/auth.tsx`), email + password to start.

## Set up Supabase (one-time)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run everything in `supabase/schema.sql`. This
   creates the tables, Row Level Security policies, and a trigger that
   creates a `profiles` row whenever someone signs up.
3. In **Project Settings → API**, copy the Project URL and the `anon`
   public key.
4. Copy `.env.example` to `.env.local` and paste them in.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign up, and you're in.

## Core loop

1. Sign up or sign in (`/signup`, `/signin`)
2. Create a council and add other registered users to it (`/councils`) —
   note: for this testing phase, anyone signed in can see the names of
   other registered users when building the member list. Fine for a
   closed test group; a real invite-link system is a natural next step
   before any public launch.
3. Post a question to a council (`/councils/new?councilId=...`)
4. Members see it in their daily queue (`/queue`) and vote
   Yes / Maybe / No with an optional reason
5. Results aggregate on the request page (`/requests/view?id=...`) once
   you've voted or you're the author

Council/request detail pages use query params (`?id=...`) rather than
dynamic path segments, because static export needs to know every URL at
build time and these IDs are created at runtime — see the routing note
further down if you're extending this.

## Deploy targets

One codebase, three targets, controlled by env vars set at build time.

### GitHub Pages (showcase / testing)
`.github/workflows/deploy.yml` builds and deploys on every push to
`main`. Before your first deploy:
1. In the repo, go to **Settings → Secrets and variables → Actions** and
   add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   repository secrets (same values as your `.env.local`).
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Push to `main`. The workflow auto-detects the correct base path for
   the repo — nothing to hardcode.

### Vercel (if you want a persistent live URL)
Connect the repo, add the same two env vars in the Vercel project
settings, done. No `NEXT_PUBLIC_BASE_PATH` needed.

### iOS / Android (Capacitor, later)
Because the app is a static export, it wraps as-is:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npm run build   # produces out/
npx cap sync    # bundles out/ into the native projects
```
Native-only features (reliable iOS push, contacts import, biometrics)
get added one at a time as Capacitor plugins from there — no rewrite of
the app logic, since the data/auth layers are already isolated behind
their interfaces.

## What's intentionally out of scope for this phase

- AI-generated consensus summaries
- Private trust / helpfulness analytics per council member
- Real invite links (currently: add-by-name from the full user list)
- Push notifications

These attach to the existing repository interfaces without restructuring
the app — see the comments in `src/lib/repositories/`.
