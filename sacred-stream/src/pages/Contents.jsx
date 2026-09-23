import { useDeferredValue, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { surahs, juzs, getSurah, TOTAL_DURATION_SEC, NARRATION } from '../data/catalog';
import { formatDuration } from '../lib/format';
import { useProgressStore } from '../stores/progressStore';
import SurahRow from '../components/SurahRow';
import { matchesSurah } from '../lib/search';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'progress', label: 'In progress' },
  { id: 'new', label: 'Not started' },
  { id: 'done', label: 'Finished' },
];


export default function Contents() {
  const [view, setView] = useState('surah');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim());
  const bySurah = useProgressStore((s) => s.bySurah);

  const passesFilter = useMemo(() => {
    const state = (id) => {
      const e = bySurah[id];
      if (e?.finished) return 'done';
      return e?.position > 0 ? 'progress' : 'new';
    };
    return (id) => filter === 'all' || state(id) === filter;
  }, [bySurah, filter]);

  const list = surahs.filter((s) => matchesSurah(s, q) && passesFilter(s.id));

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-6">
      <header className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Contents</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          114 surahs · {formatDuration(TOTAL_DURATION_SEC)} · Translation: {NARRATION.translation}
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 px-4 lg:-mx-8 lg:px-8 py-3 bg-surface/95 backdrop-blur space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, number or meaning"
            aria-label="Search surahs"
            className="w-full bg-surface-container-high rounded-full py-2.5 pl-10 pr-10 text-sm placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/40"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface">
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div role="tablist" aria-label="Group by" className="flex bg-surface-container rounded-full p-1 shrink-0">
            {[
              ['surah', 'Surah'],
              ['juz', 'Juz'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === id ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-primary/15 text-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'surah' ? (
        <ul className="mt-2 space-y-0.5">
          {list.map((s) => (
            <SurahRow key={s.id} surah={s} />
          ))}
        </ul>
      ) : (
        <div className="mt-2 space-y-6">
          {juzs.map((j) => {
            const rows = j.surahs.map((r) => ({ ...r, surah: getSurah(r.id) })).filter((r) => matchesSurah(r.surah, q) && passesFilter(r.id));
            if (!rows.length) return null;
            return (
              <section key={j.juz} aria-labelledby={`juz-${j.juz}`}>
                <h2 id={`juz-${j.juz}`} className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-1">
                  Juz {j.juz}
                </h2>
                <ul className="space-y-0.5">
                  {rows.map(({ surah, from, to }) => {
                    const partial = from !== 1 || to !== surah.verseCount;
                    return (
                      <SurahRow
                        key={surah.id}
                        surah={surah}
                        subtitle={partial ? `${surah.meaning} · verses ${from}–${to}` : undefined}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {list.length === 0 && view === 'surah' && (
        <p className="text-center text-on-surface-variant py-16">No surahs match{q ? ` “${q}”` : ' this filter'}.</p>
      )}
    </div>
  );
}
