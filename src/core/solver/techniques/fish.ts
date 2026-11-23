import { COLS, ROWS } from '../../grid';
import { DIGITS } from '../../mask';
import type { CellIndex, Technique, TechniqueId, Unit } from '../../types';
import { cellsWithCandidate, combinations, eliminationsFor, unitHasValue } from './util';

/**
 * "Riba": u `size` redova znamenka se može naći samo u istih `size` stupaca.
 * Svaki od tih redova mora imati znamenku u jednom od tih stupaca, pa u tim
 * stupcima znamenka ne može biti ni u jednom drugom redu. (Isto i obratno.)
 */
function makeFish(size: 2 | 3, id: TechniqueId, name: string, difficulty: Technique['difficulty']): Technique {
  return {
    id,
    name,
    difficulty,
    find(s) {
      for (const digit of DIGITS) {
        for (const [bases, covers, pos] of [
          [ROWS, COLS, (c: CellIndex) => c % 9],
          [COLS, ROWS, (c: CellIndex) => Math.floor(c / 9)],
        ] as const) {
          const candidatesBases: { unit: Unit; cells: CellIndex[] }[] = [];
          for (const unit of bases) {
            if (unitHasValue(s, unit, digit)) continue;
            const cells = cellsWithCandidate(s, unit, digit);
            if (cells.length >= 2 && cells.length <= size) candidatesBases.push({ unit, cells });
          }
          for (const combo of combinations(candidatesBases, size)) {
            const coverIdx = new Set<number>();
            for (const b of combo) for (const c of b.cells) coverIdx.add(pos(c));
            if (coverIdx.size !== size) continue;
            const coverUnits = [...coverIdx].sort((a, b) => a - b).map((i) => covers[i]);
            const baseCells = combo.flatMap((b) => b.cells);
            const targets = coverUnits.flatMap((u) => u.cells.filter((c) => !baseCells.includes(c)));
            const eliminations = eliminationsFor(s, targets, [digit]);
            if (eliminations.length === 0) continue;
            const baseUnits = combo.map((b) => b.unit);
            return {
              technique: id,
              eliminations,
              pattern: baseCells.map((cell) => ({ cell, role: 'base' as const, digits: [digit] })),
              focus: { units: baseUnits, cells: [], digit },
              explanation: { kind: 'fish', size, digit, baseUnits, coverUnits, cells: baseCells },
            };
          }
        }
      }
      return null;
    },
  };
}

export const xWing = makeFish(2, 'xWing', 'X-Wing', 'tesko');
export const swordfish = makeFish(3, 'swordfish', 'Swordfish', 'ekspert');
