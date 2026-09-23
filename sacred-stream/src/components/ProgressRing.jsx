import { Check } from 'lucide-react';

/** Small circular progress indicator for a chapter (fraction 0..1). */
export default function ProgressRing({ fraction, size = 28 }) {
  if (fraction >= 1) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Finished"
      >
        <Check size={size * 0.55} aria-hidden />
      </span>
    );
  }
  const r = 10;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={fraction > 0 ? `${Math.round(fraction * 100)}% listened` : 'Not started'}
    >
      <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2.5" className="stroke-surface-container-highest" />
      {fraction > 0 && (
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={`${c * fraction} ${c}`}
          transform="rotate(-90 12 12)"
        />
      )}
    </svg>
  );
}
