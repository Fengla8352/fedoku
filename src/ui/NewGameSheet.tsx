import { useState } from 'react';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../core/generator/grade';
import type { Difficulty } from '../core/types';
import type { Action } from '../game/types';

export interface GeneratingState {
  difficulty: Difficulty;
  attempts: number;
  error?: string;
}

const DIFFICULTY_INFO: Record<Difficulty, string> = {
  lako: 'samo singleovi',
  srednje: 'pointing, box-line, goli parovi',
  tesko: 'skriveni parovi, X-Wing, XY-Wing',
  ekspert: 'Swordfish, W-Wing, Skyscraper…',
  ekstremno: 'XY-Chain, bojanje',
};

interface Props {
  currentText: string;
  generating: GeneratingState | null;
  onGenerate: (d: Difficulty) => void;
  onCancelGenerate: () => void;
  onAction: (a: Action) => void;
  onClose: () => void;
}

export function NewGameSheet({ currentText, generating, onGenerate, onCancelGenerate, onAction, onClose }: Props) {
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

        <h3>Novi sudoku</h3>
        <p className="hint-text">Težina se određuje prema najtežoj tehnici potrebnoj za rješenje.</p>
        {generating && !generating.error ? (
          <div className="generating" role="status">
            <span className="spinner" aria-hidden />
            <span>
              Generiram ({DIFFICULTY_LABEL[generating.difficulty]})…
              {generating.attempts > 0 && <small> pokušaj {generating.attempts + 1}</small>}
            </span>
            <button type="button" className="btn small" onClick={onCancelGenerate}>
              Odustani
            </button>
          </div>
        ) : (
          <div className="difficulty-list">
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" className="btn difficulty" onClick={() => onGenerate(d)}>
                <span>{DIFFICULTY_LABEL[d]}</span>
                <small>{DIFFICULTY_INFO[d]}</small>
              </button>
            ))}
          </div>
        )}
        {generating?.error && <p className="error-text">{generating.error}</p>}

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
