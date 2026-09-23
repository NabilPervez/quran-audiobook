import { useEffect, useRef, useState } from 'react';
import { Download, Minus, Plus, RotateCcw, Upload } from 'lucide-react';
import { NARRATION } from '../data/catalog';
import { TEXT_SCALES, useSettingsStore } from '../stores/settingsStore';
import { useProgressStore } from '../stores/progressStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { toast } from '../stores/toastStore';
import { exportData, importData } from '../lib/backup';

function Section({ title, children }) {
  return (
    <section className="mt-8" aria-labelledby={`s-${title}`}>
      <h2 id={`s-${title}`} className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {title}
      </h2>
      <div className="rounded-2xl bg-surface-container-low divide-y divide-white/5">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 min-h-14">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        {hint && <p className="text-xs text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented({ label, options, value, onChange, format = (v) => v }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex bg-surface-container-high rounded-full p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`px-3 h-8 rounded-full text-sm font-semibold tabular ${value === o ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full p-1 transition-colors disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-surface-bright'}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-on-surface transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

/** Destructive action that needs a second tap within a few seconds. */
function ConfirmButton({ children, confirmLabel, onConfirm }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          clearTimeout(timer.current);
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 4000);
        }
      }}
      className={`px-4 h-9 rounded-full text-sm font-semibold flex items-center gap-2 ${armed ? 'bg-error text-on-error' : 'bg-surface-container-high hover:bg-surface-bright'}`}
    >
      <RotateCcw size={16} aria-hidden />
      {armed ? confirmLabel : children}
    </button>
  );
}

export default function Settings() {
  const s = useSettingsStore();
  const bookmarkCount = useBookmarkStore((st) => st.items.length);
  const surahCount = useProgressStore((st) => Object.keys(st.bySurah).length);
  const fileRef = useRef(null);
  const i = Math.max(0, TEXT_SCALES.indexOf(s.textScale));

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const r = await importData(file);
      toast(`Imported ${r.bookmarks} bookmark${r.bookmarks === 1 ? '' : 's'} and progress for ${r.surahs} surah${r.surahs === 1 ? '' : 's'}`);
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>

      <Section title="Playback">
        <Row label="Skip back">
          <Segmented label="Skip back" options={[10, 15, 30]} value={s.skipBack} onChange={(v) => s.set({ skipBack: v })} format={(v) => `${v}s`} />
        </Row>
        <Row label="Skip forward">
          <Segmented label="Skip forward" options={[15, 30, 45]} value={s.skipForward} onChange={(v) => s.set({ skipForward: v })} format={(v) => `${v}s`} />
        </Row>
        <Row label="Play the next surah automatically">
          <Switch label="Play the next surah automatically" checked={s.autoAdvance} onChange={(v) => s.set({ autoAdvance: v })} />
        </Row>
      </Section>

      <Section title="Reading">
        <Row label="Text size" hint={`${Math.round(s.textScale * 100)}%`}>
          <div className="flex gap-1">
            <button type="button" aria-label="Smaller text" disabled={i === 0} onClick={() => s.set({ textScale: TEXT_SCALES[i - 1] })} className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-high disabled:opacity-40">
              <Minus size={16} aria-hidden />
            </button>
            <button type="button" aria-label="Larger text" disabled={i === TEXT_SCALES.length - 1} onClick={() => s.set({ textScale: TEXT_SCALES[i + 1] })} className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-high disabled:opacity-40">
              <Plus size={16} aria-hidden />
            </button>
          </div>
        </Row>
        <Row label="Show Arabic">
          <Switch label="Show Arabic" checked={s.showArabic} disabled={s.showArabic && !s.showEnglish} onChange={(v) => s.set({ showArabic: v })} />
        </Row>
        <Row label="Show English">
          <Switch label="Show English" checked={s.showEnglish} disabled={s.showEnglish && !s.showArabic} onChange={(v) => s.set({ showEnglish: v })} />
        </Row>
        <Row label="Follow the narration" hint="Keep the verse being read in view">
          <Switch label="Follow the narration" checked={s.autoScroll} onChange={(v) => s.set({ autoScroll: v })} />
        </Row>
      </Section>

      <Section title="Your data">
        <Row label="Export" hint={`${bookmarkCount} bookmarks · progress for ${surahCount} surahs`}>
          <button
            type="button"
            onClick={() => {
              exportData();
              toast('Backup downloaded');
            }}
            className="px-4 h-9 rounded-full text-sm font-semibold bg-surface-container-high hover:bg-surface-bright flex items-center gap-2"
          >
            <Download size={16} aria-hidden /> Export
          </button>
        </Row>
        <Row label="Import" hint="Merges a backup into this device">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-4 h-9 rounded-full text-sm font-semibold bg-surface-container-high hover:bg-surface-bright flex items-center gap-2">
            <Upload size={16} aria-hidden /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </Row>
        <Row label="Reset listening progress" hint="Bookmarks and notes are kept">
          <ConfirmButton
            confirmLabel="Tap to confirm"
            onConfirm={() => {
              useProgressStore.setState({ bySurah: {}, lastSurahId: null });
              toast('Listening progress reset');
            }}
          >
            Reset
          </ConfirmButton>
        </Row>
      </Section>
      <p className="text-xs text-on-surface-variant mt-2 px-1">Everything is stored on this device only. Export a backup to move to another phone.</p>

      <Section title="About">
        <div className="px-4 py-4 text-sm text-on-surface-variant space-y-2 leading-relaxed">
          <p>
            <span className="text-on-surface font-semibold">Translation:</span> {NARRATION.translation}, <i>The Qur’an: A New Translation</i> (Oxford
            World’s Classics).
          </p>
          <p>
            <span className="text-on-surface font-semibold">Narration:</span> the English audio is computer-generated (Piper TTS, voice “Alan”). It
            is not a recitation.
          </p>
          <p>
            <span className="text-on-surface font-semibold">Text:</span> Arabic (Uthmani script) and English from Quran.com.
          </p>
        </div>
      </Section>
    </div>
  );
}
