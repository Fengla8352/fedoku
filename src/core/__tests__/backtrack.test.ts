import { describe, expect, it } from 'vitest';
import { parseValues, valuesToString } from '../grid';
import { checkUniqueness, countSolutions } from '../solver/backtrack';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
const EASY_SOLUTION = '483921657967345821251876493548132976729564138136798245372689514814253769695417382';
// Poznata vrlo teška zagonetka (traži pretraživanje).
const HARD = '4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......';

describe('provjera jedinstvenosti', () => {
  it('pronalazi jedinstveno rješenje', () => {
    const r = checkUniqueness(parseValues(EASY));
    expect(r.status).toBe('unique');
    if (r.status === 'unique') expect(valuesToString(r.solution, '0')).toBe(EASY_SOLUTION);
  });

  it('rješava i vrlo tešku zagonetku', () => {
    expect(checkUniqueness(parseValues(HARD)).status).toBe('unique');
  });

  it('prepoznaje više rješenja', () => {
    expect(countSolutions(new Array(81).fill(0))).toBe(2);
    expect(checkUniqueness(new Array(81).fill(0)).status).toBe('multiple');
  });

  it('prepoznaje da nema rješenja (sukob ili slijepa ulica)', () => {
    const v = parseValues(EASY);
    v[0] = 3; // sukob u redu
    expect(checkUniqueness(v).status).toBe('none');
    // bez izravnog sukoba, ali krivi broj: r1c1 mora biti 4, upišemo 5
    const w = parseValues(EASY);
    w[0] = 5;
    expect(checkUniqueness(w).status).toBe('none');
  });
});
