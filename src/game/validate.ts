import { findConflicts } from '../core/grid';
import { checkUniqueness } from '../core/solver/backtrack';
import type { CellIndex } from '../core/types';

export type EntryCheck =
  | { status: 'tooFew'; count: number }
  | { status: 'conflict'; cells: CellIndex[] }
  | { status: 'none' }
  | { status: 'multiple' }
  | { status: 'ok'; solution: number[]; wrong: CellIndex[] };

/** Najmanji broj zadanih brojeva za koji sudoku može imati jedinstveno rješenje. */
export const MIN_GIVENS = 17;

/**
 * Provjera ručno unesene zagonetke:
 *  1. nema dvostrukih brojeva (zadani + moji),
 *  2. zadani brojevi imaju TOČNO jedno rješenje,
 *  3. moji upisani brojevi odgovaraju tom rješenju (inače su "krivi").
 */
export function checkEntry(values: readonly number[], givens: readonly boolean[]): EntryCheck {
  const count = givens.filter((g, i) => g && values[i]).length;
  if (count < MIN_GIVENS) return { status: 'tooFew', count };
  const conflicts = findConflicts(values);
  if (conflicts.size) return { status: 'conflict', cells: [...conflicts].sort((a, b) => a - b) };
  const givenValues = values.map((v, i) => (givens[i] ? v : 0));
  const u = checkUniqueness(givenValues);
  if (u.status !== 'unique') return { status: u.status };
  const wrong: CellIndex[] = [];
  for (let i = 0; i < 81; i++) if (!givens[i] && values[i] && values[i] !== u.solution[i]) wrong.push(i);
  return { status: 'ok', solution: u.solution, wrong };
}
