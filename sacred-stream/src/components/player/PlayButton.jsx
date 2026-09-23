import { Loader2, Pause, Play } from 'lucide-react';
import { engine } from '../../audio/engine';
import { usePlayerStore } from '../../stores/playerStore';

const SIZES = {
  sm: { box: 'w-11 h-11', icon: 20 },
  md: { box: 'w-14 h-14', icon: 26 },
  lg: { box: 'w-[72px] h-[72px]', icon: 32 },
};

export default function PlayButton({ size = 'md', className = '' }) {
  const status = usePlayerStore((s) => s.status);
  const playing = status === 'playing';
  const busy = status === 'buffering';
  const { box, icon } = SIZES[size];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        engine.toggle();
      }}
      aria-label={playing || busy ? 'Pause' : 'Play'}
      className={`${box} shrink-0 rounded-full bg-on-surface text-surface flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ${className}`}
    >
      {busy ? (
        <Loader2 size={icon} className="animate-spin" aria-hidden />
      ) : playing ? (
        <Pause size={icon} fill="currentColor" aria-hidden />
      ) : (
        <Play size={icon} fill="currentColor" className="ml-0.5" aria-hidden />
      )}
    </button>
  );
}
