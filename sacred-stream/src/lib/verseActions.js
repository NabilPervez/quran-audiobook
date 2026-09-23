import { getSurah, NARRATION } from '../data/catalog';
import { loadVerses } from '../data/text';
import { timeBus } from '../audio/timeBus';
import { usePlayerStore } from '../stores/playerStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { toast } from '../stores/toastStore';
import { openNote } from '../stores/uiStore';
import { verseIndexAt } from './verseTiming';

/** Bookmark a verse and confirm with a toast offering "Add note" and "Undo". */
export function bookmarkVerse(surahId, verse, time, onAddNote = openNote) {
  const store = useBookmarkStore.getState();
  const existing = store.items.find((b) => b.surahId === surahId && b.verse === verse);
  if (existing) {
    toast(`Already bookmarked ${surahId}:${verse}`, [{ label: existing.note ? 'Edit note' : 'Add note', onClick: () => onAddNote(existing) }]);
    return existing;
  }
  const bookmark = store.add({ surahId, verse, time });
  toast(`Bookmarked ${surahId}:${verse}`, [
    { label: 'Add note', onClick: () => onAddNote(bookmark) },
    { label: 'Undo', onClick: () => useBookmarkStore.getState().remove(bookmark.id) },
  ]);
  return bookmark;
}

/** Bookmark whatever verse is playing right now. */
export async function bookmarkCurrentPosition(onAddNote = openNote) {
  const surahId = usePlayerStore.getState().surahId;
  if (!surahId) return null;
  const { t } = timeBus.get();
  let verse = 1;
  try {
    const verses = await loadVerses(surahId);
    verse = verses[verseIndexAt(verses, t)].n;
  } catch {
    // Text unavailable offline: still save the time, attached to verse 1.
  }
  return bookmarkVerse(surahId, verse, t, onAddNote);
}

export function removeBookmark(bookmark) {
  useBookmarkStore.getState().remove(bookmark.id);
  toast(`Removed bookmark ${bookmark.surahId}:${bookmark.verse}`, [
    { label: 'Undo', onClick: () => useBookmarkStore.getState().restore(bookmark) },
  ]);
}

export const verseLink = (surahId, n) =>
  `${window.location.origin}/surah/${surahId}?player=${surahId}&view=read&v=${n}`;

const citation = (surahId, verse) =>
  `“${verse.en}”\n— Quran ${surahId}:${verse.n} (${getSurah(surahId).nameTranslit}), trans. ${NARRATION.translation}`;

export async function copyVerse(surahId, verse) {
  try {
    await navigator.clipboard.writeText(citation(surahId, verse));
    toast(`Copied ${surahId}:${verse.n}`);
  } catch {
    toast('Couldn’t copy. Select the text instead.');
  }
}

export async function shareVerse(surahId, verse) {
  const url = verseLink(surahId, verse.n);
  if (navigator.share) {
    try {
      await navigator.share({ title: `Quran ${surahId}:${verse.n}`, text: citation(surahId, verse), url });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // user closed the share sheet
    }
  }
  try {
    await navigator.clipboard.writeText(`${citation(surahId, verse)}\n${url}`);
    toast('Link copied');
  } catch {
    toast('Couldn’t share this verse.');
  }
}
