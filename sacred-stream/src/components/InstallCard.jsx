import { useState } from 'react';
import { Share, Smartphone, X } from 'lucide-react';
import { isIOS, isStandalone, useInstallPrompt } from '../pwa/install';

const DISMISS_KEY = 'ss.installDismissed';

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/** Home-screen invitation: native prompt on Android/desktop Chrome, instructions on iOS. */
export default function InstallCard() {
  const { canPrompt, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(wasDismissed);
  if (dismissed || isStandalone()) return null;
  const ios = isIOS();
  if (!canPrompt && !ios) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode: just hide for this session.
    }
  };

  return (
    <section className="relative rounded-2xl bg-surface-container-low p-4 pr-12 flex gap-4 items-center" aria-labelledby="install-heading">
      <span className="w-11 h-11 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
        <Smartphone size={22} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="install-heading" className="font-bold">
          Install the app
        </h2>
        {canPrompt ? (
          <p className="text-sm text-on-surface-variant">Opens full screen, with lock-screen controls and offline listening.</p>
        ) : (
          <p className="text-sm text-on-surface-variant">
            In Safari, tap <Share size={14} className="inline -mt-0.5" aria-label="Share" /> then “Add to Home Screen”.
          </p>
        )}
        {canPrompt && (
          <button type="button" onClick={install} className="mt-3 px-5 h-10 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-110">
            Install
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface">
        <X size={18} aria-hidden />
      </button>
    </section>
  );
}
