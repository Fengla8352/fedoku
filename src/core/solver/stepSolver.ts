import { applyStep, createState, hasContradiction, isSolved } from '../candidates';
import { TECHNIQUES } from './techniques';
import type { SolverState, Step, Technique, TechniqueId } from '../types';

/** Najjednostavniji sljedeći korak ili null ako nijedna tehnika ne pomaže. */
export function findNextStep(
  state: SolverState,
  techniques: readonly Technique[] = TECHNIQUES,
): Step | null {
  for (const t of techniques) {
    const step = t.find(state);
    if (step) return step;
  }
  return null;
}

export interface LogicalSolveResult {
  /** Je li mreža potpuno riješena samo tehnikama. */
  solved: boolean;
  steps: Step[];
  /** Najteža korištena tehnika (prema redoslijedu u popisu tehnika). */
  hardest: TechniqueId | null;
  /** Stanje na kraju (riješeno ili zapelo). */
  state: SolverState;
}

/** Rješava zagonetku korak po korak, uvijek najjednostavnijom tehnikom. */
export function solveLogically(
  values: readonly number[],
  techniques: readonly Technique[] = TECHNIQUES,
  maxSteps = 2000,
): LogicalSolveResult {
  let state = createState(values);
  const steps: Step[] = [];
  let hardestRank = -1;
  while (!isSolved(state) && !hasContradiction(state) && steps.length < maxSteps) {
    const step = findNextStep(state, techniques);
    if (!step) break;
    steps.push(step);
    hardestRank = Math.max(hardestRank, techniques.findIndex((t) => t.id === step.technique));
    state = applyStep(state, step);
  }
  return {
    solved: isSolved(state),
    steps,
    hardest: hardestRank >= 0 ? techniques[hardestRank].id : null,
    state,
  };
}
