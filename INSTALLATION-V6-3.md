# NOVELYA V6.3 — Correction du lecteur lent

Le découpage des chapitres utilise désormais des sous-chaînes de taille limitée, au lieu de reconstruire à chaque mesure des portions entières du chapitre. Le livre conserve la pagination adaptée à sa hauteur et les flèches.

1. Sauvegardez votre version.
2. Remplacez les fichiers de GitHub par ceux de ce dossier.
3. Attendez que Render affiche « Live » (Auto-Deploy activé).
4. Actualisez avec Ctrl+F5, puis testez un long chapitre.

Aucun nouveau SQL nécessaire. La correction est locale au JavaScript du lecteur. Test en production non effectué.
