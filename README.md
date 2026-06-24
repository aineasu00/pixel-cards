# Pixel Cards

V0 jouable d'un jeu de cartes multijoueur local, inspire d'un UNO-like, pense pour une tablette horizontale comme table et des telephones comme mains de joueurs.

## Stack

- Vite + TypeScript
- Supabase Realtime Broadcast + Presence si configure
- Fallback local par `BroadcastChannel` sans compte Supabase pour tester avec plusieurs onglets
- QR code cote client avec `qrcode`
- Deploiement statique compatible GitHub Pages

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichee par Vite sur la tablette ou l'ordinateur. La page tablette est `index.html`. Le QR code ouvre `player.html?room=XXXX`.

## Tester rapidement

1. Lance `npm run dev`.
2. Ouvre la page tablette sur `http://localhost:5173/`.
3. Ouvre deux onglets joueurs avec l'URL du QR, par exemple `http://localhost:5173/player.html?room=ABCD`.
4. Entre deux pseudos, clique pret, puis lance la partie sur la tablette.
5. Joue une carte depuis le telephone actif, ou pioche puis passe.

Sans Supabase, le fallback local fonctionne entre onglets du meme navigateur. Pour tablette + telephones reels sur le meme reseau, configure Supabase.

## Configurer Supabase

1. Cree un projet Supabase gratuit.
2. Dans Project Settings > API, copie l'URL du projet et la cle `anon public`.
3. Cree un fichier `.env` a la racine :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

4. Relance `npm run dev`.

Le jeu utilise un seul canal par room : `room:{roomCode}`. Les actions envoyees par telephone sont courtes et intentionnelles (`PLAY_CARD`, `DRAW_CARD`, `PASS_TURN`). La tablette reste autoritaire.

## Build

```bash
npm run build
npm run preview
```

## Deploiement gratuit GitHub Pages

Le depot est configure pour servir la branche `gh-pages`, generee depuis `dist`.

```bash
npm run deploy
```

La config Vite utilise `base: './'` pour rester compatible avec GitHub Pages. Le build utilise les variables Supabase du fichier `.env` local.

## Regles V0

- 2 a 9 joueurs.
- Chaque joueur commence avec 7 cartes.
- Couleurs : rouge, bleu, vert, jaune.
- Valeurs : 0 a 9.
- Actions : `+2`, `skip`, `reverse`, `wild`.
- Une carte est jouable par couleur, valeur/type identique, ou joker.
- Tour limite a 50 secondes.
- A 0 seconde, le joueur actif pioche automatiquement puis passe.
- Premier joueur a 0 carte gagne.

## Limites connues

- La securite est une securite V0 cote client : suffisante pour un jeu local, pas pour un mode public competitif.
- Le fallback local ne connecte pas plusieurs appareils physiques.
- La mascotte fournie n'etait pas disponible dans le workspace au moment de la creation ; `public/assets/mascot.png` est un placeholder remplaçable.
- Le choix de couleur joker est volontairement simple.

## Prochaines ameliorations prioritaires

- Importer la vraie mascotte finale.
- Ajouter un ecran de selection de couleur joker plus tactile.
- Ajouter une reconnexion avec replay du dernier etat pour un telephone qui arrive en retard.
- Ajouter tests unitaires sur `rules.ts` et `room.ts`.
- Ajouter une GitHub Action de deploiement Pages.
