import type { CellIndex, Puzzle, Unit, UnitType } from './types';

export const rowOf = (i: CellIndex): number => Math.floor(i / 9);
export const colOf = (i: CellIndex): number => i % 9;
export const boxOf = (i: CellIndex): number =>
  Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
export const cellAt = (row: number, col: number): CellIndex => row * 9 + col;

function makeUnit(type: UnitType, index: number): Unit {
  const cells: CellIndex[] = [];
  for (let k = 0; k < 9; k++) {
    if (type === 'row') cells.push(cellAt(index, k));
    else if (type === 'col') cells.push(cellAt(k, index));
    else {
      const r0 = Math.floor(index / 3) * 3;
      const c0 = (index % 3) * 3;
      cells.push(cellAt(r0 + Math.floor(k / 3), c0 + (k % 3)));
    }
  }
  return Object.freeze({ type, index, cells: Object.freeze(cells) });
}

const range9 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export const ROWS: readonly Unit[] = range9.map((i) => makeUnit('row', i));
export const COLS: readonly Unit[] = range9.map((i) => makeUnit('col', i));
export const BOXES: readonly Unit[] = range9.map((i) => makeUnit('box', i));
/** Svih 27 jedinica: najprije kvadrati, pa redovi, pa stupci. */
export const ALL_UNITS: readonly Unit[] = [...BOXES, ...ROWS, ...COLS];

export const rowUnit = (i: CellIndex): Unit => ROWS[rowOf(i)];
export const colUnit = (i: CellIndex): Unit => COLS[colOf(i)];
export const boxUnit = (i: CellIndex): Unit => BOXES[boxOf(i)];

/** Za svaku ćeliju 20 ćelija koje "vidi" (isti red, stupac ili kvadrat). */
export const PEERS: readonly (readonly CellIndex[])[] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<CellIndex>([...rowUnit(i).cells, ...colUnit(i).cells, ...boxUnit(i).cells]);
  set.delete(i);
  return Object.freeze([...set].sort((a, b) => a - b));
});

export const sees = (a: CellIndex, b: CellIndex): boolean =>
  a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

/** Ćelije koje vide sve zadane ćelije (bez njih samih). */
export function commonPeers(cells: readonly CellIndex[]): CellIndex[] {
  if (cells.length === 0) return [];
  return PEERS[cells[0]].filter((p) => !cells.includes(p) && cells.every((c) => sees(c, p)));
}

export class ParseError extends Error {}

/**
 * Parsira tekst od 81 znaka: 1–9 su brojevi, '0' ili '.' prazno.
 * Razmaci, novi redovi i znakovi '|', '-', '+' se ignoriraju (dozvoljava ispis s okvirom).
 */
export function parseValues(text: string): number[] {
  const chars = text.replace(/[\s|+\-]/g, '');
  if (chars.length !== 81) {
    throw new ParseError(`Očekivano 81 znak, dobiveno ${chars.length}.`);
  }
  const values: number[] = [];
  for (const ch of chars) {
    if (ch === '.' || ch === '0') values.push(0);
    else if (ch >= '1' && ch <= '9') values.push(Number(ch));
    else throw new ParseError(`Nedozvoljen znak "${ch}".`);
  }
  return values;
}

/** Parsira tekst u zagonetku; svi upisani brojevi postaju zadani. */
export function parsePuzzle(text: string): Puzzle {
  const values = parseValues(text);
  return { values, givens: values.map((v) => v !== 0) };
}

export function valuesToString(values: readonly number[], empty = '.'): string {
  return values.map((v) => (v === 0 ? empty : String(v))).join('');
}

/**
 * Ćelije koje su u sukobu: isti broj se pojavljuje dvaput u istoj jedinici.
 * Vraća skup indeksa svih ćelija koje sudjeluju u sukobu.
 */
export function findConflicts(values: readonly number[]): Set<CellIndex> {
  const out = new Set<CellIndex>();
  for (const unit of ALL_UNITS) {
    const seen = new Map<number, CellIndex>();
    for (const c of unit.cells) {
      const v = values[c];
      if (!v) continue;
      const prev = seen.get(v);
      if (prev !== undefined) {
        out.add(prev);
        out.add(c);
      } else seen.set(v, c);
    }
  }
  return out;
}
