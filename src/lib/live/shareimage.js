/**
 * «Bild zum Teilen» after the ride (Noah 20.10.2026 «b»): a square-ish PNG (1080 × 1350, the size Instagram
 * and messengers show whole) with the shape of the ride, its name and date and the big numbers. Drawn on a
 * canvas in the browser, no map tiles and no address; nothing leaves the device until you share it.
 * The shape can be left out (it shows where you rode).
 *
 * linePath is pure and tested in tests/live-share.test.js; drawShareImage needs a canvas.
 */
export const W = 1080;
export const H = 1350;

/**
 * The points [[lat, lon, …]] of a recording fitted into a box { x, y, w, h }: [[x, y]] (at most `max`
 * points, north up, the same scale both ways). Fewer than 2 points → [].
 */
export function linePath(pts = [], box = { x: 0, y: 0, w: W, h: H }, max = 2000) {
  const p = (Array.isArray(pts) ? pts : []).filter((q) => Number.isFinite(q?.[0]) && Number.isFinite(q?.[1]));
  if (p.length < 2) return [];
  const step = Math.max(1, Math.ceil(p.length / max));
  const pick = p.filter((_, i) => i % step === 0 || i === p.length - 1);
  const lat0 = pick.reduce((a, q) => a + q[0], 0) / pick.length;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const xs = pick.map((q) => q[1] * kx);
  const ys = pick.map((q) => -q[0]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  const s = Math.min(spanX > 0 ? box.w / spanX : Infinity, spanY > 0 ? box.h / spanY : Infinity);
  const scale = Number.isFinite(s) ? s : 0;
  // centred in the box
  const offX = box.x + (box.w - spanX * scale) / 2;
  const offY = box.y + (box.h - spanY * scale) / 2;
  return xs.map((x, i) => [Math.round((offX + (x - minX) * scale) * 10) / 10, Math.round((offY + (ys[i] - minY) * scale) * 10) / 10]);
}

/**
 * Draw the image. words: { title, date, brand } (already translated); stats: [{ label, value }] (2–6, already
 * written out, e.g. «42,5 km»); pts: the points of the recording or [] without the shape.
 * Returns the canvas.
 */
export function drawShareImage({ pts = [], stats = [], words = {} }, doc = document) {
  const canvas = doc.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  // light, like the app: paper, the Salbei green for the line
  g.fillStyle = '#f7f5ef';
  g.fillRect(0, 0, W, H);
  const font = (px, weight = 400) => `${weight} ${px}px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;

  g.fillStyle = '#1d2b25';
  g.font = font(60, 700);
  g.fillText(fit(g, words.title ?? '', W - 160), 80, 140);
  g.fillStyle = '#5b675f';
  g.font = font(36);
  g.fillText(fit(g, words.date ?? '', W - 160), 80, 196);

  // the numbers take what they need at the bottom, the shape fills the rest
  const list = stats.slice(0, 6);
  const rowH = 150;
  const top = H - 110 - Math.ceil(list.length / 2) * rowH;
  const line = linePath(pts, { x: 120, y: 260, w: W - 240, h: Math.max(200, top - 60 - 260) });
  if (line.length > 1) {
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = '#4a7360';
    g.lineWidth = 12;
    g.beginPath();
    line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    // start and end
    dot(g, line[0], '#4a7360');
    dot(g, line.at(-1), '#a94a24');
  }

  // the numbers: two columns
  list.forEach((s, i) => {
    const x = 80 + (i % 2) * ((W - 160) / 2);
    const y = top + Math.floor(i / 2) * rowH;
    g.fillStyle = '#5b675f';
    g.font = font(34);
    g.fillText(fit(g, s.label ?? '', (W - 200) / 2), x, y);
    g.fillStyle = '#1d2b25';
    g.font = font(68, 700);
    g.fillText(fit(g, s.value ?? '', (W - 200) / 2), x, y + 72);
  });

  g.fillStyle = '#5b675f';
  g.font = font(30);
  g.fillText(words.brand ?? 'Pack Generator', 80, H - 50);
  return canvas;
}

function dot(g, [x, y], color) {
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(x, y, 20, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, 13, 0, Math.PI * 2);
  g.fill();
}

/** Shorten a text with «…» until it fits the width. */
function fit(g, text, maxW) {
  let s = String(text ?? '');
  if (g.measureText(s).width <= maxW) return s;
  while (s.length > 1 && g.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  return `${s}…`;
}
