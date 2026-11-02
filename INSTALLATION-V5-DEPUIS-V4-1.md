# NOVELYA V5 — Mise à jour depuis NovelyaV4.1-main.zip

Cette archive reprend **les fichiers fournis de V4.1** et y applique les changements V5 (les autres fichiers restent ceux de V4.1).

1. Sauvegarder votre dépôt et vos données Supabase.
2. Si `MIGRATION-V4.sql` n'a jamais été exécutée, exécuter cette migration V4 d'abord (une seule fois).
3. Dans Supabase > SQL Editor, exécuter **MIGRATION-V5-DEPUIS-V4-1.sql**. Ce fichier comprend le prérequis V4.2 : ne pas exécuter séparément MIGRATION-HALLOWEEN-V4-2.sql.
4. Remplacer les fichiers du dépôt GitHub par ceux de cette archive. **Ne pas écraser votre configuration `config.js` déjà fonctionnelle** si elle diffère.
5. Redéployer sur Render puis actualiser avec Ctrl+F5.
6. Tester le compte administrateur, la sélection du thème (Paramètres), la consultation en navigation privée, les couvertures, le lecteur et l'upload de fonds de chapitre.

**Important :** l'interface V5 et la syntaxe JavaScript sont vérifiées localement, mais les accès réels à Supabase et le déploiement Render ne sont pas testés. Déployer d'abord sur une branche de test est conseillé.

**Contenu V5 :** trois thèmes (Normal / Halloween animé / Noël animé), choix du thème global réservé aux admins et synchronisé pour tous les visiteurs ; mise en avant de couvertures réelles cliquables ; lecteur en double page sur ordinateur et simple page sur mobile ; fond personnalisable par chapitre depuis l'administration ; boutons et composants UI modernisés.

**Limite :** l'animation de page est une rotation CSS, pas une simulation physique du papier ; la pagination est approximative selon la taille d'écran.
