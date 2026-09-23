import { useSyncExternalStore } from 'react';
import { Moon } from 'lucide-react';
import { engine } from '../../audio/engine';
import { usePlayerStore } from '../../stores/playerStore';
import Menu, { MenuItem } from '../Menu';

const OPTIONS = [5, 10, 15, 30, 45, 60];

const subscribeClock = (fn) => {
  const id = setInterval(fn, 5_000);
  return () => clearInterval(id);
};

function useMinutesLeft(sleep) {
  const endsAt = sleep?.mode === 'minutes' ? sleep.endsAt : null;
  return useSyncExternalStore(subscribeClock, () =>
    endsAt ? Math.max(1, Math.ceil((endsAt - Date.now()) / 60_000)) : null
  );
}

export default function SleepControl({ placement = 'top', align }) {
  const sleep = usePlayerStore((s) => s.sleep);
  const minutesLeft = useMinutesLeft(sleep);
  const badge = sleep?.mode === 'chapter' ? 'End' : minutesLeft ? `${minutesLeft}m` : null;
  const label = !sleep
    ? 'Sleep timer'
    : sleep.mode === 'chapter'
      ? 'Sleep timer: end of chapter'
      : `Sleep timer: ${minutesLeft} minutes left`;

  return (
    <Menu
      label={label}
      placement={placement}
      align={align}
      trigger={
        <>
          <Moon size={20} className={badge ? 'text-primary' : ''} aria-hidden />
          {badge && <span className="text-xs font-bold text-primary tabular">{badge}</span>}
        </>
      }
    >
      {(close) => {
        const pick = (v) => {
          engine.setSleep(v);
          close();
        };
        return (
          <>
            <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-on-surface-variant">Sleep timer</p>
            {OPTIONS.map((m) => (
              <MenuItem key={m} onSelect={() => pick(m)}>
                {m} minutes
              </MenuItem>
            ))}
            <MenuItem selected={sleep?.mode === 'chapter'} onSelect={() => pick('chapter')}>
              End of chapter
            </MenuItem>
            {sleep && <MenuItem onSelect={() => pick(null)}>Turn off</MenuItem>}
          </>
        );
      }}
    </Menu>
  );
}
