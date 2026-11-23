import { describe, expect, it } from 'vitest';
import { computeCandidates } from '../../core/candidates';
import { parseValues } from '../../core/grid';
import { digitsOf } from '../../core/mask';
import { checkUniqueness } from '../../core/solver/backtrack';
import { digitCounts, displayedNotes, givensText, initialState, reducer } from '../reducer';
import type { Action, GameState } from '../types';

const EASY = '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
const SOLUTION = (checkUniqueness(parseValues(EASY)) as { solution: number[] }).solution;

const run = (s: GameState, ...actions: Action[]) => actions.reduce(reducer, s);
const playing = () => run(initialState(), { type: 'loadPuzzle', values: parseValues(EASY) });

describe('igra', () => {
  it('loadPuzzle pokreće igru s rješenjem', () => {
    const s = playing();
    expect(s.phase).toBe('play');
    expect(s.solution).toEqual(SOLUTION);
    expect(s.givens[2]).toBe(true);
  });

  it('zadani brojevi se ne mogu mijenjati', () => {
    const s = run(playing(), { type: 'select', cell: 2 }, { type: 'input', digit: 5 }, { type: 'erase' });
    expect(s.values[2]).toBe(3);
  });

  it('upis briše znamenku iz bilješki susjeda; isti broj ponovno briše upis', () => {
    let s = run(playing(), { type: 'togglePencil' }, { type: 'select', cell: 1 }, { type: 'input', digit: 8 });
    expect(digitsOf(s.notes[1])).toEqual([8]);
    s = run(s, { type: 'togglePencil' }, { type: 'select', cell: 0 }, { type: 'input', digit: 8 });
    expect(s.values[0]).toBe(8);
    expect(s.notes[1]).toBe(0);
    s = run(s, { type: 'input', digit: 8 });
    expect(s.values[0]).toBe(0);
  });

  it('poništi vraća prethodno stanje', () => {
    const s0 = playing();
    const s = run(s0, { type: 'select', cell: 0 }, { type: 'input', digit: 4 }, { type: 'input', digit: 5 });
    expect(s.values[0]).toBe(5);
    const u1 = reducer(s, { type: 'undo' });
    expect(u1.values[0]).toBe(4);
    const u2 = reducer(u1, { type: 'undo' });
    expect(u2.values).toEqual(s0.values);
    expect(reducer(u2, { type: 'undo' })).toBe(u2);
  });

  it('automatski kandidati: prikaz, brisanje olovkom, vraćanje', () => {
    let s = run(playing(), { type: 'toggleAuto' });
    const computed = computeCandidates(s.values);
    expect(displayedNotes(s)).toEqual(computed);
    expect(digitsOf(displayedNotes(s)[0])).toEqual([4, 5]);
    s = run(s, { type: 'togglePencil' }, { type: 'select', cell: 0 }, { type: 'input', digit: 5 });
    expect(digitsOf(displayedNotes(s)[0])).toEqual([4]);
    // nemoguć kandidat se ne može dodati
    const same = reducer(s, { type: 'input', digit: 9 });
    expect(same).toBe(s);
    // gašenjem se vraćaju moje (prazne) bilješke, uključivanjem opet automatske
    s = run(s, { type: 'toggleAuto' });
    expect(displayedNotes(s)[0]).toBe(0);
    s = run(s, { type: 'toggleAuto' });
    expect(digitsOf(displayedNotes(s)[0])).toEqual([4]);
    // brisanje prazne ćelije vraća automatske kandidate
    s = run(s, { type: 'erase' });
    expect(digitsOf(displayedNotes(s)[0])).toEqual([4, 5]);
  });

  it('broj preostalih znamenki', () => {
    const counts = digitCounts(parseValues(EASY));
    expect(counts[3]).toBe(4);
  });

  it('provjera označava krive brojeve', () => {
    const wrongDigit = SOLUTION[0] === 4 ? 5 : 4;
    const s = run(playing(), { type: 'select', cell: 0 }, { type: 'input', digit: wrongDigit }, { type: 'check' });
    expect(s.wrong).toEqual([0]);
    expect(s.message?.kind).toBe('warning');
    expect(s.message?.details).toEqual(['red 1, stupac 1']);
  });

  it('prepoznaje riješen sudoku', () => {
    let s = playing();
    for (let i = 0; i < 81; i++) if (!s.values[i]) s = run(s, { type: 'select', cell: i }, { type: 'input', digit: SOLUTION[i] });
    expect(s.solved).toBe(true);
    expect(s.message?.kind).toBe('success');
  });

  it('pomicanje strelicama', () => {
    const s = run(initialState(), { type: 'select', cell: 0 }, { type: 'move', dRow: -1, dCol: 0 });
    expect(s.selected).toBe(72);
  });
});

describe('ručni unos', () => {
  it('razlikuje zadane i moje brojeve', () => {
    const s = run(
      initialState(),
      { type: 'select', cell: 0 }, { type: 'input', digit: 1 },
      { type: 'setEntryLayer', layer: 'own' },
      { type: 'select', cell: 1 }, { type: 'input', digit: 2 },
    );
    expect(s.givens.slice(0, 2)).toEqual([true, false]);
    expect(s.values.slice(0, 2)).toEqual([1, 2]);
  });

  it('učitava tekst od 81 znaka kao zadane brojeve', () => {
    const s = reducer(initialState(), { type: 'loadText', text: EASY.replace(/0/g, '.') });
    expect(givensText(s)).toBe(EASY.replace(/0/g, '.'));
    expect(s.entryLayer).toBe('own');
    const bad = reducer(initialState(), { type: 'loadText', text: '123' });
    expect(bad.message?.kind).toBe('error');
  });

  it('upozorava na premalo zadanih brojeva', () => {
    const s = run(initialState(), { type: 'select', cell: 0 }, { type: 'input', digit: 1 }, { type: 'startFromEntry' });
    expect(s.phase).toBe('entry');
    expect(s.message?.text).toMatch(/barem 17/);
  });

  it('javlja dvostruki broj', () => {
    const v = parseValues(EASY);
    v[0] = 3;
    const s = run(initialState(), { type: 'loadText', text: v.join('') }, { type: 'startFromEntry' });
    expect(s.phase).toBe('entry');
    expect(s.wrong).toEqual([0, 2]);
    expect(s.message?.details).toEqual(['red 1, stupac 1', 'red 1, stupac 3']);
  });

  it('javlja više rješenja', () => {
    // Uklanjamo zadane brojeve dok ne nastane više rješenja.
    const v = parseValues(EASY);
    for (const i of [2, 4, 6, 9, 11, 13, 15, 17, 20, 22]) v[i] = 0;
    expect(checkUniqueness(v).status).toBe('multiple');
    const s = run(initialState(), { type: 'loadText', text: v.join('') }, { type: 'startFromEntry' });
    expect(s.message?.text).toMatch(/više rješenja/);
  });

  it('javlja da nema rješenja', () => {
    const v = parseValues(EASY);
    v[0] = 5; // točno je 4, ali nema izravnog sukoba
    const s = run(initialState(), { type: 'loadText', text: v.join('') }, { type: 'startFromEntry' });
    expect(s.message?.text).toMatch(/nemaju rješenje/);
  });

  it('pokreće igru i upozorava na moj krivi broj', () => {
    const s = run(
      initialState(),
      { type: 'loadText', text: EASY },
      { type: 'select', cell: 0 }, { type: 'input', digit: 5 }, // krivo (točno je 4)
      { type: 'select', cell: 1 }, { type: 'input', digit: SOLUTION[1] }, // točno
      { type: 'startFromEntry' },
    );
    expect(s.phase).toBe('play');
    expect(s.givens[0]).toBe(false);
    expect(s.wrong).toEqual([0]);
    expect(s.message?.kind).toBe('warning');
    expect(s.message?.details).toEqual(['red 1, stupac 1 (upisano 5)']);
    // moj broj se u igri može ispraviti
    const fixed = run(s, { type: 'select', cell: 0 }, { type: 'input', digit: 4 });
    expect(fixed.wrong).toEqual([]);
  });

  it('povratak na uređivanje', () => {
    const s = run(playing(), { type: 'backToEntry' });
    expect(s.phase).toBe('entry');
    expect(s.solution).toBeNull();
  });
});

describe('ocjena težine u igri', () => {
  it('ručno unesena zagonetka dobije ocjenu', () => {
    const s = run(initialState(), { type: 'loadText', text: EASY }, { type: 'startFromEntry' });
    expect(s.rating).toEqual({ difficulty: 'lako', hardest: 'nakedSingle' });
  });
  it('generirana zagonetka zadržava zadanu ocjenu', () => {
    const s = reducer(initialState(), { type: 'loadPuzzle', values: parseValues(EASY), rating: { difficulty: 'lako', hardest: 'hiddenSingle' } });
    expect(s.rating).toEqual({ difficulty: 'lako', hardest: 'hiddenSingle' });
  });
  it('zagonetka izvan dosega tehnika', () => {
    const stuck = '6..23.4....89....3......62.5.....3.2.69..7...3...8..9....4....5.1..........85.9.4';
    expect(reducer(initialState(), { type: 'loadPuzzle', values: parseValues(stuck) }).rating).toEqual({ beyond: true });
  });
  it('poruka o rješenju navodi najtežu tehniku', () => {
    let s = playing();
    for (let i = 0; i < 81; i++) if (!s.values[i]) s = run(s, { type: 'select', cell: i }, { type: 'input', digit: SOLUTION[i] });
    expect(s.message?.text).toBe('Bravo, sudoku je riješen! Vrijeme: 0:00. Najteža potrebna tehnika: Goli single.');
  });
});

describe('izvor zagonetke', () => {
  it('generirana zagonetka je "generated", ručni unos "manual"', () => {
    const gen = reducer(initialState(), { type: 'loadPuzzle', values: parseValues(EASY), source: 'generated' });
    expect(gen.source).toBe('generated');
    const manual = run(initialState(), { type: 'loadText', text: EASY }, { type: 'startFromEntry' });
    expect(manual.source).toBe('manual');
    expect(reducer(gen, { type: 'newEntry' }).source).toBe('manual');
  });
});

describe('tajmer i pauza', () => {
  it('vrijeme teče samo dok se igra', () => {
    expect(reducer(initialState(), { type: 'tick', ms: 1000 }).elapsedMs).toBe(0); // ručni unos
    let s = run(playing(), { type: 'tick', ms: 1000 }, { type: 'tick', ms: 500 });
    expect(s.elapsedMs).toBe(1500);
    s = run(s, { type: 'pause' }, { type: 'tick', ms: 1000 });
    expect(s.elapsedMs).toBe(1500);
    s = run(s, { type: 'resume' }, { type: 'tick', ms: 1000 });
    expect(s.elapsedMs).toBe(2500);
  });

  it('za vrijeme pauze nema unosa ni savjeta', () => {
    const p = run(playing(), { type: 'select', cell: 0 }, { type: 'pause' });
    expect(run(p, { type: 'input', digit: 4 })).toBe(p);
    expect(run(p, { type: 'hint' })).toBe(p);
    expect(run(p, { type: 'erase' })).toBe(p);
    expect(run(p, { type: 'undo' })).toBe(p);
    expect(run(p, { type: 'resume' }, { type: 'input', digit: 4 }).values[0]).toBe(4);
  });

  it('pauza zatvara savjet; nova igra kreće od nule i nije pauzirana', () => {
    const p = run(playing(), { type: 'hint' }, { type: 'tick', ms: 5000 }, { type: 'pause' });
    expect(p.hint).toBeNull();
    const n = reducer(p, { type: 'loadPuzzle', values: parseValues(EASY) });
    expect(n.elapsedMs).toBe(0);
    expect(n.paused).toBe(false);
  });

  it('uređivanje ručnog unosa ne briše vrijeme', () => {
    const s = run(initialState(), { type: 'loadText', text: EASY }, { type: 'startFromEntry' }, { type: 'tick', ms: 7000 }, { type: 'backToEntry' }, { type: 'startFromEntry' });
    expect(s.elapsedMs).toBe(7000);
  });

  it('poruka o rješenju navodi vrijeme; nakon rješenja vrijeme stoji', () => {
    let s = run(playing(), { type: 'tick', ms: 125_000 });
    for (let i = 0; i < 81; i++) if (!s.values[i]) s = run(s, { type: 'select', cell: i }, { type: 'input', digit: SOLUTION[i] });
    expect(s.message?.text).toContain('Vrijeme: 2:05.');
    expect(run(s, { type: 'tick', ms: 1000 }).elapsedMs).toBe(125_000);
    expect(run(s, { type: 'pause' }).paused).toBe(false);
  });
});
