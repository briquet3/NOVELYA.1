# ENCRIA — Ton site d'histoires gratuit

## Ce que contient cette version
- Site responsive avec bibliothèque, recherche, filtres, lecture par chapitre et mode sombre.
- Espace auteur accessible avec le bouton « Espace auteur » pour créer, modifier, supprimer, importer et exporter des histoires.
- Aucun service payant ni framework requis : HTML, CSS, JavaScript et JSON.

## Pour l'essayer sur ton ordinateur
1. Décompresse le dossier.
2. Dans le dossier `atelier-histoires`, ouvre un terminal et lance `python3 -m http.server 8000` (Python installé requis).
3. Dans ton navigateur, visite `http://localhost:8000`.

**Important :** un double-clic sur `index.html` peut empêcher le chargement de `histoires.json` selon le navigateur ; utilise le petit serveur local ci-dessus.

## Modifier les histoires
- Clique sur « Espace auteur » : tu peux modifier les textes sans toucher au code.
- Les changements dans l'éditeur sont stockés dans le navigateur local (localStorage) : ils **ne sont pas publiés automatiquement** et ne sont pas partagés entre appareils.
- Pour publier les modifications pour tous : clique sur « Exporter les histoires », puis remplace `histoires.json` dans les fichiers de ton site hébergé par le fichier téléchargé. Les lecteurs verront la nouvelle version ; ton navigateur d'édition conserve sa copie locale.
- Pour modifier le site directement par code : `index.html` = structure, `style.css` = apparence, `app.js` = fonctionnement, `histoires.json` = contenus.

## Plusieurs chapitres
Dans `histoires.json`, chaque histoire possède une liste `chapters` :
```json
"chapters": [
  { "title": "Chapitre 1", "text": "Texte du chapitre 1" },
  { "title": "Chapitre 2", "text": "Texte du chapitre 2" }
]
```
L'éditeur intégré modifie le premier chapitre et conserve les chapitres suivants. Pour ajouter des chapitres, édite le JSON manuellement.

## Hébergement gratuit
Tu peux publier ces fichiers avec **GitHub Pages** (site statique gratuit avec une adresse de type `utilisateur.github.io`). Crée un dépôt public, envoie les quatre fichiers à sa racine, puis active Pages dans les paramètres du dépôt. Vérifie les conditions et limites actuelles du fournisseur.

## Sécurité et limites
- **L'espace auteur n'est pas protégé par mot de passe.** Tout visiteur peut ouvrir le panneau et modifier sa propre copie locale, mais **personne ne peut modifier les fichiers publiés sur ton hébergement** sans accès à celui-ci.
- Pas de comptes lecteurs, commentaires, publication multi-auteurs, base de données ou synchronisation entre appareils dans cette première version.
- N'ajoute pas de secrets, mots de passe ou données privées aux fichiers publics.
- Les polices Google nécessitent une connexion ; une police de remplacement est utilisée sinon.
- Les trois histoires sont des textes d'exemple à remplacer.
