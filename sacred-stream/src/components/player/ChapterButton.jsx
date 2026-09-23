import { SkipBack, SkipForward } from 'lucide-react';
import { engine } from '../../audio/engine';

export default function ChapterButton({ direction, size = 22 }) {
  const next = direction === 'next';
  const Icon = next ? SkipForward : SkipBack;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (next) engine.nextSurah();
        else engine.prevSurah();
      }}
      aria-label={next ? 'Next surah' : 'Restart or previous surah'}
      className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:scale-90 transition"
    >
      <Icon size={size} fill="currentColor" aria-hidden />
    </button>
  );
}
