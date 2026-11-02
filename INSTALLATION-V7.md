# NOVELYA V7 — Installation prudente

1. Sauvegardez le dépôt GitHub et la base Supabase. Ne supprimez aucune table.
2. Dans Supabase SQL Editor, exécutez `MIGRATION-V7-AUTEURS-MODERATION-PRESENCE.sql` **après** les migrations V6.8 et V6.9.
3. Remplacez les fichiers du dépôt par ceux de cette archive; Commit changes; attendez Render Live; Ctrl+F5.
4. Dans Supabase Authentication > URL Configuration, vérifiez que Site URL correspond à `https://novelya-udjd.onrender.com` et ajoutez `https://novelya-udjd.onrender.com/**` dans Redirect URLs. Vérifiez aussi le fournisseur SMTP et les journaux d'authentification si les courriels échouent.
5. Testez un compte membre, un compte administrateur et une histoire de test avant d'ouvrir aux visiteurs.

## Limites importantes

- La modération automatique est **lexicale** (mots/expressions), pas un modèle d'IA. Un texte non signalé n'est pas garanti sûr. Les histoires suspectes sont mises en attente pour les admins. Il faut un vrai service de modération côté serveur pour une analyse fiable des textes/images.
- Les sanctions existantes `publish_banned` ne révoquent pas automatiquement un compte Supabase Auth. Le panneau sépare désormais les comptes sanctionnés, mais le bannissement total (impossibilité de se connecter) nécessite une opération sécurisée côté serveur avec `auth.admin`/service role, jamais depuis le navigateur.
- La présence « en ligne » signifie activité détectée récemment, pas une preuve de connexion à la seconde.
- Les fonds et couvertures auteur sont envoyés au bucket `covers` sous `authors/<UUID>/...`.
- Les modifications de chapitres suspectes remettent temporairement toute l'histoire en attente, pour éviter de publier du contenu non vérifié.
- Les problèmes d'e-mails peuvent dépendre des réglages Supabase/SMTP, qui ne peuvent pas être corrigés uniquement dans le ZIP.
