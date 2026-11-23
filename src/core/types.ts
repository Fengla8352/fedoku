// Osnovni tipovi za sudoku logiku. Ovaj modul (i cijela mapa core/) ne smije
// ovisiti o Reactu ni o DOM-u, kako bi radio i u Web Workeru i u testovima.

/** Znamenka 1–9. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Indeks ćelije 0–80, red po red (indeks = red * 9 + stupac). */
export type CellIndex = number;

/**
 * Skup kandidata kao bitovna maska: bit `1 << d` je postavljen ako je
 * znamenka d moguća. Bit 0 se ne koristi. Puna maska je 0b11_1111_1110.
 */
export type Mask = number;

export type UnitType = 'row' | 'col' | 'box';

/** Jedinica: red, stupac ili kvadrat 3x3. `index` je 0–8. */
export interface Unit {
  readonly type: UnitType;
  readonly index: number;
  readonly cells: readonly CellIndex[];
}

/**
 * Zagonetka kako je vidi korisnik: vrijednosti i oznaka koje su zadane.
 * 0 znači prazno.
 */
export interface Puzzle {
  values: number[]; // duljina 81
  givens: boolean[]; // duljina 81
}

/**
 * Stanje nad kojim rade tehnike: upisane vrijednosti + STVARNI kandidati.
 * Za popunjenu ćeliju kandidati su 0.
 */
export interface SolverState {
  values: number[]; // duljina 81, 0 = prazno
  candidates: Mask[]; // duljina 81
}

/** Jedan kandidat u jednoj ćeliji. */
export interface CandidateRef {
  cell: CellIndex;
  digit: Digit;
}

/**
 * Uloga ćelije u uzorku — sučelje po ulozi bira boju isticanja.
 *  - target:  ćelija u koju se upisuje broj
 *  - base:    ćelije koje čine uzorak (par, trojka, pointing ćelije...)
 *  - pivot:   središte (XY-Wing, XYZ-Wing)
 *  - pincer:  krak (XY-Wing, XYZ-Wing, W-Wing krajevi)
 *  - link:    ćelije poveznice (W-Wing most, Skyscraper, lanci)
 *  - colorA / colorB: dvije boje kod bojanja i lanaca
 */
export type CellRole = 'target' | 'base' | 'pivot' | 'pincer' | 'link' | 'colorA' | 'colorB';

export interface PatternCell {
  cell: CellIndex;
  role: CellRole;
  /** Kandidati te ćelije koji su bitni za uzorak. */
  digits: Digit[];
}

/** Područje za Razinu 1 savjeta ("gdje gledati"). */
export interface Focus {
  units: Unit[];
  cells: CellIndex[];
}

export type TechniqueId =
  | 'nakedSingle'
  | 'hiddenSingle'
  | 'pointing'
  | 'boxLine'
  | 'nakedPair'
  | 'nakedTriple'
  | 'hiddenPair'
  | 'hiddenTriple'
  // Faza 2:
  | 'xWing'
  | 'xyWing'
  | 'remotePair'
  | 'xyzWing'
  | 'swordfish'
  | 'wWing'
  | 'skyscraper'
  | 'xyChain'
  | 'simpleColoring';

export type Difficulty = 'lako' | 'srednje' | 'tesko' | 'ekspert' | 'ekstremno';

/**
 * Strukturirani podaci za tekst objašnjenja (Razina 3). Tekst se gradi
 * kasnije iz ovih podataka, pa je svaka varijanta vezana uz tehniku.
 */
export type Explanation =
  | {
      kind: 'nakedSingle';
      cell: CellIndex;
      digit: Digit;
    }
  | {
      kind: 'hiddenSingle';
      cell: CellIndex;
      digit: Digit;
      unit: Unit;
    }
  | {
      kind: 'pointing';
      digit: Digit;
      /** Kvadrat u kojem je znamenka zatvorena u jedan red/stupac. */
      box: Unit;
      /** Red ili stupac iz kojeg se briše. */
      line: Unit;
      cells: CellIndex[];
    }
  | {
      kind: 'boxLine';
      digit: Digit;
      /** Red ili stupac u kojem je znamenka zatvorena u jedan kvadrat. */
      line: Unit;
      /** Kvadrat iz kojeg se briše. */
      box: Unit;
      cells: CellIndex[];
    }
  | {
      kind: 'nakedSubset';
      size: 2 | 3;
      unit: Unit;
      cells: CellIndex[];
      digits: Digit[];
    }
  | {
      kind: 'hiddenSubset';
      size: 2 | 3;
      unit: Unit;
      cells: CellIndex[];
      digits: Digit[];
    };

/** Jedan logički korak koji vraća tehnika. */
export interface Step {
  technique: TechniqueId;
  /** Upis broja (singleovi). */
  placement?: CandidateRef;
  /** Kandidati koji se brišu. */
  eliminations: CandidateRef[];
  /** Ćelije uzorka s ulogama (Razina 2). */
  pattern: PatternCell[];
  /** Područje za Razinu 1. */
  focus: Focus;
  /** Podaci za objašnjenje (Razina 3). */
  explanation: Explanation;
}

/** Svaka tehnika je funkcija istog sučelja. */
export interface Technique {
  id: TechniqueId;
  /** Ime na hrvatskom. */
  name: string;
  difficulty: Difficulty;
  /** Vraća prvi pronađeni korak ili null. Ne mijenja `state`. */
  find(state: SolverState): Step | null;
}
