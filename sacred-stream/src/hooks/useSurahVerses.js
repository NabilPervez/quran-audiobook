import { useEffect, useState } from 'react';
import { getSurah } from '../data/catalog';
import { estimateTimings } from '../lib/verseTiming';

const API = 'https://api.quran.com/api/v4';
const TRANSLATION_ID = 85; // M.A.S. Abdel Haleem, same text the narration was generated from
const cache = new Map();

/** Strip footnote markers and all markup, returning plain text (never injected as HTML). */
function toPlainText(html) {
  const withoutNotes = html.replace(/<sup[^>]*>.*?<\/sup>/g, '');
  return new DOMParser().parseFromString(withoutNotes, 'text/html').body.textContent.trim();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Requests are shared through the cache, so they are never aborted; unmounting
// components simply ignore the result.
function loadVerses(id) {
  if (!cache.has(id)) {
    const promise = Promise.all([
      fetchJson(`${API}/verses/by_chapter/${id}?translations=${TRANSLATION_ID}&per_page=300&words=false`),
      fetchJson(`${API}/quran/verses/uthmani?chapter_number=${id}`),
    ]).then(([en, ar]) => {
      const arabicByKey = new Map(ar.verses.map((v) => [v.verse_key, v.text_uthmani]));
      const verses = en.verses.map((v) => ({
        n: v.verse_number,
        key: v.verse_key,
        en: toPlainText(v.translations[0]?.text ?? ''),
        ar: arabicByKey.get(v.verse_key) ?? '',
      }));
      return estimateTimings(verses, getSurah(id).durationSec);
    });
    promise.catch(() => cache.delete(id)); // allow retry after a failure
    cache.set(id, promise);
  }
  return cache.get(id);
}

/**
 * Verse text (English + Arabic) with estimated start/end times.
 * @returns {{ verses: Array<{n:number,key:string,en:string,ar:string,start:number,end:number}> | null, error: Error | null, retry: () => void }}
 */
export function useSurahVerses(id) {
  const [state, setState] = useState({ id: null, verses: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadVerses(id).then(
      (verses) => active && setState({ id, verses, error: null }),
      (error) => active && setState({ id, verses: null, error })
    );
    return () => {
      active = false;
    };
  }, [id, attempt]);

  const current = state.id === id;
  return {
    verses: current ? state.verses : null,
    error: current ? state.error : null,
    retry: () => setAttempt((a) => a + 1),
  };
}
