import { useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, Languages, Loader2, Play } from 'lucide-react';
import { getSurah } from '../data/catalog';
import { engine } from '../audio/engine';
import { usePlayerStore } from '../stores/playerStore';
import { useProgressStore, resumePointFor } from '../stores/progressStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSurahVerses } from '../hooks/useSurahVerses';
import { useActiveVerse } from '../hooks/useActiveVerse';
import { formatDuration, formatTime } from '../lib/format';
import { verseIndexAt } from '../lib/verseTiming';
import Cover from '../components/Cover';
import PlayButton from '../components/player/PlayButton';
import SkipButton from '../components/player/SkipButton';
import ChapterButton from '../components/player/ChapterButton';
import Scrubber from '../components/player/Scrubber';
import SpeedControl from '../components/player/SpeedControl';
import SleepControl from '../components/player/SleepControl';
import VerseList from '../components/reader/VerseList';

function Transport({ size = 'lg' }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <ChapterButton direction="prev" />
      <SkipButton direction="back" size={size === 'lg' ? 34 : 28} />
      <PlayButton size={size} />
      <SkipButton direction="forward" size={size === 'lg' ? 34 : 28} />
      <ChapterButton direction="next" />
    </div>
  );
}

/** Shown in place of the transport when this surah isn't the one loaded. */
function StartButton({ surah }) {
  const entry = useProgressStore((s) => s.bySurah[surah.id]);
  const otherId = usePlayerStore((s) => s.surahId);
  const other = otherId && otherId !== surah.id ? getSurah(otherId) : null;
  const resumeAt = resumePointFor(surah.id);
  const label = resumeAt > 0 ? `Resume from ${formatTime(resumeAt)}` : entry?.finished ? 'Listen again' : 'Play';
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => engine.load(surah.id)}
        className="h-14 px-10 rounded-full bg-primary text-on-primary font-bold text-lg flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition"
      >
        <Play size={22} fill="currentColor" aria-hidden /> {label}
      </button>
      {other && <p className="text-xs text-on-surface-variant">This will stop {other.nameTranslit}</p>}
    </div>
  );
}

function VerseCounter({ verses, total }) {
  const index = useActiveVerse(verses);
  if (index < 0) return <span>{total} verses</span>;
  return (
    <span className="tabular">
      Verse {verses[index].n} of {total}
    </span>
  );
}

function ListenPanel({ surah, isCurrent, verses }) {
  const describe = useCallback((t) => (verses?.length ? `Verse ${verses[verseIndexAt(verses, t)].n}` : null), [verses]);
  return (
    <section aria-label="Listen" className="flex flex-col items-center justify-center gap-6 px-6 py-6 h-full w-full max-w-md mx-auto">
      <Cover surah={surah} className="w-full max-w-[18rem] lg:max-w-sm aspect-square shadow-2xl" />
      <div className="w-full">
        <h2 className="text-3xl font-extrabold tracking-tight">{surah.nameTranslit}</h2>
        <p className="text-on-surface-variant mt-0.5">
          {surah.meaning} · {surah.revelation === 'meccan' ? 'Meccan' : 'Medinan'} · {formatDuration(surah.durationSec)}
        </p>
        <p className="text-sm text-primary font-semibold mt-1">{isCurrent ? <VerseCounter verses={verses} total={surah.verseCount} /> : `${surah.verseCount} verses`}</p>
      </div>
      {isCurrent ? (
        <>
          <Scrubber fallbackDuration={surah.durationSec} describe={describe} />
          <Transport />
          <div className="flex items-center justify-center gap-6">
            <SpeedControl />
            <SleepControl />
          </div>
        </>
      ) : (
        <StartButton surah={surah} />
      )}
    </section>
  );
}

function ReadPanel({ surah, isCurrent, verses, error, retry }) {
  const scrollRef = useRef(null);
  const showArabic = useSettingsStore((s) => s.showArabic);
  const activeIndex = useActiveVerse(verses, isCurrent);

  const playFrom = useCallback(
    (verse) => {
      if (isCurrent) {
        engine.seek(verse.start);
        engine.play();
      } else {
        engine.load(surah.id, { at: verse.start });
      }
    },
    [isCurrent, surah.id]
  );

  return (
    <section aria-label="Read along" ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar px-2 sm:px-6 lg:px-10 py-4" tabIndex={-1}>
      <div className="max-w-2xl mx-auto">
        {surah.id !== 1 && surah.id !== 9 && (
          <p lang="ar" dir="rtl" className="arabic text-center text-2xl text-on-surface-variant py-4">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
        )}
        {error ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-on-surface-variant">Couldn’t load the text. Check your connection.</p>
            <button type="button" onClick={retry} className="px-5 h-10 rounded-full bg-surface-container-high font-semibold hover:bg-surface-bright">
              Try again
            </button>
          </div>
        ) : !verses ? (
          <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant" role="status">
            <Loader2 className="animate-spin" size={20} aria-hidden /> Loading text…
          </div>
        ) : (
          <>
            <VerseList verses={verses} activeIndex={activeIndex} showArabic={showArabic} onPlayFrom={playFrom} scrollRef={scrollRef} />
            <p className="text-center text-xs text-on-surface-variant py-8">
              Verse highlighting is estimated from the text and may run slightly ahead or behind.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default function Player() {
  const { surahId } = useParams();
  const surah = getSurah(surahId);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'read' ? 'read' : 'listen';
  const isCurrent = usePlayerStore((s) => s.surahId === surah?.id);
  const showArabic = useSettingsStore((s) => s.showArabic);
  const { verses, error, retry } = useSurahVerses(surah?.id ?? 1);

  if (!surah) {
    return (
      <div className="p-8 text-center space-y-4">
        <p>That surah doesn’t exist.</p>
        <Link to="/contents" className="text-primary font-semibold">
          Go to contents
        </Link>
      </div>
    );
  }

  const close = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));
  const setView = (v) => setParams(v === 'read' ? { view: 'read' } : {}, { replace: true });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-secondary-container/40 via-surface to-surface">
      <header className="flex items-center justify-between gap-2 px-3 sm:px-6 h-16 shrink-0">
        <button type="button" onClick={close} aria-label="Close player" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-high">
          <ChevronDown size={26} aria-hidden />
        </button>

        {/* Listen / Read switch (phones and tablets; desktop shows both side by side) */}
        <div role="tablist" aria-label="Player view" className="flex bg-surface-container rounded-full p-1 lg:hidden">
          {['listen', 'read'].map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${view === v ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="hidden lg:block text-sm font-semibold text-on-surface-variant">
          Surah {surah.id} · {surah.nameTranslit}
        </p>

        <button
          type="button"
          onClick={() => useSettingsStore.getState().set({ showArabic: !showArabic })}
          aria-pressed={showArabic}
          aria-label="Show Arabic text"
          className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-high ${showArabic ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <Languages size={22} aria-hidden />
        </button>
      </header>

      <main className="flex-1 min-h-0 lg:grid lg:grid-cols-[minmax(22rem,30rem)_1fr]">
        <div className={`h-full overflow-y-auto ${view === 'listen' ? 'block' : 'hidden'} lg:block`}>
          <ListenPanel surah={surah} isCurrent={isCurrent} verses={verses} />
        </div>
        <div className={`h-full min-h-0 flex-col ${view === 'read' ? 'flex' : 'hidden'} lg:flex lg:bg-surface-container-lowest/50 lg:rounded-tl-3xl`}>
          <div className="flex-1 min-h-0">
            <ReadPanel surah={surah} isCurrent={isCurrent} verses={verses} error={error} retry={retry} />
          </div>
          {/* Compact controls while reading on small screens */}
          <div className="lg:hidden shrink-0 border-t border-white/5 glass px-4 pt-2 pb-[calc(0.75rem+var(--safe-bottom))]">
            {isCurrent ? (
              <>
                <Scrubber fallbackDuration={surah.durationSec} />
                <Transport size="md" />
              </>
            ) : (
              <div className="py-2">
                <StartButton surah={surah} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
