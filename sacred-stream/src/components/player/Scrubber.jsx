import { useState } from 'react';
import { engine } from '../../audio/engine';
import { useCurrentTime } from '../../audio/timeBus';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatTime } from '../../lib/format';

/**
 * Seek bar built on a native range input (keyboard + screen reader support for free).
 * Pointer drags only seek on release so audio never stutters; keyboard seeks immediately.
 * `describe(t)` optionally labels a position, e.g. "Verse 23".
 */
export default function Scrubber({ fallbackDuration = 0, describe }) {
  const { t, d: liveD } = useCurrentTime();
  const rate = useSettingsStore((s) => s.rate);
  const [drag, setDrag] = useState(null);
  const [showTotal, setShowTotal] = useState(false);

  const d = liveD || fallbackDuration;
  const value = drag ?? t;
  const pct = d > 0 ? (value / d) * 100 : 0;
  const remaining = Math.max(0, d - value) / rate;
  const label = describe?.(value);

  const commit = () => {
    if (drag != null) engine.seek(drag);
    setDrag(null);
  };

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <input
        type="range"
        className="seek"
        min={0}
        max={d || 1}
        step={1}
        value={value}
        style={{ '--pct': `${pct}%` }}
        aria-label="Seek"
        aria-valuetext={`${formatTime(value)} of ${formatTime(d)}${label ? `, ${label}` : ''}`}
        onPointerDown={() => setDrag(t)}
        onPointerUp={commit}
        onPointerCancel={() => setDrag(null)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (drag != null) setDrag(v);
          else engine.seek(v);
        }}
      />
      <div className="flex justify-between items-center text-xs font-medium text-on-surface-variant tabular mt-0.5">
        <span>{formatTime(value)}</span>
        {drag != null && label ? <span className="text-primary font-bold">{label}</span> : null}
        <button
          type="button"
          onClick={() => setShowTotal((s) => !s)}
          className="hover:text-on-surface"
          aria-label={showTotal ? 'Showing total length. Show time remaining' : 'Showing time remaining. Show total length'}
        >
          {showTotal ? formatTime(d) : `-${formatTime(remaining)}`}
        </button>
      </div>
    </div>
  );
}
