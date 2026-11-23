import type { Difficulty } from '../core/types';

/**
 * Nekoliko gotovih zagonetki dok generator (Faza 5) ne bude gotov.
 * Težina = najteža tehnika potrebna za rješenje.
 */
export const SAMPLES: { difficulty: Difficulty; puzzle: string }[] = [
  { difficulty: 'lako', puzzle: '...4..1.2.451.7..6...6...........2.78..34..6........944........3.2...8..5...32.7.' },
  { difficulty: 'srednje', puzzle: '.......6..16...45...3.8..7......1....5....9..14.2.............8..59..74..2.3..1.6' },
  { difficulty: 'tesko', puzzle: '4..95..7..21.................52....6.1...43..8.......1...53.92..52..1.8...3.8....' },
  { difficulty: 'ekspert', puzzle: '3...4......9.........6.84.3.8..63....7...43........28.7..2..5...6......9..2.5..41' },
  { difficulty: 'ekstremno', puzzle: '.8.16.75..3.5..4....52..6.3.....4..6..6...2...24....8.5..8..3......9..7.9.....8..' },
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  lako: 'Lako',
  srednje: 'Srednje',
  tesko: 'Teško',
  ekspert: 'Ekspert',
  ekstremno: 'Ekstremno',
};
