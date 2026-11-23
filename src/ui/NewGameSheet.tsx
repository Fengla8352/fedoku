import { useState } from 'react';
import { parseValues } from '../core/grid';
import { DIFFICULTY_LABEL, SAMPLES } from '../game/samples';
import type { Action } from '../game/types';

interface Props {
  currentText: string;
  onAction: (a: Action) => void;
  onClose: () => void;
}

export function NewGameSheet({ currentText, onAction, onClose }: Props) {
  const [text, setText] = useState('');
  const run = (a: Action) => {
    onAction(a);
    onClose();
  };
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Nova igra" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Nova igra</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Zatvori">
            ✕
          </button>
        </div>

        <h3>Ručni unos</h3>
        <p className="hint-text">Prepiši sudoku iz druge aplikacije — zadane brojeve i one koje si već riješio.</p>
        <button type="button" className="btn primary wide" onClick={() => run({ type: 'newEntry' })}>
          Prazna mreža za unos
        </button>

        <h3>Unos kao tekst</h3>
        <p className="hint-text">81 znak, red po red; 0 ili . za prazno polje.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="53..7....6..195....98....6.8...6...34..8.3..17..."
          aria-label="Sudoku kao tekst"
        />
        <button
          type="button"
          className="btn wide"
          disabled={!text.trim()}
          onClick={() => run({ type: 'loadText', text })}
        >
          Učitaj tekst
        </button>

        <h3>Primjeri</h3>
        <p className="hint-text">Generator po težini dolazi uskoro.</p>
        <div className="sample-grid">
          {SAMPLES.map((s) => (
            <button
              key={s.difficulty}
              type="button"
              className="btn"
              onClick={() => run({ type: 'loadPuzzle', values: parseValues(s.puzzle) })}
            >
              {DIFFICULTY_LABEL[s.difficulty]}
            </button>
          ))}
        </div>

        {currentText.replace(/\./g, '').length > 0 && (
          <>
            <h3>Trenutna zagonetka kao tekst</h3>
            <input className="export" readOnly value={currentText} onFocus={(e) => e.target.select()} aria-label="Trenutna zagonetka" />
          </>
        )}
      </div>
    </div>
  );
}
