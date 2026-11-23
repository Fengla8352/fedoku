import type { TechniqueId } from '../types';

/**
 * Stvarne zagonetke (jedinstveno rješenje) za svaku tehniku. Za svaku je
 * navedena tehnika NAJTEŽA potrebna kad se uvijek bira najjednostavniji korak,
 * osim za Swordfish, koji se ovdje pojavljuje uz još težu tehniku.
 */
export const FIXTURES: { technique: TechniqueId; hardest: boolean; puzzle: string }[] = [
  { technique: 'nakedSingle', hardest: true, puzzle: '...4..1.2.451.7..6...6...........2.78..34..6........944........3.2...8..5...32.7.' },
  { technique: 'hiddenSingle', hardest: true, puzzle: '.....4.7..6..7859...3..2..4........1..4..6...6.28.795.7.9.5....3.....7.........2.' },
  { technique: 'pointing', hardest: true, puzzle: '.......6..16...45...3.8..7......1....5....9..14.2.............8..59..74..2.3..1.6' },
  { technique: 'boxLine', hardest: true, puzzle: '.4.1.......56.789...72.8...4.......9283.1......1...23..58............7.4.2..8.9.1' },
  { technique: 'nakedPair', hardest: true, puzzle: '.246...8.....1..5.3..97.1....8..7.3.2........9.7......4....95.....12...3.1..5..48' },
  { technique: 'nakedTriple', hardest: true, puzzle: '.49....2....2...6...7..958.....8.9.497........21....3....398.....5..........65.91' },
  { technique: 'hiddenPair', hardest: true, puzzle: '...54.2.......75...9.....8.......4.28....6.....79...1.6...5..9...1.7..3...38.....' },
  { technique: 'hiddenTriple', hardest: true, puzzle: '.8..9.3....25...7...4.........9.7.6..568....7.....34...95...81...........172..9..' },
  { technique: 'xWing', hardest: true, puzzle: '4..95..7..21.................52....6.1...43..8.......1...53.92..52..1.8...3.8....' },
  { technique: 'xyWing', hardest: true, puzzle: '.1...3.7..5.48..6....2.5..4.8..4..........2.529.3.........1..4.3.8...9.....6.....' },
  { technique: 'remotePair', hardest: true, puzzle: '..3....9..8.915............6...2..1...1.3..5.42...86..25...1..4....6.3....6...9..' },
  { technique: 'xyzWing', hardest: true, puzzle: '.6.9..82.8.2...7..5...........3...7....6.1....1..9.3.23.4.....5..1.....66..453...' },
  { technique: 'swordfish', hardest: false, puzzle: '8.....6...9..4.351.1.6...9..5...6.....2..........73...53....8..7..53.46..6...81..' },
  { technique: 'wWing', hardest: true, puzzle: '3...4......9.........6.84.3.8..63....7...43........28.7..2..5...6......9..2.5..41' },
  { technique: 'skyscraper', hardest: true, puzzle: '.3..4.....7..35..2.5....7.1..73...1.39.2.......1..4.......9.........148...472.9..' },
  { technique: 'xyChain', hardest: true, puzzle: '.8.16.75..3.5..4....52..6.3.....4..6..6...2...24....8.5..8..3......9..7.9.....8..' },
  { technique: 'simpleColoring', hardest: true, puzzle: '5..8.4.2.....9..........3.1.9...1..7....2....6.7..3.5...61.......9.5.8..84.9..7..' },
];
