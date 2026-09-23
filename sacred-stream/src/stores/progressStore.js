import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// A chapter counts as finished once 98% has been heard (TTS files end in silence).
export const FINISHED_RATIO = 0.98;
// On resume, rewind a little so the listener regains context (Audible does this).
export const RESUME_REWIND_SEC = 3;

export const useProgressStore = create(
  persist(
    (set) => ({
      /** @type {Record<number, { position: number, duration: number, finished: boolean, updatedAt: number }>} */
      bySurah: {},
      /** id of the surah most recently played */
      lastSurahId: null,

      save: (id, position, duration) =>
        set((s) => {
          const prev = s.bySurah[id];
          const finished = Boolean(prev?.finished) || (duration > 0 && position / duration >= FINISHED_RATIO);
          return {
            lastSurahId: id,
            bySurah: { ...s.bySurah, [id]: { position, duration, finished, updatedAt: Date.now() } },
          };
        }),

      markFinished: (id) =>
        set((s) => ({
          bySurah: {
            ...s.bySurah,
            [id]: { duration: 0, ...s.bySurah[id], position: 0, finished: true, updatedAt: Date.now() },
          },
        })),

      reset: (id) =>
        set((s) => {
          const rest = { ...s.bySurah };
          delete rest[id];
          return { bySurah: rest };
        }),
    }),
    { name: 'ss.progress', version: 1 }
  )
);

/** Where playback should start for a surah: 0 if finished/new, else a few seconds before the saved spot. */
export function resumePointFor(id) {
  const entry = useProgressStore.getState().bySurah[id];
  if (!entry || entry.finished) return 0;
  return Math.max(0, entry.position - RESUME_REWIND_SEC);
}

/** 0..1 fraction listened for display (finished = 1). */
export function fractionListened(entry) {
  if (!entry) return 0;
  if (entry.finished) return 1;
  return entry.duration > 0 ? Math.min(1, entry.position / entry.duration) : 0;
}
