# NOVELYA V6.9 — Installation

1. Sauvegarder le dépôt GitHub et vérifier que la V6.8 fonctionne.
2. Si elle n’a pas déjà été exécutée, appliquer `MIGRATION-V6-8-ROLES-MARQUEPAGES.sql` dans Supabase et définir le vrai UUID du propriétaire (voir guide V6.8).
3. Dans Supabase SQL Editor, exécuter **une seule fois** `MIGRATION-V6-9-PSEUDOS-ADMIN.sql`. Aucun DROP de table, aucune suppression de données.
4. Déployer tous les fichiers du dossier à la racine du dépôt GitHub (ne pas déployer le dossier parent), puis attendre Render « Live ».
5. Recharger avec Ctrl+F5. Tester la recherche globale, l’enregistrement/reprise d’un marque-page et les actions « Gérer le membre ».

## Sécurité
Seul le propriétaire déclaré dans `site_owner` peut modifier les rôles ou les pseudos des autres membres. Les sanctions sont soumises à la RPC sécurisée déjà existante. Aucune action n’est déclenchée à l’ouverture de la fenêtre de gestion.

## Limites
Test de syntaxe et d’intégrité du ZIP possible hors ligne, mais le fonctionnement Supabase en production doit être vérifié après déploiement.
