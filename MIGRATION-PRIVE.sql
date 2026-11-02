-- NOVELYA : MIGRATION DES HISTOIRES PRIVÉES (à exécuter UNE FOIS).
-- Conserve toutes les histoires, chapitres et comptes administrateurs existants.
alter table public.stories add column if not exists visibility text not null default 'published';
alter table public.stories add column if not exists release_at timestamptz;
alter table public.stories drop constraint if exists stories_visibility_check;
alter table public.stories add constraint stories_visibility_check check (visibility in ('draft','scheduled','published'));
-- Les anciennes histoires restent publiées ; rien n'est effacé.
create or replace function public.is_encria_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
-- Supprime les anciennes règles publiques trop permissives.
drop policy if exists "Public read stories" on public.stories;
drop policy if exists "Public read scheduled chapters" on public.chapters;
drop policy if exists "Public read visible stories" on public.stories;
drop policy if exists "Public read visible chapters" on public.chapters;
create policy "Public read visible stories" on public.stories for select to anon, authenticated
using (public.is_encria_admin() or visibility = 'published' or (visibility = 'scheduled' and release_at <= now()));
create policy "Public read visible chapters" on public.chapters for select to anon, authenticated
using (public.is_encria_admin() or (publish_at <= now() and exists (
 select 1 from public.stories s where s.id = story_id
 and (s.visibility = 'published' or (s.visibility = 'scheduled' and s.release_at <= now()))
)));
-- Les règles INSERT / UPDATE / DELETE des admins restent celles de supabase.sql.
