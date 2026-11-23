import { colOf, rowOf } from './grid';
import type { CellIndex, Unit } from './types';

/** "red 3, stupac 5" (1-indeksirano). */
export function cellName(i: CellIndex): string {
  return `red ${rowOf(i) + 1}, stupac ${colOf(i) + 1}`;
}

/** "red 3", "stupac 5", "kvadrat 7". Kvadrati su numerirani 1–9 s lijeva na desno, odozgo. */
export function unitName(u: Pick<Unit, 'type' | 'index'>): string {
  const n = u.index + 1;
  return u.type === 'row' ? `red ${n}` : u.type === 'col' ? `stupac ${n}` : `kvadrat ${n}`;
}
