import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const HOUR = 60 * 60 * 1000;

/**
 * "Update available" card. The new version only takes over when the listener
 * taps Reload, so an update never interrupts playback.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Installed apps can stay open for days; look for new versions hourly.
      if (registration) setInterval(() => registration.update().catch(() => {}), HOUR);
    },
  });

  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed top-3 inset-x-0 z-[75] flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-surface-container-highest shadow-2xl pl-4 pr-2 py-2 animate-fade-in">
        <RefreshCw size={18} className="text-primary" aria-hidden />
        <span className="text-sm font-semibold">A new version is available</span>
        <button type="button" onClick={() => setNeedRefresh(false)} className="px-3 h-9 rounded-lg text-sm text-on-surface-variant hover:text-on-surface">
          Later
        </button>
        <button type="button" onClick={() => updateServiceWorker(true)} className="px-4 h-9 rounded-lg bg-primary text-on-primary text-sm font-bold">
          Reload
        </button>
      </div>
    </div>
  );
}
