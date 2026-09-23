import { useCallback, useSyncExternalStore } from 'react';
import { timeBus } from '../audio/timeBus';
import { verseIndexAt } from '../lib/verseTiming';

/**
 * Index of the verse currently being narrated, or -1 when disabled / no verses.
 * Subscribes to the time bus but only re-renders when the index changes.
 */
export function useActiveVerse(verses, enabled = true) {
  const getSnapshot = useCallback(
    () => (enabled && verses?.length ? verseIndexAt(verses, timeBus.get().t) : -1),
    [verses, enabled]
  );
  return useSyncExternalStore(timeBus.subscribe, getSnapshot);
}
