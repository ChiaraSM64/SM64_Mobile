# Comment ajouter ou modifier une run

Il y a maintenant **2 façons** d'ajouter une run :

## Méthode 1 (recommandée) — Le formulaire `admin.html`

Ouvre `admin.html` sur ton site (ex: `https://chiarasm64.github.io/SM64_Mobile/admin.html`
— cette page n'est pas liée dans le menu, seuls ceux qui ont le lien direct y accèdent).

Remplis le formulaire (catégorie, joueur, temps, date, vérificateur, vidéo...) et
clique sur "Ajouter la run" : la run est **automatiquement ajoutée et commitée sur
GitHub**, sans avoir besoin de toucher au JSON à la main.

### Créer ton token GitHub (à faire une seule fois)

1. Va sur GitHub → clique sur ta photo de profil → **Settings**
2. Tout en bas du menu de gauche → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Donne-lui un nom (ex: "Admin SM64 Mobile"), une expiration (ex: 90 jours, à
   renouveler ensuite)
5. **Repository access** → "Only select repositories" → choisis `SM64_Mobile`
6. **Permissions** → **Repository permissions** → **Contents** → mets sur
   **"Read and write"**
7. Génère le token et **copie-le tout de suite** (il ne sera plus jamais affiché après)

⚠️ **Garde ce token secret**, ne le partage à personne et ne le mets jamais dans un
fichier commité sur GitHub. Si un modérateur doit aussi ajouter des runs, il doit
créer son propre token (ne partage pas le tien).

Colle ce token dans le champ correspondant du formulaire à chaque utilisation (il
n'est jamais sauvegardé nulle part, ni envoyé ailleurs qu'à l'API GitHub officielle).

## Méthode 2 — Éditer `data/runs.json` directement

Tout le site (classements + pages de détail) est généré automatiquement à partir
d'un seul fichier : **`data/runs.json`**.


Tu n'as plus jamais besoin de créer un nouveau fichier `.html`, ni de recalculer les
positions à la main : le classement se trie automatiquement par temps à chaque
chargement de page.

## Structure du fichier

```json
{
  "categories": {
    "16_Star_No_LBLJ": {
      "name": "16 Star No LBLJ",
      "entries": [
        {
          "id": "16NoLBLJpbAwbryy",
          "player": "awbryy",
          "flag": "de.png",
          "colorKey": "awbryy",
          "time": "15m 27s",
          "date": "2026-06-17",
          "verified": true
        }
      ]
    }
  },
  "runsDetail": {
    "16NoLBLJpbAwbryy": {
      "id": "16NoLBLJpbAwbryy",
      "categoryName": "16 Star No LBLJ",
      "categoryKey": "16_Star_No_LBLJ",
      "date": "2026-06-17",
      "time": "15m 27s",
      "player": "awbryy",
      "playerColorKey": "awbryy",
      "verifier": "Chillo",
      "verifierColorKey": "chillo1-chillo2",
      "video": "https://www.youtube.com/embed/XXXXXXXXXXX",
      "description": ""
    }
  }
}
```

## Ajouter une nouvelle run

1. Choisis un **id** unique (ex: `16NoLBLJpbNouveauJoueur` — pas d'espace, pas d'accent).
2. Ajoute une entrée dans `categories.<CATEGORIE>.entries` (le tableau du classement).
3. Ajoute l'entrée correspondante dans `runsDetail` (la page de détail).
4. Sauvegarde et commit/push sur GitHub.

C'est tout : la nouvelle run apparaît **automatiquement à la bonne position** dans le
classement (triée par temps), et sa page de détail est accessible via
`runs/view.html?id=<ton-id>` — pas besoin de créer un fichier HTML.

## Modifier une run existante

Édite simplement les champs (`time`, `date`, `verified`, `video`, `description`, etc.)
dans les deux endroits (`categories` **et** `runsDetail` si le champ existe aux deux
endroits, comme `time` et `date`). Le classement et la page de détail se
mettent à jour automatiquement.

## Format du temps

Utilise le format `Xh Ym Zs`, `Ym Zs` ou juste `Zs` (ex : `15m 27s`, `1h 02m 03s`).
Le tri se base uniquement sur ce champ.

Pour un temps encore inconnu (run en attente de vérification par ex.), garde une valeur
de temps réelle si tu la connais — seul le champ `date` peut être mis à `"Unknown"`
si la date exacte n'est pas connue.

## Le champ "verifier" (qui a vérifié la run)

Dans `runsDetail`, ajoute simplement :
```json
"verifier": "Chillo"
```
**Tu n'as pas besoin d'ajouter de `verifierColorKey`** : le système reconnaît
automatiquement les modérateurs connus (`awbryy`, `ChiaraSM64`, `MercurySpeedruns`,
`Major`, `Chillo`) et applique la bonne couleur tout seul. Pour n'importe quel autre
nom (nouveau modérateur, joueur normal), le nom s'affichera simplement en blanc — c'est
normal et automatique, pas besoin de rien configurer.

Il en va de même pour le champ `"player"` : écris juste le pseudo, la couleur se
déduit automatiquement s'il s'agit d'un des noms connus ci-dessus.

## Couleurs de pseudo (`colorKey`) — optionnel, cas avancé uniquement

- Pas de couleur spéciale → ne mets rien, ou `"default"`
- Une seule couleur → le nom de la classe CSS (ex: `"awbryy"`, `"chiara"`, `"mercury"`)
- Pseudo bicolore (2 couleurs, ex: Major, Chillo) → les deux classes séparées par un
  tiret (ex : `"major1-major2"`)

Ce champ n'est utile QUE si tu veux forcer une couleur différente de la
reconnaissance automatique (rare). Dans 99% des cas, tu peux l'omettre complètement :
mets juste le nom dans `"player"` ou `"verifier"` et laisse le système deviner.

Si tu ajoutes un **nouveau** joueur/modérateur avec un pseudo bicolore (2 couleurs) et
que tu veux qu'il soit reconnu automatiquement à l'avenir, ajoute-le dans
`js/leaderboard.js` :
1. Dans `KNOWN_NAME_COLORS`, ajoute une ligne : `"nomduplayer": "couleur1-couleur2",`
2. Dans `TWO_TONE_SPLITS`, précise où couper les lettres : `"couleur1-couleur2": 2,`
   (2 = nombre de lettres pour la 1ère couleur)
3. Définis les classes CSS `.playerColor.couleur1` et `.playerColor.couleur2` dans
   `css/style.css` (comme c'est déjà fait pour major1/major2 et chillo1/chillo2)

## Note sur les anciennes pages de runs

Les fichiers dans `runs/*.html` (autres que `view.html`) sont les anciennes pages
individuelles ; elles continuent de fonctionner (au cas où quelqu'un a gardé un lien
en favori) mais ne sont plus utilisées par le nouveau système. Pour toute nouvelle
run, la page générée est automatiquement `runs/view.html?id=...`.
