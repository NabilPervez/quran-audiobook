// Renders a surah cover to a PNG data URL for lock-screen / notification artwork.
// Mirrors components/Cover.jsx but draws on a canvas so it can use the page's
// loaded web fonts (an SVG rendered as an image cannot).
const PALETTES = {
  meccan: ['#14532d', '#0b1f14', '#53e076'],
  medinan: ['#134e4a', '#0a1d1c', '#e8c872'],
};
const SIZE = 512;
const cache = new Map();

function drawStar(ctx, cx, cy, r) {
  const inner = r * 0.44;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (Math.PI / 4) * i - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.stroke();
}

export async function coverDataUrl(surah) {
  if (cache.has(surah.id)) return cache.get(surah.id);
  const [from, to, accent] = PALETTES[surah.revelation] ?? PALETTES.meccan;
  try {
    await Promise.all([
      document.fonts.load('700 120px "Plus Jakarta Sans Variable"'),
      document.fonts.load(`90px "Amiri Quran"`, surah.nameArabic),
    ]);
  } catch {
    // Fall back to system fonts.
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, from);
  bg.addColorStop(1, to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  const step = SIZE / 5;
  for (let x = step / 2; x < SIZE; x += step) for (let y = step / 2; y < SIZE; y += step) drawStar(ctx, x, y, step * 0.4);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = '700 112px "Plus Jakarta Sans Variable", sans-serif';
  ctx.fillText(String(surah.id), SIZE / 2, SIZE * 0.44);
  ctx.fillStyle = '#e5e2e1';
  ctx.direction = 'rtl';
  ctx.font = '88px "Amiri Quran", serif';
  ctx.fillText(surah.nameArabic, SIZE / 2, SIZE * 0.76);

  const url = canvas.toDataURL('image/png');
  cache.set(surah.id, url);
  return url;
}
