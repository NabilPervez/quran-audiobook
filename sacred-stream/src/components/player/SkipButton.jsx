import { RotateCcw, RotateCw } from 'lucide-react';
import { engine } from '../../audio/engine';
import { useSettingsStore } from '../../stores/settingsStore';

/** Skip back / forward N seconds, with the number drawn inside the arrow like Audible. */
export default function SkipButton({ direction, size = 30 }) {
  const back = direction === 'back';
  const seconds = useSettingsStore((s) => (back ? s.skipBack : s.skipForward));
  const Icon = back ? RotateCcw : RotateCw;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        engine.skip(back ? -seconds : seconds);
      }}
      aria-label={`${back ? 'Back' : 'Forward'} ${seconds} seconds`}
      className="relative w-12 h-12 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition"
    >
      <Icon size={size} strokeWidth={1.75} aria-hidden />
      <span className="absolute text-[10px] font-bold tabular pt-0.5" aria-hidden>
        {seconds}
      </span>
    </button>
  );
}
