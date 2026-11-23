import type { CellRole } from '../core/types';
import type { HintView } from '../game/types';

interface Props {
  hint: HintView;
  onMore: () => void;
  onApply: () => void;
  onClose: () => void;
}

const ROLE_ORDER: CellRole[] = ['target', 'pivot', 'pincer', 'base', 'link', 'colorA', 'colorB'];

export function HintPanel({ hint, onMore, onApply, onClose }: Props) {
  const d = hint.data;
  const close = (
    <button type="button" className="btn" onClick={onClose}>
      Zatvori
    </button>
  );

  if (d.kind === 'issue') {
    const fix =
      d.issue.kind === 'wrongValue'
        ? 'Obriši kriv broj'
        : d.issue.kind === 'missingCandidate'
          ? 'Vrati kandidat'
          : 'Obriši kandidat';
    return (
      <section className="hint-panel issue" aria-live="polite">
        <h2>Prvo ispravi bilješke ili brojeve</h2>
        <p>{d.text}</p>
        {d.details.length > 0 && (
          <ul>
            {d.details.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <div className="hint-actions">
          {close}
          <button type="button" className="btn primary" onClick={onApply}>
            {fix}
          </button>
        </div>
      </section>
    );
  }

  if (d.kind !== 'step') {
    return (
      <section className="hint-panel" aria-live="polite">
        <p>{d.kind === 'solved' ? 'Sudoku je već riješen.' : d.text}</p>
        <div className="hint-actions">{close}</div>
      </section>
    );
  }

  const t = d.text;
  return (
    <section className="hint-panel" aria-live="polite">
      <div className="hint-head">
        <h2>{hint.level >= 2 ? t.techniqueName : 'Savjet'}</h2>
        <span className="hint-level" aria-label={`Razina ${hint.level} od 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= hint.level ? 'dot on' : 'dot'} />
          ))}
        </span>
      </div>

      {hint.level === 1 && <p>{t.level1}</p>}

      {hint.level >= 2 && (
        <>
          <p>{t.level2}</p>
          <div className="legend">
            {ROLE_ORDER.filter((r) => t.roles[r]).map((r) => (
              <span key={r} className="legend-item">
                <span className={`swatch role-${r}`} />
                {t.roles[r]}
              </span>
            ))}
          </div>
        </>
      )}

      {hint.level === 3 && (
        <>
          <ol className="hint-steps">
            {t.steps.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          <p className="hint-result">{t.result}</p>
        </>
      )}

      <div className="hint-actions">
        {close}
        {hint.level < 3 ? (
          <button type="button" className="btn primary" onClick={onMore}>
            {hint.level === 1 ? 'Koja tehnika?' : 'Objasni'}
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onApply}>
            Primijeni
          </button>
        )}
      </div>
    </section>
  );
}
