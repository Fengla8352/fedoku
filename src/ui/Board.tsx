import { memo } from 'react';
import { boxOf, colOf, rowOf } from '../core/grid';
import { cellName } from '../core/format';
import type { CellIndex, Mask } from '../core/types';
import type { BoardHint } from './hintMarks';

interface BoardProps {
  values: number[];
  givens: boolean[];
  notes: Mask[];
  selected: CellIndex | null;
  conflicts: Set<CellIndex>;
  wrong: CellIndex[];
  highlightSame: boolean;
  hint: BoardHint | null;
  /** Pauza: brojevi i bilješke se ne prikazuju. */
  paused?: boolean;
  /** Animacija vala: kašnjenje (ms) po ćeliji; `key` ponovno pokreće animaciju. */
  wave?: { key: number; delays: Map<CellIndex, number> } | null;
  onResume?: () => void;
  onSelect: (cell: CellIndex) => void;
}

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const Board = memo(function Board(p: BoardProps) {
  const sel = p.selected;
  const selValue = sel !== null ? p.values[sel] : 0;
  const wrong = new Set(p.wrong);

  if (p.paused) {
    // Za vrijeme pauze ne crtamo ni brojeve ni bilješke — samo praznu mrežu.
    return (
      <div className="board paused" aria-label="Igra je pauzirana">
        {p.values.map((_, i) => {
          const classes = ['cell'];
          if (colOf(i) % 3 === 2 && colOf(i) < 8) classes.push('edge-r');
          if (rowOf(i) % 3 === 2 && rowOf(i) < 8) classes.push('edge-b');
          return <div key={i} className={classes.join(' ')} />;
        })}
        <div className="pause-overlay">
          <p>Pauza</p>
          <button type="button" className="btn primary" onClick={p.onResume}>
            ▶ Nastavi
          </button>
        </div>
      </div>
    );
  }

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
        const h = p.hint;
        if (h?.area.has(i)) classes.push('hint-area');
        const role = h?.roles.get(i);
        if (role) classes.push(`role role-${role}`);
        const noteMask = v ? 0 : p.notes[i] || h?.candidates.get(i) || 0;
        const marks = h?.marks.get(i);
        const label = `${cellName(i)}${v ? `: ${v}` : ', prazno'}`;
        const delay = p.wave?.delays.get(i);
        if (delay !== undefined) classes.push('wave');
        return (
          <div
            // Nova vrijednost ključa ponovno pokreće animaciju iste ćelije.
            key={delay !== undefined ? `${i}-${p.wave!.key}` : i}
            role="gridcell"
            aria-label={label}
            aria-selected={i === sel}
            className={classes.join(' ')}
            style={delay !== undefined ? ({ '--d': `${delay}ms` } as React.CSSProperties) : undefined}
            onPointerDown={() => p.onSelect(i)}
          >
            {v ? (
              <span className="value">{v}</span>
            ) : noteMask || marks ? (
              <div className="notes">
                {NOTE_DIGITS.map((d) => {
                  const present = (noteMask & (1 << d)) !== 0;
                  const m = marks?.get(d);
                  let cls = 'note';
                  if (m) cls += ` mark-${m}`;
                  else if (p.highlightSame && present && d === selValue) cls += ' hl';
                  return (
                    <span key={d} className={cls}>
                      {present || m === 'place' ? d : ''}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
