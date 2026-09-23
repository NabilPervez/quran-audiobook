import { useCallback, useState } from 'react';
import { Bookmark, BookmarkMinus, Copy, Play, Share2 } from 'lucide-react';
import { getSurah } from '../../data/catalog';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { bookmarkVerse, copyVerse, removeBookmark, shareVerse } from '../../lib/verseActions';
import ActionSheet from '../ActionSheet';

/**
 * Verse action menu (bookmark, copy, share, play from here).
 * Returns `openFor(verse)` and the sheet element to render.
 */
export function useVerseActions(surahId, onPlayFrom) {
  const [verse, setVerse] = useState(null);
  const bookmark = useBookmarkStore((s) =>
    verse ? s.items.find((b) => b.surahId === surahId && b.verse === verse.n) : undefined
  );
  const openFor = useCallback((v) => setVerse(v), []);

  const sheet = verse ? (
    <ActionSheet
      title={`${getSurah(surahId).nameTranslit} ${surahId}:${verse.n}`}
      subtitle={verse.en}
      onClose={() => setVerse(null)}
      items={[
        { icon: Play, label: 'Play from here', onSelect: () => onPlayFrom(verse) },
        bookmark
          ? { icon: BookmarkMinus, label: 'Remove bookmark', onSelect: () => removeBookmark(bookmark) }
          : { icon: Bookmark, label: 'Bookmark', onSelect: () => bookmarkVerse(surahId, verse.n, verse.start) },
        { icon: Copy, label: 'Copy text', onSelect: () => copyVerse(surahId, verse) },
        { icon: Share2, label: 'Share', onSelect: () => shareVerse(surahId, verse) },
      ]}
    />
  ) : null;

  return { openFor, sheet };
}
