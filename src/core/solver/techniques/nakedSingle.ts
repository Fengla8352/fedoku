import { boxUnit, colUnit, rowUnit } from '../../grid';
import { popcount, singleDigit } from '../../mask';
import type { Technique } from '../../types';

/** Goli single: ćelija ima samo jedan kandidat. */
export const nakedSingle: Technique = {
  id: 'nakedSingle',
  name: 'Goli single',
  difficulty: 'lako',
  find(s) {
    for (let cell = 0; cell < 81; cell++) {
      const m = s.candidates[cell];
      if (s.values[cell] || popcount(m) !== 1) continue;
      const digit = singleDigit(m);
      return {
        technique: 'nakedSingle',
        placement: { cell, digit },
        eliminations: [],
        pattern: [{ cell, role: 'target', digits: [digit] }],
        focus: { units: [rowUnit(cell), colUnit(cell), boxUnit(cell)], cells: [cell] },
        explanation: { kind: 'nakedSingle', cell, digit },
      };
    }
    return null;
  },
};
