import { describe, expect, it } from 'vitest';
import { parseValues } from '../../core/grid';
import { checkUniqueness } from '../../core/solver/backtrack';
import { boardWave, completedUnits, newlyPlaced, unitWave, UNIT_STEP_MS } from '../completion';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
const puzzle = parseValues(EASY);
const solution = (checkUniqueness(puzzle) as { solution: number[] }).solution;

describe('dovršene jedinice', () => {
  it('red se dovrši zadnjim točnim brojem', () => {
    const v = [...puzzle];
    for (let c = 1; c < 9; c++) v[c] = solution[c]; // red 1 bez prve ćelije
    expect(completedUnits(v, solution, 1).map((u) => u.type)).not.toContain('row');
    v[0] = solution[0];
    expect(completedUnits(v, solution, 0).map((u) => `${u.type}${u.index}`)).toEqual(['row0']);
  });

  it('jedan broj može dovršiti red, stupac i kvadrat odjednom', () => {
    const v = [...solution];
    v[40] = 0;
    const before = [...v];
    v[40] = solution[40];
    expect(newlyPlaced(before, v)).toBe(40);
    expect(completedUnits(v, solution, 40).map((u) => u.type)).toEqual(['row', 'col', 'box']);
  });

  it('kriv broj ne pokreće animaciju (ne otkriva grešku)', () => {
    const v = [...solution];
    v[0] = solution[0] === 1 ? 2 : 1;
    expect(completedUnits(v, solution, 0)).toEqual([]);
  });
});

describe('val', () => {
  it('kreće od upisane ćelije', () => {
    const v = [...solution];
    const units = completedUnits(v, solution, 4);
    const d = unitWave(units, 4);
    expect(d.get(4)).toBe(0);
    expect(d.get(0)).toBe(4 * UNIT_STEP_MS);
    expect(d.get(8)).toBe(4 * UNIT_STEP_MS);
  });
  it('cijela mreža: dijagonalno od kuta', () => {
    const d = boardWave();
    expect(d.size).toBe(81);
    expect(d.get(0)).toBe(0);
    expect(d.get(80)! > d.get(40)!).toBe(true);
  });
});

describe('newlyPlaced', () => {
  it('prepoznaje samo jedan novi upis', () => {
    const a = new Array(81).fill(0);
    const b = [...a];
    b[5] = 3;
    expect(newlyPlaced(a, b)).toBe(5);
    expect(newlyPlaced(b, a)).toBeNull(); // brisanje / Poništi
    const c = [...b];
    c[6] = 4;
    expect(newlyPlaced(a, c)).toBeNull(); // nova igra / učitavanje
    expect(newlyPlaced(a, a)).toBeNull();
  });
});
