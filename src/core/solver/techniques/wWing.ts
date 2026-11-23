import { ALL_UNITS, sees } from '../../grid';
import { digitsOf } from '../../mask';
import type { Digit, Technique } from '../../types';
import { bivalueCells, cellsWithCandidate, eliminateSeeingAll, unitHasValue } from './util';

/**
 * W-Wing: dvije ćelije {x,y} koje se ne vide, a povezane su jakom vezom na x
 * (u nekoj jedinici x je samo na dva mjesta; jedno vidi prvu ćeliju, drugo drugu).
 * Ne mogu obje biti x (tada x u toj jedinici ne bi imao mjesta), pa je barem
 * jedna y — y se briše iz ćelija koje vide obje.
 */
export const wWing: Technique = {
  id: 'wWing',
  name: 'W-Wing',
  difficulty: 'ekspert',
  find(s) {
    const biv = bivalueCells(s);
    for (let i = 0; i < biv.length; i++) {
      for (let j = i + 1; j < biv.length; j++) {
        const a = biv[i];
        const b = biv[j];
        const m = s.candidates[a];
        if (s.candidates[b] !== m || sees(a, b)) continue;
        const digits = digitsOf(m);
        for (const x of digits) {
          const y = digits.find((d) => d !== x)! as Digit;
          const eliminations = eliminateSeeingAll(s, [a, b], y);
          if (eliminations.length === 0) continue;
          for (const unit of ALL_UNITS) {
            if (unitHasValue(s, unit, x)) continue;
            const pos = cellsWithCandidate(s, unit, x);
            if (pos.length !== 2 || pos.includes(a) || pos.includes(b)) continue;
            let link: [number, number] | null = null;
            if (sees(pos[0], a) && sees(pos[1], b)) link = [pos[0], pos[1]];
            else if (sees(pos[1], a) && sees(pos[0], b)) link = [pos[1], pos[0]];
            if (!link) continue;
            return {
              technique: 'wWing',
              eliminations,
              pattern: [
                { cell: a, role: 'pincer', digits },
                { cell: b, role: 'pincer', digits },
                { cell: link[0], role: 'link', digits: [x] },
                { cell: link[1], role: 'link', digits: [x] },
              ],
              focus: { units: [], cells: [a, b] },
              explanation: { kind: 'wWing', cells: [a, b], x, y, link, linkUnit: unit },
            };
          }
        }
      }
    }
    return null;
  },
};
