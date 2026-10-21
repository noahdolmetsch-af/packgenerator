/**
 * «Tagebuch» › Jahresbuch (Noah 20.10.2026 «5a»): all entries of a year with their photos as a PDF to keep
 * or print, made on this device (pdf-lib, loaded only now). A cover with the year and its numbers, then
 * the months in order, each entry with its date, title, mood, place, text, tags and up to three photos.
 * Nothing leaves the device. The PDF font knows Latin letters only, so the mood is written as a word.
 */
import { pdfText } from '../spur/book.js';
import { sortEntries, headOf, yearsOf } from './journal.js';

export { yearsOf };
import { moodName } from './insights.js';

const A4 = [595.28, 841.89];
const M = 56;

/** Lines of text that fit into `width` at `size` (long words are cut). */
export function wrapText(font, text, size, width) {
  const out = [];
  for (const para of pdfText(text).split('\n')) {
    let line = '';
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (font.widthOfTextAtSize(word, size) > width && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > width) cut--;
        if (line) out.push(line);
        out.push(word.slice(0, cut));
        line = '';
        word = word.slice(cut);
      }
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) line = next;
      else {
        if (line) out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

/** The entries of one year, oldest first. */
export const yearEntries = (entries, year) => sortEntries(entries.filter((e) => e.day.startsWith(`${year}-`))).reverse();

/**
 * The year book as PDF bytes. tr: t(); long(day): «Dienstag, 20. Oktober 2026»; monthName('YYYY-MM').
 */
export async function makeYearBook(entries, year, { tr = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : s), long = (d) => d, monthName = (m) => m, when = new Date(), title = 'Diary' } = {}) {
  const list = yearEntries(entries, year);
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfText(`${title} ${year}`));
  pdf.setCreator('Pack Generator');
  pdf.setProducer('Pack Generator');
  pdf.setCreationDate(when);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.1, 0.14, 0.12);
  const soft = rgb(0.4, 0.44, 0.4);
  const sage = rgb(0.29, 0.45, 0.38);
  const width = A4[0] - 2 * M;

  // cover
  const cover = pdf.addPage(A4);
  cover.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: rgb(0.97, 0.95, 0.92) });
  cover.drawText(pdfText(title), { x: M, y: A4[1] / 2 + 60, size: 22, font: sans, color: sage });
  cover.drawText(String(year), { x: M, y: A4[1] / 2, size: 72, font: bold, color: ink });
  const days = new Set(list.map((e) => e.day)).size;
  const photos = list.reduce((s, e) => s + (e.photos?.length ?? 0), 0);
  cover.drawText(pdfText(tr('{e} entries · {d} days · {p} photos', { e: list.length, d: days, p: photos })), { x: M, y: A4[1] / 2 - 36, size: 13, font: sans, color: soft });

  let page = null;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage(A4);
    y = A4[1] - M;
    page.drawText(pdfText(`${title} ${year}`), { x: M, y: M / 2, size: 8, font: sans, color: soft });
    page.drawText(String(pdf.getPageCount() - 1), { x: A4[0] - M - 10, y: M / 2, size: 8, font: sans, color: soft });
  };
  const room = (need) => {
    if (!page || y - need < M) newPage();
  };

  let month = '';
  for (const e of list) {
    if (e.day.slice(0, 7) !== month) {
      month = e.day.slice(0, 7);
      newPage();
      page.drawText(pdfText(monthName(month)), { x: M, y: y - 26, size: 26, font: bold, color: sage });
      y -= 52;
    }
    const h = headOf(e);
    const meta = [long(e.day) + (e.time ? `, ${e.time}` : ''), e.mood ? moodName(e.mood, tr) : '', e.place?.name ?? ''].filter(Boolean).join(' · ');
    const titleRows = wrapText(bold, e.title?.trim() || h.title || '', 14, width);
    room(16 + titleRows.length * 18 + 20);
    page.drawText(pdfText(meta), { x: M, y, size: 10, font: sans, color: soft });
    y -= 18;
    for (const r of titleRows) {
      page.drawText(r, { x: M, y, size: 14, font: bold, color: ink });
      y -= 18;
    }
    const body = e.title?.trim() ? e.text : String(e.text ?? '').split('\n').slice(1).join('\n');
    for (const r of wrapText(font, String(body ?? '').trim(), 12, width)) {
      room(16);
      page.drawText(r, { x: M, y, size: 12, font, color: ink });
      y -= 16;
    }
    if (e.tags?.length) {
      room(16);
      page.drawText(pdfText(e.tags.map((x) => `#${x}`).join('  ')), { x: M, y, size: 10, font: italic, color: sage });
      y -= 16;
    }
    for (const p of (e.photos ?? []).slice(0, 3)) {
      if (!/^data:image\/jpe?g;base64,/.test(p.src ?? '')) continue;
      try {
        const img = await pdf.embedJpg(p.src);
        const s = Math.min(width / img.width, 240 / img.height);
        room(img.height * s + 10);
        page.drawImage(img, { x: M, y: y - img.height * s, width: img.width * s, height: img.height * s });
        y -= img.height * s + 10;
      } catch {
        /* a photo that cannot be read stays out */
      }
    }
    y -= 18;
  }
  if (!list.length) cover.drawText(pdfText(tr('No entries in this year.')), { x: M, y: M + 40, size: 12, font: sans, color: soft });
  return pdf.save();
}
