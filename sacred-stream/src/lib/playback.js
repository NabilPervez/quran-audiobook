import { engine } from '../audio/engine';
import { usePlayerStore, selectIsPlaying } from '../stores/playerStore';

/** Play/resume a surah, or toggle pause if it is already the loaded one. */
export function playOrToggle(id) {
  if (usePlayerStore.getState().surahId === id) engine.toggle();
  else engine.load(id);
}

/** True when `id` is the loaded surah and audio is playing. */
export const useIsPlayingSurah = (id) =>
  usePlayerStore((s) => s.surahId === id && selectIsPlaying(s));
