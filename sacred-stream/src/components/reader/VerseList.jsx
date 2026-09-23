import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import VerseItem from './VerseItem';
import { useVerseActions } from './VerseActions';

const USER_SCROLL_GRACE_MS = 5000;

/**
 * Verse-by-verse text for one surah, honouring the reader settings (Arabic,
 * English, text size, auto-scroll).
 *
 * When `activeIndex` >= 0 the list follows the narration, pausing for a few
 * seconds whenever the user scrolls by hand. `scrollRef` is the scrolling
 * container; omit it when the page itself scrolls (no follow mode then).
 */
export default function VerseList({ surahId, verses, activeIndex = -1, focusVerse, onPlayFrom, scrollRef }) {
  const { showArabic, showEnglish, textScale, autoScroll } = useSettingsStore();
  const bookmarkedItems = useBookmarkStore((s) => s.items);
  const bookmarked = useMemo(
    () => new Set(bookmarkedItems.filter((b) => b.surahId === surahId).map((b) => b.verse)),
    [bookmarkedItems, surahId]
  );
  const { openFor, sheet } = useVerseActions(surahId, onPlayFrom);

  const listRef = useRef(null);
  const userScrolledAt = useRef(0);
  const [offscreen, setOffscreen] = useState(false);
  const firstScroll = useRef(true);

  // The element to keep in view: the verse being narrated, else a verse from a link (?v=).
  const activeEl = useCallback(() => {
    const n = activeIndex >= 0 ? verses[activeIndex].n : focusVerse;
    return n ? listRef.current?.querySelector(`[data-verse="${n}"]`) : null;
  }, [activeIndex, verses, focusVerse]);

  const scrollToActive = useCallback(
    (behavior) => {
      const el = activeEl();
      if (!el) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : behavior });
    },
    [activeEl]
  );

  // Jump to the target once, then follow the narration if auto-scroll is on.
  useLayoutEffect(() => {
    if (activeIndex < 0 && !focusVerse) return;
    if (firstScroll.current) {
      firstScroll.current = false;
      scrollToActive('auto');
      return;
    }
    if (autoScroll && activeIndex >= 0 && Date.now() - userScrolledAt.current > USER_SCROLL_GRACE_MS) {
      scrollToActive('smooth');
    }
  }, [activeIndex, focusVerse, autoScroll, scrollToActive]);

  // The list may mount while hidden (phone Listen tab). Jump to the active verse
  // whenever the panel goes from hidden to visible.
  useEffect(() => {
    const root = scrollRef?.current;
    if (!root) return;
    let wasHidden = root.clientHeight === 0;
    const ro = new ResizeObserver(() => {
      const hidden = root.clientHeight === 0;
      if (wasHidden && !hidden) {
        userScrolledAt.current = 0;
        scrollToActive('auto');
      }
      wasHidden = hidden;
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [scrollRef, scrollToActive]);

  // Track manual scrolling and whether the active verse is visible.
  useEffect(() => {
    const root = scrollRef?.current;
    if (!root) return;
    const markUser = () => {
      userScrolledAt.current = Date.now();
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = activeIndex >= 0 ? activeEl() : null;
        if (!el) return setOffscreen(false);
        const r = el.getBoundingClientRect();
        const box = root.getBoundingClientRect();
        setOffscreen(r.bottom < box.top + 40 || r.top > box.bottom - 40);
      });
    };
    root.addEventListener('wheel', markUser, { passive: true });
    root.addEventListener('touchmove', markUser, { passive: true });
    root.addEventListener('keydown', markUser);
    root.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('wheel', markUser);
      root.removeEventListener('touchmove', markUser);
      root.removeEventListener('keydown', markUser);
      root.removeEventListener('scroll', onScroll);
    };
  }, [scrollRef, activeEl, activeIndex]);

  return (
    <>
      <div ref={listRef} className="space-y-1" style={{ fontSize: `${textScale}rem` }}>
        {verses.map((v, i) => (
          <VerseItem
            key={v.n}
            verse={v}
            state={activeIndex < 0 ? 'idle' : i < activeIndex ? 'past' : i === activeIndex ? 'active' : 'future'}
            bookmarked={bookmarked.has(v.n)}
            showArabic={showArabic}
            showEnglish={showEnglish || !showArabic}
            onPlayFrom={onPlayFrom}
            onActions={openFor}
          />
        ))}
      </div>
      {offscreen && (
        <button
          type="button"
          onClick={() => {
            userScrolledAt.current = 0;
            scrollToActive('smooth');
          }}
          className="sticky bottom-4 mx-auto flex items-center gap-2 px-4 h-10 rounded-full bg-on-surface text-surface text-sm font-bold shadow-2xl"
        >
          <ArrowDown size={16} aria-hidden /> Back to current verse
        </button>
      )}
      {sheet}
    </>
  );
}
