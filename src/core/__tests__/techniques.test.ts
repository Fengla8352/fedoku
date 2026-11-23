import { describe, expect, it } from 'vitest';
import { BOXES, ROWS, cellAt } from '../grid';
import {
  boxLine, hiddenPair, hiddenSingle, hiddenTriple, nakedPair, nakedSingle, nakedTriple, pointing,
} from '../solver/techniques';
import type { CandidateRef } from '../types';
import { blankState, removeExcept, setCands } from './helpers';

const sortElims = (e: CandidateRef[]) =>
  [...e].sort((a, b) => a.cell - b.cell || a.digit - b.digit);

describe('goli single', () => {
  it('upisuje jedini kandidat', () => {
    const s = blankState();
    setCands(s, 10, [4]);
    const step = nakedSingle.find(s)!;
    expect(step.placement).toEqual({ cell: 10, digit: 4 });
    expect(step.pattern).toEqual([{ cell: 10, role: 'target', digits: [4] }]);
    expect(step.focus.cells).toEqual([10]);
  });
  it('ne nalazi ništa u praznoj mreži', () => {
    expect(nakedSingle.find(blankState())).toBeNull();
  });
});

describe('skriveni single', () => {
  it('u kvadratu', () => {
    const s = blankState();
    removeExcept(s, BOXES[0].cells, 7, [20]);
    const step = hiddenSingle.find(s)!;
    expect(step.placement).toEqual({ cell: 20, digit: 7 });
    expect(step.explanation).toMatchObject({ kind: 'hiddenSingle', unit: { type: 'box', index: 0 } });
    expect(step.focus.units[0].type).toBe('box');
  });
  it('u redu', () => {
    const s = blankState();
    removeExcept(s, ROWS[4].cells, 3, [cellAt(4, 6)]);
    const step = hiddenSingle.find(s)!;
    expect(step.placement).toEqual({ cell: cellAt(4, 6), digit: 3 });
    expect(step.explanation).toMatchObject({ unit: { type: 'row', index: 4 } });
  });
});

describe('pointing', () => {
  it('par u kvadratu briše iz ostatka reda', () => {
    const s = blankState();
    removeExcept(s, BOXES[0].cells, 5, [0, 1]);
    const step = pointing.find(s)!;
    expect(step.technique).toBe('pointing');
    expect(sortElims(step.eliminations)).toEqual([3, 4, 5, 6, 7, 8].map((cell) => ({ cell, digit: 5 })));
    expect(step.pattern.map((p) => p.cell)).toEqual([0, 1]);
    expect(step.explanation).toMatchObject({ box: { type: 'box', index: 0 }, line: { type: 'row', index: 0 } });
  });
  it('trojka u stupcu', () => {
    const s = blankState();
    removeExcept(s, BOXES[8].cells, 2, [cellAt(6, 7), cellAt(7, 7), cellAt(8, 7)]);
    const step = pointing.find(s)!;
    expect(step.explanation).toMatchObject({ line: { type: 'col', index: 7 } });
    expect(step.eliminations).toHaveLength(6);
  });
  it('ne javlja ništa ako nema što brisati', () => {
    const s = blankState();
    removeExcept(s, BOXES[0].cells, 5, [0, 1]);
    removeExcept(s, ROWS[0].cells, 5, [0, 1]);
    expect(pointing.find(s)).toBeNull();
  });
});

describe('box-line redukcija', () => {
  it('znamenka zatvorena u red unutar kvadrata briše se iz ostatka kvadrata', () => {
    const s = blankState();
    removeExcept(s, ROWS[0].cells, 6, [0, 1, 2]);
    expect(pointing.find(s)).toBeNull();
    const step = boxLine.find(s)!;
    expect(sortElims(step.eliminations)).toEqual([9, 10, 11, 18, 19, 20].map((cell) => ({ cell, digit: 6 })));
    expect(step.explanation).toMatchObject({ line: { type: 'row', index: 0 }, box: { index: 0 } });
    expect(step.focus.units[0].type).toBe('row');
  });
});

describe('goli par i trojka', () => {
  it('goli par', () => {
    const s = blankState();
    setCands(s, 0, [2, 7]);
    setCands(s, 1, [2, 7]);
    const step = nakedPair.find(s)!;
    // Kvadrati se provjeravaju prvi, pa se brišu 2 i 7 iz ostatka kvadrata 1.
    expect(step.explanation).toMatchObject({ kind: 'nakedSubset', size: 2, cells: [0, 1], digits: [2, 7] });
    expect(step.explanation).toMatchObject({ unit: { type: 'box', index: 0 } });
    expect(step.eliminations).toHaveLength(14);
    expect(step.eliminations.every((e) => e.cell !== 0 && e.cell !== 1)).toBe(true);
  });
  it('gola trojka (nijedna ćelija nema sva tri kandidata)', () => {
    const s = blankState();
    setCands(s, 0, [1, 2]);
    setCands(s, 4, [2, 3]);
    setCands(s, 8, [1, 3]);
    expect(nakedPair.find(s)).toBeNull();
    const step = nakedTriple.find(s)!;
    expect(step.explanation).toMatchObject({ size: 3, unit: { type: 'row', index: 0 }, cells: [0, 4, 8], digits: [1, 2, 3] });
    expect(step.eliminations).toHaveLength(18);
  });
});

describe('skriveni par i trojka', () => {
  it('skriveni par', () => {
    const s = blankState();
    const row = ROWS[4].cells;
    removeExcept(s, row, 1, [37, 42]);
    removeExcept(s, row, 9, [37, 42]);
    const step = hiddenPair.find(s)!;
    expect(step.explanation).toMatchObject({ kind: 'hiddenSubset', size: 2, cells: [37, 42], digits: [1, 9] });
    expect(step.eliminations).toHaveLength(14);
    expect(step.eliminations.every((e) => e.digit !== 1 && e.digit !== 9)).toBe(true);
    expect(step.pattern.every((p) => p.digits.join() === '1,9')).toBe(true);
  });
  it('skrivena trojka', () => {
    const s = blankState();
    const row = ROWS[4].cells;
    removeExcept(s, row, 1, [36, 40]);
    removeExcept(s, row, 2, [40, 44]);
    removeExcept(s, row, 3, [36, 44]);
    expect(hiddenPair.find(s)).toBeNull();
    const step = hiddenTriple.find(s)!;
    expect(step.explanation).toMatchObject({ size: 3, cells: [36, 40, 44], digits: [1, 2, 3] });
    expect(step.eliminations).toHaveLength(18);
  });
});
