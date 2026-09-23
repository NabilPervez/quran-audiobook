import { useEffect } from 'react';
import { engine } from '../audio/engine';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { timeBus } from '../audio/timeBus';
import { loadVerses } from '../data/text';
import { verseIndexAt } from '../lib/verseTiming';
import { bookmarkCurrentPosition } from '../lib/verseActions';

/** Jump to the start of the previous/next verse of the loaded surah. */
async function stepVerse(delta) {
  const id = usePlayerStore.getState().surahId;
  const verses = await loadVerses(id);
  const { t } = timeBus.get();
  const i = verseIndexAt(verses, t);
  // "Previous" restarts the current verse unless we're right at its start.
  const target = delta < 0 && t - verses[i].start > 2 ? i : i + delta;
  engine.seek(verses[Math.max(0, Math.min(verses.length - 1, target))].start);
}

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Desktop shortcuts: Space play/pause, ←/→ skip, Shift+←/→ previous/next verse, B bookmark. */
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
      } else if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        stepVerse(e.key === 'ArrowLeft' ? -1 : 1).catch(() => {});
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        bookmarkCurrentPosition();
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
