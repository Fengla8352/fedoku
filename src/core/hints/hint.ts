import { computeCandidates, createState } from '../candidates';
import { PEERS, boxOf, colOf, rowOf } from '../grid';
import { bit, digitsOf } from '../mask';
import { findNextStep } from '../solver/stepSolver';
import type { CandidateRef, CellIndex, Mask, SolverState, Step } from '../types';
import { explainStep, type StepText } from './explain';
import { cellRef } from './text';

export interface HintInput {
  values: readonly number[];
  givens: readonly boolean[];
  /**
   * Bilješke kakve korisnik vidi; null = ćelija nema bilješki (rješavač tada
   * koristi sve stvarne kandidate). 0 znači da su svi kandidati obrisani.
   */
  notes: readonly (Mask | null)[];
  solution: readonly number[];
  /**
   * Bilješke su djelomične (korisnik ne piše sve kandidate): ne provjeravaju se
   * i ne koriste se. Rješavač tada radi nad stvarnim kandidatima umanjenim samo
   * za `knownElim` — eliminacije koje su već primijenjene preko savjeta.
   */
  ignoreNotes?: boolean;
  knownElim?: readonly Mask[];
}

/** Greška u korisnikovim brojevima ili bilješkama — javlja se prije svega ostalog. */
export type HintIssue =
  | { kind: 'wrongValue'; cells: CellIndex[] }
  | { kind: 'missingCandidate'; items: CandidateRef[] }
  | { kind: 'impossibleCandidate'; items: CandidateRef[] };

export type Hint =
  | { kind: 'solved' }
  | ({
      kind: 'issue';
      text: string;
      details: string[];
      /** Zašto je to problem — prikazuje se uz poruku. */
      why: string[];
    } & { issue: HintIssue })
  | { kind: 'step'; step: Step; text: StepText; candidates: Mask[] }
  | { kind: 'stuck'; text: string };

/**
 * Kandidati nad kojima radi rješavač: STVARNI kandidati iz upisanih brojeva,
 * suženi korisnikovim bilješkama tamo gdje ih ima. (Bilješke koje ne sadrže
 * točan broj prijavljuju se kao greška prije nego što se ovo koristi.)
 */
export function hintState(values: readonly number[], notes: readonly (Mask | null)[]): SolverState {
  const restrict = notes.map((m) => (m === null ? 0x3fe : m));
  return createState(values, restrict);
}

/** Zašto kandidat nije moguć: koja upisana ćelija ga blokira. */
function blockingCell(values: readonly number[], cell: CellIndex, d: number): CellIndex | undefined {
  return PEERS[cell].find((p) => values[p] === d);
}

/** "6 se ne nalazi ni u redu 1, ni u stupcu 3, ni u kvadratu 1" */
function stillPossible(cell: CellIndex, d: number): string {
  return `${d} se ne nalazi ni u redu ${rowOf(cell) + 1}, ni u stupcu ${colOf(cell) + 1}, ni u kvadratu ${boxOf(cell) + 1}, a nije ga isključila ni nijedna tehnika`;
}

export function findHint(input: HintInput): Hint {
  const { values, givens, solution } = input;
  const notes = input.ignoreNotes ? values.map(() => null) : input.notes;

  // 1. Krivo upisani brojevi.
  const wrong: CellIndex[] = [];
  for (let i = 0; i < 81; i++) if (!givens[i] && values[i] && values[i] !== solution[i]) wrong.push(i);
  if (wrong.length) {
    return {
      kind: 'issue',
      issue: { kind: 'wrongValue', cells: wrong },
      text:
        wrong.length === 1
          ? `U ćeliji ${cellRef(wrong[0])} upisan je krivi broj.`
          : `${wrong.length} upisana broja nisu točna:`,
      details: wrong.length === 1 ? [] : wrong.map((c) => `${cellRef(c)}: upisano ${values[c]}`),
      why: [
        'Sudoku ima samo jedno rješenje, a upisani broj se s njim ne slaže — negdje ranije potkrala se greška.',
        'Dok krivi broj stoji u mreži, svi zaključci koji iz njega slijede mogu biti krivi, pa ga savjet prvo javlja.',
      ],
    };
  }

  if (values.every((v) => v)) return { kind: 'solved' };

  // 2. Bilješke kojima nedostaje kandidat koji je zapravo moguć (točan broj obrisan).
  const missing: CandidateRef[] = [];
  for (let i = 0; i < 81; i++) {
    if (!values[i] && notes[i] !== null && !(notes[i]! & bit(solution[i]))) {
      missing.push({ cell: i, digit: solution[i] as CandidateRef['digit'] });
    }
  }
  if (missing.length) {
    return {
      kind: 'issue',
      issue: { kind: 'missingCandidate', items: missing },
      text:
        missing.length === 1
          ? `U ćeliji ${cellRef(missing[0].cell)} nedostaje kandidat ${missing[0].digit}.`
          : `U bilješkama nedostaju kandidati koji su mogući:`,
      details: missing.length === 1 ? [] : missing.map((m) => `${cellRef(m.cell)}: nedostaje ${m.digit}`),
      why: [
        'Savjet bilješke u ćeliji čita kao popis SVIH brojeva koji tamo još mogu doći.',
        missing.length === 1
          ? `Broj ${missing[0].digit} je ovdje još moguć: ${stillPossible(missing[0].cell, missing[0].digit)}.`
          : 'Ti brojevi su još mogući: nema ih ni u redu, ni u stupcu, ni u kvadratu tih ćelija, a nije ih isključila nijedna tehnika.',
        'Iz bilješki kojima nedostaje mogući broj lako se izvede krivi zaključak (npr. ćelija izgleda kao da ima samo jednog kandidata).',
        'Ako bilješke namjerno pišeš samo djelomično, odaberi „Moje bilješke su djelomične” — savjet će ih tada zanemariti.',
      ],
    };
  }

  // 3. Bilješke s kandidatom koji nije moguć (broj je već u redu/stupcu/kvadratu).
  const basic = computeCandidates(values);
  const impossible: CandidateRef[] = [];
  for (let i = 0; i < 81; i++) {
    const m = notes[i];
    if (values[i] || !m) continue;
    for (const d of digitsOf(m & ~basic[i])) impossible.push({ cell: i, digit: d });
  }
  if (impossible.length) {
    const lines = impossible.map(({ cell, digit }) => {
      const b = blockingCell(values, cell, digit);
      return `U ćeliji ${cellRef(cell)} kandidat ${digit} nije moguć${b !== undefined ? ` — ${digit} je već u ${cellRef(b)}` : ''}.`;
    });
    return {
      kind: 'issue',
      issue: { kind: 'impossibleCandidate', items: impossible },
      text: impossible.length === 1 ? lines[0] : 'Neki kandidati u bilješkama nisu mogući:',
      details: impossible.length === 1 ? [] : lines,
      why: [
        'Isti broj već je upisan u istom redu, stupcu ili kvadratu, pa ovdje ne može doći.',
        'Takav kandidat ne smeta rješavanju, ali zbunjuje: brisanjem bilješke postaju točnije.',
      ],
    };
  }

  // 4. Najjednostavniji logički korak.
  const state = hintState(values, notes);
  if (input.ignoreNotes && input.knownElim) {
    for (let i = 0; i < 81; i++) state.candidates[i] &= ~input.knownElim[i];
  }
  const step = findNextStep(state);
  if (!step) {
    return {
      kind: 'stuck',
      text: 'Nijedna od tehnika koje aplikacija poznaje ne pomaže u ovom položaju.',
    };
  }
  return { kind: 'step', step, text: explainStep(step, state), candidates: state.candidates };
}
