import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MoreHorizontal, NotebookPen, Play, Trash2 } from 'lucide-react';
import { getSurah } from '../../data/catalog';
import { useSurahVerses } from '../../hooks/useSurahVerses';
import { useOpenBookmark } from '../../hooks/useOpenBookmark';
import { formatRelative, formatTime } from '../../lib/format';
import { removeBookmark } from '../../lib/verseActions';
import { openNote } from '../../stores/uiStore';
import ActionSheet from '../ActionSheet';

export default function BookmarkItem({ bookmark: b, showSurah = true }) {
  const surah = getSurah(b.surahId);
  const { verses } = useSurahVerses(b.surahId);
  const text = verses?.find((v) => v.n === b.verse)?.en;
  const openBookmark = useOpenBookmark();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  return (
    <li className="flex items-start gap-2 rounded-xl hover:bg-surface-container-low transition-colors">
      <button type="button" onClick={() => openBookmark(b)} className="flex-1 min-w-0 text-left px-3 py-3">
        <span className="flex items-baseline gap-2 text-xs">
          <span className="font-bold text-primary tabular">
            {b.surahId}:{b.verse}
          </span>
          {showSurah && <span className="font-semibold text-on-surface">{surah.nameTranslit}</span>}
          <span className="text-on-surface-variant tabular">· {formatTime(b.time)}</span>
        </span>
        <span className="block font-read text-[0.95rem] leading-relaxed text-on-surface/90 mt-1 line-clamp-2 min-h-[1.5em]">
          {text ?? '…'}
        </span>
        {b.note && <span className="block text-sm text-on-surface-variant mt-1.5 line-clamp-2 border-l-2 border-primary/50 pl-2">{b.note}</span>}
        <span className="block text-[11px] text-on-surface-variant mt-1.5">Saved {formatRelative(b.createdAt)}</span>
      </button>
      <button
        type="button"
        onClick={() => setMenu(true)}
        aria-label={`More actions for bookmark ${b.surahId}:${b.verse}`}
        className="mt-2 mr-1 w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
      >
        <MoreHorizontal size={18} aria-hidden />
      </button>
      {menu && (
        <ActionSheet
          title={`${surah.nameTranslit} ${b.surahId}:${b.verse}`}
          subtitle={text}
          onClose={() => setMenu(false)}
          items={[
            { icon: Play, label: 'Play from bookmark', onSelect: () => openBookmark(b) },
            { icon: NotebookPen, label: b.note ? 'Edit note' : 'Add note', onSelect: () => openNote(b) },
            { icon: BookOpen, label: `Go to ${surah.nameTranslit}`, onSelect: () => navigate(`/surah/${b.surahId}`) },
            { icon: Trash2, label: 'Remove bookmark', onSelect: () => removeBookmark(b), destructive: true },
          ]}
        />
      )}
    </li>
  );
}
