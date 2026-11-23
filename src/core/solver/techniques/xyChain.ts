import { sees } from '../../grid';
import { bit, digitsOf } from '../../mask';
import type { CellIndex, Digit, Step, Technique } from '../../types';
import { bivalueCells, eliminateSeeingAll, otherDigit } from './util';

const MAX_LENGTH = 12;

interface Node {
  cell: CellIndex;
  /** Vrijednost ćelije ako početak nije z. */
  value: Digit;
  prev: Node | null;
  length: number;
}

function onPath(node: Node | null, cell: CellIndex): boolean {
  for (; node; node = node.prev) if (node.cell === cell) return true;
  return false;
}

/**
 * XY-Chain: lanac ćelija s dva kandidata. Pretpostavimo da početak NIJE z — onda
 * je druga znamenka, pa sljedeća ćelija nije ta znamenka nego svoja druga... Ako
 * time kraj lanca postane z, onda je ili početak ili kraj z, pa se z briše iz
 * ćelija koje vide oba kraja. Traži se najkraći takav lanac.
 */
export const xyChain: Technique = {
  id: 'xyChain',
  name: 'XY-Chain',
  difficulty: 'ekstremno',
  find(s) {
    const biv = bivalueCells(s);
    let best: Step | null = null;
    let bestLen = Infinity;
    for (const start of biv) {
      for (const z of digitsOf(s.candidates[start])) {
        // BFS po stanjima (ćelija, vrijednost).
        const first: Node = { cell: start, value: otherDigit(s.candidates[start], z), prev: null, length: 1 };
        const seen = new Set<number>([start * 10 + first.value]);
        const queue: Node[] = [first];
        while (queue.length) {
          const node = queue.shift()!;
          if (node.length >= MAX_LENGTH || node.length + 1 >= bestLen) continue;
          for (const next of biv) {
            const m = s.candidates[next];
            if (!(m & bit(node.value)) || !sees(node.cell, next) || onPath(node, next)) continue;
            const value = otherDigit(m, node.value);
            const key = next * 10 + value;
            if (seen.has(key)) continue;
            seen.add(key);
            const child: Node = { cell: next, value, prev: node, length: node.length + 1 };
            if (value === z && child.length >= 3) {
              const chainCells: CellIndex[] = [];
              const chain: { cell: CellIndex; value: Digit }[] = [];
              for (let n: Node | null = child; n; n = n.prev) {
                chain.unshift({ cell: n.cell, value: n.value });
                chainCells.unshift(n.cell);
              }
              const eliminations = eliminateSeeingAll(s, [start, next], z, chainCells);
              if (eliminations.length > 0) {
                bestLen = child.length;
                best = {
                  technique: 'xyChain',
                  eliminations,
                  pattern: chain.map(({ cell }, k) => ({
                    cell,
                    role: k === 0 || k === chain.length - 1 ? 'pincer' : 'link',
                    digits: digitsOf(s.candidates[cell]),
                  })),
                  focus: { units: [], cells: [start, next] },
                  explanation: { kind: 'xyChain', z, chain },
                };
                continue;
              }
            }
            queue.push(child);
          }
        }
      }
    }
    return best;
  },
};
