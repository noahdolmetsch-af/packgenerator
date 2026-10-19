/**
 * Paket J #311 (Noah 19.10.2026 «4a»): the lock-screen image of the emergency card. A phone-sized PNG
 * (1080 × 2340): the top third stays calm for the clock, then a white card with the QR code and, big,
 * the emergency contact, so a helper can call even without scanning. Drawn on a canvas in the
 * browser; nothing leaves the device.
 */
import { qrMatrix } from '../pay/qrmatrix.js';
import { cleanCard } from './sos.js';

export const W = 1080;
export const H = 2340;

/**
 * Draw the image. words: { title, scan, contact, name } already translated.
 * Returns a canvas (the caller turns it into a file).
 */
export async function drawLockImage(card, text, words, doc = document) {
  const c = cleanCard(card);
  const { n, rows } = await qrMatrix(text);
  const canvas = doc.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  // calm green background (the app's Salbei, darker), the clock sits on it
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1d3b30');
  bg.addColorStop(1, '#2f5546');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // the card
  const cx = 90;
  const cy = 860;
  const cw = W - 2 * cx;
  const ch = 1300;
  g.fillStyle = '#ffffff';
  roundRect(g, cx, cy, cw, ch, 48);
  g.fill();

  // the title in red, like an emergency sign
  g.fillStyle = '#c4161c';
  roundRect(g, cx, cy, cw, 130, 48, true);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = '700 64px Inter, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(words.title, W / 2, cy + 66);

  // the QR code with its quiet zone
  const size = 640;
  const q = 4;
  const m = size / (n + 2 * q);
  const qx = (W - size) / 2;
  const qy = cy + 180;
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (rows[r][col]) g.fillRect(Math.floor(qx + (col + q) * m), Math.floor(qy + (r + q) * m), Math.ceil(m), Math.ceil(m));

  g.fillStyle = '#3d4a44';
  g.font = '500 40px Inter, system-ui, sans-serif';
  g.fillText(words.scan, W / 2, qy + size + 50);

  // the contact, big
  let y = qy + size + 150;
  if (c.contact || c.phone) {
    g.fillStyle = '#5b6b63';
    g.font = '500 38px Inter, system-ui, sans-serif';
    g.fillText(words.contact, W / 2, y);
    y += 70;
    g.fillStyle = '#111111';
    g.font = '700 60px Inter, system-ui, sans-serif';
    g.fillText(fit(g, [c.contact, c.phone].filter(Boolean).join('  '), cw - 80), W / 2, y);
    y += 80;
  }
  if (c.name) {
    g.fillStyle = '#5b6b63';
    g.font = '500 40px Inter, system-ui, sans-serif';
    g.fillText(fit(g, `${words.name}: ${c.name}`, cw - 80), W / 2, y);
  }
  return canvas;
}

/** Shorten a line with … until it fits the width. */
function fit(g, s, w) {
  let out = s;
  while (out.length > 4 && g.measureText(out).width > w) out = `${out.slice(0, -2)}…`;
  return out;
}

function roundRect(g, x, y, w, h, r, topOnly = false) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  if (topOnly) {
    g.lineTo(x + w, y + h);
    g.lineTo(x, y + h);
  } else {
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
  }
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** The canvas as a PNG file. */
export const toFile = (canvas, name = 'notfall-sperrbild.png') =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(new File([b], name, { type: 'image/png' })) : reject(new Error('png'))), 'image/png'));
