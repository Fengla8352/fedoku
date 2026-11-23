import { describe, expect, it } from 'vitest';
import {
  ALL_UNITS, BOXES, PEERS, ParseError, boxOf, cellAt, commonPeers, findConflicts,
  parsePuzzle, parseValues, sees, valuesToString,
} from '../grid';
import { cellName, unitName } from '../format';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';

describe('geometrija mreže', () => {
  it('ima 27 jedinica po 9 ćelija i svaka ćelija je u točno 3 jedinice', () => {
    expect(ALL_UNITS).toHaveLength(27);
    for (const u of ALL_UNITS) expect(new Set(u.cells).size).toBe(9);
    for (let i = 0; i < 81; i++) expect(ALL_UNITS.filter((u) => u.cells.includes(i))).toHaveLength(3);
  });

  it('svaka ćelija ima 20 susjeda', () => {
    for (const p of PEERS) expect(p).toHaveLength(20);
  });

  it('kvadrati su ispravno složeni', () => {
    expect(BOXES[4].cells).toEqual([30, 31, 32, 39, 40, 41, 48, 49, 50]);
    expect(boxOf(cellAt(8, 8))).toBe(8);
    expect(boxOf(cellAt(3, 5))).toBe(4);
  });

  it('sees i commonPeers', () => {
    expect(sees(0, 8)).toBe(true);
    expect(sees(0, 80)).toBe(false);
    expect(sees(0, 0)).toBe(false);
    // r1c1 i r1c9 zajedno vide ostatak reda 1
    expect(commonPeers([0, 8])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('parsiranje', () => {
  it('čita 81 znak s 0 ili . za prazno', () => {
    const a = parseValues(EASY);
    const b = parseValues(EASY.replace(/0/g, '.'));
    expect(a).toEqual(b);
    expect(a[2]).toBe(3);
    expect(a[0]).toBe(0);
    expect(valuesToString(a, '0')).toBe(EASY);
  });

  it('ignorira razmake i okvir', () => {
    const framed = EASY.match(/.{9}/g)!.join('\n | ');
    expect(parseValues(framed)).toEqual(parseValues(EASY));
  });

  it('javlja grešku za krivu duljinu ili znak', () => {
    expect(() => parseValues('123')).toThrow(ParseError);
    expect(() => parseValues('x'.repeat(81))).toThrow(ParseError);
  });

  it('parsePuzzle označava zadane brojeve', () => {
    const p = parsePuzzle(EASY);
    expect(p.givens[2]).toBe(true);
    expect(p.givens[0]).toBe(false);
  });
});

describe('sukobi', () => {
  it('nema sukoba u ispravnoj mreži', () => {
    expect(findConflicts(parseValues(EASY)).size).toBe(0);
  });
  it('pronalazi dvostruki broj u redu', () => {
    const v = parseValues(EASY);
    v[0] = 3; // r1c3 je već 3
    expect([...findConflicts(v)].sort((a, b) => a - b)).toEqual([0, 2]);
  });
});

describe('format', () => {
  it('koordinate kao "red X, stupac Y"', () => {
    expect(cellName(cellAt(2, 4))).toBe('red 3, stupac 5');
    expect(unitName(BOXES[6])).toBe('kvadrat 7');
  });
});
