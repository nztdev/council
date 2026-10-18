-- Run this after 001_close_rules.sql if you already have a live project.
-- Adds: the onboarding-completion column, the Supreme Council concept,
-- and backfills a Supreme Council for anyone who signed up before this
-- migration existed (the trigger only creates one for *new* signups).

-- 1. New columns
alter table profiles add column if not exists onboarded_at timestamptz;
alter table councils add column if not exists is_supreme boolean not null default false;

-- 2. Let a council owner rename their own council (needed for Supreme
-- Council renaming, and for any future council rename in general)
drop policy if exists "owner can update their own council" on councils;
create policy "owner can update their own council"
  on councils for update
  to authenticated
  using (owner_id = auth.uid());

-- 3. Replace the signup trigger so every *new* signup gets a Supreme
-- Council automatically from now on
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

-- 4. Backfill: give every existing user (who signed up before this
-- migration) a Supreme Council too, if they don't already have one.
do $$
declare
  p record;
  new_council_id uuid;
begin
  for p in
    select pr.id from profiles pr
    where not exists (
      select 1 from councils c where c.owner_id = pr.id and c.is_supreme
    )
  loop
    insert into councils (name, description, owner_id, is_supreme)
    values ('Supreme Council', 'Your most trusted people, for anything.', p.id, true)
    returning id into new_council_id;

    insert into council_members (council_id, user_id)
    values (new_council_id, p.id);
  end loop;
end $$;
