-- NOVELYA V4.2 : paramètres globaux du site. Exécuter UNE fois dans Supabase SQL Editor.
-- Aucun compte, chapitre ou histoire existant n'est supprimé.
create table if not exists public.site_settings (
 id integer primary key default 1 check (id=1),
 halloween_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.site_settings (id,halloween_enabled) values (1,false) on conflict(id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings" on public.site_settings for select to anon, authenticated using (true);
-- Pas de droit d'écriture direct accordé aux visiteurs.
create or replace function public.set_site_halloween(enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null or not public.is_encria_admin() then
  raise exception 'Accès réservé aux administrateurs';
 end if;
 update public.site_settings set halloween_enabled=enabled,updated_at=now() where id=1;
 if not found then raise exception 'Configuration introuvable'; end if;
end; $$;
revoke all on function public.set_site_halloween(boolean) from public,anon;
grant execute on function public.set_site_halloween(boolean) to authenticated;


-- NOVELYA V5 — À exécuter après MIGRATION-V4.sql (V4.2 NON requise).
-- Aucune table ni donnée existante n'est supprimée.
-- 1) Trois thèmes globaux choisis par les administrateurs.
alter table public.site_settings add column if not exists site_theme text not null default 'normal';
update public.site_settings set site_theme=case when halloween_enabled then 'halloween' else 'normal' end where site_theme='normal' and halloween_enabled=true;
alter table public.site_settings drop constraint if exists site_settings_site_theme_check;
alter table public.site_settings add constraint site_settings_site_theme_check check (site_theme in ('normal','halloween','christmas'));
create or replace function public.set_site_theme(new_theme text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not public.is_encria_admin() then raise exception 'Accès réservé aux administrateurs'; end if;
 if new_theme is null or new_theme not in ('normal','halloween','christmas') then raise exception 'Thème invalide'; end if;
 update public.site_settings set site_theme=new_theme,halloween_enabled=(new_theme='halloween'),updated_at=now() where id=1;
 if not found then raise exception 'Configuration du site introuvable'; end if;
end;$$;
revoke all on function public.set_site_theme(text) from public,anon;
grant execute on function public.set_site_theme(text) to authenticated;
-- 2) Image de fond propre à chaque chapitre (facultative).
alter table public.chapters add column if not exists background_url text;
-- L'upload utilise le bucket public « covers » et sa politique réservée aux admins.
-- Ne pas supprimer ni recréer le bucket : les couvertures existantes sont conservées.
