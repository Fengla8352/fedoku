import { computeCandidates, createState } from '../candidates';
import { PEERS } from '../grid';
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
}

/** Greška u korisnikovim brojevima ili bilješkama — javlja se prije svega ostalog. */
export type HintIssue =
  | { kind: 'wrongValue'; cells: CellIndex[] }
  | { kind: 'missingCandidate'; items: CandidateRef[] }
  | { kind: 'impossibleCandidate'; items: CandidateRef[] };

export type Hint =
  | { kind: 'solved' }
  | ({ kind: 'issue'; text: string; details: string[] } & { issue: HintIssue })
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

export function findHint(input: HintInput): Hint {
  const { values, givens, notes, solution } = input;

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
      details: missing.length === 1 ? [] : missing.map((m) => `U ćeliji ${cellRef(m.cell)} nedostaje kandidat ${m.digit}.`),
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
    };
  }

  // 4. Najjednostavniji logički korak.
  const state = hintState(values, notes);
  const step = findNextStep(state);
  if (!step) {
    return {
      kind: 'stuck',
      text: 'Nijedna od tehnika koje aplikacija poznaje ne pomaže u ovom položaju.',
    };
  }
  return { kind: 'step', step, text: explainStep(step, state), candidates: state.candidates };
}
