import { ALL_UNITS } from '../../grid';
import { DIGITS } from '../../mask';
import type { Technique } from '../../types';
import { cellsWithCandidate, unitHasValue } from './util';

/**
 * Skriveni single: znamenka u jedinici ima samo jedno moguće mjesto.
 * Kvadrati se provjeravaju prvi jer ih ljudi najlakše uočavaju.
 */
export const hiddenSingle: Technique = {
  id: 'hiddenSingle',
  name: 'Skriveni single',
  difficulty: 'lako',
  find(s) {
    for (const unit of ALL_UNITS) {
      for (const digit of DIGITS) {
        if (unitHasValue(s, unit, digit)) continue;
        const cells = cellsWithCandidate(s, unit, digit);
        if (cells.length !== 1) continue;
        const cell = cells[0];
        return {
          technique: 'hiddenSingle',
          placement: { cell, digit },
          eliminations: [],
          pattern: [{ cell, role: 'target', digits: [digit] }],
          focus: { units: [unit], cells: [] },
          explanation: { kind: 'hiddenSingle', cell, digit, unit },
        };
      }
    }
    return null;
  },
};
