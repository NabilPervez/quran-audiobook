// Lock-screen, notification, headphone and car controls.
const supported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export function bindMediaSession(engine, getSettings) {
  if (!supported) return;
  const ms = navigator.mediaSession;
  const handlers = {
    play: () => engine.play(),
    pause: () => engine.pause(),
    seekbackward: (d) => engine.skip(-(d.seekOffset || getSettings().skipBack)),
    seekforward: (d) => engine.skip(d.seekOffset || getSettings().skipForward),
    seekto: (d) => engine.seek(d.seekTime),
    previoustrack: () => engine.prevSurah(),
    nexttrack: () => engine.nextSurah(),
  };
  for (const [action, fn] of Object.entries(handlers)) {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      // Action not supported by this browser.
    }
  }
}

export function updateMediaMetadata(surah) {
  if (!supported || typeof MediaMetadata === 'undefined') return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${surah.id}. ${surah.nameTranslit} (${surah.meaning})`,
    artist: 'The Quran in English',
    album: 'Translation: M.A.S. Abdel Haleem',
    artwork: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  });
}

export function updatePositionState(el) {
  if (!supported || !navigator.mediaSession.setPositionState) return;
  if (!Number.isFinite(el.duration) || el.duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: el.duration,
      position: Math.min(el.currentTime, el.duration),
      playbackRate: el.playbackRate || 1,
    });
  } catch {
    // Some browsers throw while metadata is still settling.
  }
}
