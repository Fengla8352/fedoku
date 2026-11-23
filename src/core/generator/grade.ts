import { solveLogically } from '../solver/stepSolver';
import { TECHNIQUES } from '../solver/techniques';
import type { Difficulty, Technique, TechniqueId } from '../types';

export const DIFFICULTIES: readonly Difficulty[] = ['lako', 'srednje', 'tesko', 'ekspert', 'ekstremno'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  lako: 'Lako',
  srednje: 'Srednje',
  tesko: 'Teško',
  ekspert: 'Ekspert',
  ekstremno: 'Ekstremno',
};

export const difficultyRank = (d: Difficulty): number => DIFFICULTIES.indexOf(d);

/** Tehnike dopuštene za zadanu težinu (sve do nje uključivo). */
export function techniquesUpTo(d: Difficulty): Technique[] {
  const r = difficultyRank(d);
  return TECHNIQUES.filter((t) => difficultyRank(t.difficulty) <= r);
}

export type Grade =
  | { solvable: true; difficulty: Difficulty; hardest: TechniqueId; steps: number }
  | { solvable: false };

/**
 * Ocjena težine: težina NAJTEŽE tehnike potrebne za rješenje kad se uvijek
 * bira najjednostavniji korak. Broj zadanih brojeva nije bitan.
 */
export function gradePuzzle(values: readonly number[], techniques: readonly Technique[] = TECHNIQUES): Grade {
  const r = solveLogically(values, techniques);
  if (!r.solved || !r.hardest) return { solvable: false };
  let rank = 0;
  for (const s of r.steps) {
    const t = techniques.find((x) => x.id === s.technique)!;
    rank = Math.max(rank, difficultyRank(t.difficulty));
  }
  const hardestOfRank = r.steps
    .map((s) => techniques.findIndex((t) => t.id === s.technique))
    .filter((i) => difficultyRank(techniques[i].difficulty) === rank)
    .reduce((a, b) => Math.max(a, b), 0);
  return { solvable: true, difficulty: DIFFICULTIES[rank], hardest: techniques[hardestOfRank].id, steps: r.steps.length };
}
