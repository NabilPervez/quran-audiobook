import { Maximize2 } from 'lucide-react';
import { getSurah } from '../data/catalog';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentTime } from '../audio/timeBus';
import { formatRemaining } from '../lib/format';
import Cover from './Cover';
import { usePlayerSheet } from '../hooks/usePlayerSheet';
import PlayButton from './player/PlayButton';
import SkipButton from './player/SkipButton';
import ChapterButton from './player/ChapterButton';
import Scrubber from './player/Scrubber';
import SpeedControl from './player/SpeedControl';
import SleepControl from './player/SleepControl';
import BookmarkButton from './player/BookmarkButton';

function ThinProgress() {
  const { t, d } = useCurrentTime();
  return (
    <div className="absolute top-0 inset-x-0 h-0.5 bg-surface-container-highest lg:hidden" aria-hidden>
      <div className="h-full bg-primary" style={{ width: `${d ? (t / d) * 100 : 0}%` }} />
    </div>
  );
}

function Subtitle({ surah }) {
  const { t, d } = useCurrentTime();
  const rate = useSettingsStore((s) => s.rate);
  const status = usePlayerStore((s) => s.status);
  if (status === 'error') return <span className="text-error">Couldn’t load audio. Tap play to retry</span>;
  return (
    <>
      {surah.meaning} · {formatRemaining(((d || surah.durationSec) - t) / rate)}
    </>
  );
}

export default function MiniPlayer() {
  const surahId = usePlayerStore((s) => s.surahId);
  const { open: openSheet } = usePlayerSheet();
  const surah = surahId ? getSurah(surahId) : null;
  if (!surah) return null;

  const open = () => openSheet(surah.id);

  return (
    <div
      className="fixed inset-x-0 z-40 glass border-t border-white/5 bottom-[calc(var(--tabbar-h)+var(--safe-bottom))] lg:bottom-0"
      role="region"
      aria-label="Now playing"
    >
      <ThinProgress />
      <div className="flex items-center gap-3 px-3 lg:px-6 h-[var(--miniplayer-h)] lg:h-24">
        {/* Track info: tapping opens the full player */}
        <button type="button" onClick={open} className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none lg:w-1/4 text-left" aria-label={`Open player for ${surah.nameTranslit}`}>
          <Cover surah={surah} showName={false} className="w-11 h-11 lg:w-14 lg:h-14 shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-bold truncate">{surah.nameTranslit}</span>
            <span className="block text-xs text-on-surface-variant truncate tabular">
              <Subtitle surah={surah} />
            </span>
          </span>
        </button>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 lg:hidden">
          <SkipButton direction="back" size={24} />
          <PlayButton size="sm" />
        </div>

        {/* Desktop controls */}
        <div className="hidden lg:flex flex-col items-center flex-1 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <ChapterButton direction="prev" size={18} />
            <SkipButton direction="back" size={26} />
            <PlayButton size="sm" />
            <SkipButton direction="forward" size={26} />
            <ChapterButton direction="next" size={18} />
          </div>
          <Scrubber fallbackDuration={surah.durationSec} />
        </div>

        <div className="hidden lg:flex items-center justify-end gap-1 w-1/4">
          <SpeedControl align="end" />
          <SleepControl align="end" />
          <BookmarkButton />
          <button type="button" onClick={open} aria-label="Open full player" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
            <Maximize2 size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
