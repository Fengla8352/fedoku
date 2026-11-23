interface KeypadProps {
  counts: number[];
  pencil: boolean;
  showCounts: boolean;
  onDigit: (d: number) => void;
}

export function Keypad({ counts, pencil, showCounts, onDigit }: KeypadProps) {
  return (
    <div className={pencil ? 'keypad pencil' : 'keypad'}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
        const left = 9 - counts[d];
        const done = showCounts && left <= 0;
        return (
          <button
            key={d}
            type="button"
            className={done ? 'key done' : 'key'}
            onClick={() => onDigit(d)}
            aria-label={showCounts ? `${d}, preostalo ${Math.max(left, 0)}` : String(d)}
          >
            <span className="key-digit">{d}</span>
            {showCounts && <span className="key-count">{done ? '✓' : left}</span>}
          </button>
        );
      })}
    </div>
  );
}
