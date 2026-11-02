-- NOVELYA V6 : exécuter APRÈS toutes les migrations V5, dont MIGRATION-V5-3-AVIS.sql.
-- Aucune donnée existante supprimée. Relecture humaine obligatoire pour les soumissions.
-- 1. Pseudonymes uniques et changement tous les 30 jours.
alter table public.profiles add column if not exists pseudo_changed_at timestamptz;
update public.profiles set pseudo='lecteur_'||substr(user_id::text,1,8) where pseudo is null or trim(pseudo)='' or lower(pseudo)='lecteur';
-- Résoudre les éventuels doublons historiques sans supprimer de profils.
with duplicates as (select user_id, row_number() over(partition by lower(pseudo) order by created_at,user_id) as n from public.profiles)
update public.profiles p set pseudo=left(p.pseudo,20)||'_'||substr(p.user_id::text,1,8) from duplicates d where d.user_id=p.user_id and d.n>1;
create unique index if not exists novelya_pseudo_unique on public.profiles(lower(pseudo));
-- L'ancien trigger créait des pseudonymes « Lecteur » identiques : le remplacer.
create or replace function public.create_reader_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare chosen text;
begin
 chosen:=left(trim(coalesce(new.raw_user_meta_data->>'pseudo','')),24);
 if chosen !~ '^[[:alnum:]_-]{3,24}$' or lower(chosen) in ('admin','administrateur','moderateur','modérateur','novelya','support') then
  chosen:='lecteur_'||substr(new.id::text,1,8);
 end if;
 if exists(select 1 from public.profiles where lower(pseudo)=lower(chosen)) then
  chosen:='lecteur_'||substr(new.id::text,1,8);
 end if;
 insert into public.profiles(user_id,pseudo) values(new.id,chosen) on conflict(user_id) do nothing;
 return new;
end;$$;
create or replace function public.change_my_pseudo(new_pseudo text) returns void language plpgsql security definer set search_path='' as $$
declare last_change timestamptz;
begin
 if auth.uid() is null then raise exception 'Connexion obligatoire'; end if;
 new_pseudo:=trim(new_pseudo);
 if new_pseudo !~ '^[[:alnum:]_-]{3,24}$' or lower(new_pseudo) in ('admin','administrateur','moderateur','modérateur','novelya','support') then raise exception 'Pseudo invalide ou réservé'; end if;
 select pseudo_changed_at into last_change from public.profiles where user_id=auth.uid() for update;
 if last_change>now()-interval '30 days' then raise exception 'Changement possible une fois tous les 30 jours'; end if;
 if exists(select 1 from public.profiles where lower(pseudo)=lower(new_pseudo) and user_id<>auth.uid()) then raise exception 'Ce pseudonyme est déjà utilisé'; end if;
 update public.profiles set pseudo=new_pseudo,pseudo_changed_at=now() where user_id=auth.uid();
 if not found then raise exception 'Profil introuvable'; end if;
end;$$;
revoke all on function public.change_my_pseudo(text) from public,anon;
grant execute on function public.change_my_pseudo(text) to authenticated;
-- Affichage public des pseudonymes uniquement (aucun email ni sanction dans cette vue).
create or replace view public.public_author_profiles with (security_invoker=true) as select user_id,pseudo from public.profiles;
-- La table profiles n'était lisible que par son propriétaire : une politique de lecture limitée aux colonnes est impossible.
-- Les noms publics sont donc copiés dans une table dédiée maintenue par trigger.
create table if not exists public.author_names(user_id uuid primary key references auth.users(id) on delete cascade,pseudo text not null);
insert into public.author_names(user_id,pseudo) select user_id,pseudo from public.profiles on conflict(user_id) do update set pseudo=excluded.pseudo;
create or replace function public.sync_author_name() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.author_names(user_id,pseudo) values(new.user_id,new.pseudo) on conflict(user_id) do update set pseudo=excluded.pseudo;return new;end;$$;
drop trigger if exists novelya_sync_author on public.profiles;
create trigger novelya_sync_author after insert or update of pseudo on public.profiles for each row execute function public.sync_author_name();
alter table public.author_names enable row level security;
drop policy if exists "Public author names" on public.author_names;
create policy "Public author names" on public.author_names for select to anon,authenticated using(true);
-- 2. Histoires soumises : le propriétaire reste immuable, l'alias est réservé aux admins.
alter table public.stories add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.stories add column if not exists author_alias text;
alter table public.stories add column if not exists moderation_flags text;
alter table public.stories drop constraint if exists stories_visibility_check;
alter table public.stories add constraint stories_visibility_check check (visibility in ('draft','scheduled','published','pending','rejected'));
-- Ne jamais rendre publiques les histoires en attente, y compris via requêtes directes.
drop policy if exists "Public read visible stories" on public.stories;
create policy "Public read visible stories" on public.stories for select to anon,authenticated using(public.is_encria_admin() or visibility in ('published','scheduled') or (owner_id=auth.uid()));
create or replace function public.submit_story_for_review(p_title text,p_description text,p_genre text,p_format text,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; pid text; flags text:='';
begin
 if auth.uid() is null then raise exception 'Connexion obligatoire'; end if;
 if not public.can_publish_story() then raise exception 'Publication interdite pour ce compte'; end if;
 if length(trim(p_title)) not between 3 and 140 or length(trim(p_description)) not between 10 and 2000 or length(trim(p_body)) not between 50 and 100000 then raise exception 'Longueur de texte invalide'; end if;
 if p_format not in ('Roman','Manga','Webtoon','BD','Nouvelle','Light novel','Poésie','Fanfiction','Conte') or p_genre not in ('Fantasy','Romance','Action','Aventure','Science-fiction','Horreur','Thriller','Policier','Drame','Comédie','Historique','Mystère','Fantastique','Autre') then raise exception 'Catégorie invalide'; end if;
 -- Heuristique indicative seulement : ce contrôle ne remplace PAS une modération IA ou humaine.
 if (p_title||' '||p_description||' '||p_body) ~* '(pornograph|viol sexuel|extermination|suicide collectif)' then flags:='Alerte lexicale : vérifier le contexte'; end if;
 select pseudo into pid from public.profiles where user_id=auth.uid();
 insert into public.stories(title,description,genre,story_format,author,owner_id,visibility,moderation_flags) values(trim(p_title),trim(p_description),p_genre,p_format,coalesce(pid,'Auteur'),auth.uid(),'pending',nullif(flags,'')) returning id into sid;
 insert into public.chapters(story_id,title,body,publish_at) values(sid,'Chapitre 1',trim(p_body),now());
 return sid;
end;$$;
revoke all on function public.submit_story_for_review(text,text,text,text,text) from public,anon;
grant execute on function public.submit_story_for_review(text,text,text,text,text) to authenticated;
create or replace function public.review_story_submission(target_story uuid,decision text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_encria_admin() then raise exception 'Administrateur uniquement'; end if;
 if decision not in ('approve','reject') then raise exception 'Décision invalide'; end if;
 update public.stories set visibility=case when decision='approve' then 'published' else 'rejected' end where id=target_story and visibility='pending';
 if not found then raise exception 'Histoire introuvable ou déjà traitée'; end if;
end;$$;
revoke all on function public.review_story_submission(uuid,text) from public,anon;
grant execute on function public.review_story_submission(uuid,text) to authenticated;
-- 3. Commentaires en attente, refusables et signalables.
create table if not exists public.story_comments(id uuid primary key default gen_random_uuid(),story_id uuid not null references public.stories(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,body text not null check(length(trim(body)) between 3 and 1500),status text not null default 'pending' check(status in ('pending','approved','rejected')),created_at timestamptz not null default now());
create table if not exists public.comment_reports(id uuid primary key default gen_random_uuid(),comment_id uuid not null references public.story_comments(id) on delete cascade,reporter_id uuid not null references auth.users(id) on delete cascade,reason text not null check(length(trim(reason)) between 5 and 300),created_at timestamptz not null default now(),unique(comment_id,reporter_id));
alter table public.story_comments enable row level security;
alter table public.comment_reports enable row level security;
create policy "Read approved comments" on public.story_comments for select to anon,authenticated using(status='approved' or public.is_encria_admin() or user_id=auth.uid());
create policy "Submit comments for review" on public.story_comments for insert to authenticated with check(user_id=auth.uid() and status='pending' and exists(select 1 from public.stories s where s.id=story_id and s.visibility='published'));
create policy "Report comments" on public.comment_reports for insert to authenticated with check(reporter_id=auth.uid());
create policy "Admin read reports" on public.comment_reports for select to authenticated using(public.is_encria_admin());
create or replace function public.review_comment(target_comment uuid,decision text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_encria_admin() then raise exception 'Administrateur uniquement'; end if;
 if decision not in ('approve','reject') then raise exception 'Décision invalide'; end if;
 update public.story_comments set status=case when decision='approve' then 'approved' else 'rejected' end where id=target_comment and status='pending';
 if not found then raise exception 'Commentaire introuvable ou déjà traité'; end if;
end;$$;
revoke all on function public.review_comment(uuid,text) from public,anon;
grant execute on function public.review_comment(uuid,text) to authenticated;
-- IMPORTANT : aucune IA d'analyse d'image n'est installée dans cette migration.
-- Les couvertures communautaires ne sont donc pas ouvertes ; les admins conservent l'upload.
-- Renforcer la confidentialité des chapitres soumis : même une requête API directe ne les voit pas.
drop policy if exists "Public read scheduled chapters" on public.chapters;
drop policy if exists "Public read visible chapters" on public.chapters;
create policy "Public read visible chapters" on public.chapters for select to anon,authenticated using(
 public.is_encria_admin() or exists(select 1 from public.stories s where s.id=story_id and s.owner_id=auth.uid())
 or (publish_at<=now() and exists(select 1 from public.stories s where s.id=story_id and (s.visibility='published' or (s.visibility='scheduled' and s.release_at<=now()))))
);
