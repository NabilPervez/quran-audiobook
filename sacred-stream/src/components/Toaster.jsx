import { X } from 'lucide-react';
import { useToastStore } from '../stores/toastStore';

/** Single transient message with optional actions (Undo, Add note…). */
export default function Toaster() {
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 z-[70] flex justify-center px-3 pointer-events-none bottom-[calc(var(--tabbar-h)+var(--miniplayer-h)+var(--safe-bottom)+12px)] lg:bottom-28"
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-center gap-1 max-w-md w-full sm:w-auto rounded-xl bg-on-surface text-surface shadow-2xl pl-4 pr-1 py-1 animate-fade-in"
        >
          <span className="text-sm font-semibold flex-1 py-2">{toast.message}</span>
          {toast.actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                a.onClick();
                dismiss();
              }}
              className="px-3 h-9 rounded-lg text-sm font-bold text-on-primary-fixed-variant hover:bg-black/10 whitespace-nowrap"
            >
              {a.label}
            </button>
          ))}
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/10">
            <X size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
