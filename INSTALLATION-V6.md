# NOVELYA V6 — Installation

Cette archive a été construite à partir de la V5.1 fournie, en réintégrant les likes, notes et catégories de V5.3.

1. **Sauvegarder** votre dépôt GitHub et votre base Supabase.
2. Dans Supabase > SQL Editor, exécuter les migrations précédentes manquantes dans l'ordre (voir guides V4/V5), puis `MIGRATION-V5-3-AVIS.sql` si elle n'a pas déjà été appliquée.
3. Exécuter **`MIGRATION-V6-SECURITE.sql`** après les migrations V5. Ne pas exécuter deux fois les anciens scripts d'installation initiaux.
4. Remplacer les fichiers du dépôt GitHub par les fichiers de cette archive (mettre les fichiers à la racine du dépôt, pas le dossier parent), puis redéployer sur Render.
5. Vider le cache navigateur (Ctrl+F5) et tester avec un compte lecteur et un compte admin.

## Fonctionnalités
- Couvertures d'histoires réellement publiées sur l'accueil, rotation toutes les 30 secondes, flèches et clic pour lire.
- Père Noël remplacé par une illustration SVG de traîneau et renne traversant le haut du site.
- Formats et genres séparés ; likes et notes 1–5 étoiles par compte.
- Commentaires dans une fenêtre « Voir les avis », soumis à validation des admins, avec signalement.
- Pseudonymes uniques (nouveaux comptes) et changement autorisé une fois tous les 30 jours.
- Auteur affiché automatiquement depuis le pseudonyme du compte propriétaire ; un administrateur peut définir un nom de plume sur une histoire.
- Proposition d'histoires textuelles par les lecteurs, toujours en attente de validation ; admins peuvent approuver/refuser.
- Alertes lexicales **indicatives** sur certains mots ; **pas d'IA de modération** intégrée.

## Limitations importantes
- **Ne pas présenter cette version comme une protection automatique complète des mineurs.** La détection lexicale est très partielle et ne détecte pas les images problématiques. La publication communautaire de couvertures est désactivée ; seuls les admins peuvent en envoyer.
- Les admins doivent examiner chaque proposition et commentaire avant publication. Les commentaires déjà approuvés ne sont pas automatiquement réanalysés.
- La publication de nouvelles versions de chapitres par les utilisateurs n'est pas encore proposée : le formulaire communautaire crée une histoire et son premier chapitre ; les chapitres suivants sont gérés par les admins.
- Les pseudonymes préexistants en double peuvent recevoir un suffixe unique lors de la migration.
- Tester les règles RLS en conditions réelles ; le fonctionnement avec la base de production n'a pas été validé dans cet environnement.
- L'ancien bouton de suppression d'histoire côté admin supprime aussi ses chapitres : conserver des sauvegardes.
