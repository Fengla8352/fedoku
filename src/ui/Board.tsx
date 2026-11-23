import { memo } from 'react';
import { boxOf, colOf, rowOf } from '../core/grid';
import { cellName } from '../core/format';
import type { CellIndex, Mask } from '../core/types';

interface BoardProps {
  values: number[];
  givens: boolean[];
  notes: Mask[];
  selected: CellIndex | null;
  conflicts: Set<CellIndex>;
  wrong: CellIndex[];
  highlightSame: boolean;
  onSelect: (cell: CellIndex) => void;
}

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const Board = memo(function Board(p: BoardProps) {
  const sel = p.selected;
  const selValue = sel !== null ? p.values[sel] : 0;
  const wrong = new Set(p.wrong);

  return (
    <div className="board" role="grid" aria-label="Sudoku mreža">
      {p.values.map((v, i) => {
        const r = rowOf(i);
        const c = colOf(i);
        const classes = ['cell'];
        if (c % 3 === 2 && c < 8) classes.push('edge-r');
        if (r % 3 === 2 && r < 8) classes.push('edge-b');
        if (v) classes.push(p.givens[i] ? 'given' : 'own');
        if (sel !== null) {
          if (i === sel) classes.push('selected');
          else if (rowOf(sel) === r || colOf(sel) === c || boxOf(sel) === boxOf(i)) classes.push('peer');
          if (p.highlightSame && selValue && v === selValue && i !== sel) classes.push('same');
        }
        if (p.conflicts.has(i)) classes.push('conflict');
        if (wrong.has(i)) classes.push('wrong');
        const label = `${cellName(i)}${v ? `: ${v}` : ', prazno'}`;
        return (
          <div
            key={i}
            role="gridcell"
            aria-label={label}
            aria-selected={i === sel}
            className={classes.join(' ')}
            onPointerDown={() => p.onSelect(i)}
          >
            {v ? (
              <span className="value">{v}</span>
            ) : p.notes[i] ? (
              <div className="notes">
                {NOTE_DIGITS.map((d) => (
                  <span
                    key={d}
                    className={p.highlightSame && d === selValue && p.notes[i] & (1 << d) ? 'note hl' : 'note'}
                  >
                    {p.notes[i] & (1 << d) ? d : ''}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
