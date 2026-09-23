import { create } from 'zustand';

/** Transient app-wide UI state (not persisted). */
export const useUiStore = create((set) => ({
  /** id of the bookmark whose note is being edited */
  noteFor: null,
  openNote: (bookmarkId) => set({ noteFor: bookmarkId }),
  closeNote: () => set({ noteFor: null }),
}));

export const openNote = (bookmark) => useUiStore.getState().openNote(bookmark.id);
