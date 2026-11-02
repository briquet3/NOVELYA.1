# ENCRIA — Installation de l'administration et publications automatiques

1. Crée un projet gratuit sur https://supabase.com.
2. Dans **SQL Editor**, colle le contenu de `supabase.sql` et exécute-le.
3. Dans **Authentication > Users**, crée ton compte administrateur (e-mail + mot de passe). Copie son **User UID**.
4. Dans **SQL Editor**, exécute `insert into public.admins(user_id) values ('COLLE-ICI-TON-UUID');` (remplace le texte par ton vrai UUID).
5. Dans **Project Settings > API / Data API**, copie l'URL du projet et la **clé publique anon/publishable**. Renseigne-les dans `config.js`. Ne copie JAMAIS la clé `service_role` ou une clé secrète dans ce fichier.
6. Envoie les fichiers à ton dépôt GitHub puis héberge sur Render avec **New > Static Site** ; **Publish Directory** : `atelier-histoires` si ce dossier est à la racine du dépôt, ou `.` si les fichiers sont à la racine ; **Build Command** : `echo ready`.
7. Ouvre `https://TON-SITE.onrender.com/admin.html`, connecte-toi, crée une histoire puis ses chapitres. Dans la rubrique **Planifier une série hebdomadaire**, sélectionne un jour et une heure et programme la série.

**Important** : les chapitres sont conservés en base de données. La politique RLS de Supabase interdit aux lecteurs de consulter un chapitre avant son heure de publication. Le site récupère les chapitres visibles lors du chargement de la page : une actualisation de la page suffit à voir les nouvelles sorties. Pas besoin de laisser un ordinateur allumé.

**Limites** : l'offre gratuite de Supabase et Render a des quotas et peut évoluer. La publication est automatique pour les chapitres déjà écrits et programmés, pas pour créer du texte automatiquement. L'administration gère histoires, chapitres et calendrier ; la modification de la mise en page globale demande encore du code.

**Sécurité** : désactive les inscriptions publiques dans Supabase Auth si tu veux être le seul utilisateur ; protège ton mot de passe. Ne communique pas tes clés secrètes. Les identifiants publics dans `config.js` ne donnent pas les droits admin : ceux-ci sont contrôlés côté base de données.
