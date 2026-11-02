# NOVELYA V4 — Installation et contrôle

## Sauvegarde AVANT toute migration
Dans Supabase, sauvegarde les tables `stories`, `chapters`, `admins` et les couvertures Storage. Conserve le ZIP V3. N'exécute pas `supabase.sql` à nouveau si le projet est déjà installé.

## Déploiement
1. Sur ton projet Supabase existant, ouvre SQL Editor et exécute **uniquement `MIGRATION-V4.sql`** (si les migrations V3 précédentes ont déjà été appliquées).
2. Vérifie que les administrateurs existants figurent toujours dans `admins`.
3. Remplace les fichiers statiques du dépôt GitHub par ceux de ce dossier, sans modifier `config.js` si tes identifiants publics sont déjà corrects.
4. Déploie sur Render et recharge la page (Ctrl+F5).
5. Teste avec un compte admin ET un compte lecteur ordinaire, puis sans connexion.

## Fonctions V4
- Refonte de l'interface, bouton Discord, présentation auteurs amateurs, bouton bibliothèque.
- Cartes sans badge sur couverture ; section des sorties programmées avec heure et compte à rebours.
- Lecture paginée, animation légère, navigation par clic/flèches, choix du chapitre, reprise locale.
- Fermeture des fenêtres en cliquant sur le fond, ou sur ✕.
- Inscription/connexion via Supabase Auth ; rôle admin détecté depuis `admins`.
- Préférences sombre/clair, taille de texte, animations, décor Halloween.
- Accès « Modifier » direct pour les admins depuis une carte d'histoire.
- Modération réservée aux admins : raison, durée, levée et historique en base.

## Précisions importantes
- La pagination s'appuie sur la longueur du texte, pas encore sur une mesure typographique exacte. La présentation est en une page à la fois, y compris sur ordinateur. L'animation est un effet 3D léger, pas une simulation physique de feuille.
- Les préférences et la progression de lecture sont enregistrées dans le navigateur courant.
- La future création d'histoires par les visiteurs **n'est pas encore implémentée**. `can_publish_story()` prépare le contrôle de bannissement ; toute future policy d'écriture devra l'utiliser. Les comptes ordinaires ne peuvent pas publier actuellement.
- Les métadonnées des histoires programmées (titre, description, couverture) sont publiques avant la date ; leurs chapitres restent protégés par la RLS V3.
- Les anciens administrateurs restent définis dans la table `admins`. Ne jamais donner les permissions en se basant seulement sur un bouton ou le navigateur.
- Supabase peut exiger une confirmation d'e-mail selon tes paramètres Auth. Configure les URLs de redirection autorisées dans Supabase.
- Le thème Halloween est une décoration discrète et désactivable, pas un pack graphique complet.
- Pour la modération, la liste affiche les pseudos et identifiants des comptes, sans révéler les e-mails des lecteurs.

## Vérifications avant production
- Compte lecteur : inscription, connexion, déconnexion, aucune possibilité de modifier des histoires.
- Compte admin : modifier une histoire via sa carte, accès administration, sanction et débannissement.
- Histoire programmée : apparaît dans Sorties à venir ; ses chapitres ne sont pas récupérables par un lecteur avant l'heure ; publication automatique à l'heure prévue.
- Affichage sur mobile, contraste du thème clair, liens Discord, et lecture des chapitres longs.

Si le SQL affiche une erreur, arrête-toi et partage le message exact plutôt que d'effacer les tables.
