<p align="center">
  <img src="docs/banner.png" alt="Écran titre d'Echo : le logo ECHO sur fond de château hanté, boutons Jouer, Nouvelle partie et Scores" width="720">
</p>

# Echo

Jeu de plateforme 2D en un seul fichier HTML5 (canvas, sprites inlinés, son synthétisé ; seules les polices viennent de Google Fonts) dans un style dessin animé des années 30. Tu remontes le temps (jauge « Temps »), tu bats 8 boss et tu récupères leurs échos (pouvoirs) pour affronter le Roi des Échos. Jouable au clavier AZERTY et au tactile.

## Jouer

Ouvre `dist/index.html` dans un navigateur, ou héberge le dossier `dist/` sur n'importe quel site statique (Netlify, Cloudflare Pages, un simple serveur web… ; pour GitHub Pages, voir plus bas).

## Développer

Le projet utilise [Vite](https://vite.dev) et des modules ES ; le build produit toujours **un seul fichier** autonome (JS, CSS et sprites inlinés).

```bash
npm install
npm run dev          # serveur de développement avec rechargement à chaud
npm run build        # génère dist/index.html
npm test             # tests de non-régression (Vitest)
npm run lint         # ESLint
npm run format       # Prettier
```

### Organisation du code

| Dossier | Rôle |
|---|---|
| `src/main.js` | Point d'entrée : charge les modules, lance la boucle, expose `globalThis.__T` en mode test |
| `src/core/` | Constantes (`config.js`) et canvas |
| `src/data/` | Données pures : boss, échos et textes, plans des salles dessinées à la main, métriques des sprites |
| `src/state/` | État de la partie (`state.js`), sauvegarde et scores (`save.js`), variables partagées (`runtime.js`) |
| `src/world/` | Générateur de salles (`generator.js`), tables du monde (`world.js`), liaisons entre salles (`edges.js`), assemblage des 100 salles (`build.js`), chargement d'une salle (`rooms.js`) |
| `src/game/` | Simulation à 60 Hz : physique, échos, combat (`combat.js`), IA des boss (`boss-ai.js`), Colosse, Reflets, rembobinage, boucle |
| `src/render/` | Dessin : décor, tuiles, personnages, boss (`boss-*.js`, `bosses.js` en est le point d'entrée), scène, sprites |
| `src/ui/` | HUD, écrans (titre, scores, carte, pause) |
| `src/input/` | Clavier, tactile, boutons à l'écran |
| `src/audio/` | Musique et effets, entièrement synthétisés (Web Audio) |
| `src/assets/sprites/` | PNG des boss (inlinés au build) |
| `tests/` | Non-régression : monde et physique rejoués de façon déterministe, rendu de toutes les salles |

### Notes d'architecture

- **Variables partagées** : les variables réassignées depuis plusieurs modules (salle courante, joueur, clone, entités…) vivent dans l'objet `runtime` (`src/state/runtime.js`), car un `let` exporté ne peut pas être réassigné par l'importeur. L'état persistant de la partie est dans `gameState`.
- **Tests** : `npm test` construit en mode `test`, ce qui active le hook `globalThis.__T` (accès aux internes) ; les tests rejouent des scénarios avec un `Math.random` seedé et comparent des empreintes à la référence produite par le code d'avant le refactor (`tests/golden-scenario.json`).
- **Rendu** : `draw()` est protégé par un `try/catch` dans la boucle pour ne jamais figer le jeu ; le test `render-smoke` l'appelle directement pour que les erreurs de dessin soient visibles.

## Règles de conception

- Boss dans l'ordre : Temps, Jumeaux, L'Envol (double saut), Colosse, Les Reflets (miroir), La Sorcière, La Mémoire (rémanence), L'Éclair.
- Mort : retour à la dernière statue / dernier lit, le chrono continue ; le classement n'enregistre que les parties terminées.
- Les lits ne servent que si on est blessé ou si la jauge de Temps est entamée ; dormir ajoute 20 s au chrono.
- Un coup mortel déclenche un retour arrière automatique de 5 s si la jauge le permet.
- Statues et salles de repos = voyage rapide ; le Hall devient l'arène du roi après 8 pouvoirs.
- Chaque nouvel écho a une durée (10 s par défaut), les clones n'expirent jamais.

## Déploiement GitHub Pages

Le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) lance les tests, construit le jeu et le publie à chaque push sur `main`.

Réglage à faire une seule fois : **Settings → Pages → Build and deployment → Source : « GitHub Actions »**. (Avec « Deploy from a branch », GitHub servirait le `index.html` source du dépôt, qui ne fonctionne pas sans build.)

## Licence

[MIT](LICENSE) : usage, modification et redistribution libres, y compris commerciaux, à condition de conserver la mention de l'auteur (Yorcela) et le texte de la licence.
