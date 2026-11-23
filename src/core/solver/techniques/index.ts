import type { Technique } from '../../types';
import { boxLine } from './boxLine';
import { hiddenPair, hiddenTriple } from './hiddenSubset';
import { hiddenSingle } from './hiddenSingle';
import { nakedPair, nakedTriple } from './nakedSubset';
import { nakedSingle } from './nakedSingle';
import { pointing } from './pointing';

export { boxLine, hiddenPair, hiddenSingle, hiddenTriple, nakedPair, nakedSingle, nakedTriple, pointing };

/** Sve tehnike, redom od najlakše. Savjet uvijek uzima prvu koja nađe korak. */
export const TECHNIQUES: readonly Technique[] = [
  nakedSingle,
  hiddenSingle,
  pointing,
  boxLine,
  nakedPair,
  nakedTriple,
  hiddenPair,
  hiddenTriple,
];
