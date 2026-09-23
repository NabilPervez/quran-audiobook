import { create } from 'zustand';

/**
 * Coarse, session-only playback state. `status` is driven by <audio> events in
 * audio/engine.js, never set optimistically by UI code.
 *
 * status: 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error'
 */
export const usePlayerStore = create(() => ({
  surahId: null,
  status: 'idle',
  error: null, // 'tap-to-play' | string
  sleep: null, // { mode: 'minutes', endsAt: number } | { mode: 'chapter' }
}));

export const selectIsPlaying = (s) => s.status === 'playing' || s.status === 'buffering';
