# Novelya V5.1 — Correctifs du 30 octobre 2026

## Changements
- Les couvertures et les images mises en avant sont affichées en entier (object-fit: contain). Des marges peuvent apparaître si leur ratio ne correspond pas à celui de la carte.
- Contraste du menu « Tous les genres » corrigé sur les thèmes sombres, avec couleurs explicites pour les options natives.
- Noël : guirlandes SVG, ampoules animées et Père Noël SVG en mouvement, sans ajouter de photographies.
- Mise en avant des histoires : passage automatique à la suivante toutes les 30 secondes lorsque l'onglet est visible et que le lecteur est fermé. Les flèches manuelles restent disponibles.
- Le fond personnalisé de chaque chapitre est déjà géré dans Administration > Chapitres > Image de fond. Sans image, la couverture sert de fond.
- Cliquer sur le fond du lecteur ou ses marges ferme la lecture ; la croix fonctionne toujours.

## Installation
Aucune nouvelle migration SQL nécessaire si MIGRATION-V5-DEPUIS-V4-1.sql a déjà été exécutée. Remplacer les fichiers du dépôt par ceux de cette archive puis redéployer sur Render. Tester les trois thèmes, le lecteur et les comptes avant de mettre en production.

## Limites
Les menus <select> natifs peuvent conserver un rendu propre au système d'exploitation. Aucun test en production avec Supabase/Render n'a été réalisé. Sauvegarder la version précédente.
