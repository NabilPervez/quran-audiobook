import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet of actions (phones) / centred menu (desktop).
 * items: [{ icon: LucideIcon, label, onSelect, destructive? }]
 */
export default function ActionSheet({ title, subtitle, items, onClose }) {
  const firstRef = useRef(null);
  const latestClose = useRef(onClose);
  useEffect(() => {
    latestClose.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    firstRef.current?.focus();
    // Capture phase + stopPropagation so Escape closes only this sheet, not the player under it.
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

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/60 animate-fade-in cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:w-96 rounded-t-3xl sm:rounded-2xl bg-surface-container-high p-2 pb-[calc(0.5rem+var(--safe-bottom))] shadow-2xl animate-sheet-in sm:animate-fade-in"
      >
        <div className="px-4 pt-3 pb-2">
          <p className="font-bold">{title}</p>
          {subtitle && <p className="text-sm text-on-surface-variant line-clamp-2 mt-0.5">{subtitle}</p>}
        </div>
        <ul>
          {items.map(({ icon: Icon, label, onSelect, destructive }, i) => (
            <li key={label}>
              <button
                ref={i === 0 ? firstRef : undefined}
                type="button"
                onClick={() => {
                  onClose();
                  onSelect();
                }}
                className={`w-full flex items-center gap-4 px-4 h-12 rounded-xl text-left font-medium hover:bg-surface-bright ${destructive ? 'text-error' : ''}`}
              >
                <Icon size={20} aria-hidden />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
