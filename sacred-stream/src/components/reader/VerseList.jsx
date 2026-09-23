import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, Play } from 'lucide-react';

const USER_SCROLL_GRACE_MS = 5000;

const VerseItem = memo(function VerseItem({ verse, state, showArabic, onPlayFrom }) {
  const active = state === 'active';
  return (
    <article
      id={`verse-${verse.n}`}
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        // Tapping a verse plays from it, unless the user is selecting text to copy.
        if (!window.getSelection()?.toString()) onPlayFrom(verse);
      }}
      className={`group relative rounded-2xl px-4 py-5 sm:px-6 cursor-pointer transition-colors duration-300 ${
        active ? 'bg-surface-container-high shadow-[inset_3px_0_0_theme(colors.primary)]' : 'hover:bg-surface-container-low'
      } ${state === 'past' ? 'opacity-70' : ''}`}
    >
      <header className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayFrom(verse);
          }}
          aria-label={`Play from verse ${verse.n}`}
          className={`h-7 min-w-7 px-2 rounded-full text-xs font-bold tabular flex items-center gap-1 transition-colors ${
            active ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant group-hover:text-on-surface'
          }`}
        >
          <Play size={10} fill="currentColor" className="hidden group-hover:block" aria-hidden />
          {verse.key}
        </button>
      </header>
      {showArabic && verse.ar && (
        <p lang="ar" dir="rtl" className="arabic text-[1.65rem] sm:text-3xl text-on-surface mb-3">
          {verse.ar}
        </p>
      )}
      <p className={`font-read text-[1.075rem] sm:text-lg leading-[1.75] ${active ? 'text-on-surface' : 'text-on-surface/85'}`}>
        {verse.en}
      </p>
    </article>
  );
});

/**
 * Verse-by-verse text. When `activeIndex` >= 0 the list follows the narration,
 * but pauses following for a few seconds whenever the user scrolls by hand.
 */
export default function VerseList({ verses, activeIndex, focusVerse, showArabic, onPlayFrom, scrollRef }) {
  const userScrolledAt = useRef(0);
  const [offscreen, setOffscreen] = useState(false);
  const firstScroll = useRef(true);

  // The element to keep in view: the verse being narrated, else a verse from a link (?v=).
  const activeEl = useCallback(() => {
    if (activeIndex >= 0) return document.getElementById(`verse-${verses[activeIndex].n}`);
    return focusVerse ? document.getElementById(`verse-${focusVerse}`) : null;
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

  // Follow the narration.
  useLayoutEffect(() => {
    if (activeIndex < 0 && !focusVerse) return;
    if (firstScroll.current) {
      firstScroll.current = false;
      scrollToActive('auto');
      return;
    }
    if (activeIndex >= 0 && Date.now() - userScrolledAt.current > USER_SCROLL_GRACE_MS) scrollToActive('smooth');
  }, [activeIndex, focusVerse, scrollToActive]);

  // The list may mount while hidden (phone Listen tab). Jump to the active verse
  // whenever the panel goes from hidden to visible.
  useEffect(() => {
    const root = scrollRef.current;
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
    const root = scrollRef.current;
    if (!root) return;
    const markUser = () => {
      userScrolledAt.current = Date.now();
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = activeEl();
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
  }, [scrollRef, activeEl]);

  return (
    <>
      <div className="space-y-1">
        {verses.map((v, i) => (
          <VerseItem
            key={v.n}
            verse={v}
            state={activeIndex < 0 ? 'future' : i < activeIndex ? 'past' : i === activeIndex ? 'active' : 'future'}
            showArabic={showArabic}
            onPlayFrom={onPlayFrom}
          />
        ))}
      </div>
      {offscreen && activeIndex >= 0 && (
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
    </>
  );
}
