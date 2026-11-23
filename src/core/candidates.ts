import { PEERS } from './grid';
import { ALL_DIGITS, bit } from './mask';
import type { CandidateRef, Mask, SolverState, Step } from './types';

/**
 * Osnovni kandidati izračunati samo iz upisanih brojeva: znamenka je kandidat
 * ako se ne pojavljuje u redu, stupcu ni kvadratu ćelije.
 */
export function computeCandidates(values: readonly number[]): Mask[] {
  const out: Mask[] = new Array(81);
  for (let i = 0; i < 81; i++) {
    if (values[i]) {
      out[i] = 0;
      continue;
    }
    let m = ALL_DIGITS;
    for (const p of PEERS[i]) if (values[p]) m &= ~bit(values[p]);
    out[i] = m;
  }
  return out;
}

/**
 * Stvara stanje za rješavač. Ako su zadani `restrictTo` kandidati (npr. već
 * provjerene bilješke), stvarni kandidati su presjek s osnovnim kandidatima —
 * nikad se ne dodaje kandidat koji osnovni izračun isključuje.
 */
export function createState(values: readonly number[], restrictTo?: readonly Mask[]): SolverState {
  const candidates = computeCandidates(values);
  if (restrictTo) for (let i = 0; i < 81; i++) candidates[i] &= restrictTo[i];
  return { values: [...values], candidates };
}

export function cloneState(s: SolverState): SolverState {
  return { values: [...s.values], candidates: [...s.candidates] };
}

/** Upisuje broj i briše ga iz kandidata svih susjeda (mijenja stanje). */
export function placeDigit(s: SolverState, { cell, digit }: CandidateRef): void {
  s.values[cell] = digit;
  s.candidates[cell] = 0;
  const b = ~bit(digit);
  for (const p of PEERS[cell]) s.candidates[p] &= b;
}

/** Primjenjuje korak i vraća NOVO stanje. */
export function applyStep(s: SolverState, step: Step): SolverState {
  const next = cloneState(s);
  for (const e of step.eliminations) next.candidates[e.cell] &= ~bit(e.digit);
  if (step.placement) placeDigit(next, step.placement);
  return next;
}

export const isSolved = (s: SolverState): boolean => s.values.every((v) => v !== 0);

/** Prazna ćelija bez ijednog kandidata — stanje je proturječno. */
export const hasContradiction = (s: SolverState): boolean =>
  s.values.some((v, i) => v === 0 && s.candidates[i] === 0);
