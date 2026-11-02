-- NOVELYA V5.3 : à exécuter dans Supabase SQL Editor APRÈS les migrations précédentes.
-- Conserve toutes les histoires et tous les comptes.
alter table public.stories add column if not exists story_format text not null default 'Roman';
create table if not exists public.story_reactions (
 story_id uuid not null references public.stories(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 liked boolean not null default false,
 rating smallint check (rating between 1 and 5),
 updated_at timestamptz not null default now(),
 primary key (story_id,user_id)
);
create index if not exists story_reactions_story_idx on public.story_reactions(story_id);
alter table public.story_reactions enable row level security;
drop policy if exists "Public can read reaction counts" on public.story_reactions;
create policy "Public can read reaction counts" on public.story_reactions for select to anon,authenticated using (true);
drop policy if exists "Members add their own reactions" on public.story_reactions;
create policy "Members add their own reactions" on public.story_reactions for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update their own reactions" on public.story_reactions;
create policy "Members update their own reactions" on public.story_reactions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete their own reactions" on public.story_reactions;
create policy "Members delete their own reactions" on public.story_reactions for delete to authenticated using ((select auth.uid())=user_id);
