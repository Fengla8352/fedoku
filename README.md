# Fedoku

Sudoku PWA za **učenje tehnika rješavanja**. React + TypeScript + Vite, testovi u Vitestu.

## Struktura

```
src/
  core/                 čisti TypeScript — bez Reacta i DOM-a (radi i u Web Workeru)
    types.ts            tipovi: Digit, Mask, Unit, SolverState, Step, Technique...
    mask.ts             bitovne maske kandidata
    grid.ts             geometrija (redovi/stupci/kvadrati, susjedi), parsiranje, sukobi
    candidates.ts       izračun kandidata, primjena koraka
    format.ts           "red X, stupac Y"
    generator/          generator po težini (najteža potrebna tehnika), ocjena težine, seed RNG
    hints/              savjet: prvo greške (krivi broj, nedostaje/nemoguć kandidat),
                        zatim najjednostavniji korak + tekst za razine 1–3
    solver/
      backtrack.ts      pretraživanje: broj rješenja, provjera jedinstvenosti
      stepSolver.ts     findNextStep (najjednostavniji korak), solveLogically
      techniques/       jedna datoteka po tehnici, isto sučelje Technique
                        (singleovi, pointing, box-line, goli/skriveni par i trojka,
                        X-Wing, XY-Wing, Remote Pair, XYZ-Wing, Swordfish, W-Wing,
                        Skyscraper, XY-Chain, Simple Coloring)
    __tests__/
  game/                 stanje igre (čisti TS): reducer akcija, ručni unos i provjera,
                        poništi, bilješke/automatski kandidati, spremanje u localStorage
  workers/              Web Worker za generiranje (sučelje ostaje odzivno)
  ui/                   React sučelje: mreža, tipkovnica, alati, izbornik "Nova igra"
```

## Naredbe

```bash
npm install
npm test          # Vitest
npm run dev       # razvojni server
npm run build
```

## PWA (instalacija na mobitel, rad bez interneta)

`npm run build` uz aplikaciju generira service worker (`dist/sw.js`) i manifest.
Sve datoteke, uključujući Web Worker generatora, spremaju se u predmemoriju, pa
aplikacija nakon prvog otvaranja radi i bez interneta. Kad postoji nova verzija,
aplikacija ponudi "Osvježi" (ne osvježava se sama usred igre).

Za instalaciju na mobitel `dist/` mora biti posluženo preko HTTPS-a.

**Objavljeno na: https://fedoku.racun8352.workers.dev** (Cloudflare Workers)

Nova objava: `npm run deploy` (build → `scripts/embed-assets.mjs` ugradi `dist/` u
Worker `worker/index.js` → `wrangler deploy`; treba `CLOUDFLARE_API_TOKEN` s dozvolom
za Workers). Worker poslužuje `assets/*` s dugim cacheom, a `sw.js`, `index.html` i
manifest s `no-cache`, da nova verzija uvijek stigne.
- Android (Chrome): gumb "Instaliraj" u zaglavlju ili izbornik ⋮ → "Instaliraj aplikaciju".
- iPhone (Safari): Dijeli → "Dodaj na početni zaslon".
