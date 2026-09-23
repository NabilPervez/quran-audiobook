import { useEffect, useId, useRef, useState } from 'react';

/**
 * Minimal accessible popover menu. `children` is a render function receiving `close`.
 * placement: 'top' opens above the trigger (used in bottom bars), 'bottom' below.
 */
export default function Menu({ label, trigger, children, placement = 'top', align = 'center' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pos = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const x = align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="min-w-11 h-11 px-2 rounded-full flex items-center justify-center gap-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${pos} ${x} z-50 min-w-44 rounded-xl bg-surface-container-highest p-1 shadow-2xl`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ selected, onSelect, children }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={Boolean(selected)}
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-surface-bright ${
        selected ? 'text-primary font-bold' : 'text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}
