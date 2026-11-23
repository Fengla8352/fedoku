import type { Message } from '../game/types';

export function MessageBar({ message, onClose }: { message: Message | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className={`message ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
      <div className="message-body">
        <p>{message.text}</p>
        {message.details && (
          <ul>
            {message.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="icon-btn" onClick={onClose} aria-label="Zatvori poruku">
        ✕
      </button>
    </div>
  );
}
