-- Starter schema for the browser REST adapter. This intentionally allows anonymous access to plain book/media data.
create table if not exists public.books (
  id text primary key,
  doc jsonb not null,
  version integer not null default 1,
  position integer not null default 0
);

alter table public.books enable row level security;

create policy "anonymous can read books"
  on public.books for select to anon using (true);
create policy "anonymous can create books"
  on public.books for insert to anon with check (true);
create policy "anonymous can update books"
  on public.books for update to anon using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('memory-media', 'memory-media', false)
on conflict (id) do nothing;

create policy "anonymous can read media"
  on storage.objects for select to anon using (bucket_id = 'memory-media');
create policy "anonymous can upload media"
  on storage.objects for insert to anon with check (bucket_id = 'memory-media');
create policy "anonymous can replace media"
  on storage.objects for update to anon using (bucket_id = 'memory-media') with check (bucket_id = 'memory-media');
