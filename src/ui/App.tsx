import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DIFFICULTY_LABEL } from '../core/generator/grade';
import type { Difficulty } from '../core/types';
import { startGeneration, type GenerationJob } from '../game/generatorClient';
import { findConflicts } from '../core/grid';
import { digitCounts, displayedNotes, givensText, initialState, reducer } from '../game/reducer';
import { loadGame, loadSettings, saveGame, saveSettings, type Settings, type Theme } from '../game/storage';
import type { Action } from '../game/types';
import { Board } from './Board';
import { HintPanel } from './HintPanel';
import { boardHint } from './hintMarks';
import { Keypad } from './Keypad';
import { MessageBar } from './MessageBar';
import { NewGameSheet, type GeneratingState } from './NewGameSheet';
import { PwaPrompt, useInstallPrompt } from './PwaPrompt';
import './styles.css';

const THEME_NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const svg = (children: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    {children}
  </svg>
);
const THEME_ICON: Record<Theme, React.ReactNode> = {
  system: svg(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </>,
  ),
  light: svg(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
  ),
  dark: svg(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />),
};
const HIGHLIGHT_ICON = (on: boolean) =>
  svg(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill={on ? 'currentColor' : 'none'} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill={on ? 'currentColor' : 'none'} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>,
  );
const THEME_LABEL: Record<Theme, string> = { system: 'Tema: sustav', light: 'Tema: svijetla', dark: 'Tema: tamna' };

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadGame() ?? initialState());
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [sheetOpen, setSheetOpen] = useState(false);
  const install = useInstallPrompt();
  const [generating, setGenerating] = useState<GeneratingState | null>(null);
  const job = useRef<GenerationJob | null>(null);

  const cancelGenerate = useCallback(() => {
    job.current?.cancel();
    job.current = null;
    setGenerating(null);
  }, []);

  const generate = useCallback((difficulty: Difficulty) => {
    job.current?.cancel();
    setGenerating({ difficulty, attempts: 0 });
    const j = startGeneration(difficulty, (attempts) => setGenerating((g) => (g ? { ...g, attempts } : g)));
    job.current = j;
    j.promise.then(
      (r) => {
        if (job.current !== j) return;
        job.current = null;
        setGenerating(null);
        setSheetOpen(false);
        dispatch({ type: 'loadPuzzle', values: r.puzzle, rating: { difficulty: r.difficulty, hardest: r.hardest } });
      },
      (e: unknown) => {
        if (job.current !== j) return;
        job.current = null;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setGenerating({ difficulty, attempts: 0, error: 'Generiranje nije uspjelo. Pokušaj ponovno.' });
      },
    );
  }, []);

  const closeSheet = useCallback(() => {
    cancelGenerate();
    setSheetOpen(false);
  }, [cancelGenerate]);

  useEffect(() => saveGame(state), [state]);
  useEffect(() => {
    saveSettings(settings);
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const act = useCallback((a: Action) => dispatch(a), []);
  const select = useCallback((cell: number) => dispatch({ type: 'select', cell }), []);

  // Tipkovnica (računalo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheetOpen || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const k = e.key;
      if (/^[1-9]$/.test(k)) dispatch({ type: 'input', digit: Number(k) });
      else if (k === 'Backspace' || k === 'Delete' || k === '0') dispatch({ type: 'erase' });
      else if (k === 'ArrowUp') dispatch({ type: 'move', dRow: -1, dCol: 0 });
      else if (k === 'ArrowDown') dispatch({ type: 'move', dRow: 1, dCol: 0 });
      else if (k === 'ArrowLeft') dispatch({ type: 'move', dRow: 0, dCol: -1 });
      else if (k === 'ArrowRight') dispatch({ type: 'move', dRow: 0, dCol: 1 });
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') dispatch({ type: 'undo' });
      else if (k === 'n' || k === 'p') dispatch({ type: 'togglePencil' });
      else if (k === 'h' || k === '?') dispatch({ type: 'hint' });
      else if (k === 'Escape') dispatch({ type: 'closeHint' });
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const notes = useMemo(() => displayedNotes(state), [state.values, state.notes, state.autoElim, state.autoCandidates]); // eslint-disable-line react-hooks/exhaustive-deps
  const conflicts = useMemo(() => findConflicts(state.values), [state.values]);
  const counts = useMemo(() => digitCounts(state.values), [state.values]);
  const isEntry = state.phase === 'entry';
  const bHint = useMemo(() => boardHint(state.hint), [state.hint]);

  return (
    <div className="app">
      <header className="top">
        <div className="title">
          <h1>Fedoku</h1>
          {state.phase === 'play' && state.rating && (
            <span className="chip" title="Težina prema najtežoj potrebnoj tehnici">
              {'beyond' in state.rating ? 'Izvan dosega tehnika' : DIFFICULTY_LABEL[state.rating.difficulty]}
            </span>
          )}
        </div>
        <div className="top-actions">
          {install && (
            <button type="button" className="btn small" onClick={install}>
              Instaliraj
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettings((s) => ({ ...s, highlightSame: !s.highlightSame }))}
            aria-pressed={settings.highlightSame}
            title="Isticanje istih brojeva"
            aria-label="Isticanje istih brojeva"
          >
            {HIGHLIGHT_ICON(settings.highlightSame)}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettings((s) => ({ ...s, theme: THEME_NEXT[s.theme] }))}
            title={THEME_LABEL[settings.theme]}
            aria-label={THEME_LABEL[settings.theme]}
          >
            {THEME_ICON[settings.theme]}
          </button>
          <button type="button" className="btn small" onClick={() => setSheetOpen(true)}>
            Nova igra
          </button>
        </div>
      </header>

      {isEntry && (
        <div className="entry-bar">
          <span className="entry-title">Ručni unos</span>
          <div className="segmented" role="radiogroup" aria-label="Što upisujem">
            <button
              type="button"
              role="radio"
              aria-checked={state.entryLayer === 'given'}
              className={state.entryLayer === 'given' ? 'on' : ''}
              onClick={() => act({ type: 'setEntryLayer', layer: 'given' })}
            >
              Zadani brojevi
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={state.entryLayer === 'own'}
              className={state.entryLayer === 'own' ? 'on own' : ''}
              onClick={() => act({ type: 'setEntryLayer', layer: 'own' })}
            >
              Moji brojevi
            </button>
          </div>
        </div>
      )}

      <MessageBar message={state.message} onClose={() => act({ type: 'dismissMessage' })} />

      <Board
        values={state.values}
        givens={state.givens}
        notes={isEntry ? new Array(81).fill(0) : notes}
        selected={state.selected}
        conflicts={conflicts}
        wrong={state.wrong}
        highlightSame={settings.highlightSame}
        hint={bHint}
        onSelect={select}
      />

      {state.hint && (
        <HintPanel
          hint={state.hint}
          onMore={() => act({ type: 'hint' })}
          onApply={() => act({ type: 'applyHint' })}
          onClose={() => act({ type: 'closeHint' })}
        />
      )}

      {isEntry ? (
        <div className="toolbar">
          <button type="button" className="tool" onClick={() => act({ type: 'undo' })} disabled={!state.history.length}>
            <span aria-hidden>↶</span>Poništi
          </button>
          <button type="button" className="tool" onClick={() => act({ type: 'erase' })}>
            <span aria-hidden>⌫</span>Briši
          </button>
          <button type="button" className="tool" onClick={() => act({ type: 'newEntry' })}>
            <span aria-hidden>▢</span>Očisti
          </button>
          <button type="button" className="tool primary" onClick={() => act({ type: 'startFromEntry' })}>
            <span aria-hidden>✓</span>Provjeri i igraj
          </button>
        </div>
      ) : (
        <div className="toolbar">
          <button type="button" className="tool" onClick={() => act({ type: 'undo' })} disabled={!state.history.length}>
            <span aria-hidden>↶</span>Poništi
          </button>
          <button type="button" className="tool" onClick={() => act({ type: 'erase' })}>
            <span aria-hidden>⌫</span>Briši
          </button>
          <button
            type="button"
            className={state.pencil ? 'tool on' : 'tool'}
            aria-pressed={state.pencil}
            onClick={() => act({ type: 'togglePencil' })}
          >
            <span aria-hidden>✎</span>Olovka
          </button>
          <button
            type="button"
            className={state.autoCandidates ? 'tool on' : 'tool'}
            aria-pressed={state.autoCandidates}
            onClick={() => act({ type: 'toggleAuto' })}
          >
            <span aria-hidden>⋯</span>Auto
          </button>
          <button
            type="button"
            className={state.hint ? 'tool on' : 'tool'}
            onClick={() => act({ type: 'hint' })}
            disabled={state.solved}
          >
            <span aria-hidden>💡</span>Savjet
          </button>
          <button type="button" className="tool" onClick={() => act({ type: 'check' })}>
            <span aria-hidden>✓</span>Provjeri
          </button>
          <button type="button" className="tool" onClick={() => act({ type: 'backToEntry' })}>
            <span aria-hidden>✐</span>Uredi
          </button>
        </div>
      )}

      <Keypad
        counts={counts}
        pencil={state.pencil && !isEntry}
        showCounts={!isEntry}
        onDigit={(d) => act({ type: 'input', digit: d })}
      />

      <PwaPrompt />

      {sheetOpen && (
        <NewGameSheet
          currentText={givensText(state)}
          generating={generating}
          onGenerate={generate}
          onCancelGenerate={cancelGenerate}
          onAction={act}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
