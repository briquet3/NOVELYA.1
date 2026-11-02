# NOVELIA V3 — Ajouter des images de couverture

1. Conserve ta base existante. Si la migration privée V2 n’a pas encore été exécutée, lance `MIGRATION-PRIVE.sql` d’abord.
2. Dans Supabase → SQL Editor → New query, colle **uniquement** le contenu de `MIGRATION-COUVERTURES.sql` et clique sur Run. Ne réexécute pas `supabase.sql`.
3. Dans GitHub, remplace les fichiers `admin.html`, `admin.js`, `app.js`, `style.css` et ajoute `MIGRATION-COUVERTURES.sql` si tu souhaites conserver la documentation. Garde ton `config.js` actuel s’il fonctionne déjà.
4. Attends que Render affiche Live, puis ouvre `/admin.html`. Dans Mes histoires → Modifier (ou Nouvelle histoire), sélectionne une image JPG, PNG ou WebP de moins de 5 Mo et clique sur Enregistrer.
5. Vérifie la couverture sur la page d’accueil, idéalement en navigation privée.

**Important :** les images sont stockées dans un bucket public Supabase Storage : toute personne qui possède l’URL exacte d’une image peut y accéder, même si l’histoire est en brouillon. Pour des couvertures de test confidentielles, il faudrait un bucket privé et des URL signées. Les anciennes couvertures remplacées ne sont pas automatiquement supprimées du stockage. L’offre gratuite Supabase comporte des limites de stockage et de trafic.
