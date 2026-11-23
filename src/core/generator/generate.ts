import { PEERS } from '../grid';
import { ALL_DIGITS, bit, digitsOf } from '../mask';
import { countSolutions } from '../solver/backtrack';
import { solveLogically } from '../solver/stepSolver';
import type { Difficulty, TechniqueId } from '../types';
import { gradePuzzle, techniquesUpTo } from './grade';
import { createRng, shuffle, type Rng } from './rng';

/** Nasumična potpuno riješena mreža. */
export function randomSolvedGrid(rand: Rng): number[] {
  const values = new Array(81).fill(0);
  const fill = (i: number): boolean => {
    if (i === 81) return true;
    let m = ALL_DIGITS;
    for (const p of PEERS[i]) if (values[p]) m &= ~bit(values[p]);
    for (const d of shuffle(digitsOf(m), rand)) {
      values[i] = d;
      if (fill(i + 1)) return true;
    }
    values[i] = 0;
    return false;
  };
  fill(0);
  return values;
}

export interface GeneratedPuzzle {
  puzzle: number[];
  solution: number[];
  difficulty: Difficulty;
  hardest: TechniqueId;
  givens: number;
  attempts: number;
  seed: number;
}

export interface GenerateOptions {
  /** Simetrija zadanih brojeva (rotacija za 180°) — izgleda urednije. */
  symmetric?: boolean;
  /** Najviše pokušaja prije odustajanja. */
  maxAttempts?: number;
  /** Poziva se nakon svakog neuspjelog pokušaja (za prikaz napretka). */
  onAttempt?: (attempt: number) => void;
}

/**
 * Jedan pokušaj: iz riješene mreže uklanja brojeve nasumičnim redom, ali samo
 * dok rješenje ostaje jedinstveno I zagonetka je rješiva tehnikama do ciljane
 * težine. Tako zagonetka nikad ne postane preteška; na kraju se provjeri je li
 * dovoljno teška (najteža potrebna tehnika je baš ciljane težine).
 */
function attempt(target: Difficulty, rand: Rng, symmetric: boolean): Omit<GeneratedPuzzle, 'attempts' | 'seed'> | null {
  const solution = randomSolvedGrid(rand);
  const puzzle = [...solution];
  const allowed = techniquesUpTo(target);
  const order = shuffle([...Array(symmetric ? 41 : 81).keys()], rand);
  for (const i of order) {
    const cells = symmetric && i !== 80 - i ? [i, 80 - i] : [i];
    const saved = cells.map((c) => puzzle[c]);
    for (const c of cells) puzzle[c] = 0;
    if (countSolutions(puzzle, 2) !== 1 || !solveLogically(puzzle, allowed).solved) {
      cells.forEach((c, k) => (puzzle[c] = saved[k]));
    }
  }
  const g = gradePuzzle(puzzle, allowed);
  if (!g.solvable || g.difficulty !== target) return null;
  return { puzzle, solution, difficulty: g.difficulty, hardest: g.hardest, givens: puzzle.filter((v) => v).length };
}

export class GenerateError extends Error {}

/** Generira zagonetku zadane težine. Isti seed daje istu zagonetku. */
export function generatePuzzle(target: Difficulty, seed: number, opts: GenerateOptions = {}): GeneratedPuzzle {
  const rand = createRng(seed);
  const max = opts.maxAttempts ?? 500;
  for (let n = 1; n <= max; n++) {
    const r = attempt(target, rand, opts.symmetric ?? true);
    if (r) return { ...r, attempts: n, seed };
    opts.onAttempt?.(n);
  }
  throw new GenerateError(`Nije uspjelo generiranje (${max} pokušaja).`);
}
