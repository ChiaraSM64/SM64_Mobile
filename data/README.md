# Comment ajouter ou modifier une run

Tout le site (classements + pages de détail) est maintenant généré automatiquement à
partir d'un seul fichier : **`data/runs.json`**.

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

## Couleurs de pseudo (`colorKey`)

- Pas de couleur spéciale → `"default"`
- Une seule couleur → le nom de la classe CSS (ex: `"awbryy"`, `"chiara"`, `"mercury"`)
- Pseudo bicolore (2 couleurs, ex: Major, Chillo) → les deux classes séparées par un
  tiret (ex : `"major1-major2"`)

Si tu ajoutes un **nouveau** joueur avec un pseudo bicolore (2 couleurs), il faut aussi
déclarer le point de coupure des lettres dans `js/leaderboard.js`, dans l'objet
`TWO_TONE_SPLITS` en haut du fichier. Exemple : pour un pseudo "AbCdef" coupé en
"Ab" (couleur 1) + "Cdef" (couleur 2), ajoute :
```js
"couleur1-couleur2": 2,
```
Et il faut bien sûr définir les classes CSS `.playerColor.couleur1` et
`.playerColor.couleur2` dans `css/style.css` (comme c'est déjà fait pour major1/major2
et chillo1/chillo2).

## Note sur les anciennes pages de runs

Les fichiers dans `runs/*.html` (autres que `view.html`) sont les anciennes pages
individuelles ; elles continuent de fonctionner (au cas où quelqu'un a gardé un lien
en favori) mais ne sont plus utilisées par le nouveau système. Pour toute nouvelle
run, la page générée est automatiquement `runs/view.html?id=...`.
