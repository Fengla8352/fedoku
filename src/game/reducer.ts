import { computeCandidates } from '../core/candidates';
import { PEERS, ParseError, colOf, parseValues, rowOf, valuesToString } from '../core/grid';
import { cellName } from '../core/format';
import { bit } from '../core/mask';
import { checkUniqueness } from '../core/solver/backtrack';
import { gradePuzzle } from '../core/generator/grade';
import { techniqueName } from '../core/hints/explain';
import { findHint } from '../core/hints/hint';
import type { CellIndex, Mask } from '../core/types';
import type { Action, GameState, Message, Rating, Snapshot } from './types';
import { MIN_GIVENS, checkEntry } from './validate';

const HISTORY_LIMIT = 300;

const empty81 = <T>(v: T): T[] => new Array(81).fill(v);

export function initialState(): GameState {
  return {
    values: empty81(0),
    givens: empty81(false),
    notes: empty81(0),
    autoElim: empty81(0),
    phase: 'entry',
    entryLayer: 'given',
    solution: null,
    selected: null,
    pencil: false,
    autoCandidates: false,
    history: [],
    wrong: [],
    message: null,
    solved: false,
    hint: null,
    rating: null,
  };
}

/** Bilješke koje se prikazuju: automatski kandidati ili moje bilješke. */
export function displayedNotes(s: Pick<GameState, 'values' | 'notes' | 'autoElim' | 'autoCandidates'>): Mask[] {
  if (!s.autoCandidates) return s.values.map((v, i) => (v ? 0 : s.notes[i]));
  const computed = computeCandidates(s.values);
  return computed.map((m, i) => m & ~s.autoElim[i]);
}

/** Koliko je puta svaka znamenka upisana (indeks 1–9). */
export function digitCounts(values: readonly number[]): number[] {
  const counts = new Array(10).fill(0);
  for (const v of values) if (v) counts[v]++;
  return counts;
}

const snapshot = (s: GameState): Snapshot => ({
  values: s.values,
  givens: s.givens,
  notes: s.notes,
  autoElim: s.autoElim,
});

/** Sprema trenutno stanje u povijest (prije promjene). */
const pushHistory = (s: GameState): Snapshot[] => [...s.history, snapshot(s)].slice(-HISTORY_LIMIT);

const isSolved = (values: readonly number[], solution: readonly number[] | null) =>
  !!solution && values.every((v, i) => v === solution[i]);

function solvedText(r: Rating | null): string {
  if (r && !('beyond' in r)) return `Bravo, sudoku je riješen! Najteža potrebna tehnika: ${techniqueName(r.hardest)}.`;
  return 'Bravo, sudoku je riješen!';
}

/** Upisuje broj u igri i briše ga iz bilješki susjeda. */
function placeValue(s: GameState, cell: CellIndex, digit: number): GameState {
  const values = [...s.values];
  const notes = [...s.notes];
  const autoElim = [...s.autoElim];
  values[cell] = digit;
  notes[cell] = 0;
  autoElim[cell] = 0;
  if (digit) for (const p of PEERS[cell]) notes[p] &= ~bit(digit);
  const solved = isSolved(values, s.solution);
  return {
    ...s,
    values,
    notes,
    autoElim,
    history: pushHistory(s),
    wrong: s.wrong.filter((c) => c !== cell),
    solved,
    message: solved ? { kind: 'success', text: solvedText(s.rating) } : s.message,
  };
}

function inputPlay(s: GameState, digit: number): GameState {
  const cell = s.selected;
  if (cell === null || s.givens[cell] || s.solved) return s;
  if (s.pencil) {
    if (s.values[cell]) return s;
    const b = bit(digit);
    if (s.autoCandidates) {
      // Može se obrisati/vratiti samo stvarno mogući kandidat.
      if (!(computeCandidates(s.values)[cell] & b)) return s;
      const autoElim = [...s.autoElim];
      autoElim[cell] ^= b;
      return { ...s, autoElim, history: pushHistory(s) };
    }
    const notes = [...s.notes];
    notes[cell] ^= b;
    return { ...s, notes, history: pushHistory(s) };
  }
  // Ponovni upis istog broja ga briše.
  return placeValue(s, cell, s.values[cell] === digit ? 0 : digit);
}

function inputEntry(s: GameState, digit: number): GameState {
  const cell = s.selected;
  if (cell === null) return s;
  const asGiven = s.entryLayer === 'given';
  const values = [...s.values];
  const givens = [...s.givens];
  if (values[cell] === digit && givens[cell] === asGiven) {
    values[cell] = 0;
    givens[cell] = false;
  } else {
    values[cell] = digit;
    givens[cell] = asGiven;
  }
  return { ...s, values, givens, history: pushHistory(s), wrong: s.wrong.filter((c) => c !== cell) };
}

function erase(s: GameState): GameState {
  const cell = s.selected;
  if (cell === null) return s;
  if (s.phase === 'entry') {
    if (!s.values[cell]) return s;
    const values = [...s.values];
    const givens = [...s.givens];
    values[cell] = 0;
    givens[cell] = false;
    return { ...s, values, givens, history: pushHistory(s), wrong: s.wrong.filter((c) => c !== cell) };
  }
  if (s.givens[cell] || s.solved) return s;
  if (s.values[cell]) return placeValue(s, cell, 0);
  // Prazna ćelija: brišu se bilješke (ili vraćaju automatski kandidati).
  if (s.autoCandidates) {
    if (!s.autoElim[cell]) return s;
    const autoElim = [...s.autoElim];
    autoElim[cell] = 0;
    return { ...s, autoElim, history: pushHistory(s) };
  }
  if (!s.notes[cell]) return s;
  const notes = [...s.notes];
  notes[cell] = 0;
  return { ...s, notes, history: pushHistory(s) };
}

/** Ocjena težine iz zadanih brojeva. */
export function rate(values: readonly number[], givens: readonly boolean[]): Rating {
  const g = gradePuzzle(values.map((v, i) => (givens[i] ? v : 0)));
  return g.solvable ? { difficulty: g.difficulty, hardest: g.hardest } : { beyond: true };
}

function startPlay(
  s: GameState,
  solution: number[],
  wrong: CellIndex[],
  message: Message | null,
  rating: Rating = rate(s.values, s.givens),
): GameState {
  return {
    ...s,
    rating,
    phase: 'play',
    solution,
    wrong,
    message,
    history: [],
    pencil: false,
    solved: isSolved(s.values, solution),
  };
}

const cellList = (cells: readonly CellIndex[]) => cells.map((c) => cellName(c));

function startFromEntry(s: GameState): GameState {
  const r = checkEntry(s.values, s.givens);
  switch (r.status) {
    case 'tooFew':
      return {
        ...s,
        message: {
          kind: 'error',
          text: `Upisano je ${r.count} zadanih brojeva. Sudoku s jedinstvenim rješenjem treba barem ${MIN_GIVENS}.`,
        },
      };
    case 'conflict':
      return {
        ...s,
        wrong: r.cells,
        message: { kind: 'error', text: 'Isti broj se ponavlja u redu, stupcu ili kvadratu:', details: cellList(r.cells) },
      };
    case 'none':
      return {
        ...s,
        message: {
          kind: 'error',
          text: 'Zadani brojevi nemaju rješenje. Provjeri jesi li ih točno prepisao.',
        },
      };
    case 'multiple':
      return {
        ...s,
        message: {
          kind: 'error',
          text: 'Zadani brojevi imaju više rješenja. Provjeri jesu li svi zadani brojevi upisani kao zadani (a ne kao tvoji).',
        },
      };
    case 'ok': {
      const msg: Message | null = r.wrong.length
        ? {
            kind: 'warning',
            text:
              r.wrong.length === 1
                ? 'Sudoku je ispravan, ali jedan tvoj broj nije točan:'
                : `Sudoku je ispravan, ali ${r.wrong.length} tvojih brojeva nisu točni:`,
            details: r.wrong.map((c) => `${cellName(c)} (upisano ${s.values[c]})`),
          }
        : { kind: 'success', text: 'Sudoku ima točno jedno rješenje. Sretno!' };
      return startPlay(s, r.solution, r.wrong, msg);
    }
  }
}

function move(s: GameState, dRow: number, dCol: number): GameState {
  if (s.selected === null) return { ...s, selected: 40 };
  const r = (rowOf(s.selected) + dRow + 9) % 9;
  const c = (colOf(s.selected) + dCol + 9) % 9;
  return { ...s, selected: r * 9 + c };
}

/** Savjet vrijedi samo dok se mreža ne promijeni. */
export function reducer(s: GameState, a: Action): GameState {
  const next = baseReducer(s, a);
  if (
    next.hint &&
    (next.values !== s.values || next.notes !== s.notes || next.autoElim !== s.autoElim || next.autoCandidates !== s.autoCandidates)
  ) {
    return { ...next, hint: null };
  }
  return next;
}

function requestHint(s: GameState): GameState {
  if (s.phase !== 'play' || !s.solution) return s;
  if (s.hint) {
    if (s.hint.data.kind !== 'step' || s.hint.level === 3) return s;
    return { ...s, hint: { ...s.hint, level: (s.hint.level + 1) as 2 | 3 } };
  }
  const shown = displayedNotes(s);
  // U automatskom načinu svaka prazna ćelija "ima bilješke"; inače samo ćelije s nekom bilješkom.
  const notes = shown.map((m, i) => (s.values[i] ? null : s.autoCandidates || m ? m : null));
  const data = findHint({ values: s.values, givens: s.givens, notes, solution: s.solution });
  // Greške se uvijek prikazuju odmah u cijelosti.
  return { ...s, hint: { level: data.kind === 'step' ? 1 : 3, data }, message: null };
}

function applyHint(s: GameState): GameState {
  const h = s.hint?.data;
  if (!h) return s;
  if (h.kind === 'step') {
    if (h.step.placement) return { ...placeValue(s, h.step.placement.cell, h.step.placement.digit), hint: null };
    const notes = [...s.notes];
    const autoElim = [...s.autoElim];
    for (const { cell, digit } of h.step.eliminations) {
      if (s.autoCandidates) autoElim[cell] |= bit(digit);
      else {
        // Ćelija bez bilješki dobiva kandidate s kojima je savjet računao.
        if (!notes[cell]) notes[cell] = h.candidates[cell];
        notes[cell] &= ~bit(digit);
      }
    }
    return { ...s, notes, autoElim, history: pushHistory(s), hint: null };
  }
  if (h.kind === 'issue') {
    const issue = h.issue;
    if (issue.kind === 'wrongValue') {
      const values = [...s.values];
      for (const c of issue.cells) values[c] = 0;
      return { ...s, values, history: pushHistory(s), wrong: s.wrong.filter((c) => !issue.cells.includes(c)), hint: null };
    }
    const notes = [...s.notes];
    const autoElim = [...s.autoElim];
    for (const { cell, digit } of issue.items) {
      if (issue.kind === 'missingCandidate') {
        if (s.autoCandidates) autoElim[cell] &= ~bit(digit);
        else notes[cell] |= bit(digit);
      } else notes[cell] &= ~bit(digit);
    }
    return { ...s, notes, autoElim, history: pushHistory(s), hint: null };
  }
  return { ...s, hint: null };
}

function baseReducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'hint':
      return requestHint(s);
    case 'applyHint':
      return applyHint(s);
    case 'closeHint':
      return { ...s, hint: null };
    case 'select':
      return { ...s, selected: a.cell };
    case 'move':
      return move(s, a.dRow, a.dCol);
    case 'input':
      if (a.digit < 1 || a.digit > 9) return s;
      return s.phase === 'entry' ? inputEntry(s, a.digit) : inputPlay(s, a.digit);
    case 'erase':
      return erase(s);
    case 'togglePencil':
      return { ...s, pencil: !s.pencil };
    case 'toggleAuto':
      return { ...s, autoCandidates: !s.autoCandidates };
    case 'undo': {
      const prev = s.history[s.history.length - 1];
      if (!prev) return s;
      return {
        ...s,
        ...prev,
        history: s.history.slice(0, -1),
        solved: isSolved(prev.values, s.solution),
      };
    }
    case 'newEntry':
      return { ...initialState(), autoCandidates: s.autoCandidates };
    case 'loadText': {
      try {
        const values = parseValues(a.text);
        return {
          ...initialState(),
          autoCandidates: s.autoCandidates,
          values,
          givens: values.map((v) => v !== 0),
          message: { kind: 'info', text: 'Zagonetka učitana. Upiši svoje brojeve ako ih imaš, pa klikni "Provjeri i igraj".' },
          entryLayer: 'own',
        };
      } catch (e) {
        if (e instanceof ParseError) return { ...s, message: { kind: 'error', text: e.message } };
        throw e;
      }
    }
    case 'setEntryLayer':
      return { ...s, entryLayer: a.layer };
    case 'startFromEntry':
      return startFromEntry(s);
    case 'loadPuzzle': {
      const u = checkUniqueness(a.values);
      if (u.status !== 'unique') {
        return { ...s, message: { kind: 'error', text: 'Ova zagonetka nema jedinstveno rješenje.' } };
      }
      const base: GameState = {
        ...initialState(),
        autoCandidates: s.autoCandidates,
        values: [...a.values],
        givens: a.values.map((v) => v !== 0),
      };
      return startPlay(base, u.solution, [], null, a.rating);
    }
    case 'backToEntry':
      return {
        ...s,
        phase: 'entry',
        entryLayer: 'given',
        solution: null,
        solved: false,
        wrong: [],
        history: [],
        hint: null,
        rating: null,
        message: { kind: 'info', text: 'Uređivanje zagonetke. Kad završiš, klikni "Provjeri i igraj".' },
      };
    case 'check': {
      if (!s.solution) return s;
      const wrong: CellIndex[] = [];
      for (let i = 0; i < 81; i++) if (!s.givens[i] && s.values[i] && s.values[i] !== s.solution[i]) wrong.push(i);
      return {
        ...s,
        wrong,
        message: wrong.length
          ? { kind: 'warning', text: wrong.length === 1 ? 'Jedan broj nije točan:' : `${wrong.length} brojeva nisu točni:`, details: cellList(wrong) }
          : { kind: 'success', text: 'Svi upisani brojevi su točni.' },
      };
    }
    case 'dismissMessage':
      return { ...s, message: null };
  }
}

/** Tekst od 81 znaka trenutne zagonetke (samo zadani brojevi). */
export const givensText = (s: Pick<GameState, 'values' | 'givens'>): string =>
  valuesToString(s.values.map((v, i) => (s.givens[i] ? v : 0)));
