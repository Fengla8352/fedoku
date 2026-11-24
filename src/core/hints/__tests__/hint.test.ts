import { describe, expect, it } from 'vitest';
import { applyStep, createState } from '../../candidates';
import { parseValues } from '../../grid';
import { bit, maskOf } from '../../mask';
import { checkUniqueness } from '../../solver/backtrack';
import { findNextStep } from '../../solver/stepSolver';
import { FIXTURES } from '../../__tests__/fixtures';
import { blankState, setCands } from '../../__tests__/helpers';
import { xyWing } from '../../solver/techniques';
import { explainStep } from '../explain';
import { findHint } from '../hint';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
const values = parseValues(EASY);
const givens = values.map((v) => v !== 0);
const solution = (checkUniqueness(values) as { solution: number[] }).solution;

describe('findHint', () => {
  it('krivi upisani broj se javlja prije poteza', () => {
    const v = [...values];
    v[0] = solution[0] === 4 ? 5 : 4;
    const h = findHint({ values: v, givens, solution });
    expect(h.kind).toBe('wrongValue');
    if (h.kind !== 'wrongValue') return;
    expect(h.cells).toEqual([0]);
    expect(h.text).toBe('Broj u ćeliji (red 1, stupac 1) nije točan.');
  });

  it('bez grešaka daje najjednostavniji korak iz same mreže', () => {
    const h = findHint({ values, givens, solution });
    expect(h.kind).toBe('step');
    if (h.kind !== 'step') return;
    expect(h.step).toEqual(findNextStep(createState(values)));
  });

  it('razina 1 navodi tehniku, opis i mjesto', () => {
    const h = findHint({ values, givens, solution });
    if (h.kind !== 'step') throw new Error(h.kind);
    expect(h.text.techniqueName.length).toBeGreaterThan(3);
    expect(h.text.description.length).toBeGreaterThan(30);
    expect(h.text.level1).toMatch(/Pogledaj/);
  });

  it('koristi dokazana brisanja (knownElim)', () => {
    const knownElim = new Array(81).fill(0);
    knownElim[0] = bit(5); // r1c1 {4,5} → ostaje samo 4
    const h = findHint({ values, givens, solution, knownElim });
    expect(h.kind === 'step' && h.step.placement).toEqual({ cell: 0, digit: 4 });
  });

  it('tvoja točna brisanja se koriste, a pogrešna (točan broj) zanemaruju', () => {
    const good = new Array(81).fill(0);
    good[0] = bit(5); // točno je 4 → brisanje 5 je točno
    expect(findHint({ values, givens, solution, userElim: good })).toMatchObject({ step: { placement: { cell: 0, digit: 4 } } });
    const bad = new Array(81).fill(0);
    bad[0] = bit(4); // brisanje točnog broja → zanemaruje se
    const h = findHint({ values, givens, solution, userElim: bad });
    expect(h.kind === 'step' && h.candidates[0]).toBe(maskOf([4, 5]));
  });

  it('prepoznaje riješenu mrežu', () => {
    expect(findHint({ values: solution, givens, solution }).kind).toBe('solved');
  });
});

describe('tekst objašnjenja', () => {
  it('XY-Wing objašnjava korak po korak', () => {
    const s = blankState();
    setCands(s, 0, [1, 2]);
    setCands(s, 5, [1, 3]);
    setCands(s, 45, [2, 3]);
    const t = explainStep(xyWing.find(s)!, s);
    expect(t.techniqueName).toBe('XY-Wing');
    expect(t.level1).not.toContain('XY');
    expect(t.level2).toMatch(/^Središte \(red 1, stupac 1\)/);
    expect(t.steps).toContain('Ako je središte 1, onda krak (red 1, stupac 6) (vidi središte) nije 1, pa je 3.');
    expect(t.result).toBe('Obriši 3 iz (red 6, stupac 6).');
    expect(t.roles).toEqual({ pivot: 'središte', pincer: 'krak' });
  });

  it('goli single navodi zašto ostali brojevi otpadaju', () => {
    const st = createState(values);
    const step = findNextStep(st)!;
    const t = explainStep(step, st);
    expect(t.result).toMatch(/^Upiši \d u ćeliju \(red \d, stupac \d\)\.$/);
    expect(t.steps.length).toBeGreaterThan(1);
  });

  it('svaki korak u svim primjer-zagonetkama ima ispravan tekst', () => {
    const seen = new Set<string>();
    for (const f of FIXTURES) {
      let st = createState(parseValues(f.puzzle));
      for (let n = 0; n < 300; n++) {
        const step = findNextStep(st);
        if (!step) break;
        const t = explainStep(step, st);
        seen.add(step.technique);
        const all = [t.level1, t.level2, t.result, ...t.steps, ...Object.values(t.roles)].join('\n');
        expect(all).not.toMatch(/undefined|NaN|\[object|null/);
        expect(t.level1.length).toBeGreaterThan(10);
        expect(t.level1).not.toContain(t.techniqueName);
        expect(t.steps.length).toBeGreaterThan(0);
        st = applyStep(st, step);
      }
    }
    expect(seen.size).toBe(17);
  });
});


it('opis uzorka (razina 2) ne ponavlja ime tehnike', () => {
  for (const f of FIXTURES) {
    let st = createState(parseValues(f.puzzle));
    for (let n = 0; n < 300; n++) {
      const step = findNextStep(st);
      if (!step) break;
      const t = explainStep(step, st);
      expect(t.level2.startsWith(t.techniqueName)).toBe(false);
      expect(t.level2[0]).toBe(t.level2[0].toUpperCase());
      st = applyStep(st, step);
    }
  }
});
