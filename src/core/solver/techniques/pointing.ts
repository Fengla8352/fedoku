import { BOXES, COLS, ROWS, colOf, rowOf } from '../../grid';
import { DIGITS } from '../../mask';
import type { Technique } from '../../types';
import { cellsWithCandidate, eliminationsFor } from './util';

/**
 * Pointing: unutar kvadrata se znamenka može naći samo u jednom redu (stupcu),
 * pa se briše iz ostatka tog reda (stupca) izvan kvadrata.
 */
export const pointing: Technique = {
  id: 'pointing',
  name: 'Pointing (usmjereni par/trojka)',
  difficulty: 'srednje',
  find(s) {
    for (const box of BOXES) {
      for (const digit of DIGITS) {
        const cells = cellsWithCandidate(s, box, digit);
        if (cells.length < 2) continue;
        const lines = [];
        if (cells.every((c) => rowOf(c) === rowOf(cells[0]))) lines.push(ROWS[rowOf(cells[0])]);
        if (cells.every((c) => colOf(c) === colOf(cells[0]))) lines.push(COLS[colOf(cells[0])]);
        for (const line of lines) {
          const targets = line.cells.filter((c) => !box.cells.includes(c));
          const eliminations = eliminationsFor(s, targets, [digit]);
          if (eliminations.length === 0) continue;
          return {
            technique: 'pointing',
            eliminations,
            pattern: cells.map((cell) => ({ cell, role: 'base' as const, digits: [digit] })),
            focus: { units: [box], cells: [] },
            explanation: { kind: 'pointing', digit, box, line, cells },
          };
        }
      }
    }
    return null;
  },
};
