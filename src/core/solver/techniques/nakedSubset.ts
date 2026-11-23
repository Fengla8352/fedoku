import { ALL_UNITS } from '../../grid';
import { digitsOf, popcount } from '../../mask';
import type { Technique, TechniqueId } from '../../types';
import { combinations, eliminationsFor } from './util';

/**
 * Goli par/trojka: n ćelija u jedinici zajedno ima točno n kandidata, pa te
 * znamenke ne mogu biti nigdje drugdje u jedinici.
 */
function makeNakedSubset(size: 2 | 3, id: TechniqueId, name: string): Technique {
  return {
    id,
    name,
    difficulty: 'srednje',
    find(s) {
      for (const unit of ALL_UNITS) {
        const empty = unit.cells.filter((c) => !s.values[c]);
        if (empty.length <= size) continue;
        const eligible = empty.filter((c) => {
          const n = popcount(s.candidates[c]);
          return n >= 2 && n <= size;
        });
        for (const cells of combinations(eligible, size)) {
          let union = 0;
          for (const c of cells) union |= s.candidates[c];
          if (popcount(union) !== size) continue;
          const digits = digitsOf(union);
          const others = empty.filter((c) => !cells.includes(c));
          const eliminations = eliminationsFor(s, others, digits);
          if (eliminations.length === 0) continue;
          return {
            technique: id,
            eliminations,
            pattern: cells.map((cell) => ({ cell, role: 'base' as const, digits: digitsOf(s.candidates[cell]) })),
            focus: { units: [unit], cells: [] },
            explanation: { kind: 'nakedSubset', size, unit, cells, digits },
          };
        }
      }
      return null;
    },
  };
}

export const nakedPair = makeNakedSubset(2, 'nakedPair', 'Goli par');
export const nakedTriple = makeNakedSubset(3, 'nakedTriple', 'Gola trojka');
