import type { CellRole } from '../core/types';
import type { HintView } from '../game/types';

interface Props {
  hint: HintView;
  /** Kandidati (mali brojevi) nisu prikazani u mreži — treba ih objasniti. */
  candidatesHidden: boolean;
  onMore: () => void;
  onApply: () => void;
  onClose: () => void;
}

const ROLE_ORDER: CellRole[] = ['target', 'pivot', 'pincer', 'base', 'link', 'colorA', 'colorB'];

export function HintPanel({ hint, candidatesHidden, onMore, onApply, onClose }: Props) {
  const d = hint.data;
  const close = (
    <button type="button" className="btn" onClick={onClose}>
      Zatvori
    </button>
  );

  if (d.kind === 'wrongValue') {
    return (
      <section className="hint-panel issue" aria-live="polite">
        <h2>{d.cells.length === 1 ? 'Broj nije točan' : 'Brojevi nisu točni'}</h2>
        <p>{d.text}</p>
        {d.details.length > 0 && (
          <ul>
            {d.details.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <p className="hint-muted">
          Sudoku ima samo jedno rješenje i ovaj se broj s njim ne slaže. Dok stoji u mreži, zaključci koji iz njega
          slijede mogu biti krivi — zato ga savjet javlja prvo.
        </p>
        <div className="hint-actions">
          {close}
          <button type="button" className="btn primary" onClick={onApply}>
            {d.cells.length === 1 ? 'Obriši taj broj' : 'Obriši te brojeve'}
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
        <h2>{t.techniqueName}</h2>
        <span className="hint-level" aria-label={`Razina ${hint.level} od 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= hint.level ? 'dot on' : 'dot'} />
          ))}
        </span>
      </div>

      {hint.level === 1 && (
        <>
          <p className="hint-what">
            <strong>Što je to? </strong>
            {t.description}
          </p>
          <p>
            <strong>Gdje: </strong>
            {t.level1}
          </p>
        </>
      )}

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
          {t.usesCandidates && candidatesHidden && (
            <p className="hint-muted">
              Mali brojevi u označenim ćelijama su <strong>kandidati</strong>: brojevi kojih još nema u redu, stupcu ni
              kvadratu te ćelije (i koje ranije tehnike nisu isključile). Uključi „Auto” da ih vidiš u cijeloj mreži.
            </p>
          )}
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
            {hint.level === 1 ? 'Pokaži uzorak' : 'Objasni korak po korak'}
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
