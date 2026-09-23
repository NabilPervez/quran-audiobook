import { useSyncExternalStore } from 'react';

// High-frequency playback time lives outside zustand so that only components
// that actually display time re-render while audio plays.
let snapshot = { t: 0, d: 0 };
const listeners = new Set();

export const timeBus = {
  get: () => snapshot,
  set(next) {
    if (next.t === snapshot.t && next.d === snapshot.d) return;
    snapshot = next;
    listeners.forEach((fn) => fn());
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/** @returns {{ t: number, d: number }} current time and duration in seconds */
export const useCurrentTime = () => useSyncExternalStore(timeBus.subscribe, timeBus.get);
