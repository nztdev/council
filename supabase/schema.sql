-- Council schema for Supabase.
-- Run this in your project's SQL editor (Supabase Dashboard -> SQL Editor).
-- It is safe to run more than once: tables use "if not exists" and every
-- policy is dropped and recreated.
--
-- Tested against a local Postgres 16 with Supabase-style roles and
-- auth.uid(), with NO automatic table privileges (the new Supabase default).

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  onboarded_at timestamptz
);

create table if not exists councils (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Every user's permanent first council. Renamable, never deletable:
  -- no delete privilege is granted on councils at all (see grants below).
  is_supreme boolean not null default false
);

create table if not exists council_members (
  council_id uuid not null references councils(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (council_id, user_id)
);

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

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  choice text not null check (choice in ('yes', 'maybe', 'no')),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

-- ---------------------------------------------------------------------
-- Helper: "is the signed-in user a member of this council?"
-- SECURITY DEFINER so it can read council_members without going back
-- through that table's own access rules. Policies that asked this
-- question with a plain subquery on council_members made Postgres fail
-- with "infinite recursion detected in policy" on every read.
-- ---------------------------------------------------------------------
create or replace function public.is_council_member(p_council_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.council_members
    where council_id = p_council_id and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Signup trigger: a profile, plus a permanent "Supreme Council" with just
-- that person in it. Doing this here (not client-side after signUp()) means
-- it happens atomically, even if email confirmation is on.
-- ---------------------------------------------------------------------
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
-- Privileges. Supabase no longer grants access to new public tables
-- automatically, so every privilege the app needs is listed here.
-- Nothing is granted to "anon": every screen requires sign-in. Nothing
-- grants DELETE: the app has no delete feature, so councils (including
-- the Supreme Council) cannot be deleted through the API.
-- Updates are limited to specific columns, so e.g. nobody can flip
-- is_supreme or change who owns a council.
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select on profiles to authenticated;
grant update (name, onboarded_at) on profiles to authenticated;

grant select, insert on councils to authenticated;
grant update (name, description) on councils to authenticated;

grant select, insert on council_members to authenticated;

grant select, insert on requests to authenticated;
grant update (closed_at) on requests to authenticated;

grant select, insert, update on votes to authenticated;

grant execute on function public.is_council_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table councils enable row level security;
alter table council_members enable row level security;
alter table requests enable row level security;
alter table votes enable row level security;

-- profiles: any signed-in user can see names (needed to build member
-- lists); you can only change your own.
drop policy if exists "profiles are readable by any signed-in user" on profiles;
create policy "profiles are readable by any signed-in user"
  on profiles for select to authenticated
  using (true);

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- councils: members can read them. The owner can always read their own,
-- which is what lets "create a council and read it back" work before the
-- owner has been added as a member.
drop policy if exists "members can read their councils" on councils;
create policy "members can read their councils"
  on councils for select to authenticated
  using (owner_id = auth.uid() or public.is_council_member(id));

-- is_supreme must be false here: only the signup trigger may create a Supreme Council.
drop policy if exists "signed-in users can create councils they own" on councils;
create policy "signed-in users can create councils they own"
  on councils for insert to authenticated
  with check (owner_id = auth.uid() and is_supreme = false);

drop policy if exists "owner can update their own council" on councils;
create policy "owner can update their own council"
  on councils for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- council_members: members can see who else is in their councils; only a
-- council's owner can add people.
drop policy if exists "members can read their council's membership rows" on council_members;
create policy "members can read their council's membership rows"
  on council_members for select to authenticated
  using (public.is_council_member(council_id));

drop policy if exists "council owner can add members" on council_members;
create policy "council owner can add members"
  on council_members for insert to authenticated
  with check (
    exists (
      select 1 from councils c
      where c.id = council_members.council_id and c.owner_id = auth.uid()
    )
  );

-- requests
drop policy if exists "members can read requests in their councils" on requests;
create policy "members can read requests in their councils"
  on requests for select to authenticated
  using (public.is_council_member(council_id));

drop policy if exists "members can post requests to their councils" on requests;
create policy "members can post requests to their councils"
  on requests for insert to authenticated
  with check (author_id = auth.uid() and public.is_council_member(council_id));

drop policy if exists "author can update their own request" on requests;
create policy "author can update their own request"
  on requests for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- votes. Reading/writing a vote requires being able to see its request,
-- and the requests policy above already limits that to council members.
drop policy if exists "members can read votes on requests in their councils" on votes;
create policy "members can read votes on requests in their councils"
  on votes for select to authenticated
  using (exists (select 1 from requests r where r.id = votes.request_id));

drop policy if exists "members can cast a vote on requests in their councils" on votes;
create policy "members can cast a vote on requests in their councils"
  on votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from requests r
      where r.id = votes.request_id
        -- Enforce the "manual" and "deadline" close rules in the database,
        -- not just the UI. "all_members" is not enforced here: the vote
        -- that completes participation must itself be allowed through
        -- (see src/lib/close-rules.ts).
        and r.closed_at is null
        and (r.deadline is null or r.deadline > now())
    )
  );

drop policy if exists "members can change their own vote" on votes;
create policy "members can change their own vote"
  on votes for update to authenticated
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