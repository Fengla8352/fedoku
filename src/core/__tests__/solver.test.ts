import { describe, expect, it } from 'vitest';
import { applyStep, createState } from '../candidates';
import { parseValues, valuesToString } from '../grid';
import { bit } from '../mask';
import { checkUniqueness } from '../solver/backtrack';
import { findNextStep, solveLogically } from '../solver/stepSolver';
import { TECHNIQUES } from '../solver/techniques';
import type { Step, TechniqueId } from '../types';
import { randomPuzzle } from './helpers';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
// Poznata "teška" zagonetka (teška za pretraživanje, ali je osnovne tehnike rješavaju).
const BRUTE_HARD = '4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......';
// Zagonetka za koju nijedna implementirana tehnika nije dovoljna.
const STUCK = '6..23.4....89....3......62.5.....3.2.69..7...3...8..9....4....5.1..........85.9.4';

/** Provjerava da korak ne proturječi poznatom rješenju. */
function expectSound(step: Step, solution: number[]) {
  if (step.placement) expect(solution[step.placement.cell]).toBe(step.placement.digit);
  for (const e of step.eliminations) expect(solution[e.cell]).not.toBe(e.digit);
}

describe('rješavač korak po korak', () => {
  it('rješava laku zagonetku samo singleovima', () => {
    const r = solveLogically(parseValues(EASY));
    expect(r.solved).toBe(true);
    expect(['nakedSingle', 'hiddenSingle']).toContain(r.hardest);
    const sol = checkUniqueness(parseValues(EASY));
    if (sol.status !== 'unique') throw new Error();
    expect(valuesToString(r.state.values)).toBe(valuesToString(sol.solution));
  });

  it('uvijek bira najjednostavniju tehniku', () => {
    const state = createState(parseValues(EASY));
    const step = findNextStep(state)!;
    const idx = TECHNIQUES.findIndex((t) => t.id === step.technique);
    for (const t of TECHNIQUES.slice(0, idx)) expect(t.find(state)).toBeNull();
  });

  it('rješava zagonetku koja je teška samo za pretraživanje', () => {
    const r = solveLogically(parseValues(BRUTE_HARD));
    expect(r.solved).toBe(true);
    expect(r.hardest).toBe('pointing');
  });

  it('kod preteške zagonetke stane bez krivih koraka', () => {
    const v = parseValues(STUCK);
    const r = solveLogically(v);
    expect(r.solved).toBe(false);
    const sol = checkUniqueness(v);
    if (sol.status !== 'unique') throw new Error();
    expect(r.steps.length).toBeGreaterThan(0);
    r.steps.forEach((s) => expectSound(s, sol.solution));
  });

  it('nikad ne briše točan kandidat niti upisuje krivi broj (150 nasumičnih zagonetki)', () => {
    const used = new Map<TechniqueId, number>();
    let solvedCount = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const { puzzle, solution } = randomPuzzle(seed);
      let state = createState(puzzle);
      for (let n = 0; n < 500; n++) {
        const step = findNextStep(state);
        if (!step) break;
        expectSound(step, solution);
        // Eliminacije se smiju odnositi samo na postojeće kandidate.
        for (const e of step.eliminations) expect(state.candidates[e.cell] & bit(e.digit)).not.toBe(0);
        used.set(step.technique, (used.get(step.technique) ?? 0) + 1);
        state = applyStep(state, step);
      }
      // Točan broj je uvijek među kandidatima.
      for (let i = 0; i < 81; i++) {
        if (!state.values[i]) expect(state.candidates[i] & bit(solution[i])).not.toBe(0);
      }
      if (state.values.every((v) => v)) solvedCount++;
    }
    expect(solvedCount).toBeGreaterThan(0);
    for (const id of ['nakedSingle', 'hiddenSingle', 'pointing', 'boxLine', 'nakedPair', 'xyWing', 'xyChain'] as const) {
      expect(used.get(id) ?? 0).toBeGreaterThan(0);
    }
  }, 60_000);
});
