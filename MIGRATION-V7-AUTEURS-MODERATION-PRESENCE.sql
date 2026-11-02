-- NOVELYA V7 : appliquer après V6.9. Sauvegarder la base avant exécution.
-- Modération lexicale prudente : les textes non signalés sont publiés, mais cela ne garantit PAS leur innocuité.
create or replace function public.novelya_text_suspect(content text) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(content,'') ~* '(pornograph|viol sexuel|extermination|suicide collectif|appel au meurtre|haine raciale|contenu pédopornographique)';
$$;
create or replace function public.submit_story_for_review(p_title text,p_description text,p_genre text,p_format text,p_body text)
returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; pid text; flagged boolean;
begin
 if auth.uid() is null then raise exception 'Connexion obligatoire'; end if;
 if not public.can_publish_story() then raise exception 'Publication interdite pour ce compte'; end if;
 if length(trim(p_title)) not between 3 and 140 or length(trim(p_description)) not between 10 and 2000 or length(trim(p_body)) not between 50 and 100000 then raise exception 'Longueur de texte invalide'; end if;
 if p_format not in ('Roman','Manga','Webtoon','BD','Nouvelle','Light novel','Poésie','Fanfiction','Conte') or p_genre not in ('Fantasy','Romance','Action','Aventure','Science-fiction','Horreur','Thriller','Policier','Drame','Comédie','Historique','Mystère','Fantastique','Autre') then raise exception 'Catégorie invalide'; end if;
 flagged:=public.novelya_text_suspect(p_title||' '||p_description||' '||p_body);
 select pseudo into pid from public.profiles where user_id=auth.uid();
 insert into public.stories(title,description,genre,story_format,author,owner_id,visibility,moderation_flags)
 values(trim(p_title),trim(p_description),p_genre,p_format,coalesce(pid,'Auteur'),auth.uid(),case when flagged then 'pending' else 'published' end,case when flagged then 'Analyse lexicale : vérification humaine nécessaire' else null end) returning id into sid;
 insert into public.chapters(story_id,title,body,publish_at) values(sid,'Chapitre 1',trim(p_body),now());
 return sid;
end;$$;
revoke all on function public.submit_story_for_review(text,text,text,text,text) from public,anon;
grant execute on function public.submit_story_for_review(text,text,text,text,text) to authenticated;

-- Les modifications d'auteurs sont limitées à leur propre histoire, contrôlées côté base.
create or replace function public.novelya_author_edit_story(target uuid,new_title text,new_description text,new_genre text,new_format text,new_cover text)
returns void language plpgsql security definer set search_path='' as $$
declare flagged boolean;
begin
 if auth.uid() is null or not public.can_publish_story() then raise exception 'Compte non autorisé'; end if;
 if not exists(select 1 from public.stories where id=target and owner_id=auth.uid() and visibility in ('published','pending')) then raise exception 'Cette histoire ne vous appartient pas'; end if;
 if length(trim(new_title)) not between 3 and 140 or length(trim(new_description)) not between 10 and 2000 then raise exception 'Titre ou résumé invalide'; end if;
 if new_cover is not null and (length(new_cover)>2000 or new_cover !~ '^https://') then raise exception 'URL de couverture invalide'; end if;
 flagged:=public.novelya_text_suspect(new_title||' '||new_description);
 update public.stories set title=trim(new_title),description=trim(new_description),genre=new_genre,story_format=new_format,cover_url=new_cover,
 visibility=case when flagged then 'pending' else visibility end,
 moderation_flags=case when flagged then 'Modification suspecte : révision requise' else moderation_flags end
 where id=target and owner_id=auth.uid();
end;$$;
revoke all on function public.novelya_author_edit_story(uuid,text,text,text,text,text) from public,anon;
grant execute on function public.novelya_author_edit_story(uuid,text,text,text,text,text) to authenticated;

create or replace function public.novelya_author_save_chapter(target_story uuid,target_chapter uuid,new_title text,new_body text,new_background text)
returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; flagged boolean;
begin
 if auth.uid() is null or not public.can_publish_story() then raise exception 'Compte non autorisé'; end if;
 if not exists(select 1 from public.stories where id=target_story and owner_id=auth.uid() and visibility in ('published','pending')) then raise exception 'Cette histoire ne vous appartient pas'; end if;
 if length(trim(new_title)) not between 1 and 140 or length(trim(new_body)) not between 50 and 100000 then raise exception 'Chapitre invalide'; end if;
 if new_background is not null and (length(new_background)>2000 or new_background !~ '^https://') then raise exception 'URL de fond invalide'; end if;
 flagged:=public.novelya_text_suspect(new_title||' '||new_body);
 if target_chapter is null then
  insert into public.chapters(story_id,title,body,background_url,publish_at) values(target_story,trim(new_title),trim(new_body),new_background,now()) returning id into cid;
 else
  update public.chapters set title=trim(new_title),body=trim(new_body),background_url=new_background where id=target_chapter and story_id=target_story returning id into cid;
  if cid is null then raise exception 'Chapitre introuvable'; end if;
 end if;
 if flagged then update public.stories set visibility='pending',moderation_flags='Chapitre à vérifier par un administrateur' where id=target_story; end if;
 return cid;
end;$$;
revoke all on function public.novelya_author_save_chapter(uuid,uuid,text,text,text) from public,anon;
grant execute on function public.novelya_author_save_chapter(uuid,uuid,text,text,text) to authenticated;

-- Couvertures/fonds dans le bucket existant : dossier privé par auteur, contrôlé par UID.
drop policy if exists "Novelya authors upload own covers" on storage.objects;
create policy "Novelya authors upload own covers" on storage.objects for insert to authenticated
with check(bucket_id='covers' and (storage.foldername(name))[1]='authors' and (storage.foldername(name))[2]=auth.uid()::text and public.can_publish_story());

-- Présence approximative, actualisée toutes les 45 secondes tant que la page reste ouverte.
create table if not exists public.novelya_presence(user_id uuid primary key references auth.users(id) on delete cascade,last_seen timestamptz not null default now());
alter table public.novelya_presence enable row level security;
drop policy if exists "Presence own update" on public.novelya_presence;
create policy "Presence own update" on public.novelya_presence for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "Presence own insert" on public.novelya_presence;
create policy "Presence own insert" on public.novelya_presence for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "Presence admin read" on public.novelya_presence;
create policy "Presence admin read" on public.novelya_presence for select to authenticated using(public.is_encria_admin() or user_id=auth.uid());
