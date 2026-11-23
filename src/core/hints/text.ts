import { cellName } from '../format';
import type { CandidateRef, CellIndex, Unit } from '../types';

/** "(red 3, stupac 5)" */
export const cellRef = (i: CellIndex): string => `(${cellName(i)})`;

const NOUN = {
  row: { nom: 'red', gen: 'reda', loc: 'redu' },
  col: { nom: 'stupac', gen: 'stupca', loc: 'stupcu' },
  box: { nom: 'kvadrat', gen: 'kvadrata', loc: 'kvadratu' },
} as const;

type U = Pick<Unit, 'type' | 'index'>;
/** "red 3" */
export const unitNom = (u: U) => `${NOUN[u.type].nom} ${u.index + 1}`;
/** "reda 3" */
export const unitGen = (u: U) => `${NOUN[u.type].gen} ${u.index + 1}`;
/** "u redu 3" */
export const unitLoc = (u: U) => `u ${NOUN[u.type].loc} ${u.index + 1}`;

/** "a, b i c" */
export function joinAnd(items: readonly (string | number)[]): string {
  const s = items.map(String);
  if (s.length <= 1) return s.join('');
  return `${s.slice(0, -1).join(', ')} i ${s[s.length - 1]}`;
}

export const cellsRef = (cells: readonly CellIndex[]) => joinAnd(cells.map(cellRef));

/** "Obriši 7 iz (red 1, stupac 2) i (red 1, stupac 3); 4 iz (…)." */
export function describeEliminations(elims: readonly CandidateRef[]): string {
  const byDigit = new Map<number, CellIndex[]>();
  for (const e of elims) byDigit.set(e.digit, [...(byDigit.get(e.digit) ?? []), e.cell]);
  const parts = [...byDigit].sort((a, b) => a[0] - b[0]).map(([d, cells]) => `${d} iz ${cellsRef(cells)}`);
  return `Obriši ${parts.join('; ')}.`;
}
