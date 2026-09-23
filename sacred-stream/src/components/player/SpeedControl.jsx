import { engine } from '../../audio/engine';
import { SPEEDS, useSettingsStore } from '../../stores/settingsStore';
import Menu, { MenuItem } from '../Menu';

export default function SpeedControl({ placement = 'top', align }) {
  const rate = useSettingsStore((s) => s.rate);
  return (
    <Menu
      label={`Playback speed, ${rate} times`}
      placement={placement}
      align={align}
      trigger={<span className="text-sm font-bold tabular">{rate}×</span>}
    >
      {(close) => (
        <>
          <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-on-surface-variant">Speed</p>
          {SPEEDS.map((s) => (
            <MenuItem
              key={s}
              selected={s === rate}
              onSelect={() => {
                engine.setRate(s);
                close();
              }}
            >
              {s}×{s === 1 ? ' · normal' : ''}
            </MenuItem>
          ))}
        </>
      )}
    </Menu>
  );
}
