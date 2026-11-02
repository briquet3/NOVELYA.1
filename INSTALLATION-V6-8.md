# Novelya V6.8 — mise à jour groupée

1. Sauvegarder les fichiers GitHub actuels et faire une sauvegarde Supabase.
2. Exécuter **MIGRATION-V6-8-ROLES-MARQUEPAGES.sql** dans Supabase > SQL Editor, UNE fois. Aucune table existante n’est supprimée.
3. Pour activer la gestion des droits, exécuter ensuite cette commande SQL **en remplaçant UUID_DU_PROPRIETAIRE par ton vrai identifiant Supabase Auth** :

```sql
insert into public.site_owner(user_id) values ('UUID_DU_PROPRIETAIRE') on conflict do nothing;
```

Le propriétaire doit déjà avoir son entrée dans `public.admins`. Ne donne jamais le rôle propriétaire à un compte inconnu. Sans cette étape, les boutons de changement de droits ne sont pas affichés.
4. Copier tous les fichiers du ZIP à la racine GitHub, Commit, attendre Render Live puis Ctrl+F5.
5. Tester recherche, notes, marque-pages, reprise, lecture depuis le début et gestion des rôles avec un compte propriétaire.

La recherche dans l'en-tête ouvre et sélectionne le vrai champ de recherche de la bibliothèque. Une note peut être remplacée en choisissant une autre étoile, ou annulée en cliquant la même note. Le marque-page est enregistré uniquement sur action explicite et synchronisé via Supabase pour le compte connecté. « Commencer » démarre au premier chapitre, première page. « Reprendre » suit le marque-page.

**Sécurité :** les changements de rôle passent exclusivement par une fonction SQL vérifiant le propriétaire et enregistrant l'action. Ne pas modifier le SQL historique ou les anciennes migrations. Les notes utilisent la politique de mise à jour existante.
