-- NOVELYA V6.9 — Exécuter après la migration V6.8.
-- Seul le propriétaire du site peut changer le pseudo d’un autre membre.
-- La contrainte d’unicité existante sur lower(pseudo) continue de s’appliquer.
create or replace function public.admin_change_member_pseudo(target uuid,new_pseudo text)
returns void language plpgsql security definer set search_path = '' as $$
declare cleaned text := btrim(new_pseudo);
begin
 if auth.uid() is null or not exists(select 1 from public.site_owner where user_id=auth.uid()) then
  raise exception 'Seul le propriétaire peut modifier les pseudonymes';
 end if;
 if target is null or not exists(select 1 from public.profiles where user_id=target) then
  raise exception 'Membre introuvable';
 end if;
 if cleaned is null or cleaned !~ '^[[:alnum:]_-]{3,24}$' then
  raise exception 'Pseudo invalide : 3 à 24 lettres, chiffres, - ou _';
 end if;
 if exists(select 1 from public.profiles where lower(pseudo)=lower(cleaned) and user_id<>target) then
  raise exception 'Ce pseudo est déjà utilisé';
 end if;
 update public.profiles set pseudo=cleaned,pseudo_changed_at=now() where user_id=target;
end;$$;
revoke all on function public.admin_change_member_pseudo(uuid,text) from public,anon;
grant execute on function public.admin_change_member_pseudo(uuid,text) to authenticated;
