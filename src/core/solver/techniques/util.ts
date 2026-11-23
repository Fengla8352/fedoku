import { bit } from '../../mask';
import type { CandidateRef, CellIndex, Digit, SolverState, Unit } from '../../types';

/** Prazne ćelije jedinice koje imaju kandidat d. */
export function cellsWithCandidate(s: SolverState, unit: Unit, d: Digit): CellIndex[] {
  const b = bit(d);
  return unit.cells.filter((c) => (s.candidates[c] & b) !== 0);
}

export const unitHasValue = (s: SolverState, unit: Unit, d: Digit): boolean =>
  unit.cells.some((c) => s.values[c] === d);

/** Sve k-člane kombinacije niza (redoslijed je stabilan). */
export function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const pick: T[] = [];
  const rec = (start: number) => {
    if (pick.length === k) {
      out.push([...pick]);
      return;
    }
    for (let i = start; i <= items.length - (k - pick.length); i++) {
      pick.push(items[i]);
      rec(i + 1);
      pick.pop();
    }
  };
  rec(0);
  return out;
}

/** Eliminacije znamenki `digits` iz ćelija `cells`, samo gdje kandidat stvarno postoji. */
export function eliminationsFor(
  s: SolverState,
  cells: readonly CellIndex[],
  digits: readonly Digit[],
): CandidateRef[] {
  const out: CandidateRef[] = [];
  for (const cell of cells) {
    for (const digit of digits) {
      if (s.candidates[cell] & bit(digit)) out.push({ cell, digit });
    }
  }
  return out;
}
