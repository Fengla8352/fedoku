import { sees } from '../../grid';
import { digitsOf } from '../../mask';
import type { CandidateRef, CellIndex, Digit, Step, Technique } from '../../types';
import { bivalueCells, eliminationsFor } from './util';

/** Najkraći put između dvije ćelije kroz zadani skup (susjedi = ćelije koje se vide). */
function shortestPath(from: CellIndex, to: CellIndex, nodes: readonly CellIndex[]): CellIndex[] | null {
  const prev = new Map<CellIndex, CellIndex>([[from, -1]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of nodes) {
      if (!prev.has(n) && sees(cur, n)) {
        prev.set(n, cur);
        queue.push(n);
      }
    }
  }
  if (!prev.has(to)) return null;
  const path: CellIndex[] = [];
  for (let c = to; c !== -1; c = prev.get(c)!) path.unshift(c);
  return path;
}

/**
 * Remote Pair: lanac ćelija s istim parom {a,b}, svaka vidi sljedeću, pa se
 * vrijednosti izmjenjuju. Krajevi lanca s parnim brojem ćelija imaju suprotne
 * vrijednosti — jedan je a, drugi b — pa ćelija koja vidi oba kraja ne može biti ni a ni b.
 */
export const remotePair: Technique = {
  id: 'remotePair',
  name: 'Remote Pair',
  difficulty: 'ekspert',
  find(s) {
    const biv = bivalueCells(s);
    const groups = new Map<number, CellIndex[]>();
    for (const c of biv) groups.set(s.candidates[c], [...(groups.get(s.candidates[c]) ?? []), c]);

    let best: Step | null = null;
    for (const [mask, cells] of groups) {
      if (cells.length < 4) continue;
      const digits = digitsOf(mask) as [Digit, Digit];
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const path = shortestPath(cells[i], cells[j], cells);
          // Paran broj ćelija (>= 4) => krajevi su suprotni. (2 ćelije su goli par.)
          if (!path || path.length < 4 || path.length % 2 !== 0) continue;
          if (best && path.length >= (best.explanation as { chain: CellIndex[] }).chain.length) continue;
          const targets: CellIndex[] = [];
          for (let c = 0; c < 81; c++) {
            if (!s.values[c] && !path.includes(c) && sees(c, path[0]) && sees(c, path[path.length - 1])) targets.push(c);
          }
          const eliminations: CandidateRef[] = eliminationsFor(s, targets, digits);
          if (eliminations.length === 0) continue;
          best = {
            technique: 'remotePair',
            eliminations,
            pattern: path.map((cell, k) => ({ cell, role: k % 2 === 0 ? 'colorA' : 'colorB', digits })),
            focus: { units: [], cells: [path[0], path[path.length - 1]] },
            explanation: { kind: 'remotePair', digits, chain: path },
          };
        }
      }
    }
    return best;
  },
};
