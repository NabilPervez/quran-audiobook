import { surahs } from '../data/catalog';
import { loadVerses } from '../data/text';

/** Lowercase, strip diacritics/punctuation so "Al-Kahf", "al kahf" and "alkahf" compare equal. */
export const normaliseName = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ'’‘`\-\s]/g, '');

/** Lowercase words-only form of prose for full-text matching. */
export const normaliseText = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ');

export function matchesSurah(surah, query) {
  const q = query.trim();
  if (!q) return true;
  if (String(surah.id) === q) return true;
  const nq = normaliseName(q);
  return (
    normaliseName(surah.nameTranslit).includes(nq) ||
    normaliseName(surah.meaning).includes(nq) ||
    surah.nameArabic.includes(q)
  );
}

let allTextPromise = null;

/** Loads every surah's text once (≈2.5 MB, cached by the service worker afterwards). */
export function loadAllText() {
  if (!allTextPromise) {
    allTextPromise = Promise.all(
      surahs.map((s) =>
        loadVerses(s.id).then((verses) => verses.map((v) => ({ surahId: s.id, n: v.n, en: v.en, norm: normaliseText(v.en) })))
      )
    ).then((lists) => lists.flat());
    allTextPromise.catch(() => {
      allTextPromise = null;
    });
  }
  return allTextPromise;
}

/** Every term must appear (as a word prefix) in the verse. Returns matches in book order. */
export function searchVerses(index, query, limit = 100) {
  const terms = normaliseText(query).split(' ').filter((t) => t.length > 1);
  if (!terms.length) return { total: 0, results: [], terms };
  const patterns = terms.map((t) => new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  const results = [];
  let total = 0;
  for (const v of index) {
    if (patterns.every((p) => p.test(v.norm))) {
      total += 1;
      if (results.length < limit) results.push(v);
    }
  }
  return { total, results, terms };
}

/** Split text into [{ text, hit }] parts for highlighting search terms without innerHTML. */
export function highlight(text, terms) {
  if (!terms.length) return [{ text, hit: false }];
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`\\b(${escaped.join('|')})[a-z']*`, 'gi');
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}
