import { createState } from '../candidates';
import { bit } from '../mask';
import { findNextStep } from '../solver/stepSolver';
import type { CellIndex, Mask, SolverState, Step } from '../types';
import { explainStep, type StepText } from './explain';
import { cellRef } from './text';

export interface HintInput {
  values: readonly number[];
  givens: readonly boolean[];
  solution: readonly number[];
  /** Kandidati obrisani primjenom savjeta (dokazana brisanja). */
  knownElim?: readonly Mask[];
  /**
   * Kandidati koje je korisnik sam obrisao (s automatskim kandidatima).
   * Uzimaju se u obzir samo ako su točni (ne brišu broj iz rješenja), pa savjet
   * nikad ne gradi na korisnikovoj pogrešci.
   */
  userElim?: readonly Mask[];
}

export type Hint =
  | { kind: 'solved' }
  | { kind: 'wrongValue'; cells: CellIndex[]; text: string; details: string[] }
  | { kind: 'step'; step: Step; text: StepText; candidates: Mask[] }
  | { kind: 'stuck'; text: string };

/**
 * Kandidati nad kojima radi savjet. Tvoje bilješke se NE koriste: savjet mora
 * biti objašnjiv iz same mreže. Polazi se od stvarnih kandidata (brojevi koji
 * se ne pojavljuju u redu, stupcu i kvadratu) i oduzimaju se samo dokazana
 * brisanja (iz savjeta) i tvoja točna brisanja.
 */
export function hintState(input: HintInput): SolverState {
  const state = createState(input.values);
  for (let i = 0; i < 81; i++) {
    if (input.values[i]) continue;
    let remove = input.knownElim?.[i] ?? 0;
    const user = input.userElim?.[i] ?? 0;
    if (user && !(user & bit(input.solution[i]))) remove |= user;
    state.candidates[i] &= ~remove;
  }
  return state;
}

export function findHint(input: HintInput): Hint {
  const { values, givens, solution } = input;

  // Krivo upisani brojevi su jedina greška koju savjet javlja prije poteza.
  const wrong: CellIndex[] = [];
  for (let i = 0; i < 81; i++) if (!givens[i] && values[i] && values[i] !== solution[i]) wrong.push(i);
  if (wrong.length) {
    return {
      kind: 'wrongValue',
      cells: wrong,
      text:
        wrong.length === 1
          ? `Broj u ćeliji ${cellRef(wrong[0])} nije točan.`
          : `${wrong.length} upisana broja nisu točna:`,
      details: wrong.length === 1 ? [] : wrong.map((c) => `${cellRef(c)}: upisano ${values[c]}`),
    };
  }

  if (values.every((v) => v)) return { kind: 'solved' };

  const state = hintState(input);
  const step = findNextStep(state);
  if (!step) {
    return { kind: 'stuck', text: 'Nijedna od tehnika koje aplikacija poznaje ne pomaže u ovom položaju.' };
  }
  return { kind: 'step', step, text: explainStep(step, state), candidates: state.candidates };
}
