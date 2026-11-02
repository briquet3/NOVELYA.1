-- NOVELYA V4 — à exécuter APRÈS supabase.sql, MIGRATION-PRIVE.sql et MIGRATION-COUVERTURES.sql.
-- Ne supprime ni histoire, ni chapitre, ni compte existant.
-- Les visiteurs peuvent lire les histoires programmées UNIQUEMENT après leur sortie :
-- la RLS existante des histoires doit être élargie pour afficher les métadonnées futures,
-- mais les chapitres restent privés jusqu'à publication.
drop policy if exists "Public read visible stories" on public.stories;
create policy "Public read visible stories" on public.stories for select to anon, authenticated
using (public.is_encria_admin() or visibility='published' or visibility='scheduled');
-- ATTENTION : les descriptions et titres des histoires programmées sont donc publics.
-- Les chapitres restent protégés par la policy « Public read visible chapters » précédente.
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 pseudo text not null default 'Lecteur',
 publish_banned boolean not null default false,
 ban_reason text,
 ban_until timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.moderation_log (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 admin_id uuid not null references auth.users(id),
 action text not null check(action in ('ban','unban')),
 reason text,
 created_at timestamptz not null default now()
);
create or replace function public.create_reader_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(user_id,pseudo) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'pseudo',''),'Lecteur'),40)) on conflict do nothing;
 return new;
end;$$;
drop trigger if exists novelya_profile_signup on auth.users;
create trigger novelya_profile_signup after insert on auth.users for each row execute function public.create_reader_profile();
insert into public.profiles(user_id,pseudo)
select id,left(coalesce(nullif(raw_user_meta_data->>'pseudo',''),'Lecteur'),40) from auth.users on conflict do nothing;
alter table public.profiles enable row level security;
alter table public.moderation_log enable row level security;
drop policy if exists "Profile read own or admin" on public.profiles;
create policy "Profile read own or admin" on public.profiles for select to authenticated using(user_id=(select auth.uid()) or public.is_encria_admin());
drop policy if exists "Moderation log admins" on public.moderation_log;
create policy "Moderation log admins" on public.moderation_log for select to authenticated using(public.is_encria_admin());
-- Aucune policy INSERT/UPDATE/DELETE directe sur profiles : seules les fonctions ci-dessous peuvent sanctionner.
create or replace function public.moderate_reader(target uuid, banned boolean, motive text, expires_at timestamptz default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_encria_admin() then raise exception 'Accès refusé'; end if;
 if target=(select auth.uid()) then raise exception 'Impossible de se sanctionner soi-même'; end if;
 if exists(select 1 from public.admins where user_id=target) then raise exception 'Impossible de sanctionner un administrateur'; end if;
 if banned and length(trim(coalesce(motive,'')))<3 then raise exception 'Motif obligatoire'; end if;
 update public.profiles set publish_banned=banned,ban_reason=case when banned then motive else null end,ban_until=case when banned then expires_at else null end where user_id=target;
 if not found then raise exception 'Profil introuvable'; end if;
 insert into public.moderation_log(user_id,admin_id,action,reason) values(target,(select auth.uid()),case when banned then 'ban' else 'unban' end,motive);
end;$$;
revoke all on function public.moderate_reader(uuid,boolean,text,timestamptz) from public,anon;
grant execute on function public.moderate_reader(uuid,boolean,text,timestamptz) to authenticated;
-- Prévu pour une future fonctionnalité de publication communautaire :
create or replace function public.can_publish_story() returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and not exists (
  select 1 from public.profiles where user_id=(select auth.uid())
  and publish_banned and (ban_until is null or ban_until>now())
 );
$$;
-- IMPORTANT : la future policy INSERT des histoires utilisateurs devra appeler can_publish_story().
-- Pour l'instant, seules les policies admins existantes autorisent la publication.
