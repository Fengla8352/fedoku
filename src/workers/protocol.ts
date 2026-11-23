import type { GeneratedPuzzle } from '../core/generator/generate';
import type { Difficulty } from '../core/types';

export interface GenRequest {
  id: number;
  difficulty: Difficulty;
  seed: number;
}

export type GenResponse =
  | { id: number; type: 'progress'; attempts: number }
  | { id: number; type: 'done'; result: GeneratedPuzzle }
  | { id: number; type: 'error'; message: string };
