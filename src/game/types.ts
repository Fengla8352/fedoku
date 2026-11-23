import type { CellIndex, Mask } from '../core/types';

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
  | { type: 'loadPuzzle'; values: number[] }
  | { type: 'backToEntry' }
  | { type: 'check' }
  | { type: 'dismissMessage' };
