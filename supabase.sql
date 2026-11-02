-- À exécuter une fois dans Supabase > SQL Editor.
create table if not exists public.stories (
 id uuid primary key default gen_random_uuid(), title text not null,
 author text not null, genre text not null, description text not null default '',
 color text not null default '#7554a8', created_at timestamptz not null default now()
);
create table if not exists public.chapters (
 id uuid primary key default gen_random_uuid(), story_id uuid not null references public.stories(id) on delete cascade,
 title text not null, body text not null, publish_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create index if not exists chapters_story_publish on public.chapters(story_id,publish_at);
create or replace function public.is_encria_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.admins enable row level security;
create policy "Public read stories" on public.stories for select to anon, authenticated using (true);
create policy "Public read scheduled chapters" on public.chapters for select to anon, authenticated using (publish_at <= now() or public.is_encria_admin());
create policy "Admin insert stories" on public.stories for insert to authenticated with check (public.is_encria_admin());
create policy "Admin update stories" on public.stories for update to authenticated using (public.is_encria_admin()) with check (public.is_encria_admin());
create policy "Admin delete stories" on public.stories for delete to authenticated using (public.is_encria_admin());
create policy "Admin insert chapters" on public.chapters for insert to authenticated with check (public.is_encria_admin());
create policy "Admin update chapters" on public.chapters for update to authenticated using (public.is_encria_admin()) with check (public.is_encria_admin());
create policy "Admin delete chapters" on public.chapters for delete to authenticated using (public.is_encria_admin());
create policy "Admin read admin status" on public.admins for select to authenticated using (user_id = (select auth.uid()));
-- Après avoir créé ton utilisateur dans Authentication > Users, remplace l'UUID ci-dessous,
-- puis exécute CETTE ligne séparément :
-- insert into public.admins(user_id) values ('TON-UUID-UTILISATEUR');
