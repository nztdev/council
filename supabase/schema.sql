-- Council schema for Supabase.
-- Run this in your project's SQL editor (Supabase Dashboard -> SQL Editor).
-- Safe to run more than once, and safe to run on a database created from the
-- previous version of this file: new tables are added, removed policies are
-- dropped, changed policies are recreated.
--
-- Tested against a local Postgres 16 with Supabase-style roles and auth.uid(),
-- with NO automatic table privileges (the new Supabase default).
--
-- THE RELATIONSHIP MODEL (consent at every step)
--   account  ->  Circle link (mutual, created only by redeeming an invite link)
--            ->  council membership (an invitation the person accepts, or an
--                invite link created for that specific council)
-- Nobody can see another person's profile unless they are in your Circle or
-- share a council with you, and nobody can be added to a council without
-- agreeing. Clients cannot write council_members or circle_links directly;
-- only the functions below can.

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

-- A mutual Circle link between two people. The pair is stored once, with
-- user_a < user_b, so there can never be duplicates or a one-way link.
create table if not exists circle_links (
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

-- Invite links. The code is the secret; anyone holding it can redeem it,
-- until it expires, is used up, or is revoked.
create table if not exists invites (
  code text primary key,
  created_by uuid not null references profiles(id) on delete cascade,
  council_id uuid references councils(id) on delete cascade,
  max_uses integer not null default 1 check (max_uses between 1 and 50),
  uses integer not null default 0,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- A council owner inviting someone already in their Circle. The invitee
-- sees it and accepts or declines. council_name is a snapshot, so the
-- invitee can see which council it is before they are a member of it.
create table if not exists council_invitations (
  id uuid primary key default gen_random_uuid(),
  council_id uuid not null references councils(id) on delete cascade,
  council_name text not null,
  invited_user uuid not null references profiles(id) on delete cascade,
  invited_by uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'declined')),
  created_at timestamptz not null default now(),
  unique (council_id, invited_user)
);

-- ---------------------------------------------------------------------
-- Helper functions used by the access rules. SECURITY DEFINER so they can
-- read these tables without going back through the tables' own rules
-- (which is what caused "infinite recursion" in the first version).
-- ---------------------------------------------------------------------
create or replace function public.is_council_member(p_council_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.council_members
    where council_id = p_council_id and user_id = auth.uid()
  );
$$;

-- Is p_other in the signed-in user's Circle?
create or replace function public.is_linked(p_other uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.circle_links
    where user_a = least(auth.uid(), p_other)
      and user_b = greatest(auth.uid(), p_other)
  );
$$;

-- Does p_other share at least one council with the signed-in user?
create or replace function public.shares_council_with(p_other uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.council_members mine
    join public.council_members theirs on theirs.council_id = mine.council_id
    where mine.user_id = auth.uid() and theirs.user_id = p_other
  );
$$;

-- ---------------------------------------------------------------------
-- Signup trigger: a profile, plus a permanent "Supreme Council" with just
-- that person in it.
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
-- Actions. These are the ONLY way to create councils, Circle links and
-- council memberships; each one checks who is asking and what they are
-- allowed to do. Errors are short codes the app turns into messages.
-- ---------------------------------------------------------------------

-- Create a council you own, with you as its first member.
create or replace function public.create_council(p_name text, p_description text default '')
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'name_required'; end if;

  insert into public.councils (name, description, owner_id, is_supreme)
  values (trim(p_name), coalesce(p_description, ''), auth.uid(), false)
  returning id into v_id;

  insert into public.council_members (council_id, user_id)
  values (v_id, auth.uid());

  return v_id;
end;
$$;

-- Make an invite link. With p_council_id (which you must own), whoever
-- redeems it also joins that council.
create or replace function public.create_invite(
  p_council_id uuid default null,
  p_max_uses integer default 1,
  p_days integer default 7
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_max_uses < 1 or p_max_uses > 50 then raise exception 'bad_max_uses'; end if;
  if p_days < 1 or p_days > 30 then raise exception 'bad_days'; end if;

  if p_council_id is not null and not exists (
    select 1 from public.councils where id = p_council_id and owner_id = auth.uid()
  ) then
    raise exception 'not_council_owner';
  end if;

  if (
    select count(*) from public.invites
    where created_by = auth.uid() and revoked_at is null
      and expires_at > now() and uses < max_uses
  ) >= 20 then
    raise exception 'too_many_invites';
  end if;

  v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 20);

  insert into public.invites (code, created_by, council_id, max_uses, expires_at)
  values (v_code, auth.uid(), p_council_id, p_max_uses, now() + make_interval(days => p_days));

  return v_code;
end;
$$;

-- What would happen if I opened this link? Names are only revealed when the
-- link is usable, so a dead or guessed code reveals nothing.
create or replace function public.preview_invite(p_code text)
returns table (status text, inviter_name text, council_name text)
language plpgsql security definer set search_path = public
as $$
declare
  i public.invites;
  v_status text;
  v_inviter text;
  v_council text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select * into i from public.invites where code = p_code;
  if not found then
    return query select 'invalid'::text, null::text, null::text;
    return;
  end if;

  if i.created_by = auth.uid() then v_status := 'own';
  elsif i.revoked_at is not null then v_status := 'revoked';
  elsif i.expires_at <= now() then v_status := 'expired';
  elsif i.uses >= i.max_uses then v_status := 'used';
  elsif public.is_linked(i.created_by)
        and (i.council_id is null or public.is_council_member(i.council_id))
    then v_status := 'already';
  else v_status := 'ok';
  end if;

  if v_status in ('ok', 'already') then
    select p.name into v_inviter from public.profiles p where p.id = i.created_by;
    if i.council_id is not null then
      select c.name into v_council from public.councils c where c.id = i.council_id;
    end if;
  end if;

  return query select v_status, v_inviter, v_council;
end;
$$;

-- Accept an invite link: become mutually linked with whoever made it and,
-- if it is a council link, join that council.
create or replace function public.redeem_invite(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  i public.invites;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select * into i from public.invites where code = p_code for update;
  if not found then raise exception 'invite_invalid'; end if;
  if i.created_by = auth.uid() then raise exception 'invite_own'; end if;
  if i.revoked_at is not null then raise exception 'invite_revoked'; end if;
  if i.expires_at <= now() then raise exception 'invite_expired'; end if;
  if i.uses >= i.max_uses then raise exception 'invite_used'; end if;
  if public.is_linked(i.created_by)
     and (i.council_id is null or public.is_council_member(i.council_id)) then
    raise exception 'invite_already';
  end if;

  insert into public.circle_links (user_a, user_b)
  values (least(auth.uid(), i.created_by), greatest(auth.uid(), i.created_by))
  on conflict do nothing;

  if i.council_id is not null then
    insert into public.council_members (council_id, user_id)
    values (i.council_id, auth.uid())
    on conflict do nothing;

    delete from public.council_invitations
    where council_id = i.council_id and invited_user = auth.uid();
  end if;

  update public.invites set uses = uses + 1 where code = i.code;

  return jsonb_build_object('council_id', i.council_id, 'inviter_id', i.created_by);
end;
$$;

-- Council owner invites someone already in their Circle.
create or replace function public.invite_to_council(p_council_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_name text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select name into v_name from public.councils
  where id = p_council_id and owner_id = auth.uid();
  if v_name is null then raise exception 'not_council_owner'; end if;

  if not public.is_linked(p_user_id) then raise exception 'not_in_circle'; end if;

  if exists (
    select 1 from public.council_members
    where council_id = p_council_id and user_id = p_user_id
  ) then
    raise exception 'already_member';
  end if;

  -- If they declined before, this quietly does nothing: no repeat nagging,
  -- and the owner is not told who declined.
  insert into public.council_invitations (council_id, council_name, invited_user, invited_by)
  values (p_council_id, v_name, p_user_id, auth.uid())
  on conflict (council_id, invited_user) do nothing;
end;
$$;

create or replace function public.respond_to_council_invitation(p_invitation_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  inv public.council_invitations;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select * into inv from public.council_invitations
  where id = p_invitation_id and invited_user = auth.uid() and status = 'pending';
  if not found then raise exception 'invitation_not_found'; end if;

  if p_accept then
    insert into public.council_members (council_id, user_id)
    values (inv.council_id, auth.uid())
    on conflict do nothing;
    delete from public.council_invitations where id = inv.id;
  else
    update public.council_invitations set status = 'declined' where id = inv.id;
  end if;
end;
$$;

-- Leave a council you don't own.
create or replace function public.leave_council(p_council_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from public.councils where id = p_council_id and owner_id = auth.uid()) then
    raise exception 'owner_cannot_leave';
  end if;
  delete from public.council_members
  where council_id = p_council_id and user_id = auth.uid();
end;
$$;

-- Remove someone from your Circle. This fully severs the connection: they
-- leave every council you own, you leave every council they own, and any
-- pending invitations between you are cancelled.
create or replace function public.remove_from_circle(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  delete from public.circle_links
  where user_a = least(auth.uid(), p_user_id)
    and user_b = greatest(auth.uid(), p_user_id);

  delete from public.council_members
  where user_id = p_user_id
    and council_id in (select id from public.councils where owner_id = auth.uid());

  delete from public.council_members
  where user_id = auth.uid()
    and council_id in (select id from public.councils where owner_id = p_user_id);

  delete from public.council_invitations
  where (invited_user = p_user_id and invited_by = auth.uid())
     or (invited_user = auth.uid() and invited_by = p_user_id);
end;
$$;

-- ---------------------------------------------------------------------
-- Privileges. Supabase no longer grants access to new public tables
-- automatically, so everything the app needs is listed here. Nothing is
-- granted to "anon". Nothing grants DELETE. Clients can no longer INSERT
-- councils or council_members directly (the functions above do it, after
-- checking permission), which is why those grants are revoked here for
-- databases created from the previous version.
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;

revoke insert on councils from authenticated;
revoke insert on council_members from authenticated;

grant select on profiles to authenticated;
grant update (name, onboarded_at) on profiles to authenticated;

grant select on councils to authenticated;
grant update (name, description) on councils to authenticated;

grant select on council_members to authenticated;

grant select, insert on requests to authenticated;
grant update (closed_at) on requests to authenticated;

grant select, insert, update on votes to authenticated;

grant select on circle_links to authenticated;
grant select on invites to authenticated;
grant update (revoked_at) on invites to authenticated;
grant select on council_invitations to authenticated;

-- Functions are callable only by signed-in users.
revoke all on function public.is_council_member(uuid) from public, anon;
revoke all on function public.is_linked(uuid) from public, anon;
revoke all on function public.shares_council_with(uuid) from public, anon;
revoke all on function public.create_council(text, text) from public, anon;
revoke all on function public.create_invite(uuid, integer, integer) from public, anon;
revoke all on function public.preview_invite(text) from public, anon;
revoke all on function public.redeem_invite(text) from public, anon;
revoke all on function public.invite_to_council(uuid, uuid) from public, anon;
revoke all on function public.respond_to_council_invitation(uuid, boolean) from public, anon;
revoke all on function public.leave_council(uuid) from public, anon;
revoke all on function public.remove_from_circle(uuid) from public, anon;

grant execute on function public.is_council_member(uuid) to authenticated;
grant execute on function public.is_linked(uuid) to authenticated;
grant execute on function public.shares_council_with(uuid) to authenticated;
grant execute on function public.create_council(text, text) to authenticated;
grant execute on function public.create_invite(uuid, integer, integer) to authenticated;
grant execute on function public.preview_invite(text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.invite_to_council(uuid, uuid) to authenticated;
grant execute on function public.respond_to_council_invitation(uuid, boolean) to authenticated;
grant execute on function public.leave_council(uuid) to authenticated;
grant execute on function public.remove_from_circle(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table councils enable row level security;
alter table council_members enable row level security;
alter table requests enable row level security;
alter table votes enable row level security;
alter table circle_links enable row level security;
alter table invites enable row level security;
alter table council_invitations enable row level security;

-- Policies from the previous version that no longer exist:
drop policy if exists "profiles are readable by any signed-in user" on profiles;
drop policy if exists "signed-in users can create councils they own" on councils;
drop policy if exists "council owner can add members" on council_members;

-- profiles: you can see yourself, your Circle, and people you share a
-- council with (you need their names to read their votes). Nobody else.
drop policy if exists "profiles visible to self, circle and council-mates" on profiles;
create policy "profiles visible to self, circle and council-mates"
  on profiles for select to authenticated
  using (id = auth.uid() or public.is_linked(id) or public.shares_council_with(id));

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- councils
drop policy if exists "members can read their councils" on councils;
create policy "members can read their councils"
  on councils for select to authenticated
  using (owner_id = auth.uid() or public.is_council_member(id));

drop policy if exists "owner can update their own council" on councils;
create policy "owner can update their own council"
  on councils for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- council_members: read-only for clients
drop policy if exists "members can read their council's membership rows" on council_members;
create policy "members can read their council's membership rows"
  on council_members for select to authenticated
  using (public.is_council_member(council_id));

-- Circle, invites, invitations: you can see only your own
drop policy if exists "see your own circle links" on circle_links;
create policy "see your own circle links"
  on circle_links for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists "see your own invite links" on invites;
create policy "see your own invite links"
  on invites for select to authenticated
  using (created_by = auth.uid());

drop policy if exists "revoke your own invite links" on invites;
create policy "revoke your own invite links"
  on invites for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "see pending council invitations you sent or received" on council_invitations;
create policy "see pending council invitations you sent or received"
  on council_invitations for select to authenticated
  using (status = 'pending' and (invited_user = auth.uid() or invited_by = auth.uid()));

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
        -- "manual" and "deadline" close rules are enforced here, not just
        -- in the UI. "all_members" is not: the vote that completes
        -- participation must itself be allowed through.
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

-- ---------------------------------------------------------------------
-- Existing accounts: anyone already sharing a council is treated as
-- connected, so existing councils keep working. From now on the same
-- holds by construction (you can only share a council with your Circle),
-- so re-running this changes nothing.
-- ---------------------------------------------------------------------
insert into circle_links (user_a, user_b)
select distinct least(a.user_id, b.user_id), greatest(a.user_id, b.user_id)
from council_members a
join council_members b on a.council_id = b.council_id and a.user_id <> b.user_id
on conflict do nothing;