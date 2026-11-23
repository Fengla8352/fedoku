import type { Hint } from '../core/hints/hint';
import type { CellIndex, Difficulty, Mask, TechniqueId } from '../core/types';

/** 'entry' = ručni unos zagonetke, 'play' = rješavanje. */
export type Phase = 'entry' | 'play';

/** Pri ručnom unosu: upisuje li se zadani broj ili moj (već riješeni) broj. */
export type EntryLayer = 'given' | 'own';

/** Dio stanja koji se sprema za "Poništi". */
export interface Snapshot {
  values: number[];
  givens: boolean[];
  /** Moje bilješke (kad su automatski kandidati isključeni). */
  notes: Mask[];
  /**
   * Kandidati koje sam obrisao dok su automatski kandidati uključeni.
   * Prikazani kandidati = izračunati & ~autoElim.
   */
  autoElim: Mask[];
  /** Kandidati obrisani primjenom savjeta (dokazano točna brisanja). */
  knownElim: Mask[];
}

export type MessageKind = 'error' | 'warning' | 'info' | 'success';

export interface Message {
  kind: MessageKind;
  text: string;
  /** Detalji, npr. popis ćelija. */
  details?: string[];
}

export interface GameState extends Snapshot {
  phase: Phase;
  entryLayer: EntryLayer;
  /** Rješenje (poznato nakon provjere jedinstvenosti). */
  solution: number[] | null;
  selected: CellIndex | null;
  pencil: boolean;
  autoCandidates: boolean;
  history: Snapshot[];
  /** Ćelije označene kao krive nakon provjere. */
  wrong: CellIndex[];
  message: Message | null;
  solved: boolean;
  /** Aktivni savjet i koliko je otkriven (1–3). */
  hint: HintView | null;
  /** Ocjena težine trenutne zagonetke. */
  rating: Rating | null;
  /** Odakle je zagonetka: generirana (gotova, ne treba uređivanje) ili ručno unesena. */
  source: PuzzleSource;
  /** Korisnik bilješke piše djelomično — savjet ih ne provjerava i ne koristi. */
  partialNotes: boolean;
  /** Vrijeme rješavanja u milisekundama (bez pauza). */
  elapsedMs: number;
  /** Igra je pauzirana: mreža je skrivena, unos zaključan. */
  paused: boolean;
}

export type PuzzleSource = 'generated' | 'manual';

export type Rating = { difficulty: Difficulty; hardest: TechniqueId } | { beyond: true };

export interface HintView {
  level: 1 | 2 | 3;
  data: Hint;
}

export type Action =
  | { type: 'select'; cell: CellIndex | null }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'input'; digit: number }
  | { type: 'erase' }
  | { type: 'togglePencil' }
  | { type: 'toggleAuto' }
  | { type: 'undo' }
  | { type: 'newEntry' }
  | { type: 'loadText'; text: string }
  | { type: 'setEntryLayer'; layer: EntryLayer }
  | { type: 'startFromEntry' }
  | { type: 'loadPuzzle'; values: number[]; rating?: Rating; source?: PuzzleSource }
  | { type: 'backToEntry' }
  | { type: 'check' }
  | { type: 'dismissMessage' }
  /** Prvi klik daje razinu 1, svaki sljedeći otkriva više (do 3). */
  | { type: 'hint' }
  | { type: 'applyHint' }
  | { type: 'closeHint' }
  /** Uključuje/isključuje djelomične bilješke i odmah traži novi savjet. */
  | { type: 'setPartialNotes'; value: boolean }
  /** Proteklo vrijeme (šalje ga sučelje svake sekunde dok igra teče). */
  | { type: 'tick'; ms: number }
  | { type: 'pause' }
  | { type: 'resume' };
