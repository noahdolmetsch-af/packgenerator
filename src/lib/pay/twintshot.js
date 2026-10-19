/**
 * «Aus TWINT teilen» (mockup QR6, way B, Noah 14.10.2026 03:52 «alle A-D», approved 04:00 «a»):
 * a screenshot of a received TWINT payment is read ON THE DEVICE. The text reader (Tesseract.js, free)
 * is loaded only the first time it is needed, from the jsdelivr CDN (about 5 MB with the German
 * language file, then cached by the browser). The picture never leaves the phone.
 *
 * From the text the app takes: the amount («+ 80.00 CHF», «CHF 80.00», «80.–»), the invoice number
 * in the message («R-0317») and, if it can, who sent it («von Mia B.»).
 */
export const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.esm.min.js';

const money = (s) => {
  const v = Number(String(s).replace(/['’\s]/g, '').replace(',', '.').replace(/[.–-]+$/, ''));
  return Number.isFinite(v) && v > 0 && v < 1_000_000 ? Math.round(v * 100) : null;
};

/** { amount (rappen) | null, no ('R-0317') | null, from | '' } out of the screenshot's text. */
export function parseTwintText(text) {
  const t = String(text ?? '').replace(/\r/g, '');
  // The amount: CHF before or after, an optional + sign, «80.00», «1'250.00», «80.–», «80,50».
  const amt =
    t.match(/\+?\s*CHF\s*([0-9][0-9'’ ]*(?:[.,][0-9]{2}|\.[–-]+)?)/i)?.[1] ??
    t.match(/\+?\s*([0-9][0-9'’ ]*(?:[.,][0-9]{2}|\.[–-]+))\s*CHF/i)?.[1] ??
    t.match(/\+\s*([0-9][0-9'’]*[.,][0-9]{2})/)?.[1];
  const noM = t.match(/\bR\s?[-–]?\s?(\d{4,6})\b/i);
  const from = (t.match(/\b(?:von|from|de|da)\s+([A-ZÄÖÜ][\p{L}'’-]*(?:\s+[A-ZÄÖÜ][\p{L}'’.-]*)?)/u)?.[1] ?? '').trim();
  return { amount: amt ? money(amt) : null, no: noM ? `R-${noM[1].padStart(4, '0')}` : null, from };
}

let reader = null;
/** Read the text of a picture on the device (the reader is loaded once). */
export async function readShotText(file, load = () => import(/* @vite-ignore */ TESSERACT_URL)) {
  if (!reader) {
    reader = (async () => {
      const mod = await load();
      const T = mod.default ?? mod;
      return T.createWorker('deu+eng');
    })();
  }
  const worker = await reader;
  const { data } = await worker.recognize(file);
  return data?.text ?? '';
}

/** Which open invoice fits: the number from the message first, else the only one with this amount. */
export function matchShot(read, invoices) {
  const open = invoices.filter((x) => x.status === 'open');
  if (read.no) {
    const inv = open.find((x) => x.no === read.no);
    if (inv) return { inv, how: 'no' };
  }
  if (read.amount) {
    const same = open.filter((x) => x.amount === read.amount);
    if (same.length === 1) return { inv: same[0], how: 'amount' };
    if (same.length > 1) return { inv: null, how: 'many', choices: same };
  }
  return { inv: null, how: 'none', choices: [] };
}
