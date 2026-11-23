/// <reference lib="webworker" />
import { generatePuzzle } from '../core/generator/generate';
import type { GenRequest, GenResponse } from './protocol';

const post = (m: GenResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

self.onmessage = (e: MessageEvent<GenRequest>) => {
  const { id, difficulty, seed } = e.data;
  try {
    const result = generatePuzzle(difficulty, seed, {
      onAttempt: (attempts) => post({ id, type: 'progress', attempts }),
    });
    post({ id, type: 'done', result });
  } catch (err) {
    post({ id, type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
