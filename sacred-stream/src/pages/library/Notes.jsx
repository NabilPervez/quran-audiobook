import { useDeferredValue, useState } from 'react';
import { NotebookPen, Search } from 'lucide-react';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import BookmarkItem from '../../components/library/BookmarkItem';

export default function Notes() {
  const items = useBookmarkStore((s) => s.items);
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());
  const withNotes = items.filter((b) => b.note).sort((a, b) => b.updatedAt - a.updatedAt);
  const shown = q ? withNotes.filter((b) => b.note.toLowerCase().includes(q)) : withNotes;

  if (!withNotes.length) {
    return (
      <div className="text-center py-16 px-6">
        <span className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <NotebookPen size={26} aria-hidden />
        </span>
        <h2 className="font-bold text-lg mt-4">No notes yet</h2>
        <p className="text-on-surface-variant mt-1 max-w-sm mx-auto">
          Open a verse’s ⋯ menu and choose “Add note” to write a reflection. It’s saved with a bookmark so you can find the verse again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your notes"
          aria-label="Search your notes"
          className="w-full bg-surface-container-high rounded-full py-2 pl-9 pr-4 text-sm placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      {shown.length ? (
        <ul>
          {shown.map((b) => (
            <BookmarkItem key={b.id} bookmark={b} />
          ))}
        </ul>
      ) : (
        <p className="text-on-surface-variant text-center py-10">No notes match “{query.trim()}”.</p>
      )}
    </>
  );
}
