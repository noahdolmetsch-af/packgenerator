/**
 * Kontakt-QR-Code step 4 (Noah 27.10.2026 «5a»): the contact card as an image, drawn on a canvas in the
 * browser (nothing leaves the device).
 * - «lock»: a lock-screen image (1080 × 2340). The top third stays calm for the clock, then a white card
 *   with «Found this phone?», the QR code and the name, so a finder can reach you.
 * - «sticker»: a sticker «Found?» (1200 × 1500) to print for the bike, the helmet or a bag.
 * Both carry the card link without an end day and without payment details: a sticker stays for years.
 */
import { qrMatrix } from '../pay/qrmatrix.js';

export const SIZES = { lock: { w: 1080, h: 2340 }, sticker: { w: 1200, h: 1500 } };

/**
 * kind: 'lock' | 'sticker'; text: what the QR code holds; words: { title, scan, name, line } already translated
 * (line: an optional second line, e.g. the phone number). Returns a canvas.
 */
export async function drawCardImage(kind, text, words, doc = document) {
  const { w: W, h: H } = SIZES[kind] ?? SIZES.lock;
  const { n, rows } = await qrMatrix(text);
  const canvas = doc.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  let cx, cy, cw, ch;
  if (kind === 'sticker') {
    // white sticker with a green frame, cut along the edge
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2f5546';
    g.lineWidth = 24;
    roundRect(g, 30, 30, W - 60, H - 60, 64);
    g.stroke();
    cx = 30;
    cy = 30;
    cw = W - 60;
    ch = H - 60;
  } else {
    // calm green background (the app's Salbei, darker), the clock sits on it
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1d3b30');
    bg.addColorStop(1, '#2f5546');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    cx = 90;
    cy = 860;
    cw = W - 2 * cx;
    ch = words.line ? 1110 : 1030;
    g.fillStyle = '#ffffff';
    roundRect(g, cx, cy, cw, ch, 48);
    g.fill();
  }

  // the title in the app's green
  g.fillStyle = '#2f5546';
  g.font = `700 ${kind === 'sticker' ? 110 : 68}px Inter, system-ui, sans-serif`;
  const ty = cy + (kind === 'sticker' ? 150 : 100);
  g.fillText(fit(g, words.title, cw - 80), cx + cw / 2, ty);

  // the QR code with its quiet zone
  const size = kind === 'sticker' ? 820 : 640;
  const q = 4;
  const m = size / (n + 2 * q);
  const qx = (W - size) / 2;
  const qy = ty + (kind === 'sticker' ? 70 : 60);
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (rows[r][col]) g.fillRect(Math.floor(qx + (col + q) * m), Math.floor(qy + (r + q) * m), Math.ceil(m), Math.ceil(m));

  g.fillStyle = '#3d4a44';
  g.font = `500 ${kind === 'sticker' ? 52 : 40}px Inter, system-ui, sans-serif`;
  let y = qy + size + (kind === 'sticker' ? 60 : 50);
  g.fillText(fit(g, words.scan, cw - 80), W / 2, y);

  y += kind === 'sticker' ? 110 : 100;
  g.fillStyle = '#111111';
  g.font = `700 ${kind === 'sticker' ? 76 : 60}px Inter, system-ui, sans-serif`;
  g.fillText(fit(g, words.name, cw - 80), W / 2, y);
  if (words.line) {
    y += kind === 'sticker' ? 90 : 80;
    g.fillStyle = '#5b6b63';
    g.font = `500 ${kind === 'sticker' ? 56 : 44}px Inter, system-ui, sans-serif`;
    g.fillText(fit(g, words.line, cw - 80), W / 2, y);
  }
  return canvas;
}

/** Shorten a line with … until it fits the width. */
function fit(g, s, w) {
  let out = String(s ?? '');
  while (out.length > 4 && g.measureText(out).width > w) out = `${out.slice(0, -2)}…`;
  return out;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** The canvas as a PNG file. */
export const toFile = (canvas, name) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(new File([b], name, { type: 'image/png' })) : reject(new Error('png'))), 'image/png'));
