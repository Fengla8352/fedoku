import { describe, expect, it } from 'vitest';
import { applyStep, computeCandidates, createState, placeDigit } from '../candidates';
import { parseValues } from '../grid';
import { ALL_DIGITS, digitsOf, maskOf } from '../mask';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';

describe('kandidati', () => {
  it('prazna mreža ima sve kandidate', () => {
    expect(computeCandidates(new Array(81).fill(0)).every((m) => m === ALL_DIGITS)).toBe(true);
  });

  it('isključuje brojeve iz reda, stupca i kvadrata', () => {
    const c = computeCandidates(parseValues(EASY));
    // r1c1: red 1 ima 3,2,6; stupac 1 ima 9,7,8; kvadrat 1 ima 3,9,1
    expect(digitsOf(c[0])).toEqual([4, 5]);
    expect(c[2]).toBe(0); // popunjena ćelija
  });

  it('createState s ograničenjem nikad ne dodaje nemoguć kandidat', () => {
    const v = parseValues(EASY);
    const restrict = new Array(81).fill(ALL_DIGITS);
    restrict[0] = maskOf([4, 9]);
    const s = createState(v, restrict);
    expect(digitsOf(s.candidates[0])).toEqual([4]);
  });

  it('placeDigit briše znamenku iz susjeda', () => {
    const s = createState(new Array(81).fill(0));
    placeDigit(s, { cell: 0, digit: 5 });
    expect(s.values[0]).toBe(5);
    expect(digitsOf(s.candidates[8])).not.toContain(5);
    expect(digitsOf(s.candidates[72])).not.toContain(5);
    expect(digitsOf(s.candidates[10])).not.toContain(5);
    expect(digitsOf(s.candidates[40])).toContain(5);
  });

  it('applyStep ne mijenja izvorno stanje', () => {
    const s = createState(new Array(81).fill(0));
    const next = applyStep(s, {
      technique: 'pointing',
      eliminations: [{ cell: 3, digit: 1 }],
      pattern: [],
      focus: { units: [], cells: [] },
      explanation: { kind: 'nakedSingle', cell: 0, digit: 1 },
    });
    expect(digitsOf(next.candidates[3])).not.toContain(1);
    expect(s.candidates[3]).toBe(ALL_DIGITS);
  });
});
