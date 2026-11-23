import { sees } from '../../grid';
import { bit, digitsOf, popcount } from '../../mask';
import type { CandidateRef, CellIndex, Digit, Mask, SolverState, Unit } from '../../types';
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

/** Prazne ćelije s točno dva kandidata. */
export function bivalueCells(s: SolverState): CellIndex[] {
  const out: CellIndex[] = [];
  for (let i = 0; i < 81; i++) {
    if (!s.values[i] && popcount(s.candidates[i]) === 2) out.push(i);
  }
  return out;
}

/** Eliminacije znamenke d iz svih ćelija koje vide sve `cells` (osim njih samih i `exclude`). */
export function eliminateSeeingAll(
  s: SolverState,
  cells: readonly CellIndex[],
  d: Digit,
  exclude: readonly CellIndex[] = [],
): CandidateRef[] {
  const out: CandidateRef[] = [];
  const b = bit(d);
  for (let c = 0; c < 81; c++) {
    if (!(s.candidates[c] & b) || cells.includes(c) || exclude.includes(c)) continue;
    if (cells.every((x) => sees(x, c))) out.push({ cell: c, digit: d });
  }
  return out;
}

/** Druga znamenka bivalentne ćelije. */
export const otherDigit = (m: Mask, d: Digit): Digit => digitsOf(m & ~bit(d))[0];
