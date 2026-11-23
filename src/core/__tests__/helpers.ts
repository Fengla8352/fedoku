import { createState } from '../candidates';
import { bit, maskOf } from '../mask';
import { countSolutions, findSolutions } from '../solver/backtrack';
import type { CellIndex, Digit, SolverState } from '../types';

/** Prazna mreža u kojoj su svi kandidati mogući — za ručno slaganje uzoraka. */
export const blankState = (): SolverState => createState(new Array(81).fill(0));

export function setCands(s: SolverState, cell: CellIndex, digits: Digit[]): void {
  s.candidates[cell] = maskOf(digits);
}

/** Briše znamenku d iz svih zadanih ćelija osim onih u `except`. */
export function removeExcept(s: SolverState, cells: readonly CellIndex[], d: Digit, except: CellIndex[]): void {
  for (const c of cells) if (!except.includes(c)) s.candidates[c] &= ~bit(d);
}

/** Deterministički generator slučajnih brojeva (mulberry32). */
export function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Jednostavan generator SAMO za testove: nasumično riješena mreža, pa uklanjanje
 * brojeva dok rješenje ostaje jedinstveno. (Pravi generator s ocjenom težine je Faza 5.)
 */
export function randomPuzzle(seed: number): { puzzle: number[]; solution: number[] } {
  const rand = rng(seed);
  // Nasumično permutiramo znamenke u kanonskom rješenju pa permutiramo redove/stupce unutar traka.
  const base = findSolutions(new Array(81).fill(0), 1)[0];
  const perm = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand);
  const bands = shuffle([0, 1, 2], rand);
  const rowOrder = bands.flatMap((b) => shuffle([0, 1, 2], rand).map((r) => b * 3 + r));
  const stacks = shuffle([0, 1, 2], rand);
  const colOrder = stacks.flatMap((b) => shuffle([0, 1, 2], rand).map((c) => b * 3 + c));
  const solution = new Array(81);
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) solution[r * 9 + c] = perm[base[rowOrder[r] * 9 + colOrder[c]] - 1];

  const puzzle = [...solution];
  for (const i of shuffle([...Array(81).keys()], rand)) {
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[i] = keep;
  }
  return { puzzle, solution };
}
