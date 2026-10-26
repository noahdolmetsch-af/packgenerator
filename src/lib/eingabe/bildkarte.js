/**
 * «Bildkarte» (Noah 26.10.2026 «1a»: instead of an AI picture): one of your own photos and a sentence as a
 * calm card to share or keep, drawn on this device (no AI, no cost). Pure parts here, tested in
 * tests/eingabe.test.js; the drawing is in BildKarte.svelte.
 */

export const CARD = { w: 1080, h: 1350, pad: 72, photoH: 860, font: 'Inter, system-ui, sans-serif' };
export const CARD_TEXT_MAX = 220;

/** The sentence a card starts with: the title, else the first lines of the text, at most CARD_TEXT_MAX signs. */
export function cardSentence(e = {}) {
  const title = String(e.title ?? '').trim();
  const text = String(e.text ?? '').replace(/\s+/g, ' ').trim();
  const s = title || text;
  return s.length > CARD_TEXT_MAX ? `${s.slice(0, CARD_TEXT_MAX - 1).replace(/\s+\S*$/, '')} …` : s;
}

/** Words wrapped into lines no wider than `max` (measure(s) gives a width), at most `lines` lines. */
export function wrapLines(text = '', max = 900, measure = (s) => s.length * 20, lines = 6) {
  const out = [];
  let cur = '';
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next) <= max || !cur) cur = next;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    const cut = out.slice(0, lines);
    cut[lines - 1] = `${cut[lines - 1].replace(/\s+\S*$/, '')} …`;
    return cut;
  }
  return out;
}

/** Where a photo of w × h is cut to fill a box of bw × bh (cover): { sx, sy, sw, sh }. */
export function coverCut(w, h, bw, bh) {
  const r = Math.max(bw / w, bh / h);
  const sw = bw / r;
  const sh = bh / r;
  return { sx: (w - sw) / 2, sy: (h - sh) / 2, sw, sh };
}

/** The file name of a card: bildkarte-2026-10-26.png */
export const cardFile = (day = '') => `bildkarte-${day || 'heute'}.png`;
