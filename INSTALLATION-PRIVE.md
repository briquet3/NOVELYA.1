# Novelya — Installation du mode privé

## 1. Supabase (INDISPENSABLE, avant le déploiement)
Ouvre ton projet Supabase → SQL Editor → New query. Copie **tout le contenu de `MIGRATION-PRIVE.sql`** et clique sur Run. Ne relance pas `supabase.sql` : ce fichier est l’installation initiale, pas la mise à jour.

Cette migration ajoute `visibility` et `release_at` aux histoires, conserve toutes les données, et remplace les règles de lecture publique pour empêcher l’accès aux brouillons, même par requête API. Tes admins existants restent admins. Les histoires déjà créées restent **publiées** : passe-les manuellement en Brouillon si tu souhaites les cacher.

## 2. GitHub et Render
Dans ton dépôt GitHub, remplace les fichiers `admin.html`, `admin.js`, `app.js`, `style.css` et ajoute `MIGRATION-PRIVE.sql`. Ne supprime pas les autres fichiers. Commit changes. Render Static Site devrait se redéployer automatiquement. Vérifie que le statut devient Live.

## 3. Utilisation
Connecte-toi sur `/admin.html`, clique sur Modifier sur une histoire et choisis :
- Brouillon : invisible aux visiteurs, accessible aux admins connectés ;
- Programmée : renseigne date et heure, visibilité publique automatique à l’heure prévue ;
- Publiée : visible immédiatement (ses chapitres futurs restent cachés).

Sur la page d’accueil, un admin connecté voit les brouillons et les badges. Les lecteurs anonymes ne les voient pas. La publication automatique ne nécessite aucun serveur de tâches : la base filtre selon l’heure courante.

## 4. Test de sécurité
Crée une histoire en Brouillon avec un chapitre ; ouvre la page publique en navigation privée. L’histoire ne doit pas apparaître. Connecte-toi en admin dans une autre fenêtre : elle doit apparaître avec le badge 🔒. Vérifie également le mode Programmée.

## Important
Ne publie jamais de clé `service_role`/`sb_secret` dans `config.js`. L’URL et la clé `sb_publishable` sont publiques. Les horaires des formulaires utilisent l’heure locale de ton ordinateur. Les chapitres d’une histoire programmée restent soumis à leur propre date `publish_at`.
