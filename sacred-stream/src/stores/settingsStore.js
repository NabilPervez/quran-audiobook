import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SPEEDS = [0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
export const TEXT_SCALES = [0.9, 1, 1.15, 1.3, 1.5];

// New keys get their defaults automatically: persist merges stored state over these.
export const useSettingsStore = create(
  persist(
    (set) => ({
      rate: 1,
      skipBack: 15,
      skipForward: 30,
      autoAdvance: true,
      // Reading
      showArabic: true,
      showEnglish: true,
      textScale: 1,
      autoScroll: true,
      set: (patch) => set(patch),
    }),
    { name: 'ss.settings', version: 1 }
  )
);
