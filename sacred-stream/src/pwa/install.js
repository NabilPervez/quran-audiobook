import { useSyncExternalStore } from 'react';

// Chrome/Edge/Android fire `beforeinstallprompt` once, early. Capture it at
// module load (imported from main.jsx) so the Install button can use it later.
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** { canPrompt, install } — canPrompt is true when the browser offered installation. */
export function useInstallPrompt() {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null);
  const install = async () => {
    if (!deferred) return false;
    const e = deferred;
    deferred = null;
    notify();
    await e.prompt();
    const { outcome } = await e.userChoice;
    return outcome === 'accepted';
  };
  return { canPrompt, install };
}
