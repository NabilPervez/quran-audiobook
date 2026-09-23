import { engine } from '../audio/engine';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayerSheet } from './usePlayerSheet';

/** Start playback at a bookmark and show it in the reader. */
export function useOpenBookmark() {
  const { open } = usePlayerSheet();
  return (b) => {
    if (usePlayerStore.getState().surahId === b.surahId) {
      engine.seek(b.time);
      engine.play();
    } else {
      engine.load(b.surahId, { at: b.time });
    }
    open(b.surahId, { view: 'read', verse: b.verse });
  };
}
