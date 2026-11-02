-- NOVELIA V3 : exécuter APRÈS MIGRATION-PRIVE.sql. Ne supprime aucune donnée.
alter table public.stories add column if not exists cover_url text;
-- Stockage public des couvertures (les brouillons restent protégés par les règles sur les histoires,
-- mais une image publique n’est PAS secrète si quelqu’un possède son URL).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('covers','covers',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Novelia admins upload covers" on storage.objects;
create policy "Novelia admins upload covers" on storage.objects for insert to authenticated
with check (bucket_id='covers' and public.is_encria_admin());
-- Les images sont servies publiquement via l’URL du bucket public.
