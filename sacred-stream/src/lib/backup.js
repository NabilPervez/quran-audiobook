import { useBookmarkStore } from '../stores/bookmarkStore';
import { useProgressStore } from '../stores/progressStore';
import { SPEEDS, TEXT_SCALES, useSettingsStore } from '../stores/settingsStore';

// Everything lives in this browser only, so export/import is how people move
// their bookmarks, notes and progress to a new phone.
const APP = 'sacred-stream';
const VERSION = 1;

export function exportData() {
  const { bySurah, lastSurahId } = useProgressStore.getState();
  const { items } = useBookmarkStore.getState();
  const settings = Object.fromEntries(Object.entries(useSettingsStore.getState()).filter(([, v]) => typeof v !== 'function'));
  const data = { app: APP, version: VERSION, exportedAt: new Date().toISOString(), progress: { bySurah, lastSurahId }, bookmarks: items, settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sacred-stream-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { bookmarks: items.length, surahs: Object.keys(bySurah).length };
}

const isSurahId = (n) => Number.isInteger(n) && n >= 1 && n <= 114;
const isNum = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

function validBookmark(b) {
  return (
    b && typeof b.id === 'string' && isSurahId(b.surahId) && Number.isInteger(b.verse) && b.verse >= 1 &&
    isNum(b.time) && typeof (b.note ?? '') === 'string' && isNum(b.createdAt)
  );
}

function validProgress(e) {
  return e && isNum(e.position) && isNum(e.duration) && typeof e.finished === 'boolean' && isNum(e.updatedAt);
}

const SETTING_RULES = {
  rate: (v) => SPEEDS.includes(v),
  skipBack: (v) => [10, 15, 30].includes(v),
  skipForward: (v) => [15, 30, 45].includes(v),
  autoAdvance: (v) => typeof v === 'boolean',
  showArabic: (v) => typeof v === 'boolean',
  showEnglish: (v) => typeof v === 'boolean',
  textScale: (v) => TEXT_SCALES.includes(v),
  autoScroll: (v) => typeof v === 'boolean',
};

/**
 * Merge a backup into this device: bookmarks by id (a verse already bookmarked
 * here keeps its local copy), progress per surah by most recent update, and
 * valid settings. Throws with a readable message on a bad file.
 */
export async function importData(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t a Sacred Stream backup.');
  }
  if (data?.app !== APP || typeof data.version !== 'number') throw new Error('That file isn’t a Sacred Stream backup.');
  if (data.version > VERSION) throw new Error('This backup is from a newer version of the app.');

  // Bookmarks
  const bookmarks = useBookmarkStore.getState();
  const byId = new Set(bookmarks.items.map((b) => b.id));
  const byVerse = new Set(bookmarks.items.map((b) => `${b.surahId}:${b.verse}`));
  const incoming = (Array.isArray(data.bookmarks) ? data.bookmarks : []).filter(validBookmark);
  const added = incoming
    .filter((b) => !byId.has(b.id) && !byVerse.has(`${b.surahId}:${b.verse}`))
    .map((b) => ({ ...b, note: (b.note ?? '').slice(0, 2000), updatedAt: isNum(b.updatedAt) ? b.updatedAt : b.createdAt }));
  useBookmarkStore.setState({ items: [...bookmarks.items, ...added].sort((a, b) => b.createdAt - a.createdAt) });

  // Progress
  const progress = useProgressStore.getState();
  const merged = { ...progress.bySurah };
  let updated = 0;
  for (const [id, entry] of Object.entries(data.progress?.bySurah ?? {})) {
    if (!isSurahId(Number(id)) || !validProgress(entry)) continue;
    if (!merged[id] || merged[id].updatedAt < entry.updatedAt) {
      merged[id] = entry;
      updated += 1;
    }
  }
  const lastSurahId = isSurahId(data.progress?.lastSurahId) && !progress.lastSurahId ? data.progress.lastSurahId : progress.lastSurahId;
  useProgressStore.setState({ bySurah: merged, lastSurahId });

  // Settings
  const settings = Object.fromEntries(
    Object.entries(data.settings ?? {}).filter(([k, v]) => SETTING_RULES[k]?.(v))
  );
  useSettingsStore.setState(settings);

  return { bookmarks: added.length, surahs: updated };
}
