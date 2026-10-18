alter table requests
  add column if not exists close_rule text not null default 'manual'
    check (close_rule in ('manual', 'deadline', 'all_members', 'deadline_or_all_members')),
  add column if not exists deadline timestamptz,
  add column if not exists closed_at timestamptz;

drop policy if exists "author can update their own request" on requests;
create policy "author can update their own request"
  on requests for update
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "members can cast a vote on requests in their councils" on votes;
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
        and r.closed_at is null
        and (r.deadline is null or r.deadline > now())
    )
  );

drop policy if exists "members can change their own vote" on votes;
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
