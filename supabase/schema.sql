-- Council schema for Supabase.
-- Run this once in your project's SQL editor (Supabase Dashboard -> SQL Editor).
-- Requires the "pgcrypto" extension for gen_random_uuid(), which Supabase
-- enables by default.
--
-- If you already ran an older version of this file against a live
-- project, don't re-run this whole file - use the numbered files in
-- supabase/migrations/ instead, in order.

-- ---------------------------------------------------------------------
-- profiles: public-facing user info, one row per auth.users row.
-- Needed because auth.users itself isn't queryable from the client.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  onboarded_at timestamptz
);

alter table profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- councils (defined before the signup trigger below, since the trigger
-- creates a row here for every new user)
-- ---------------------------------------------------------------------
create table if not exists councils (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Every user's permanent first council. Renamable, never deletable -
  -- there is no delete feature yet at all, so for now that's enforced
  -- simply by never building a delete action for a row where this is true.
  is_supreme boolean not null default false
);

create table if not exists council_members (
  council_id uuid not null references councils(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (council_id, user_id)
);

alter table councils enable row level security;
alter table council_members enable row level security;

create policy "members can read their councils"
  on councils for select
  to authenticated
  using (
    exists (
      select 1 from council_members cm
      where cm.council_id = councils.id and cm.user_id = auth.uid()
    )
  );

create policy "signed-in users can create councils they own"
  on councils for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owner can update their own council"
  on councils for update
  to authenticated
  using (owner_id = auth.uid());

create policy "members can read their council's membership rows"
  on council_members for select
  to authenticated
  using (
    exists (
      select 1 from council_members cm2
      where cm2.council_id = council_members.council_id
        and cm2.user_id = auth.uid()
    )
  );

create policy "council owner can add members"
  on council_members for insert
  to authenticated
  with check (
    exists (
      select 1 from councils c
      where c.id = council_id and c.owner_id = auth.uid()
    )
  );

-- Auto-create a profile row, plus a permanent "Supreme Council" with
-- just that person in it, whenever someone signs up. Doing this here
-- (rather than client-side after signUp()) means it happens atomically
-- regardless of email-confirmation settings or which client the account
-- was created from.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_council_id uuid;
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );

  insert into public.councils (name, description, owner_id, is_supreme)
  values ('Supreme Council', 'Your most trusted people, for anything.', new.id, true)
  returning id into new_council_id;

  insert into public.council_members (council_id, user_id)
  values (new_council_id, new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  council_id uuid not null references councils(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  context text not null default '',
  created_at timestamptz not null default now(),
  close_rule text not null default 'manual'
    check (close_rule in ('manual', 'deadline', 'all_members', 'deadline_or_all_members')),
  deadline timestamptz,
  closed_at timestamptz
);

alter table requests enable row level security;

create policy "members can read requests in their councils"
  on requests for select
  to authenticated
  using (
    exists (
      select 1 from council_members cm
      where cm.council_id = requests.council_id and cm.user_id = auth.uid()
    )
  );

create policy "members can post requests to their councils"
  on requests for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from council_members cm
      where cm.council_id = requests.council_id and cm.user_id = auth.uid()
    )
  );

create policy "author can update their own request"
  on requests for update
  to authenticated
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------
-- votes
-- ---------------------------------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  choice text not null check (choice in ('yes', 'maybe', 'no')),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

alter table votes enable row level security;

create policy "members can read votes on requests in their councils"
  on votes for select
  to authenticated
  using (
    exists (
      select 1 from requests r
      join council_members cm on cm.council_id = r.council_id
      where r.id = votes.request_id and cm.user_id = auth.uid()
    )
  );

create policy "members can cast a vote on requests in their councils"
  on votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from requests r
      join council_members cm on cm.council_id = r.council_id
      where r.id = votes.request_id
        and cm.user_id = auth.uid()
        -- Enforce the "manual" and "deadline" close rules at the
        -- database level, not just in the UI. "all_members" is not
        -- enforced here: the vote that completes participation must
        -- itself be allowed through (see src/lib/close-rules.ts).
        and r.closed_at is null
        and (r.deadline is null or r.deadline > now())
    )
  );

create policy "members can change their own vote"
  on votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from requests r
      where r.id = votes.request_id
        and r.closed_at is null
        and (r.deadline is null or r.deadline > now())
    )
  );
