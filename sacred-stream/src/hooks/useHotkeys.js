import { useEffect } from 'react';
import { engine } from '../audio/engine';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Desktop shortcuts: Space play/pause, ←/→ skip back/forward. */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (TYPING.has(el.tagName) || el.isContentEditable) return;
      if (!usePlayerStore.getState().surahId) return;
      const { skipBack, skipForward } = useSettingsStore.getState();

      if (e.code === 'Space' && el.tagName !== 'BUTTON' && el.tagName !== 'A') {
        e.preventDefault();
        engine.toggle();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        engine.skip(-skipBack);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        engine.skip(skipForward);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
