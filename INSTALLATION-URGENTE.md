NOVELYA — CORRECTION ET RESTAURATION

1. Le ZIP contient les fichiers du site DIRECTEMENT à sa racine. Sur GitHub, déposer index.html, app.js, style.css, config.js, admin.js, admin.html, histoires.json à la RACINE du dépôt, et non dans un sous-dossier.
2. Commit changes. Attendre le statut Live dans Render. Actualiser avec Ctrl+F5.
3. Sur Render Static Site, vérifier que Publish Directory est . (un seul point), si le dépôt contient index.html à la racine.
4. Ne pas exécuter les fichiers SQL du ZIP : ils sont conservés comme références historiques, aucune migration nécessaire pour ce correctif.
5. Si les histoires restent absentes, regarder la Console du navigateur (F12) et la table stories dans Supabase. Ne pas supprimer de tables.

Correction : pagination asynchrone pour éviter de figer le navigateur, fichiers à plat pour éviter les erreurs de déploiement en sous-dossier. Le comportement réel sur le site Render ne peut pas être garanti sans essai sur le site.
