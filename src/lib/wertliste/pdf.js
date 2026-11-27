/**
 * «Wertliste» as a PDF (Warteliste 7, Noah 22.11.2026 «1-5 a»): a title with the day, a table of the velos (name, frame number, purchase,
 * price), a table of the gear (piece, group, purchase, price), the sum, the note «price paid, no depreciation», the pieces without a price
 * and «receipts at hand: n of m». Written on the device with pdf-lib (loaded only when a PDF is made); the Helvetica font of the PDF
 * knows German letters. Only the notes «receipt there» are written, no pictures.
 */
import { lineOf } from './wertliste.js';

const W = 595.28;
const H = 841.89;
const M = 48;

/** A text the PDF font can write: what it cannot draw (emoji, arrows) becomes «?». */
export const safe = (s) => String(s ?? '').replace(/[^ -~ -ÿ«»–—…’‘“”]/g, '?').replace(/…/g, '...').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-');

const money = (n, tr) => (n == null ? tr.missing : `CHF ${Number(n).toLocaleString('de-CH', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`);

/**
 * rows: the chosen rows (rowsOf shape; gear rows may carry groupName), tr: { title, bikes, gear, sum, ... } the texts (the page passes them through t()).
 * → PDF as data URL.
 */
export async function makeWertPdf(rows, tr, { when = new Date() } = {}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(tr.title));
  pdf.setCreator('Pack Generator');
  pdf.setProducer('Pack Generator');
  pdf.setCreationDate(when);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const ink = rgb(0.13, 0.15, 0.14);
  const grey = rgb(0.4, 0.42, 0.41);
  const room = (h) => {
    if (y - h < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };
  const text = (s, x, size = 10, f = font, color = ink) => page.drawText(safe(s), { x, y, size, font: f, color });
  const fit = (s, width, size, f = font) => {
    let out = safe(s);
    while (out.length > 1 && f.widthOfTextAtSize(out, size) > width) out = out.slice(0, -1);
    return out === safe(s) ? out : `${out.slice(0, -1)}...`;
  };
  const right = (s, xr, size = 10, f = font) => page.drawText(safe(s), { x: xr - f.widthOfTextAtSize(safe(s), size), y, size, font: f, color: ink });

  text(tr.title, M, 20, bold);
  y -= 18;
  text(tr.dated, M, 10, font, grey);
  y -= 26;

  const table = (head, list, cols) => {
    // cols: [{ x, w, align, get }]
    room(40);
    text(head, M, 12, bold);
    y -= 16;
    for (const c of cols) {
      if (c.align === 'right') right(c.label, c.x + c.w, 9, bold);
      else text(c.label, c.x, 9, bold, grey);
    }
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: grey });
    y -= 13;
    if (!list.length) {
      text(tr.none, M, 10, font, grey);
      y -= 16;
    }
    for (const r of list) {
      room(16);
      for (const c of cols) {
        const v = c.get(r);
        if (c.align === 'right') right(v, c.x + c.w, 10);
        else text(fit(v, c.w - 6, 10), c.x, 10);
      }
      y -= 14;
    }
    y -= 12;
  };
  const bikes = rows.filter((r) => r.kind === 'bike');
  const gear = rows.filter((r) => r.kind === 'gear');
  table(tr.bikes, bikes, [
    { x: M, w: 170, label: tr.colName, get: (r) => r.name },
    { x: M + 170, w: 130, label: tr.colFrame, get: (r) => r.ref ?? '-' },
    { x: M + 300, w: 80, label: tr.colBought, get: (r) => r.bought ?? '-' },
    { x: M + 380, w: 119, align: 'right', label: tr.colPrice, get: (r) => money(r.price, tr) },
  ]);
  table(tr.gear, gear, [
    { x: M, w: 230, label: tr.colPiece, get: (r) => `${r.name}${(r.qty || 1) > 1 ? ` x ${r.qty}` : ''}` },
    { x: M + 230, w: 110, label: tr.colGroup, get: (r) => r.groupName ?? '-' },
    { x: M + 340, w: 60, label: tr.colBought, get: (r) => r.bought ?? '-' },
    { x: M + 400, w: 99, align: 'right', label: tr.colPrice, get: (r) => money(lineOf(r), tr) },
  ]);

  const sum = rows.reduce((s, r) => s + (lineOf(r) ?? 0), 0);
  const missing = rows.filter((r) => r.price == null);
  room(80);
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.8, color: ink });
  y -= 8;
  text(tr.sum, M, 12, bold);
  right(money(sum, tr), W - M, 12, bold);
  y -= 18;
  text(tr.note, M, 9, font, grey);
  y -= 14;
  if (missing.length) {
    text(tr.missingLine, M, 9, font, grey);
    y -= 13;
    // the names wrap over lines (at most 6, then «...»)
    const words = safe(missing.map((r) => r.name).join(', ')).split(' ');
    let line = '';
    let lines = 0;
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, 9) > W - 2 * M && line) {
        room(14);
        text(line, M, 9, font, grey);
        y -= 12;
        line = w;
        if (++lines >= 6) break;
      } else line = next;
    }
    room(14);
    text(lines >= 6 ? `${line}...` : line, M, 9, font, grey);
    y -= 14;
  }
  text(tr.receipts, M, 9, font, grey);
  return pdf.saveAsBase64({ dataUri: true });
}
