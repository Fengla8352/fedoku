import { COLS, ROWS, colOf, rowOf } from '../../grid';
import { DIGITS } from '../../mask';
import type { CellIndex, Technique, Unit } from '../../types';
import { cellsWithCandidate, eliminateSeeingAll, unitHasValue } from './util';

/**
 * Skyscraper: dva reda (stupca) u kojima je znamenka na točno dva mjesta, s
 * jednim parom krajeva u istom stupcu (redu). Ta dva "temelja" ne mogu oba biti
 * znamenka, pa je barem jedan od "vrhova" znamenka — briše se iz ćelija koje vide oba vrha.
 */
export const skyscraper: Technique = {
  id: 'skyscraper',
  name: 'Skyscraper',
  difficulty: 'ekspert',
  find(s) {
    for (const digit of DIGITS) {
      for (const [lines, cross] of [
        [ROWS, colOf],
        [COLS, rowOf],
      ] as const) {
        const pairs: { unit: Unit; cells: CellIndex[] }[] = [];
        for (const unit of lines) {
          if (unitHasValue(s, unit, digit)) continue;
          const cells = cellsWithCandidate(s, unit, digit);
          if (cells.length === 2) pairs.push({ unit, cells });
        }
        for (let i = 0; i < pairs.length; i++) {
          for (let j = i + 1; j < pairs.length; j++) {
            const p = pairs[i].cells;
            const q = pairs[j].cells;
            for (let pi = 0; pi < 2; pi++) {
              for (let qi = 0; qi < 2; qi++) {
                if (cross(p[pi]) !== cross(q[qi])) continue;
                const tops: [CellIndex, CellIndex] = [p[1 - pi], q[1 - qi]];
                if (cross(tops[0]) === cross(tops[1])) continue; // to bi bio X-Wing
                const eliminations = eliminateSeeingAll(s, tops, digit, [p[pi], q[qi]]);
                if (eliminations.length === 0) continue;
                const base: [CellIndex, CellIndex] = [p[pi], q[qi]];
                return {
                  technique: 'skyscraper',
                  eliminations,
                  pattern: [
                    { cell: base[0], role: 'base', digits: [digit] },
                    { cell: base[1], role: 'base', digits: [digit] },
                    { cell: tops[0], role: 'pincer', digits: [digit] },
                    { cell: tops[1], role: 'pincer', digits: [digit] },
                  ],
                  focus: { units: [pairs[i].unit, pairs[j].unit], cells: [], digit },
                  explanation: { kind: 'skyscraper', digit, lines: [pairs[i].unit, pairs[j].unit], base, tops },
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
};
