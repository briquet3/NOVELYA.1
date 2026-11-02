# NOVELYA V6.2 — Correctifs

## Changements
- Correction du découpage des pages du lecteur : la V6.1 utilisait une expression régulière erronée qui pouvait faire disparaître le texte des chapitres.
- Le fond personnalisé choisi pour un chapitre apparaît aussi derrière la fiche de présentation de l'histoire (premier chapitre possédant un fond), sinon la couverture.
- Le fond de présentation est rendu plus visible.
- En cas d'échec d'enregistrement d'un chapitre, un message explicite affiche l'erreur Supabase sans effacer le formulaire.

## Installation
1. Sauvegarder la version actuelle.
2. Remplacer les fichiers du dépôt GitHub par ceux de ce dossier.
3. Redéployer sur Render, puis recharger avec Ctrl+F5.
4. Vérifier l'ouverture d'un chapitre déjà publié et l'enregistrement d'un chapitre depuis l'administration.

Aucune migration SQL supplémentaire par rapport à V6.
Si les écritures dans Supabase échouent, vérifier les droits du compte admin, les politiques RLS et les messages d'erreur affichés.
