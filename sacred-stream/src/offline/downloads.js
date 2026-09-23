import { create } from 'zustand';
import { getSurah, surahs } from '../data/catalog';
import { textUrl } from '../data/text';
import { toast } from '../stores/toastStore';

// Must match the runtime cache names in vite.config.js. The service worker
// serves /audio/* from AUDIO_CACHE (with Range support, so seeking works) and
// only full 200 responses are stored, so streaming never fills it by itself:
// the only way audio gets in is an explicit download here.
export const AUDIO_CACHE = 'audio-cache';
export const TEXT_CACHE = 'text-cache';
const CONCURRENCY = 2;

const supported = typeof caches !== 'undefined';

/**
 * status[id]: 'queued' | 'downloading' | 'done' | 'error' (absent = not downloaded)
 * progress[id]: 0..1 while downloading
 */
export const useDownloadStore = create(() => ({ status: {}, progress: {}, ready: false }));

const setStatus = (id, s) =>
  useDownloadStore.setState((st) => {
    const status = { ...st.status };
    if (s) status[id] = s;
    else delete status[id];
    return { status };
  });
const setProgress = (id, p) => useDownloadStore.setState((st) => ({ progress: { ...st.progress, [id]: p } }));

const queue = [];
const controllers = new Map();
let active = 0;

/** Rebuild state from what is actually in the cache (the source of truth). */
export async function reconcileDownloads() {
  if (!supported) return useDownloadStore.setState({ ready: true });
  const cache = await caches.open(AUDIO_CACHE);
  const keys = await cache.keys();
  const cached = new Set(keys.map((r) => new URL(r.url).pathname));
  const status = {};
  for (const s of surahs) if (cached.has(s.audioUrl)) status[s.id] = 'done';
  useDownloadStore.setState({ status, progress: {}, ready: true });
}

async function fetchWithProgress(url, onProgress, signal) {
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(received / total);
  }
  return { blob: new Blob(chunks, { type: res.headers.get('content-type') || 'audio/mpeg' }), size: received };
}

async function run(id) {
  const surah = getSurah(id);
  const controller = new AbortController();
  controllers.set(id, controller);
  setStatus(id, 'downloading');
  setProgress(id, 0);
  try {
    const { blob, size } = await fetchWithProgress(surah.audioUrl, (p) => setProgress(id, p), controller.signal);
    const audio = await caches.open(AUDIO_CACHE);
    await audio.put(
      new Request(surah.audioUrl),
      new Response(blob, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(size) } })
    );
    // Text too, so reading works offline.
    const text = await caches.open(TEXT_CACHE);
    await text.add(textUrl(id)).catch(() => {});
    setStatus(id, 'done');
  } catch (err) {
    setStatus(id, err.name === 'AbortError' ? null : 'error');
  } finally {
    controllers.delete(id);
    active -= 1;
    pump();
  }
}

function pump() {
  while (active < CONCURRENCY && queue.length) {
    active += 1;
    run(queue.shift());
  }
}

let askedPersist = false;
async function requestPersistence() {
  if (askedPersist || !navigator.storage?.persist) return;
  askedPersist = true;
  // Ask the browser not to evict downloads (and bookmarks) under storage pressure.
  await navigator.storage.persist().catch(() => {});
}

export function download(ids) {
  if (!supported) {
    toast('Downloads aren’t supported in this browser.');
    return;
  }
  requestPersistence();
  const { status } = useDownloadStore.getState();
  for (const id of [].concat(ids)) {
    if (status[id] === 'done' || status[id] === 'queued' || status[id] === 'downloading') continue;
    queue.push(id);
    setStatus(id, 'queued');
  }
  pump();
}

export function cancel(id) {
  const i = queue.indexOf(id);
  if (i >= 0) {
    queue.splice(i, 1);
    setStatus(id, null);
  }
  controllers.get(id)?.abort();
}

export async function removeDownload(ids) {
  if (!supported) return;
  const audio = await caches.open(AUDIO_CACHE);
  for (const id of [].concat(ids)) {
    cancel(id);
    await audio.delete(getSurah(id).audioUrl);
    setStatus(id, null);
  }
}

export const downloadedBytes = (status) =>
  Object.entries(status).reduce((sum, [id, s]) => sum + (s === 'done' ? getSurah(id).sizeBytes : 0), 0);

export function formatBytes(n) {
  if (n <= 0) return '0 MB';
  if (n < 1e6) return `${Math.max(1, Math.round(n / 1e3))} KB`;
  return `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;
}
