import { describe, expect, it } from 'vitest';
import { applyStep, computeCandidates, createState } from '../../candidates';
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
const noNotes = new Array(81).fill(null);

describe('findHint — greške imaju prednost', () => {
  it('krivi upisani broj se javlja prvi', () => {
    const v = [...values];
    v[0] = solution[0] === 4 ? 5 : 4;
    const notes = [...noNotes];
    notes[1] = bit(9); // i bilješka kojoj nedostaje točan broj
    const h = findHint({ values: v, givens, notes, solution });
    expect(h.kind).toBe('issue');
    if (h.kind !== 'issue') return;
    expect(h.issue).toEqual({ kind: 'wrongValue', cells: [0] });
    expect(h.text).toBe('U ćeliji (red 1, stupac 1) upisan je krivi broj.');
  });

  it('nedostaje kandidat koji je zapravo moguć', () => {
    const notes: (number | null)[] = computeCandidates(values);
    notes[2 * 9 + 4] = null; // ćelija bez bilješki se ne prijavljuje
    const cell = notes.findIndex((m, i) => !values[i] && m);
    notes[cell] = notes[cell]! & ~bit(solution[cell]);
    const h = findHint({ values, givens, notes, solution });
    expect(h.kind).toBe('issue');
    if (h.kind !== 'issue') return;
    expect(h.text).toBe(`U ćeliji (red ${Math.floor(cell / 9) + 1}, stupac ${(cell % 9) + 1}) nedostaje kandidat ${solution[cell]}.`);
  });

  it('ćelija iz koje su obrisani svi kandidati javlja nedostajući kandidat', () => {
    const notes: (number | null)[] = computeCandidates(values);
    notes[0] = 0;
    const h = findHint({ values, givens, notes, solution });
    expect(h.kind === 'issue' && h.text).toBe(`U ćeliji (red 1, stupac 1) nedostaje kandidat ${solution[0]}.`);
  });

  it('kandidat koji nije moguć', () => {
    const notes = computeCandidates(values);
    notes[0] |= bit(3); // 3 je već u (red 1, stupac 3)
    const h = findHint({ values, givens, notes, solution });
    expect(h.kind).toBe('issue');
    if (h.kind !== 'issue') return;
    expect(h.text).toBe('U ćeliji (red 1, stupac 1) kandidat 3 nije moguć — 3 je već u (red 1, stupac 3).');
  });

  it('bez grešaka daje najjednostavniji korak', () => {
    const h = findHint({ values, givens, notes: noNotes, solution });
    expect(h.kind).toBe('step');
    if (h.kind !== 'step') return;
    expect(h.step).toEqual(findNextStep(createState(values)));
    expect(h.text.level1).not.toMatch(/single/i); // razina 1 ne otkriva ime tehnike
  });

  it('koristi stvarne kandidate sužene bilješkama', () => {
    const notes = computeCandidates(values);
    // Ostavimo u ćeliji samo točan broj: to postaje goli single u toj ćeliji.
    const cell = 0;
    notes[cell] = maskOf([solution[cell]]);
    const h = findHint({ values, givens, notes, solution });
    expect(h.kind === 'step' && h.step.placement).toEqual({ cell, digit: solution[cell] });
  });

  it('prepoznaje riješenu mrežu', () => {
    expect(findHint({ values: solution, givens, notes: noNotes, solution }).kind).toBe('solved');
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
    expect(t.level2).toContain('središte (red 1, stupac 1)');
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

describe('djelomične bilješke', () => {
  it('poruka o nedostajućem kandidatu objašnjava zašto', () => {
    const notes: (number | null)[] = computeCandidates(values);
    notes[0] = bit(5); // točno je 4
    const h = findHint({ values, givens, notes, solution });
    if (h.kind !== 'issue') throw new Error(h.kind);
    expect(h.text).toBe('U ćeliji (red 1, stupac 1) nedostaje kandidat 4.');
    expect(h.why).toContain(
      'Broj 4 je ovdje još moguć: 4 se ne nalazi ni u redu 1, ni u stupcu 1, ni u kvadratu 1, a nije ga isključila ni nijedna tehnika.',
    );
    expect(h.why.join(' ')).toMatch(/djelomične/);
  });

  it('ignoreNotes: bilješke se ne provjeravaju ni ne koriste', () => {
    const notes: (number | null)[] = computeCandidates(values);
    notes[0] = bit(5);
    const h = findHint({ values, givens, notes, solution, ignoreNotes: true });
    expect(h.kind).toBe('step');
    expect(h).toMatchObject({ step: findNextStep(createState(values)) });
  });

  it('ignoreNotes i dalje javlja krivi broj', () => {
    const v = [...values];
    v[0] = 5;
    expect(findHint({ values: v, givens, notes: noNotes, solution, ignoreNotes: true }).kind).toBe('issue');
  });

  it('ignoreNotes koristi već primijenjena brisanja (knownElim)', () => {
    const knownElim = new Array(81).fill(0);
    knownElim[0] = bit(5); // r1c1 {4,5} → ostaje samo 4
    const h = findHint({ values, givens, notes: noNotes, solution, ignoreNotes: true, knownElim });
    expect(h.kind === 'step' && h.step.placement).toEqual({ cell: 0, digit: 4 });
  });
});
