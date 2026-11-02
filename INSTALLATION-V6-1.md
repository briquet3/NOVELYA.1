# Novelya V6.1 — Fiche d'histoire et pagination

## Modifications
- Le carrousel de l'accueil et les boutons de la bibliothèque ouvrent désormais une fiche d'histoire avant la lecture.
- Cette fiche présente la couverture, le titre, le nom d'auteur, le format, le genre, le résumé, les likes, les étoiles et un accès aux commentaires.
- Le fond de la fiche utilise la couverture de l'histoire, avec un voile sombre pour garder le texte lisible.
- La lecture s'ouvre uniquement via « Commencer la lecture ».
- Le texte est découpé en pages selon l'espace réellement disponible, et non plus selon un nombre fixe de caractères. Les pages n'ont plus de barre de défilement.
- Les flèches et le clavier permettent toujours de tourner les pages.

## Installation
1. Conserver une copie de votre site actuel.
2. Copier le contenu du dossier NovelyaV6_1 à la racine du dépôt GitHub (index.html, app.js, style.css, etc.).
3. Redéployer sur Render, puis actualiser avec Ctrl+F5.

**Aucun SQL supplémentaire pour V6.1.** Les migrations V6 précédentes doivent déjà être installées pour les réactions et commentaires.

## Contrôles recommandés
- Tester les fiches avec une couverture, sans couverture et un résumé long.
- Tester la pagination avec des paragraphes longs et des tailles de police différentes sur ordinateur et mobile.
- Tester le passage au chapitre suivant et la reprise de lecture.

Le rendu final et Supabase/Render n'ont pas été testés en production.
