-- NOVELYA V6.8 : exécuter UNE FOIS dans Supabase SQL Editor.
-- Ne supprime aucune histoire, chapitre ou compte.
create table if not exists public.reading_bookmarks (
 user_id uuid not null references auth.users(id) on delete cascade,
 story_id uuid not null references public.stories(id) on delete cascade,
 chapter_index integer not null default 0 check(chapter_index>=0),
 page_index integer not null default 0 check(page_index>=0),
 updated_at timestamptz not null default now(),
 primary key(user_id,story_id)
);
alter table public.reading_bookmarks enable row level security;
drop policy if exists "Bookmarks own read" on public.reading_bookmarks;
create policy "Bookmarks own read" on public.reading_bookmarks for select to authenticated using(user_id=auth.uid());
drop policy if exists "Bookmarks own insert" on public.reading_bookmarks;
create policy "Bookmarks own insert" on public.reading_bookmarks for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "Bookmarks own update" on public.reading_bookmarks;
create policy "Bookmarks own update" on public.reading_bookmarks for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Seul le propriétaire configuré peut promouvoir/rétrograder les administrateurs.
create table if not exists public.site_owner (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.site_owner enable row level security;
revoke all on public.site_owner from anon,authenticated;
-- IMPORTANT : exécuter séparément après ce script, avec le vrai UUID du propriétaire :
-- insert into public.site_owner(user_id) values ('UUID_DU_PROPRIETAIRE') on conflict do nothing;
-- Ne jamais utiliser un UUID trouvé au hasard dans la liste des membres.
create table if not exists public.admin_role_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 target_id uuid not null references auth.users(id),
 action text not null check(action in ('grant','revoke')),
 created_at timestamptz not null default now()
);
alter table public.admin_role_audit enable row level security;
revoke all on public.admin_role_audit from anon,authenticated;
-- L'interface admin lit la liste des administrateurs; seuls les comptes admin y ont accès.
drop policy if exists "Admins can list admins" on public.admins;
create policy "Admins can list admins" on public.admins for select to authenticated using(public.is_encria_admin());
create or replace function public.get_role_owner() returns uuid
language sql stable security definer set search_path = '' as $$
 select user_id from public.site_owner where user_id=auth.uid() limit 1;
$$;
revoke all on function public.get_role_owner() from public,anon;
grant execute on function public.get_role_owner() to authenticated;
create or replace function public.manage_admin_role(target uuid,make_admin boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.site_owner where user_id=auth.uid()) then
  raise exception 'Seul le propriétaire du site peut modifier les droits administrateur';
 end if;
 if target is null or not exists(select 1 from auth.users where id=target) then
  raise exception 'Utilisateur introuvable';
 end if;
 if exists(select 1 from public.site_owner where user_id=target) then
  raise exception 'Impossible de modifier les droits du propriétaire';
 end if;
 if make_admin then
  insert into public.admins(user_id) values(target) on conflict do nothing;
 else
  delete from public.admins where user_id=target;
 end if;
 insert into public.admin_role_audit(actor_id,target_id,action) values(auth.uid(),target,case when make_admin then 'grant' else 'revoke' end);
end;
$$;
revoke all on function public.manage_admin_role(uuid,boolean) from public,anon;
grant execute on function public.manage_admin_role(uuid,boolean) to authenticated;
