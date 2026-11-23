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
    solver/
      backtrack.ts      pretraživanje: broj rješenja, provjera jedinstvenosti
      stepSolver.ts     findNextStep (najjednostavniji korak), solveLogically
      techniques/       jedna datoteka po tehnici, isto sučelje Technique
                        (singleovi, pointing, box-line, goli/skriveni par i trojka,
                        X-Wing, XY-Wing, Remote Pair, XYZ-Wing, Swordfish, W-Wing,
                        Skyscraper, XY-Chain, Simple Coloring)
    __tests__/
  ui/                   React sučelje (Faza 3+)
```

## Naredbe

```bash
npm install
npm test          # Vitest
npm run dev       # razvojni server
npm run build
```
