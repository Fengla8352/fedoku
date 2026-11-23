import { PEERS } from '../grid';
import { ALL_DIGITS, bit, popcount } from '../mask';

/**
 * Brzi rješavač pretraživanjem (bez tehnika): koristi se za provjeru
 * jedinstvenosti i za dobivanje rješenja. Bira ćeliju s najmanje kandidata.
 */
function search(values: number[], limit: number, found: number[][]): void {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (values[i]) continue;
    let m = ALL_DIGITS;
    for (const p of PEERS[i]) if (values[p]) m &= ~bit(values[p]);
    const n = popcount(m);
    if (n < bestCount) {
      best = i;
      bestMask = m;
      bestCount = n;
      if (n <= 1) break;
    }
  }
  if (best === -1) {
    found.push([...values]);
    return;
  }
  if (bestCount === 0) return;
  for (let d = 1; d <= 9 && found.length < limit; d++) {
    if (!(bestMask & bit(d))) continue;
    values[best] = d;
    search(values, limit, found);
  }
  values[best] = 0;
}

function hasConflict(values: readonly number[]): boolean {
  for (let i = 0; i < 81; i++) {
    const v = values[i];
    if (v && PEERS[i].some((p) => values[p] === v)) return true;
  }
  return false;
}

/** Pronalazi do `limit` rješenja. */
export function findSolutions(values: readonly number[], limit = 2): number[][] {
  if (values.length !== 81 || hasConflict(values)) return [];
  const found: number[][] = [];
  search([...values], limit, found);
  return found;
}

/** Broj rješenja, zaustavlja se na `limit` (zadano 2 — dovoljno za provjeru jedinstvenosti). */
export const countSolutions = (values: readonly number[], limit = 2): number =>
  findSolutions(values, limit).length;

export type UniquenessResult =
  | { status: 'unique'; solution: number[] }
  | { status: 'none' }
  | { status: 'multiple' };

export function checkUniqueness(values: readonly number[]): UniquenessResult {
  const sols = findSolutions(values, 2);
  if (sols.length === 0) return { status: 'none' };
  if (sols.length > 1) return { status: 'multiple' };
  return { status: 'unique', solution: sols[0] };
}
