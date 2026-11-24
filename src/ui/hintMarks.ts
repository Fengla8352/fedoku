import { bit } from '../core/mask';
import type { CellIndex, CellRole, Mask } from '../core/types';
import type { HintView } from '../game/types';

export type NoteMark = 'pattern' | 'elim' | 'place';

/** Što savjet ističe na mreži, ovisno o otkrivenoj razini. */
export interface BoardHint {
  /** Razina 1: područje u koje treba gledati. */
  area: Set<CellIndex>;
  /** Razina 2+: uloga ćelije u uzorku. */
  roles: Map<CellIndex, CellRole>;
  /** Razina 2+: kandidati koje treba prikazati i kad ćelija nema bilješki. */
  candidates: Map<CellIndex, Mask>;
  /** Oznake pojedinih kandidata. */
  marks: Map<CellIndex, Map<number, NoteMark>>;
}

export function boardHint(h: HintView | null): BoardHint | null {
  if (!h) return null;
  const out: BoardHint = { area: new Set(), roles: new Map(), candidates: new Map(), marks: new Map() };
  const mark = (cell: CellIndex, d: number, m: NoteMark) => {
    if (!out.marks.has(cell)) out.marks.set(cell, new Map());
    out.marks.get(cell)!.set(d, m);
  };
  const data = h.data;
  if (data.kind === 'wrongValue') {
    data.cells.forEach((c) => out.area.add(c));
    return out;
  }
  if (data.kind !== 'step') return out;
  const step = data.step;
  for (const u of step.focus.units) u.cells.forEach((c) => out.area.add(c));
  step.focus.cells.forEach((c) => out.area.add(c));
  if (h.level >= 2) {
    out.area.clear();
    for (const p of step.pattern) {
      out.roles.set(p.cell, p.role);
      out.candidates.set(p.cell, data.candidates[p.cell]);
      for (const d of p.digits) mark(p.cell, d, 'pattern');
    }
    // Na razini 2 jedinice uzorka ostaju blago istaknute.
    for (const u of step.focus.units) u.cells.forEach((c) => out.area.add(c));
  }
  if (h.level >= 3) {
    for (const e of step.eliminations) {
      out.candidates.set(e.cell, data.candidates[e.cell]);
      mark(e.cell, e.digit, 'elim');
    }
    if (step.placement) {
      out.candidates.set(step.placement.cell, data.candidates[step.placement.cell] | bit(step.placement.digit));
      mark(step.placement.cell, step.placement.digit, 'place');
    }
  }
  return out;
}
