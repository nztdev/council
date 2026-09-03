-- Council schema for Supabase.
-- Run this once in your project's SQL editor (Supabase Dashboard -> SQL Editor).
-- Requires the "pgcrypto" extension for gen_random_uuid(), which Supabase
-- enables by default.

-- ---------------------------------------------------------------------
-- profiles: public-facing user info, one row per auth.users row.
-- Needed because auth.users itself isn't queryable from the client.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
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

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- councils
-- ---------------------------------------------------------------------
create table if not exists councils (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
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

-- ---------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  council_id uuid not null references councils(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  context text not null default '',
  created_at timestamptz not null default now()
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
      where r.id = votes.request_id and cm.user_id = auth.uid()
    )
  );

create policy "members can change their own vote"
  on votes for update
  to authenticated
  using (user_id = auth.uid());
