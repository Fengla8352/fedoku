import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Gumb "Instaliraj" (Android/Chrome) — pojavi se samo kad preglednik dopušta instalaciju. */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  if (!event) return null;
  return async () => {
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  };
}

/** Obavijesti: aplikacija spremna za rad bez interneta / dostupna je nova verzija. */
export function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Preglednik sam provjerava novu verziju samo pri učitavanju stranice; instalirana
    // aplikacija se rijetko ponovno učitava, pa provjeravamo i pri povratku u aplikaciju
    // te svakih 30 minuta.
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  if (!offlineReady && !needRefresh) return null;
  return (
    <div className="toast" role="status">
      <span>{needRefresh ? 'Dostupna je nova verzija.' : 'Aplikacija sada radi i bez interneta.'}</span>
      {needRefresh && (
        <button type="button" className="btn small primary" onClick={() => updateServiceWorker(true)}>
          Osvježi
        </button>
      )}
      <button
        type="button"
        className="icon-btn"
        aria-label="Zatvori"
        onClick={() => {
          setOfflineReady(false);
          setNeedRefresh(false);
        }}
      >
        ✕
      </button>
    </div>
  );
}
