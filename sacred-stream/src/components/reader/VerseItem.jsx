import { memo } from 'react';
import { Bookmark, MoreHorizontal, Play } from 'lucide-react';

/**
 * One verse. Tap plays from it (unless text is being selected); the ⋯ button,
 * right-click or long-press opens its actions. Sizes are in em so the reader's
 * text-size setting (font-size on the list) scales everything together.
 */
function VerseItem({ verse, state = 'idle', bookmarked, showArabic, showEnglish, onPlayFrom, onActions }) {
  const active = state === 'active';
  return (
    <article
      data-verse={verse.n}
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        if (!window.getSelection()?.toString()) onPlayFrom(verse);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onActions(verse);
      }}
      className={`group relative rounded-2xl px-4 py-5 sm:px-6 cursor-pointer transition-colors duration-300 ${
        active ? 'bg-surface-container-high shadow-[inset_3px_0_0_theme(colors.primary)]' : 'hover:bg-surface-container-low'
      } ${state === 'past' ? 'opacity-70' : ''}`}
    >
      <header className="flex items-center gap-2 mb-3 text-[1rem]">
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
        {bookmarked && <Bookmark size={16} className="text-primary" fill="currentColor" aria-label="Bookmarked" />}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onActions(verse);
          }}
          aria-label={`More actions for verse ${verse.n}`}
          className="ml-auto w-9 h-9 -my-1 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </header>
      {showArabic && verse.ar && (
        <p lang="ar" dir="rtl" className="arabic text-[1.65em] text-on-surface mb-3">
          {verse.ar}
        </p>
      )}
      {showEnglish && (
        <p className={`font-read text-[1.075em] leading-[1.75] ${active ? 'text-on-surface' : 'text-on-surface/85'}`}>{verse.en}</p>
      )}
    </article>
  );
}

export default memo(VerseItem);
