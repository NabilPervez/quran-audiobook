import { Bookmark } from 'lucide-react';
import { bookmarkCurrentPosition } from '../../lib/verseActions';

/** One tap saves the current verse and time: no dialog, so listening isn't interrupted. */
export default function BookmarkButton() {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        bookmarkCurrentPosition();
      }}
      aria-label="Bookmark this moment"
      title="Bookmark (B)"
      className="min-w-11 h-11 px-2 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
    >
      <Bookmark size={20} aria-hidden />
    </button>
  );
}
