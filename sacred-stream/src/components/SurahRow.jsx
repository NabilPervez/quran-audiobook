import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { formatDuration } from '../lib/format';
import { playOrToggle, useIsPlayingSurah } from '../lib/playback';
import { usePlayerStore } from '../stores/playerStore';
import { useProgressStore, fractionListened } from '../stores/progressStore';
import ProgressRing from './ProgressRing';

/** One table-of-contents entry. Row opens the surah; the trailing button plays it. */
function SurahRow({ surah, subtitle }) {
  const isCurrent = usePlayerStore((s) => s.surahId === surah.id);
  const isPlaying = useIsPlayingSurah(surah.id);
  const fraction = useProgressStore((s) => fractionListened(s.bySurah[surah.id]));

  return (
    <li className={`group flex items-center gap-3 rounded-xl pr-2 transition-colors ${isCurrent ? 'bg-surface-container' : 'hover:bg-surface-container-low'}`} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 72px' }}>
      <Link to={`/player/${surah.id}`} className="flex items-center gap-3 flex-1 min-w-0 py-3 pl-2">
        <span className={`w-8 text-center text-sm font-bold tabular ${isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>{surah.id}</span>
        <span className="flex-1 min-w-0">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`font-bold truncate ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>{surah.nameTranslit}</span>
            <span lang="ar" dir="rtl" className="arabic text-lg leading-none text-on-surface-variant shrink-0">
              {surah.nameArabic}
            </span>
          </span>
          <span className="block text-xs text-on-surface-variant truncate mt-0.5">
            {subtitle ?? `${surah.meaning} · ${formatDuration(surah.durationSec)} · ${surah.verseCount} verses`}
          </span>
        </span>
      </Link>
      <ProgressRing fraction={fraction} size={24} />
      <button
        type="button"
        onClick={() => playOrToggle(surah.id)}
        aria-label={`${isPlaying ? 'Pause' : fraction > 0 && fraction < 1 ? 'Resume' : 'Play'} ${surah.nameTranslit}`}
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" aria-hidden /> : <Play size={18} fill="currentColor" aria-hidden />}
      </button>
    </li>
  );
}

export default memo(SurahRow);
