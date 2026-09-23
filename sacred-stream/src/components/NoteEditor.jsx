import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSurah } from '../data/catalog';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useUiStore } from '../stores/uiStore';
import { useSurahVerses } from '../hooks/useSurahVerses';
import { toast } from '../stores/toastStore';

const MAX = 2000;

function Editor({ bookmark, onClose }) {
  const [text, setText] = useState(bookmark.note);
  const { verses } = useSurahVerses(bookmark.surahId);
  const verseText = verses?.find((v) => v.n === bookmark.verse)?.en;
  const ref = useRef(null);
  const titleId = useId();
  const latestClose = useRef(onClose);
  useEffect(() => {
    latestClose.current = onClose;
  }, [onClose]);

  const save = () => {
    useBookmarkStore.getState().setNote(bookmark.id, text.trim());
    toast(text.trim() ? 'Note saved' : 'Note removed');
    onClose();
  };

  useEffect(() => {
    const opener = document.activeElement;
    const el = ref.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      latestClose.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[66] flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Cancel" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/60 animate-fade-in cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:w-[28rem] rounded-t-3xl sm:rounded-2xl bg-surface-container-high p-4 pb-[calc(1rem+var(--safe-bottom))] shadow-2xl animate-sheet-in sm:animate-fade-in"
      >
        <h2 id={titleId} className="font-bold">
          Note on {getSurah(bookmark.surahId).nameTranslit} {bookmark.surahId}:{bookmark.verse}
        </h2>
        {verseText && <p className="font-read text-sm text-on-surface-variant mt-1 line-clamp-3">{verseText}</p>}
        <textarea
          ref={ref}
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && save()}
          rows={5}
          placeholder="What does this verse mean to you?"
          aria-label="Note"
          className="mt-3 w-full rounded-xl bg-surface-container-lowest p-3 text-[0.95rem] leading-relaxed placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/40 resize-y"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-on-surface-variant tabular">
            {text.length}/{MAX}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 h-10 rounded-full font-semibold hover:bg-surface-bright">
              Cancel
            </button>
            <button type="button" onClick={save} className="px-5 h-10 rounded-full bg-primary text-on-primary font-bold hover:brightness-110">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** App-wide note editor, opened via uiStore.openNote(bookmarkId). */
export default function NoteEditor() {
  const noteFor = useUiStore((s) => s.noteFor);
  const closeNote = useUiStore((s) => s.closeNote);
  const bookmark = useBookmarkStore((s) => (noteFor ? s.items.find((b) => b.id === noteFor) : undefined));
  if (!bookmark) return null;
  return createPortal(<Editor key={bookmark.id} bookmark={bookmark} onClose={closeNote} />, document.body);
}
