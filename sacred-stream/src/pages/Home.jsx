import { Link } from 'react-router-dom';
import { ChevronRight, Pause, Play, Settings as SettingsIcon } from 'lucide-react';
import { surahs, getSurah, TOTAL_DURATION_SEC } from '../data/catalog';
import { formatDuration, formatRemaining } from '../lib/format';
import { playOrToggle, useIsPlayingSurah } from '../lib/playback';
import { useProgressStore, fractionListened } from '../stores/progressStore';
import Cover from '../components/Cover';
import { useBookmarkStore } from '../stores/bookmarkStore';
import BookmarkItem from '../components/library/BookmarkItem';
import InstallCard from '../components/InstallCard';

const SHORT_SURAHS = surahs.filter((s) => s.juzStart === 30);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function ContinueCard({ surah, entry }) {
  const isPlaying = useIsPlayingSurah(surah.id);
  const fraction = fractionListened(entry);
  const started = entry && !entry.finished && entry.position > 0;
  const remaining = (entry?.duration || surah.durationSec) - (entry?.position ?? 0);

  return (
    <section aria-labelledby="continue-heading" className="rounded-2xl bg-gradient-to-br from-secondary-container/60 to-surface-container-low p-4 sm:p-6">
      <h2 id="continue-heading" className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
        {started ? 'Continue listening' : 'Start listening'}
      </h2>
      <div className="flex gap-4 items-center">
        <Link to={`/surah/${surah.id}`} className="shrink-0" aria-label={`Open ${surah.nameTranslit}`}>
          <Cover surah={surah} className="w-24 h-24 sm:w-32 sm:h-32 shadow-xl" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/surah/${surah.id}`} className="block hover:underline underline-offset-4">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{surah.nameTranslit}</p>
          </Link>
          <p className="text-on-surface-variant truncate">
            {surah.meaning} · Surah {surah.id}
          </p>
          <p className="text-sm text-on-surface-variant mt-2 tabular">
            {started ? formatRemaining(remaining) : `${formatDuration(surah.durationSec)} · ${surah.verseCount} verses`}
          </p>
        </div>
      </div>
      {started && (
        <div className="h-1 rounded-full bg-surface-container-highest mt-4" aria-hidden>
          <div className="h-full rounded-full bg-primary" style={{ width: `${fraction * 100}%` }} />
        </div>
      )}
      <button
        type="button"
        onClick={() => playOrToggle(surah.id)}
        className="mt-5 w-full sm:w-auto px-8 h-12 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition"
      >
        {isPlaying ? <Pause size={20} fill="currentColor" aria-hidden /> : <Play size={20} fill="currentColor" aria-hidden />}
        {isPlaying ? 'Pause' : started ? 'Resume' : 'Play'}
      </button>
    </section>
  );
}

function Journey({ bySurah }) {
  const entries = Object.entries(bySurah);
  const finished = entries.filter(([, e]) => e.finished).length;
  const heard = entries.reduce((sum, [id, e]) => sum + (e.finished ? getSurah(id).durationSec : e.position), 0);
  const pct = Math.min(100, (heard / TOTAL_DURATION_SEC) * 100);
  return (
    <section aria-labelledby="journey-heading" className="rounded-2xl bg-surface-container-low p-4 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 id="journey-heading" className="font-bold">
          Your journey
        </h2>
        <span className="text-sm text-on-surface-variant tabular">
          {finished} of 114 surahs · {pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-highest mt-3" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Whole Quran listened">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}

function RecentBookmarks() {
  // Select the stable array, slice in render (a selector returning a new array loops).
  const recent = useBookmarkStore((s) => s.items).slice(0, 3);
  if (!recent.length) return null;
  return (
    <section aria-labelledby="bookmarks-heading">
      <div className="flex items-baseline justify-between mb-2">
        <h2 id="bookmarks-heading" className="text-xl font-bold tracking-tight">
          Recent bookmarks
        </h2>
        <Link to="/library" className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center">
          Library <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="-mx-3">
        {recent.map((b) => (
          <BookmarkItem key={b.id} bookmark={b} />
        ))}
      </ul>
    </section>
  );
}

function ShortSurahs() {
  return (
    <section aria-labelledby="short-heading">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="short-heading" className="text-xl font-bold tracking-tight">
          Short surahs for a quick listen
        </h2>
        <Link to="/contents" className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center">
          Contents <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 snap-x">
        {SHORT_SURAHS.map((s) => (
          <li key={s.id} className="w-32 shrink-0 snap-start">
            <Link to={`/surah/${s.id}`} className="block group">
              <Cover surah={s} className="w-32 h-32 group-hover:brightness-110 transition" />
              <p className="font-semibold text-sm mt-2 truncate">{s.nameTranslit}</p>
              <p className="text-xs text-on-surface-variant truncate">
                {s.meaning} · {formatDuration(s.durationSec)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const bySurah = useProgressStore((s) => s.bySurah);
  const lastSurahId = useProgressStore((s) => s.lastSurahId);

  // If the last surah is finished, suggest the next one in order.
  let current = lastSurahId ? getSurah(lastSurahId) : getSurah(1);
  if (lastSurahId && bySurah[lastSurahId]?.finished && lastSurahId < 114) current = getSurah(lastSurahId + 1);
  const upNext = current.id < 114 ? getSurah(current.id + 1) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 pt-6 space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-on-surface-variant text-sm">Assalamu alaikum</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{greeting()}</h1>
        </div>
        <Link to="/settings" aria-label="Settings" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container lg:hidden">
          <SettingsIcon size={22} aria-hidden />
        </Link>
      </header>

      <ContinueCard surah={current} entry={bySurah[current.id]} />

      {upNext && (
        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="text-xl font-bold tracking-tight mb-3">
            Up next
          </h2>
          <Link to={`/surah/${upNext.id}`} className="flex items-center gap-4 rounded-xl p-2 -mx-2 hover:bg-surface-container-low transition-colors">
            <Cover surah={upNext} showName={false} className="w-14 h-14" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold truncate">{upNext.nameTranslit}</span>
              <span className="block text-sm text-on-surface-variant truncate">
                {upNext.meaning} · {formatDuration(upNext.durationSec)}
              </span>
            </span>
            <ChevronRight className="text-on-surface-variant" aria-hidden />
          </Link>
        </section>
      )}

      <InstallCard />
      <RecentBookmarks />
      <Journey bySurah={bySurah} />
      <ShortSurahs />
    </div>
  );
}
