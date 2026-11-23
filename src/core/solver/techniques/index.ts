import type { Technique } from '../../types';
import { boxLine } from './boxLine';
import { swordfish, xWing } from './fish';
import { hiddenPair, hiddenTriple } from './hiddenSubset';
import { hiddenSingle } from './hiddenSingle';
import { nakedPair, nakedTriple } from './nakedSubset';
import { nakedSingle } from './nakedSingle';
import { pointing } from './pointing';
import { remotePair } from './remotePair';
import { simpleColoring } from './simpleColoring';
import { skyscraper } from './skyscraper';
import { wWing } from './wWing';
import { xyChain } from './xyChain';
import { xyWing } from './xyWing';
import { xyzWing } from './xyzWing';

export {
  boxLine, hiddenPair, hiddenSingle, hiddenTriple, nakedPair, nakedSingle, nakedTriple, pointing,
  remotePair, simpleColoring, skyscraper, swordfish, wWing, xWing, xyChain, xyWing, xyzWing,
};

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
  xWing,
  xyWing,
  remotePair,
  xyzWing,
  swordfish,
  wWing,
  skyscraper,
  xyChain,
  simpleColoring,
];
