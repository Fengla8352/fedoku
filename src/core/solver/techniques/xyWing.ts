import { PEERS } from '../../grid';
import { bit, digitsOf, popcount } from '../../mask';
import type { Technique } from '../../types';
import { bivalueCells, eliminateSeeingAll } from './util';

/**
 * XY-Wing: središte {x,y} vidi krak A {x,z} i krak B {y,z}. Ako je središte x,
 * krak A je z; ako je y, krak B je z. Dakle z se briše iz ćelija koje vide oba kraka.
 */
export const xyWing: Technique = {
  id: 'xyWing',
  name: 'XY-Wing',
  difficulty: 'tesko',
  find(s) {
    const bivalue = new Set(bivalueCells(s));
    for (const pivot of bivalue) {
      const pm = s.candidates[pivot];
      const [x, y] = digitsOf(pm);
      const wings = PEERS[pivot].filter((p) => bivalue.has(p));
      // Krak A sadrži x (ne y), krak B sadrži y (ne x), a dijele treću znamenku z.
      for (const a of wings) {
        const am = s.candidates[a];
        if (!(am & bit(x)) || am & bit(y)) continue;
        const zMask = am & ~bit(x);
        for (const b of wings) {
          const bm = s.candidates[b];
          if (b === a || bm !== (bit(y) | zMask) || popcount(zMask) !== 1) continue;
          const z = digitsOf(zMask)[0];
          const eliminations = eliminateSeeingAll(s, [a, b], z, [pivot]);
          if (eliminations.length === 0) continue;
          return {
            technique: 'xyWing',
            eliminations,
            pattern: [
              { cell: pivot, role: 'pivot', digits: [x, y] },
              { cell: a, role: 'pincer', digits: digitsOf(am) },
              { cell: b, role: 'pincer', digits: digitsOf(bm) },
            ],
            focus: { units: [], cells: [pivot] },
            explanation: { kind: 'xyWing', pivot, pincers: [a, b], x, y, z },
          };
        }
      }
    }
    return null;
  },
};
