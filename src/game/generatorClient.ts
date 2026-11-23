import { generatePuzzle, type GeneratedPuzzle } from '../core/generator/generate';
import { randomSeed } from '../core/generator/rng';
import type { Difficulty } from '../core/types';
import type { GenRequest, GenResponse } from '../workers/protocol';

export interface GenerationJob {
  promise: Promise<GeneratedPuzzle>;
  cancel: () => void;
}

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  worker ??= new Worker(new URL('../workers/generator.worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

/**
 * Pokreće generiranje u Web Workeru (sučelje ostaje odzivno). `cancel()`
 * prekida workera; sljedeći poziv stvara novog.
 */
export function startGeneration(difficulty: Difficulty, onProgress?: (attempts: number) => void): GenerationJob {
  const seed = randomSeed();
  const w = getWorker();
  if (!w) {
    // Rezerva bez Web Workera.
    return { promise: Promise.resolve().then(() => generatePuzzle(difficulty, seed)), cancel: () => {} };
  }
  const id = nextId++;
  let settled = false;
  let rejectFn: (e: Error) => void = () => {};
  const promise = new Promise<GeneratedPuzzle>((resolve, reject) => {
    rejectFn = reject;
    const onMessage = (e: MessageEvent<GenResponse>) => {
      const m = e.data;
      if (m.id !== id) return;
      if (m.type === 'progress') {
        onProgress?.(m.attempts);
        return;
      }
      settled = true;
      w.removeEventListener('message', onMessage);
      if (m.type === 'done') resolve(m.result);
      else reject(new Error(m.message));
    };
    w.addEventListener('message', onMessage);
    w.postMessage({ id, difficulty, seed } satisfies GenRequest);
  });
  return {
    promise,
    cancel: () => {
      if (settled) return;
      settled = true;
      worker?.terminate();
      worker = null;
      rejectFn(new DOMException('Prekinuto', 'AbortError'));
    },
  };
}
