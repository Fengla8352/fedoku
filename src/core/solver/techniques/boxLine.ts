import { BOXES, COLS, ROWS, boxOf } from '../../grid';
import { DIGITS } from '../../mask';
import type { Technique } from '../../types';
import { cellsWithCandidate, eliminationsFor } from './util';

/**
 * Box-line redukcija: unutar reda (stupca) se znamenka može naći samo u jednom
 * kvadratu, pa se briše iz ostatka tog kvadrata.
 */
export const boxLine: Technique = {
  id: 'boxLine',
  name: 'Box-line redukcija',
  difficulty: 'srednje',
  find(s) {
    for (const line of [...ROWS, ...COLS]) {
      for (const digit of DIGITS) {
        const cells = cellsWithCandidate(s, line, digit);
        if (cells.length < 2) continue;
        const b = boxOf(cells[0]);
        if (!cells.every((c) => boxOf(c) === b)) continue;
        const box = BOXES[b];
        const targets = box.cells.filter((c) => !line.cells.includes(c));
        const eliminations = eliminationsFor(s, targets, [digit]);
        if (eliminations.length === 0) continue;
        return {
          technique: 'boxLine',
          eliminations,
          pattern: cells.map((cell) => ({ cell, role: 'base' as const, digits: [digit] })),
          focus: { units: [line], cells: [] },
          explanation: { kind: 'boxLine', digit, line, box, cells },
        };
      }
    }
    return null;
  },
};
