import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { getSurah } from '../../data/catalog';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import BookmarkItem from '../../components/library/BookmarkItem';

const SORTS = [
  ['recent', 'Recent'],
  ['surah', 'By surah'],
];

export default function Bookmarks() {
  const items = useBookmarkStore((s) => s.items);
  const [sort, setSort] = useState('recent');

  const groups = useMemo(() => {
    if (sort === 'recent') return null;
    const bySurah = new Map();
    [...items]
      .sort((a, b) => a.surahId - b.surahId || a.verse - b.verse)
      .forEach((b) => bySurah.set(b.surahId, [...(bySurah.get(b.surahId) ?? []), b]));
    return [...bySurah.entries()];
  }, [items, sort]);

  if (!items.length) {
    return (
      <div className="text-center py-16 px-6">
        <span className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <Bookmark size={26} aria-hidden />
        </span>
        <h2 className="font-bold text-lg mt-4">No bookmarks yet</h2>
        <p className="text-on-surface-variant mt-1 max-w-sm mx-auto">
          Tap the bookmark button while listening, or a verse’s ⋯ menu while reading, to save your place and come back to it here.
        </p>
        <Link to="/contents" className="inline-flex mt-5 px-5 h-10 items-center rounded-full bg-surface-container-high font-semibold hover:bg-surface-bright">
          Browse the surahs
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-on-surface-variant">
          {items.length} bookmark{items.length === 1 ? '' : 's'}
        </p>
        <div role="radiogroup" aria-label="Sort bookmarks" className="flex bg-surface-container rounded-full p-1">
          {SORTS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={sort === id}
              onClick={() => setSort(id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${sort === id ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {groups ? (
        <div className="space-y-5">
          {groups.map(([surahId, list]) => (
            <section key={surahId} aria-labelledby={`bm-${surahId}`}>
              <h2 id={`bm-${surahId}`} className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-3 mb-1">
                {surahId}. {getSurah(surahId).nameTranslit}
              </h2>
              <ul>
                {list.map((b) => (
                  <BookmarkItem key={b.id} bookmark={b} showSurah={false} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul>
          {items.map((b) => (
            <BookmarkItem key={b.id} bookmark={b} />
          ))}
        </ul>
      )}
    </>
  );
}
