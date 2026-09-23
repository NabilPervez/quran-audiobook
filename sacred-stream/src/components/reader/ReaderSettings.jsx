import { Minus, Plus, Type } from 'lucide-react';
import { TEXT_SCALES, useSettingsStore } from '../../stores/settingsStore';
import Menu from '../Menu';

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg text-sm text-on-surface hover:bg-surface-bright disabled:opacity-50"
    >
      {label}
      <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${checked ? 'bg-primary' : 'bg-surface-bright'}`} aria-hidden>
        <span className={`block w-4 h-4 rounded-full bg-on-surface transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

/** "Aa" menu: text size, Arabic/English visibility, follow-along scrolling. */
export default function ReaderSettings({ placement = 'bottom', align = 'end' }) {
  const { showArabic, showEnglish, textScale, autoScroll, set } = useSettingsStore();
  const i = Math.max(0, TEXT_SCALES.indexOf(textScale));
  return (
    <Menu label="Reading settings" placement={placement} align={align} trigger={<Type size={20} aria-hidden />}>
      {() => (
        <div className="w-64">
          <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-on-surface-variant">Text size</p>
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              type="button"
              onClick={() => set({ textScale: TEXT_SCALES[Math.max(0, i - 1)] })}
              disabled={i === 0}
              aria-label="Smaller text"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-bright disabled:opacity-40"
            >
              <Minus size={18} aria-hidden />
            </button>
            <span className="text-sm font-bold tabular" aria-live="polite">
              {Math.round(textScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => set({ textScale: TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, i + 1)] })}
              disabled={i === TEXT_SCALES.length - 1}
              aria-label="Larger text"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-bright disabled:opacity-40"
            >
              <Plus size={18} aria-hidden />
            </button>
          </div>
          {/* At least one language stays on. */}
          <Toggle label="Arabic" checked={showArabic} disabled={showArabic && !showEnglish} onChange={(v) => set({ showArabic: v })} />
          <Toggle label="English" checked={showEnglish} disabled={showEnglish && !showArabic} onChange={(v) => set({ showEnglish: v })} />
          <Toggle label="Follow the narration" checked={autoScroll} onChange={(v) => set({ autoScroll: v })} />
        </div>
      )}
    </Menu>
  );
}
