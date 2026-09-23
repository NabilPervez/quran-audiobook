import { Link, Navigate, useParams } from 'react-router-dom';
import { BookOpen, Check, ChevronLeft, ChevronRight, Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';
import { getSurah } from '../data/catalog';
import { engine } from '../audio/engine';
import { formatDuration, formatRemaining, formatTime } from '../lib/format';
import { useIsPlayingSurah } from '../lib/playback';
import { usePlayerStore } from '../stores/playerStore';
import { useProgressStore, fractionListened, resumePointFor } from '../stores/progressStore';
import { useSurahVerses } from '../hooks/useSurahVerses';
import { usePlayerSheet } from '../hooks/usePlayerSheet';
import Cover from '../components/Cover';
import VerseList from '../components/reader/VerseList';
import ReaderSettings from '../components/reader/ReaderSettings';

function PrimaryAction({ surah, entry }) {
  const isCurrent = usePlayerStore((s) => s.surahId === surah.id);
  const isPlaying = useIsPlayingSurah(surah.id);
  const resumeAt = resumePointFor(surah.id);
  const label = isPlaying ? 'Pause' : resumeAt > 0 ? `Resume from ${formatTime(resumeAt)}` : entry?.finished ? 'Listen again' : 'Play';
  return (
    <button
      type="button"
      onClick={() => (isCurrent ? engine.toggle() : engine.load(surah.id))}
      className="h-12 px-7 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition"
    >
      {isPlaying ? <Pause size={20} fill="currentColor" aria-hidden /> : <Play size={20} fill="currentColor" aria-hidden />}
      {label}
    </button>
  );
}

function VerseText({ surah }) {
  const { verses, error, retry } = useSurahVerses(surah.id);
  const { open } = usePlayerSheet();
  const playFrom = useCallback(
    (v) => {
      engine.load(surah.id, { at: v.start });
      open(surah.id, { view: 'read', verse: v.n });
    },
    [surah.id, open]
  );

  if (error) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-on-surface-variant">Couldn’t load the text.</p>
        <button type="button" onClick={retry} className="px-5 h-10 rounded-full bg-surface-container-high font-semibold">
          Try again
        </button>
      </div>
    );
  }
  if (!verses) {
    return (
      <p className="py-10 flex items-center justify-center gap-2 text-on-surface-variant" role="status">
        <Loader2 size={18} className="animate-spin" aria-hidden /> Loading text…
      </p>
    );
  }
  return <VerseList surahId={surah.id} verses={verses} onPlayFrom={playFrom} />;
}

export default function SurahDetail() {
  const { id } = useParams();
  const surah = getSurah(id);
  const entry = useProgressStore((s) => (surah ? s.bySurah[surah.id] : undefined));
  const { open } = usePlayerSheet();
  if (!surah) return <Navigate to="/contents" replace />;

  const fraction = fractionListened(entry);
  const started = entry && !entry.finished && entry.position > 0;
  const prev = getSurah(surah.id - 1);
  const next = getSurah(surah.id + 1);
  const { markFinished, reset } = useProgressStore.getState();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-6">
      <header className="flex flex-col sm:flex-row gap-5 sm:items-end">
        <Cover surah={surah} className="w-40 h-40 sm:w-48 sm:h-48 shadow-2xl" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Surah {surah.id}</p>
          <h1 className="text-4xl font-extrabold tracking-tight">{surah.nameTranslit}</h1>
          <p lang="ar" dir="rtl" className="arabic text-3xl text-on-surface-variant text-left sm:text-left leading-snug">
            {surah.nameArabic}
          </p>
          <p className="text-on-surface-variant">
            {surah.meaning} · {surah.revelation === 'meccan' ? 'Meccan' : 'Medinan'} · {surah.verseCount} verses ·{' '}
            {formatDuration(surah.durationSec)}
          </p>
        </div>
      </header>

      {(started || entry?.finished) && (
        <div className="mt-5">
          <div className="h-1 rounded-full bg-surface-container-highest" aria-hidden>
            <div className="h-full rounded-full bg-primary" style={{ width: `${fraction * 100}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant mt-1.5 tabular">
            {entry.finished ? 'Finished' : formatRemaining((entry.duration || surah.durationSec) - entry.position)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-5">
        <PrimaryAction surah={surah} entry={entry} />
        <button
          type="button"
          onClick={() => open(surah.id, { view: 'read' })}
          className="h-12 px-5 rounded-full bg-surface-container-high font-semibold flex items-center gap-2 hover:bg-surface-bright"
        >
          <BookOpen size={18} aria-hidden /> Read along
        </button>
        {entry?.finished ? (
          <button type="button" onClick={() => reset(surah.id)} className="h-12 px-4 rounded-full text-on-surface-variant font-semibold flex items-center gap-2 hover:text-on-surface hover:bg-surface-container">
            <RotateCcw size={18} aria-hidden /> Mark as not finished
          </button>
        ) : (
          <button type="button" onClick={() => markFinished(surah.id)} className="h-12 px-4 rounded-full text-on-surface-variant font-semibold flex items-center gap-2 hover:text-on-surface hover:bg-surface-container">
            <Check size={18} aria-hidden /> Mark as finished
          </button>
        )}
        <div className="ml-auto">
          <ReaderSettings />
        </div>
      </div>

      <section className="mt-8" aria-labelledby="text-heading">
        <h2 id="text-heading" className="sr-only">
          Text
        </h2>
        {surah.id !== 1 && surah.id !== 9 && (
          <p lang="ar" dir="rtl" className="arabic text-center text-2xl text-on-surface-variant pb-4">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
        )}
        <VerseText surah={surah} />
      </section>

      <nav aria-label="Other surahs" className="grid grid-cols-2 gap-3 mt-8">
        {prev ? (
          <Link to={`/surah/${prev.id}`} className="rounded-xl bg-surface-container-low p-4 hover:bg-surface-container flex items-center gap-2">
            <ChevronLeft size={18} aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs text-on-surface-variant">Previous</span>
              <span className="block font-semibold truncate">{prev.nameTranslit}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/surah/${next.id}`} className="rounded-xl bg-surface-container-low p-4 hover:bg-surface-container flex items-center justify-end gap-2 text-right">
            <span className="min-w-0">
              <span className="block text-xs text-on-surface-variant">Next</span>
              <span className="block font-semibold truncate">{next.nameTranslit}</span>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  );
}
