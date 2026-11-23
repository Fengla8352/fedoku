import { describe, expect, it } from 'vitest';
import { parseValues } from '../../core/grid';
import { bit, digitsOf } from '../../core/mask';
import { displayedNotes, initialState, reducer } from '../reducer';
import type { Action, GameState } from '../types';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const play = (p = EASY) => reducer(initialState(), { type: 'loadPuzzle', values: parseValues(p) });

describe('savjet u igri', () => {
  it('razine 1 → 2 → 3, pa ostaje 3', () => {
    let s = run(play(), { type: 'hint' });
    expect(s.hint?.level).toBe(1);
    s = run(s, { type: 'hint' });
    expect(s.hint?.level).toBe(2);
    s = run(s, { type: 'hint' }, { type: 'hint' });
    expect(s.hint?.level).toBe(3);
  });

  it('"Primijeni" upisuje broj i zatvara savjet', () => {
    const s = run(play(), { type: 'hint' }, { type: 'hint' }, { type: 'hint' });
    const h = s.hint!.data;
    if (h.kind !== 'step' || !h.step.placement) throw new Error('očekivan upis');
    const after = reducer(s, { type: 'applyHint' });
    expect(after.values[h.step.placement.cell]).toBe(h.step.placement.digit);
    expect(after.hint).toBeNull();
    expect(after.history.length).toBe(s.history.length + 1);
  });

  it('promjena mreže zatvara savjet', () => {
    const s = run(play(), { type: 'hint' }, { type: 'select', cell: 0 }, { type: 'input', digit: 4 });
    expect(s.hint).toBeNull();
  });

  it('greška u broju se prikazuje odmah u cijelosti i "Primijeni" je briše', () => {
    let s = run(play(), { type: 'select', cell: 0 }, { type: 'input', digit: 5 }, { type: 'hint' });
    expect(s.hint?.level).toBe(3);
    expect(s.hint?.data.kind).toBe('issue');
    s = reducer(s, { type: 'applyHint' });
    expect(s.values[0]).toBe(0);
  });

  it('nedostajući kandidat se vraća u automatske kandidate', () => {
    let s = run(play(), { type: 'toggleAuto' }, { type: 'togglePencil' }, { type: 'select', cell: 0 }, { type: 'input', digit: 4 });
    expect(digitsOf(displayedNotes(s)[0])).toEqual([5]);
    s = run(s, { type: 'hint' });
    expect(s.hint?.data.kind).toBe('issue');
    s = reducer(s, { type: 'applyHint' });
    expect(digitsOf(displayedNotes(s)[0])).toEqual([4, 5]);
  });

  it('obrisani svi automatski kandidati u ćeliji javljaju grešku', () => {
    let s = run(play(), { type: 'toggleAuto' }, { type: 'togglePencil' }, { type: 'select', cell: 0 }, { type: 'input', digit: 4 }, { type: 'input', digit: 5 });
    expect(displayedNotes(s)[0]).toBe(0);
    s = run(s, { type: 'hint' });
    expect(s.hint?.data.kind).toBe('issue');
  });

  it('eliminacija se primjenjuje na bilješke', () => {
    // Stanje s automatskim kandidatima, rješavamo dok savjet ne bude eliminacija.
    let s = run(play('.......6..16...45...3.8..7......1....5....9..14.2.............8..59..74..2.3..1.6'), { type: 'toggleAuto' });
    for (let n = 0; n < 100; n++) {
      s = run(s, { type: 'hint' });
      const h = s.hint!.data;
      if (h.kind !== 'step') throw new Error(h.kind);
      if (!h.step.placement) {
        const e = h.step.eliminations[0];
        expect(displayedNotes(s)[e.cell] & bit(e.digit)).not.toBe(0);
        s = reducer(s, { type: 'applyHint' });
        expect(displayedNotes(s)[e.cell] & bit(e.digit)).toBe(0);
        // Sljedeći savjet ne ponavlja istu eliminaciju.
        const again = reducer(s, { type: 'hint' }).hint!.data;
        expect(again.kind === 'step' && again.step.eliminations.some((x) => x.cell === e.cell && x.digit === e.digit)).toBe(false);
        return;
      }
      s = reducer(s, { type: 'applyHint' });
    }
    throw new Error('nije pronađena eliminacija');
  });

  it('eliminacija bez automatskih kandidata popuni bilješke ćelije', () => {
    let s = play('.......6..16...45...3.8..7......1....5....9..14.2.............8..59..74..2.3..1.6');
    for (let n = 0; n < 100; n++) {
      s = run(s, { type: 'hint' });
      const h = s.hint!.data;
      if (h.kind !== 'step') throw new Error(h.kind);
      if (!h.step.placement) {
        const e = h.step.eliminations[0];
        s = reducer(s, { type: 'applyHint' });
        expect(s.notes[e.cell]).not.toBe(0);
        expect(s.notes[e.cell] & bit(e.digit)).toBe(0);
        return;
      }
      s = reducer(s, { type: 'applyHint' });
    }
    throw new Error('nije pronađena eliminacija');
  });
});
