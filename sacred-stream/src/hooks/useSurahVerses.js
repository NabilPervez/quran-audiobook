import { useEffect, useState } from 'react';
import { loadVerses } from '../data/text';

/**
 * Verse text (English + Arabic) with start/end times for one surah.
 * @returns {{ verses: Array<{n:number,key:string,en:string,ar:string,start:number,end:number}> | null, error: Error | null, retry: () => void }}
 */
export function useSurahVerses(id) {
  const [state, setState] = useState({ id: null, attempt: 0, verses: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadVerses(id).then(
      (verses) => active && setState({ id, attempt, verses, error: null }),
      (error) => active && setState({ id, attempt, verses: null, error })
    );
    return () => {
      active = false;
    };
  }, [id, attempt]);

  const current = state.id === id && state.attempt === attempt;
  return {
    verses: current ? state.verses : null,
    error: current ? state.error : null,
    retry: () => setAttempt((a) => a + 1),
  };
}
