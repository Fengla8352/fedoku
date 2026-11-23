import { ALL_UNITS } from '../../grid';
import { DIGITS, bit, digitsOf, maskOf } from '../../mask';
import type { CellIndex, Digit, Technique, TechniqueId } from '../../types';
import { cellsWithCandidate, combinations, eliminationsFor, unitHasValue } from './util';

/**
 * Skriveni par/trojka: n znamenki se u jedinici mogu naći samo u istih n ćelija,
 * pa se iz tih ćelija brišu svi ostali kandidati.
 */
function makeHiddenSubset(size: 2 | 3, id: TechniqueId, name: string): Technique {
  return {
    id,
    name,
    difficulty: 'tesko',
    find(s) {
      for (const unit of ALL_UNITS) {
        const positions = new Map<Digit, CellIndex[]>();
        for (const d of DIGITS) {
          if (unitHasValue(s, unit, d)) continue;
          const cells = cellsWithCandidate(s, unit, d);
          // 1 mjesto = skriveni single (jednostavnija tehnika); > size ne može ući u podskup.
          if (cells.length >= 2 && cells.length <= size) positions.set(d, cells);
        }
        for (const digits of combinations([...positions.keys()], size)) {
          const cellSet = new Set<CellIndex>();
          for (const d of digits) for (const c of positions.get(d)!) cellSet.add(c);
          if (cellSet.size !== size) continue;
          const cells = [...cellSet].sort((a, b) => a - b);
          const keep = maskOf(digits);
          const others = DIGITS.filter((d) => !(keep & bit(d)));
          const eliminations = eliminationsFor(s, cells, others);
          if (eliminations.length === 0) continue;
          return {
            technique: id,
            eliminations,
            pattern: cells.map((cell) => ({
              cell,
              role: 'base' as const,
              digits: digitsOf(s.candidates[cell] & keep),
            })),
            focus: { units: [unit], cells: [] },
            explanation: { kind: 'hiddenSubset', size, unit, cells, digits },
          };
        }
      }
      return null;
    },
  };
}

export const hiddenPair = makeHiddenSubset(2, 'hiddenPair', 'Skriveni par');
export const hiddenTriple = makeHiddenSubset(3, 'hiddenTriple', 'Skrivena trojka');
