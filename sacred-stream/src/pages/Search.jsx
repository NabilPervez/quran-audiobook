import { useEffect, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { surahs, getSurah } from '../data/catalog';
import { highlight, loadAllText, matchesSurah, searchVerses } from '../lib/search';
import { usePlayerSheet } from '../hooks/usePlayerSheet';
import SurahRow from '../components/SurahRow';

const MIN_VERSE_QUERY = 3;
const SUGGESTIONS = ['mercy', 'patience', 'Moses', 'light', 'forgiveness', 'Mary'];

function useVerseIndex(enabled) {
  const [state, setState] = useState({ index: null, error: null });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadAllText().then(
      (index) => active && setState({ index, error: null }),
      (error) => active && setState({ index: null, error })
    );
    return () => {
      active = false;
    };
  }, [enabled]);
  return state;
}

function VerseResult({ v, terms, onOpen }) {
  const surah = getSurah(v.surahId);
  return (
    <li>
      <button type="button" onClick={() => onOpen(v)} className="w-full text-left rounded-xl px-3 py-3 hover:bg-surface-container-low transition-colors">
        <span className="text-xs font-bold text-primary tabular">
          {v.surahId}:{v.n} · {surah.nameTranslit}
        </span>
        <span className="block font-read text-[0.975rem] leading-relaxed text-on-surface/90 mt-1 line-clamp-3">
          {highlight(v.en, terms).map((p, i) =>
            p.hit ? (
              <mark key={i} className="bg-primary/20 text-on-surface rounded px-0.5">
                {p.text}
              </mark>
            ) : (
              <span key={i}>{p.text}</span>
            )
          )}
        </span>
      </button>
    </li>
  );
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const q = useDeferredValue(query.trim());
  const inputRef = useRef(null);
  const { open } = usePlayerSheet();
  const wantsVerses = q.length >= MIN_VERSE_QUERY;
  const { index, error } = useVerseIndex(wantsVerses);

  // Keep the query in the URL so back/forward and reloads restore it.
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (q) next.set('q', q);
    else next.delete('q');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [q, params, setParams]);

  const surahHits = useMemo(() => (q ? surahs.filter((s) => matchesSurah(s, q)).slice(0, 8) : []), [q]);
  const verseHits = useMemo(() => (wantsVerses && index ? searchVerses(index, q) : null), [wantsVerses, index, q]);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight mb-4">Search</h1>
      <div className="relative">
        <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Surah name, or words in a verse"
          aria-label="Search the Quran"
          className="w-full bg-surface-container-high rounded-full py-3 pl-10 pr-10 placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>

      {!q && (
        <div className="mt-8">
          <p className="text-sm text-on-surface-variant mb-3">Try searching for</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setQuery(s)} className="px-4 h-9 rounded-full bg-surface-container text-sm font-medium hover:bg-surface-container-high">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {surahHits.length > 0 && (
        <section className="mt-6" aria-labelledby="surah-results">
          <h2 id="surah-results" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-1">
            Surahs
          </h2>
          <ul className="space-y-0.5">
            {surahHits.map((s) => (
              <SurahRow key={s.id} surah={s} />
            ))}
          </ul>
        </section>
      )}

      {wantsVerses && (
        <section className="mt-6" aria-labelledby="verse-results" aria-live="polite">
          <h2 id="verse-results" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-1">
            Verses{verseHits ? ` · ${verseHits.total.toLocaleString()} found` : ''}
          </h2>
          {error ? (
            <p className="px-2 py-6 text-on-surface-variant">Couldn’t load verse text. Check your connection and try again.</p>
          ) : !verseHits ? (
            <p className="px-2 py-6 text-on-surface-variant flex items-center gap-2" role="status">
              <Loader2 size={18} className="animate-spin" aria-hidden /> Searching all 114 surahs…
            </p>
          ) : verseHits.total === 0 ? (
            <p className="px-2 py-6 text-on-surface-variant">No verses contain “{q}”.</p>
          ) : (
            <>
              <ul>
                {verseHits.results.map((v) => (
                  <VerseResult key={`${v.surahId}:${v.n}`} v={v} terms={verseHits.terms} onOpen={(hit) => open(hit.surahId, { view: 'read', verse: hit.n })} />
                ))}
              </ul>
              {verseHits.total > verseHits.results.length && (
                <p className="px-2 py-4 text-sm text-on-surface-variant">
                  Showing the first {verseHits.results.length}. Add another word to narrow the results.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
