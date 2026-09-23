import { Link } from 'react-router-dom';
import { History as HistoryIcon, Pause, Play } from 'lucide-react';
import { getSurah } from '../../data/catalog';
import { useProgressStore, fractionListened } from '../../stores/progressStore';
import { formatDuration, formatRelative, formatTime } from '../../lib/format';
import { playOrToggle, useIsPlayingSurah } from '../../lib/playback';
import Cover from '../../components/Cover';

function HistoryRow({ surah, entry }) {
  const isPlaying = useIsPlayingSurah(surah.id);
  const fraction = fractionListened(entry);
  const status = entry.finished
    ? 'Finished'
    : `Stopped at ${formatTime(entry.position)} of ${formatDuration(entry.duration || surah.durationSec)}`;
  return (
    <li className="flex items-center gap-3 rounded-xl hover:bg-surface-container-low pr-2 transition-colors">
      <Link to={`/surah/${surah.id}`} className="flex items-center gap-3 flex-1 min-w-0 p-2">
        <Cover surah={surah} showName={false} className="w-12 h-12 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold truncate">{surah.nameTranslit}</span>
          <span className="block text-xs text-on-surface-variant truncate tabular">
            {status} · {formatRelative(entry.updatedAt)}
          </span>
          <span className="block h-0.5 rounded-full bg-surface-container-highest mt-1.5" aria-hidden>
            <span className="block h-full rounded-full bg-primary" style={{ width: `${fraction * 100}%` }} />
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => playOrToggle(surah.id)}
        aria-label={`${isPlaying ? 'Pause' : entry.finished ? 'Play' : 'Resume'} ${surah.nameTranslit}`}
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isPlaying ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-highest'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" aria-hidden /> : <Play size={18} fill="currentColor" aria-hidden />}
      </button>
    </li>
  );
}

export default function History() {
  const bySurah = useProgressStore((s) => s.bySurah);
  const entries = Object.entries(bySurah)
    .map(([id, entry]) => ({ surah: getSurah(id), entry }))
    .filter((e) => e.surah && e.entry.updatedAt)
    .sort((a, b) => b.entry.updatedAt - a.entry.updatedAt);

  if (!entries.length) {
    return (
      <div className="text-center py-16 px-6">
        <span className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <HistoryIcon size={26} aria-hidden />
        </span>
        <h2 className="font-bold text-lg mt-4">Nothing played yet</h2>
        <p className="text-on-surface-variant mt-1">Surahs you listen to appear here with where you stopped.</p>
      </div>
    );
  }

  return (
    <ul>
      {entries.map(({ surah, entry }) => (
        <HistoryRow key={surah.id} surah={surah} entry={entry} />
      ))}
    </ul>
  );
}
