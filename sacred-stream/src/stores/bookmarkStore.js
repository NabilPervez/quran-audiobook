import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * @typedef {{ id: string, surahId: number, verse: number, time: number, note: string, createdAt: number, updatedAt: number }} Bookmark
 */

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useBookmarkStore = create(
  persist(
    (set, get) => ({
      /** @type {Bookmark[]} newest first */
      items: [],

      /** Add a bookmark (one per verse); returns the new or existing bookmark. */
      add: ({ surahId, verse, time }) => {
        const existing = get().items.find((b) => b.surahId === surahId && b.verse === verse);
        if (existing) return existing;
        const now = Date.now();
        const bookmark = { id: newId(), surahId, verse, time, note: '', createdAt: now, updatedAt: now };
        set((s) => ({ items: [bookmark, ...s.items] }));
        return bookmark;
      },

      setNote: (id, note) =>
        set((s) => ({ items: s.items.map((b) => (b.id === id ? { ...b, note: note.slice(0, 2000), updatedAt: Date.now() } : b)) })),

      remove: (id) => set((s) => ({ items: s.items.filter((b) => b.id !== id) })),

      /** Put a removed bookmark back (for Undo). */
      restore: (bookmark) =>
        set((s) =>
          s.items.some((b) => b.id === bookmark.id)
            ? s
            : { items: [...s.items, bookmark].sort((a, b) => b.createdAt - a.createdAt) }
        ),
    }),
    { name: 'ss.bookmarks', version: 1 }
  )
);

export const bookmarkFor = (surahId, verse) => (s) => s.items.find((b) => b.surahId === surahId && b.verse === verse);
