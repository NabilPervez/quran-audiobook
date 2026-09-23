const PALETTES = {
  meccan: ['#14532d', '#0b1f14', '#53e076'],
  medinan: ['#134e4a', '#0a1d1c', '#e8c872'],
};

/**
 * Generated typographic cover: surah number + Arabic name on a tinted pattern.
 * Tint encodes revelation place (Meccan = emerald, Medinan = teal/gold).
 */
export default function Cover({ surah, className = '', showName = true }) {
  const [from, to, accent] = PALETTES[surah.revelation] ?? PALETTES.meccan;
  const gid = `cover-${surah.id}`;
  return (
    <svg viewBox="0 0 100 100" className={`block rounded-lg ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <pattern id={`${gid}-star`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M10 2l2.4 5.6L18 10l-5.6 2.4L10 18l-2.4-5.6L2 10l5.6-2.4z" fill="none" stroke={accent} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill={`url(#${gid}-bg)`} />
      <rect width="100" height="100" fill={`url(#${gid}-star)`} opacity="0.12" />
      <text
        x="50"
        y={showName ? 42 : 60}
        textAnchor="middle"
        fill={accent}
        fontSize={showName ? 22 : 36}
        fontWeight="700"
        fontFamily="Plus Jakarta Sans Variable, sans-serif"
      >
        {surah.id}
      </text>
      {showName && (
        <text x="50" y="76" textAnchor="middle" fill="#e5e2e1" fontSize="17" fontFamily="Amiri Quran, serif">
          {surah.nameArabic}
        </text>
      )}
    </svg>
  );
}
