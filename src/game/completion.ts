import { boxUnit, colOf, colUnit, rowOf, rowUnit } from '../core/grid';
import type { CellIndex, Unit } from '../core/types';

/** Koraci vala (ms po koraku udaljenosti). */
export const UNIT_STEP_MS = 45;
export const BOARD_STEP_MS = 35;

/**
 * Jedinice (red, stupac, kvadrat) koje je upis u `cell` upravo dovršio:
 * sve ćelije su popunjene i točne.
 */
export function completedUnits(values: readonly number[], solution: readonly number[], cell: CellIndex): Unit[] {
  if (!values[cell] || values[cell] !== solution[cell]) return [];
  return [rowUnit(cell), colUnit(cell), boxUnit(cell)].filter((u) =>
    u.cells.every((c) => values[c] !== 0 && values[c] === solution[c]),
  );
}

const distance = (a: CellIndex, b: CellIndex) =>
  Math.max(Math.abs(rowOf(a) - rowOf(b)), Math.abs(colOf(a) - colOf(b)));

/** Kašnjenje animacije za svaku ćeliju dovršenih jedinica: val kreće od upisane ćelije. */
export function unitWave(units: readonly Unit[], origin: CellIndex): Map<CellIndex, number> {
  const out = new Map<CellIndex, number>();
  for (const u of units) for (const c of u.cells) out.set(c, distance(origin, c) * UNIT_STEP_MS);
  return out;
}

/** Val preko cijele mreže (riješen sudoku): dijagonalno od gornjeg lijevog kuta. */
export function boardWave(): Map<CellIndex, number> {
  const out = new Map<CellIndex, number>();
  for (let i = 0; i < 81; i++) out.set(i, (rowOf(i) + colOf(i)) * BOARD_STEP_MS);
  return out;
}

/**
 * Koja je ćelija upravo dobila broj (točno jedna nova vrijednost) — inače null
 * (npr. Poništi, nova igra, učitavanje).
 */
export function newlyPlaced(prev: readonly number[], next: readonly number[]): CellIndex | null {
  let found: CellIndex | null = null;
  for (let i = 0; i < 81; i++) {
    if (prev[i] === next[i]) continue;
    if (prev[i] !== 0 || next[i] === 0 || found !== null) return null;
    found = i;
  }
  return found;
}
