// Until the TTS pipeline emits real per-verse timings (plan S3-1), estimate them.
// Piper's speaking rate is close to linear in characters, so weighting each verse
// by its text length (plus a constant for the inter-verse pause) tracks the
// narration far better than splitting the file into equal slices.
const PAUSE_WEIGHT = 8;

/** @param {{ en: string }[]} verses @param {number} duration seconds */
export function estimateTimings(verses, duration) {
  const weights = verses.map((v) => v.en.length + PAUSE_WEIGHT);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return verses.map((v, i) => {
    const start = (acc / total) * duration;
    acc += weights[i];
    return { ...v, start, end: (acc / total) * duration };
  });
}

/** Index of the verse playing at time t (binary search over start times). */
export function verseIndexAt(verses, t) {
  let lo = 0;
  let hi = verses.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (verses[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}
