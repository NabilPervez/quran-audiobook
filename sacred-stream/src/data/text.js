import { getSurah } from './catalog';
import { estimateTimings } from '../lib/verseTiming';

// Verse text lives in /data/text/NNN.json (built by scripts/build_content.py).
// Files may carry aligned `start`/`end` times; if not, they are estimated.
const cache = new Map();

export const textUrl = (id) => `/data/text/${String(id).padStart(3, '0')}.json`;

/**
 * @returns {Promise<Array<{ n: number, key: string, en: string, ar: string, start: number, end: number }>>}
 */
export function loadVerses(id) {
  if (!cache.has(id)) {
    const promise = fetch(textUrl(id))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const verses = data.verses.map((v) => ({ ...v, key: `${id}:${v.n}` }));
        return verses.every((v) => Number.isFinite(v.start))
          ? verses
          : estimateTimings(verses, getSurah(id).durationSec);
      });
    promise.catch(() => cache.delete(id)); // allow a retry after a failure
    cache.set(id, promise);
  }
  return cache.get(id);
}
