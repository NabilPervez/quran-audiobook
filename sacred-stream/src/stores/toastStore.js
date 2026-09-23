import { create } from 'zustand';

const DURATION_MS = 5000;
let timer = null;

/**
 * One toast at a time, Audible-style: "Bookmarked 18:23 · Add note · Undo".
 * actions: [{ label, onClick }]
 */
export const useToastStore = create((set) => ({
  toast: null,
  show: (message, actions = []) => {
    clearTimeout(timer);
    set({ toast: { id: Date.now(), message, actions } });
    timer = setTimeout(() => set({ toast: null }), DURATION_MS);
  },
  dismiss: () => {
    clearTimeout(timer);
    set({ toast: null });
  },
}));

export const toast = (message, actions) => useToastStore.getState().show(message, actions);
