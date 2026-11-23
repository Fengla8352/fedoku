import { describe, expect, it } from 'vitest';
import { findConflicts } from '../../grid';
import { checkUniqueness } from '../../solver/backtrack';
import { generatePuzzle, randomSolvedGrid } from '../generate';
import { DIFFICULTIES, gradePuzzle } from '../grade';
import { createRng } from '../rng';
import { parseValues } from '../../grid';
import { FIXTURES } from '../../__tests__/fixtures';

describe('riješena mreža', () => {
  it('je ispravna i ovisi o seedu', () => {
    const a = randomSolvedGrid(createRng(1));
    const b = randomSolvedGrid(createRng(2));
    expect(a.every((v) => v >= 1 && v <= 9)).toBe(true);
    expect(findConflicts(a).size).toBe(0);
    expect(a).not.toEqual(b);
    expect(randomSolvedGrid(createRng(1))).toEqual(a);
  });
});

describe('ocjena težine', () => {
  it('prema najtežoj tehnici, ne prema broju zadanih', () => {
    const g = gradePuzzle(parseValues(FIXTURES.find((f) => f.technique === 'wWing')!.puzzle));
    expect(g).toMatchObject({ solvable: true, difficulty: 'ekspert', hardest: 'wWing' });
    const easy = gradePuzzle(parseValues(FIXTURES.find((f) => f.technique === 'hiddenSingle')!.puzzle));
    expect(easy).toMatchObject({ difficulty: 'lako' });
  });
  it('preteška zagonetka nije ocijenjena', () => {
    const stuck = '6..23.4....89....3......62.5.....3.2.69..7...3...8..9....4....5.1..........85.9.4';
    expect(gradePuzzle(parseValues(stuck)).solvable).toBe(false);
  });
});

describe('generator', () => {
  for (const d of DIFFICULTIES) {
    it(`${d}: jedinstveno rješenje i točno ta težina`, () => {
      for (let seed = 1; seed <= 3; seed++) {
        const r = generatePuzzle(d, seed);
        expect(r.difficulty).toBe(d);
        const u = checkUniqueness(r.puzzle);
        expect(u.status).toBe('unique');
        if (u.status === 'unique') expect(u.solution).toEqual(r.solution);
        expect(r.puzzle.every((v, i) => v === 0 || v === r.solution[i])).toBe(true);
        expect(gradePuzzle(r.puzzle)).toMatchObject({ solvable: true, difficulty: d, hardest: r.hardest });
        // simetrija za 180°
        expect(r.puzzle.every((v, i) => !!v === !!r.puzzle[80 - i])).toBe(true);
        expect(r.givens).toBe(r.puzzle.filter((v) => v).length);
      }
    }, 30_000);
  }

  it('isti seed daje istu zagonetku', () => {
    expect(generatePuzzle('srednje', 42).puzzle).toEqual(generatePuzzle('srednje', 42).puzzle);
    expect(generatePuzzle('srednje', 42).puzzle).not.toEqual(generatePuzzle('srednje', 43).puzzle);
  });

  it('javlja napredak i odustaje nakon maxAttempts', () => {
    const seen: number[] = [];
    expect(() => generatePuzzle('ekstremno', 7, { maxAttempts: 1, onAttempt: (n) => seen.push(n) })).toThrow();
    expect(seen).toEqual([1]);
  });
});
