import { PEERS } from '../../grid';
import { digitsOf, popcount } from '../../mask';
import type { Technique } from '../../types';
import { bivalueCells, eliminateSeeingAll } from './util';

/**
 * XYZ-Wing: središte {x,y,z} vidi krak A {x,z} i krak B {y,z}. Kakogod bilo,
 * jedna od tri ćelije je z, pa se z briše iz ćelija koje vide sve tri.
 */
export const xyzWing: Technique = {
  id: 'xyzWing',
  name: 'XYZ-Wing',
  difficulty: 'ekspert',
  find(s) {
    const bivalue = new Set(bivalueCells(s));
    for (let pivot = 0; pivot < 81; pivot++) {
      const pm = s.candidates[pivot];
      if (s.values[pivot] || popcount(pm) !== 3) continue;
      const wings = PEERS[pivot].filter((p) => bivalue.has(p) && (s.candidates[p] & ~pm) === 0);
      for (let i = 0; i < wings.length; i++) {
        for (let j = i + 1; j < wings.length; j++) {
          const a = wings[i];
          const b = wings[j];
          const am = s.candidates[a];
          const bm = s.candidates[b];
          if (am === bm || (am | bm) !== pm) continue;
          const zMask = am & bm;
          const z = digitsOf(zMask)[0];
          const x = digitsOf(am & ~zMask)[0];
          const y = digitsOf(bm & ~zMask)[0];
          const eliminations = eliminateSeeingAll(s, [pivot, a, b], z);
          if (eliminations.length === 0) continue;
          return {
            technique: 'xyzWing',
            eliminations,
            pattern: [
              { cell: pivot, role: 'pivot', digits: digitsOf(pm) },
              { cell: a, role: 'pincer', digits: digitsOf(am) },
              { cell: b, role: 'pincer', digits: digitsOf(bm) },
            ],
            focus: { units: [], cells: [pivot] },
            explanation: { kind: 'xyzWing', pivot, pincers: [a, b], x, y, z },
          };
        }
      }
    }
    return null;
  },
};
