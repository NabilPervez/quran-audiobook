import { getSurah } from '../data/catalog';
import { usePlayerStore } from '../stores/playerStore';
import { useProgressStore, resumePointFor } from '../stores/progressStore';
import { useSettingsStore } from '../stores/settingsStore';
import { timeBus } from './timeBus';
import { bindMediaSession, updateMediaMetadata, updatePositionState } from './mediaSession';

// The one and only audio element. It lives outside React so any screen can
// control playback, and StrictMode double-mounts can't create a second one.
const el = typeof Audio !== 'undefined' ? new Audio() : null;
const SAVE_INTERVAL_MS = 5000;
const FADE_OUT_SEC = 10;

let loadedId = null; // surah whose src is currently on the element
let pendingSeek = null; // position to apply once metadata is available
let lastSavedAt = 0;

const setPlayer = (patch) => usePlayerStore.setState(patch);
const settings = () => useSettingsStore.getState();

function pushTime() {
  timeBus.set({ t: el.currentTime, d: Number.isFinite(el.duration) ? el.duration : 0 });
}

function saveProgress() {
  if (!loadedId || el.readyState < 1 || !Number.isFinite(el.duration)) return;
  useProgressStore.getState().save(loadedId, el.currentTime, el.duration);
  lastSavedAt = Date.now();
}

function applyRate() {
  el.defaultPlaybackRate = settings().rate;
  el.playbackRate = settings().rate;
  el.preservesPitch = true;
}

// ---------------------------------------------------------------------------
// Sleep timer
// ---------------------------------------------------------------------------
let sleepInterval = null;

function clearSleep() {
  clearInterval(sleepInterval);
  sleepInterval = null;
  el.volume = 1;
  setPlayer({ sleep: null });
}

function checkSleep() {
  const { sleep } = usePlayerStore.getState();
  if (sleep?.mode !== 'minutes') return;
  const remaining = (sleep.endsAt - Date.now()) / 1000;
  if (remaining <= 0) {
    el.pause();
    clearSleep();
  } else if (remaining <= FADE_OUT_SEC) {
    el.volume = Math.max(0, remaining / FADE_OUT_SEC);
  }
}

// ---------------------------------------------------------------------------
// Element events are the single source of truth for status.
// ---------------------------------------------------------------------------
function onEnded() {
  const id = loadedId;
  saveProgress();
  useProgressStore.getState().markFinished(id);

  if (usePlayerStore.getState().sleep?.mode === 'chapter') {
    clearSleep();
    setPlayer({ status: 'ended' });
    return;
  }
  if (settings().autoAdvance && id < 114) {
    engine.load(id + 1, { at: 0, autoplay: true });
  } else {
    setPlayer({ status: 'ended' });
  }
}

if (el) {
  el.preload = 'metadata';
  el.addEventListener('loadedmetadata', () => {
    if (pendingSeek != null) {
      el.currentTime = Math.min(pendingSeek, el.duration || pendingSeek);
      pendingSeek = null;
    }
    applyRate();
    pushTime();
    updatePositionState(el);
    if (el.paused && usePlayerStore.getState().status === 'loading') setPlayer({ status: 'paused' });
  });
  el.addEventListener('durationchange', pushTime);
  el.addEventListener('timeupdate', () => {
    pushTime();
    if (!el.paused && Date.now() - lastSavedAt > SAVE_INTERVAL_MS) saveProgress();
  });
  el.addEventListener('seeked', () => {
    pushTime();
    updatePositionState(el);
    saveProgress();
  });
  el.addEventListener('play', () => setPlayer({ status: 'playing', error: null }));
  el.addEventListener('playing', () => {
    setPlayer({ status: 'playing', error: null });
    updatePositionState(el);
  });
  el.addEventListener('waiting', () => setPlayer({ status: 'buffering' }));
  el.addEventListener('pause', () => {
    // 'pause' also fires just before 'ended'; let onEnded decide the final status.
    if (!el.ended) setPlayer({ status: 'paused' });
    saveProgress();
    updatePositionState(el);
  });
  el.addEventListener('ratechange', () => updatePositionState(el));
  el.addEventListener('ended', onEnded);
  el.addEventListener('error', () => {
    if (!el.src) return;
    setPlayer({ status: 'error', error: el.error?.message || 'Could not load audio' });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveProgress();
  });
  window.addEventListener('pagehide', saveProgress);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const engine = {
  /**
   * Load a surah. Starts at its resume point unless `at` is given.
   * @param {number} id
   * @param {{ at?: number, autoplay?: boolean }} [opts]
   */
  load(id, { at, autoplay = true } = {}) {
    const surah = getSurah(id);
    if (!surah || !el) return;
    const start = at ?? resumePointFor(id);

    if (loadedId !== id) {
      if (loadedId) saveProgress();
      loadedId = id;
      pendingSeek = start;
      setPlayer({ surahId: id, status: 'loading', error: null });
      timeBus.set({ t: start, d: surah.durationSec });
      el.src = surah.audioUrl;
      updateMediaMetadata(surah);
    } else if (at != null) {
      engine.seek(at);
    }
    useProgressStore.setState({ lastSurahId: id });
    if (autoplay) return engine.play();
  },

  /** Load the last-played surah paused, so the mini-player can offer "Resume". */
  restore() {
    const id = useProgressStore.getState().lastSurahId;
    if (id && !loadedId) engine.load(id, { autoplay: false });
  },

  play() {
    if (!el?.src) return Promise.resolve();
    if (el.ended) el.currentTime = 0;
    if (el.readyState < 3) setPlayer({ status: 'buffering' });
    return el.play().catch((err) => {
      if (err.name === 'AbortError') return; // superseded by a newer load()
      setPlayer({
        status: 'paused',
        error: err.name === 'NotAllowedError' ? 'tap-to-play' : err.message,
      });
    });
  },

  pause() {
    el?.pause();
  },

  toggle() {
    if (!el) return;
    if (el.paused) engine.play();
    else engine.pause();
  },

  seek(t) {
    if (!el) return;
    const d = Number.isFinite(el.duration) ? el.duration : getSurah(loadedId)?.durationSec ?? t;
    const clamped = Math.max(0, Math.min(t, d));
    if (el.readyState < 1) {
      pendingSeek = clamped;
      timeBus.set({ t: clamped, d });
      return;
    }
    el.currentTime = clamped;
    pushTime();
  },

  skip(delta) {
    engine.seek((el?.currentTime ?? 0) + delta);
  },

  /** Standard audiobook behaviour: restart the chapter, or go back one if near its start. */
  prevSurah() {
    if (!loadedId) return;
    if (el.currentTime > 3 || loadedId === 1) engine.seek(0);
    else engine.load(loadedId - 1, { at: 0, autoplay: !el.paused });
  },

  nextSurah() {
    if (!loadedId || loadedId >= 114) return;
    engine.load(loadedId + 1, { at: 0, autoplay: !el.paused });
  },

  setRate(rate) {
    useSettingsStore.getState().set({ rate });
    if (el) applyRate();
  },

  /** @param {number | 'chapter' | null} minutes */
  setSleep(minutes) {
    clearSleep();
    if (minutes === 'chapter') setPlayer({ sleep: { mode: 'chapter' } });
    else if (minutes) {
      setPlayer({ sleep: { mode: 'minutes', endsAt: Date.now() + minutes * 60_000 } });
      sleepInterval = setInterval(checkSleep, 500);
    }
  },
};

bindMediaSession(engine, settings);
