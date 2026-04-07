import { create } from 'zustand';

export const usePlayerStore = create((set) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0, // 0 to 1
  duration: 0,
  currentTime: 0,
  volume: 1,
  isLyricsVisible: true,

  toggleLyrics: () => set((state) => ({ isLyricsVisible: !state.isLyricsVisible })),
  play: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  setProgress: (progress, currentTime) => set({ progress, currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
}));
