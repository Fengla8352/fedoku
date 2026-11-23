import { describe, expect, it } from 'vitest';
import { COLS, ROWS, cellAt } from '../grid';
import { checkUniqueness } from '../solver/backtrack';
import { solveLogically } from '../solver/stepSolver';
import {
  remotePair, simpleColoring, skyscraper, swordfish, wWing, xWing, xyChain, xyWing, xyzWing,
} from '../solver/techniques';
import { parseValues } from '../grid';
import type { CandidateRef } from '../types';
import { FIXTURES } from './fixtures';
import { blankState, removeExcept, setCands } from './helpers';

const sorted = (e: CandidateRef[]) => [...e].sort((a, b) => a.cell - b.cell || a.digit - b.digit);
const rc = (r: number, c: number) => cellAt(r, c);

describe('X-Wing', () => {
  it('dva reda s istim parom stupaca brišu znamenku iz tih stupaca', () => {
    const s = blankState();
    removeExcept(s, ROWS[1].cells, 4, [rc(1, 2), rc(1, 6)]);
    removeExcept(s, ROWS[5].cells, 4, [rc(5, 2), rc(5, 6)]);
    const step = xWing.find(s)!;
    expect(step.explanation).toMatchObject({
      kind: 'fish', size: 2, digit: 4,
      baseUnits: [{ type: 'row', index: 1 }, { type: 'row', index: 5 }],
      coverUnits: [{ type: 'col', index: 2 }, { type: 'col', index: 6 }],
    });
    expect(step.eliminations).toHaveLength(14);
    expect(step.eliminations.every((e) => e.digit === 4 && [2, 6].includes(e.cell % 9))).toBe(true);
    expect(step.focus.digit).toBe(4);
  });
});

describe('Swordfish', () => {
  it('tri reda u tri stupca (bez punog 3x3 uzorka)', () => {
    const s = blankState();
    removeExcept(s, ROWS[0].cells, 7, [rc(0, 1), rc(0, 4)]);
    removeExcept(s, ROWS[4].cells, 7, [rc(4, 4), rc(4, 7)]);
    removeExcept(s, ROWS[8].cells, 7, [rc(8, 1), rc(8, 7)]);
    expect(xWing.find(s)).toBeNull();
    const step = swordfish.find(s)!;
    expect(step.explanation).toMatchObject({ size: 3, coverUnits: [{ index: 1 }, { index: 4 }, { index: 7 }] });
    expect(step.eliminations).toHaveLength(18);
  });
});

describe('XY-Wing', () => {
  it('središte {1,2}, krakovi {1,3} i {2,3} brišu 3', () => {
    const s = blankState();
    setCands(s, rc(0, 0), [1, 2]);
    setCands(s, rc(0, 5), [1, 3]);
    setCands(s, rc(5, 0), [2, 3]);
    const step = xyWing.find(s)!;
    expect(step.explanation).toEqual({ kind: 'xyWing', pivot: 0, pincers: [rc(0, 5), rc(5, 0)], x: 1, y: 2, z: 3 });
    expect(step.eliminations).toEqual([{ cell: rc(5, 5), digit: 3 }]);
    expect(step.pattern.map((p) => p.role)).toEqual(['pivot', 'pincer', 'pincer']);
  });
});

describe('XYZ-Wing', () => {
  it('središte {1,2,3}, krakovi {1,3} i {2,3} brišu 3 iz ćelija koje vide sve tri', () => {
    const s = blankState();
    setCands(s, rc(0, 0), [1, 2, 3]);
    setCands(s, rc(0, 4), [1, 3]);
    setCands(s, rc(1, 1), [2, 3]);
    expect(xyWing.find(s)).toBeNull();
    const step = xyzWing.find(s)!;
    expect(step.explanation).toMatchObject({ kind: 'xyzWing', pivot: 0, z: 3 });
    expect(sorted(step.eliminations)).toEqual([{ cell: 1, digit: 3 }, { cell: 2, digit: 3 }]);
  });
});

describe('Remote Pair', () => {
  it('lanac od 4 ćelije {4,8}: ćelije koje vide oba kraja gube 4 i 8', () => {
    const s = blankState();
    for (const c of [rc(0, 0), rc(0, 4), rc(4, 4), rc(4, 8)]) setCands(s, c, [4, 8]);
    const step = remotePair.find(s)!;
    expect(step.explanation).toEqual({ kind: 'remotePair', digits: [4, 8], chain: [0, 4, 40, 44] });
    expect(sorted(step.eliminations)).toEqual([
      { cell: rc(0, 8), digit: 4 }, { cell: rc(0, 8), digit: 8 },
      { cell: rc(4, 0), digit: 4 }, { cell: rc(4, 0), digit: 8 },
    ]);
    expect(step.pattern.map((p) => p.role)).toEqual(['colorA', 'colorB', 'colorA', 'colorB']);
  });
});

describe('W-Wing', () => {
  it('dvije ćelije {5,9} povezane jakom vezom na 9 brišu 5', () => {
    const s = blankState();
    setCands(s, rc(0, 0), [5, 9]);
    setCands(s, rc(4, 8), [5, 9]);
    removeExcept(s, COLS[6].cells, 9, [rc(0, 6), rc(4, 6)]);
    const step = wWing.find(s)!;
    expect(step.explanation).toMatchObject({
      kind: 'wWing', cells: [0, rc(4, 8)], x: 9, y: 5, link: [rc(0, 6), rc(4, 6)], linkUnit: { type: 'col', index: 6 },
    });
    expect(sorted(step.eliminations)).toEqual([{ cell: rc(0, 8), digit: 5 }, { cell: rc(4, 0), digit: 5 }]);
  });
});

describe('Skyscraper', () => {
  it('dva reda s poravnatim temeljima u stupcu 2', () => {
    const s = blankState();
    removeExcept(s, ROWS[1].cells, 3, [rc(1, 1), rc(1, 4)]);
    removeExcept(s, ROWS[6].cells, 3, [rc(6, 1), rc(6, 5)]);
    expect(xWing.find(s)).toBeNull();
    const step = skyscraper.find(s)!;
    expect(step.explanation).toMatchObject({ digit: 3, base: [rc(1, 1), rc(6, 1)], tops: [rc(1, 4), rc(6, 5)] });
    expect(sorted(step.eliminations)).toEqual(
      [rc(0, 5), rc(2, 5), rc(7, 4), rc(8, 4)].map((cell) => ({ cell, digit: 3 })),
    );
  });
});

describe('XY-Chain', () => {
  it('lanac {1,2}-{2,3}-{3,4}-{4,1}: jedan kraj je 1', () => {
    const s = blankState();
    setCands(s, rc(0, 0), [1, 2]);
    setCands(s, rc(0, 4), [2, 3]);
    setCands(s, rc(4, 4), [3, 4]);
    setCands(s, rc(4, 8), [1, 4]);
    expect(xyWing.find(s)).toBeNull();
    expect(remotePair.find(s)).toBeNull();
    const step = xyChain.find(s)!;
    expect(step.explanation).toEqual({
      kind: 'xyChain', z: 1,
      chain: [{ cell: 0, value: 2 }, { cell: 4, value: 3 }, { cell: 40, value: 4 }, { cell: 44, value: 1 }],
    });
    expect(sorted(step.eliminations)).toEqual([{ cell: rc(0, 8), digit: 1 }, { cell: rc(4, 0), digit: 1 }]);
  });
});

describe('Simple Coloring', () => {
  it('trap: ćelija vidi obje boje', () => {
    const s = blankState();
    removeExcept(s, ROWS[0].cells, 6, [rc(0, 0), rc(0, 4)]);
    removeExcept(s, COLS[4].cells, 6, [rc(0, 4), rc(5, 4)]);
    removeExcept(s, ROWS[5].cells, 6, [rc(5, 1), rc(5, 4)]);
    const step = simpleColoring.find(s)!;
    expect(step.explanation).toMatchObject({ rule: 'trap', digit: 6, colorA: [0, rc(5, 4)], colorB: [4, rc(5, 1)] });
    expect(sorted(step.eliminations)).toEqual(
      [rc(1, 1), rc(2, 1), rc(3, 0), rc(4, 0)].map((cell) => ({ cell, digit: 6 })),
    );
  });
  it('wrap: dvije ćelije iste boje se vide, ta boja otpada', () => {
    const s = blankState();
    removeExcept(s, ROWS[0].cells, 6, [rc(0, 0), rc(0, 4)]);
    removeExcept(s, COLS[4].cells, 6, [rc(0, 4), rc(3, 4)]);
    removeExcept(s, ROWS[3].cells, 6, [rc(3, 4), rc(3, 1)]);
    removeExcept(s, COLS[1].cells, 6, [rc(3, 1), rc(1, 1)]);
    const step = simpleColoring.find(s)!;
    expect(step.explanation).toMatchObject({ rule: 'wrap', clash: [0, rc(1, 1)] });
    expect(sorted(step.eliminations)).toEqual([0, rc(1, 1), rc(3, 4)].map((cell) => ({ cell, digit: 6 })));
  });
});

describe('poznate zagonetke', () => {
  for (const f of FIXTURES) {
    it(`${f.technique}: ${f.hardest ? 'najteža potrebna tehnika' : 'koristi se'}`, () => {
      const values = parseValues(f.puzzle);
      const u = checkUniqueness(values);
      expect(u.status).toBe('unique');
      if (u.status !== 'unique') return;
      const r = solveLogically(values);
      expect(r.solved).toBe(true);
      if (f.hardest) expect(r.hardest).toBe(f.technique);
      expect(r.steps.some((s) => s.technique === f.technique)).toBe(true);
      for (const step of r.steps) {
        if (step.placement) expect(u.solution[step.placement.cell]).toBe(step.placement.digit);
        for (const e of step.eliminations) expect(u.solution[e.cell]).not.toBe(e.digit);
      }
    });
  }
});
