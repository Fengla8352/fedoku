import { ALL_UNITS, sees } from '../../grid';
import { DIGITS, bit } from '../../mask';
import type { CandidateRef, CellIndex, Step, Technique } from '../../types';
import { cellsWithCandidate, unitHasValue } from './util';

/**
 * Simple Coloring (bojanje jedne znamenke): jake veze (jedinice u kojima je
 * znamenka na točno dva mjesta) povezuju ćelije u lanac; susjedne ćelije u lancu
 * dobivaju suprotne boje i točno je jedna boja istinita.
 *  - 'wrap': dvije ćelije iste boje se vide → ta boja je lažna, briše se iz svih njezinih ćelija.
 *  - 'trap': ćelija izvan lanca vidi obje boje → znamenka se iz nje briše.
 */
export const simpleColoring: Technique = {
  id: 'simpleColoring',
  name: 'Simple Coloring',
  difficulty: 'ekstremno',
  find(s) {
    let best: Step | null = null;
    let bestSize = Infinity;
    for (const digit of DIGITS) {
      const b = bit(digit);
      // Graf jakih veza.
      const adj = new Map<CellIndex, CellIndex[]>();
      const links: [CellIndex, CellIndex][] = [];
      for (const unit of ALL_UNITS) {
        if (unitHasValue(s, unit, digit)) continue;
        const pos = cellsWithCandidate(s, unit, digit);
        if (pos.length !== 2) continue;
        const [p, q] = pos;
        if ((adj.get(p) ?? []).includes(q)) continue;
        adj.set(p, [...(adj.get(p) ?? []), q]);
        adj.set(q, [...(adj.get(q) ?? []), p]);
        links.push([p, q]);
      }
      const colored = new Map<CellIndex, 0 | 1>();
      for (const root of adj.keys()) {
        if (colored.has(root)) continue;
        // BFS bojanje komponente.
        const comp: CellIndex[] = [root];
        colored.set(root, 0);
        for (let k = 0; k < comp.length; k++) {
          const c = comp[k];
          for (const n of adj.get(c)!) {
            if (!colored.has(n)) {
              colored.set(n, colored.get(c) === 0 ? 1 : 0);
              comp.push(n);
            }
          }
        }
        if (comp.length < 3 || comp.length >= bestSize) continue;
        const colorA = comp.filter((c) => colored.get(c) === 0).sort((x, y) => x - y);
        const colorB = comp.filter((c) => colored.get(c) === 1).sort((x, y) => x - y);
        const compLinks = links.filter(([p]) => comp.includes(p));

        let rule: 'wrap' | 'trap' | null = null;
        let clash: [CellIndex, CellIndex] | undefined;
        let eliminations: CandidateRef[] = [];
        // Wrap: dvije iste boje se vide.
        for (const group of [colorA, colorB]) {
          for (let i = 0; i < group.length && !rule; i++) {
            for (let j = i + 1; j < group.length && !rule; j++) {
              if (sees(group[i], group[j])) {
                rule = 'wrap';
                clash = [group[i], group[j]];
                eliminations = group.map((cell) => ({ cell, digit }));
              }
            }
          }
        }
        if (!rule) {
          for (let c = 0; c < 81; c++) {
            if (!(s.candidates[c] & b) || colored.has(c)) continue;
            if (colorA.some((a) => sees(a, c)) && colorB.some((x) => sees(x, c))) {
              eliminations.push({ cell: c, digit });
            }
          }
          if (eliminations.length) rule = 'trap';
        }
        if (!rule) continue;
        bestSize = comp.length;
        best = {
          technique: 'simpleColoring',
          eliminations,
          pattern: [
            ...colorA.map((cell) => ({ cell, role: 'colorA' as const, digits: [digit] })),
            ...colorB.map((cell) => ({ cell, role: 'colorB' as const, digits: [digit] })),
          ],
          focus: { units: [], cells: [], digit },
          explanation: { kind: 'simpleColoring', digit, rule, colorA, colorB, clash, links: compLinks },
        };
      }
    }
    return best;
  },
};
