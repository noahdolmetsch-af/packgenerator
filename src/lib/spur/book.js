/**
 * Paket S «Reise-Spur» (spec 6): the travel book of a tour as a PDF, made on the device (pdf-lib,
 * loaded only now). A cover with the whole line, then one page per day: its line, km, the places,
 * notes and photos in the order of the day. The photos go into the file on this device only.
 * Tested in tests/spur.test.js (without photos).
 */
import { merc } from './mapmath.js';
import { boundsOf } from './polyline.js';
import { zurichTime } from './spur.js';

const A4 = [595.28, 841.89];
const M = 48;

/** Text the standard PDF font can write (Latin-1 and a few signs); anything else goes. */
export function pdfText(s) {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[  ]/g, ' ')
    .replace(/[^\n\x20-\x7e¡-ÿ]/g, '');
}

/** Lines of text that fit into `width` at `size`. */
function wrap(font, text, size, width) {
  const out = [];
  for (const para of pdfText(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
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

/** Draw lines [[lat, lon], …] into the box (x, y from the bottom left, w × h). */
function drawLines(page, lines, { x, y, w, h }, rgb, cols) {
  page.drawRectangle({ x, y, width: w, height: h, color: rgb(0.95, 0.96, 0.94) });
  const b = boundsOf(lines.map((l) => l.pts));
  if (!b) return;
  const a = merc([b.n, b.w]);
  const c = merc([b.s, b.e]);
  const k = Math.min((w - 24) / Math.max(1e-9, c.x - a.x), (h - 24) / Math.max(1e-9, c.y - a.y));
  const ox = x + (w - (c.x - a.x) * k) / 2;
  const oy = y + h - (h - (c.y - a.y) * k) / 2;
  const at = (p) => {
    const m = merc(p);
    return { x: ox + (m.x - a.x) * k, y: oy - (m.y - a.y) * k };
  };
  lines.forEach((l, i) => {
    const col = cols[((l.n ?? i + 1) - 1) % cols.length];
    for (let n = 1; n < l.pts.length; n++) page.drawLine({ start: at(l.pts[n - 1]), end: at(l.pts[n]), thickness: 2, color: col });
  });
  const first = lines[0]?.pts[0];
  const last = lines.at(-1)?.pts.at(-1);
  if (first) page.drawCircle({ ...at(first), size: 4, color: rgb(0.15, 0.42, 0.26) });
  if (last) page.drawCircle({ ...at(last), size: 4, color: rgb(0.06, 0.18, 0.15) });
}

/**
 * trip, spur (tourSpur), tr: t(), dayName(day) → «Fr 3. Juli». → the PDF as bytes.
 */
export async function makeBook(trip, spur, { tr = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : s), dayName = (d) => d, when = new Date() } = {}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfText(trip.title || tr('Travel book')));
  pdf.setCreator('Pack Generator');
  pdf.setProducer('Pack Generator');
  pdf.setCreationDate(when);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.18, 0.15);
  const soft = rgb(0.34, 0.42, 0.37);
  const cols = [rgb(0.25, 0.5, 0.75), rgb(0.79, 0.54, 0.12), rgb(0.18, 0.56, 0.5), rgb(0.55, 0.42, 0.72), rgb(0.72, 0.22, 0.17), rgb(0.18, 0.42, 0.31)];
  const width = A4[0] - 2 * M;
  const shown = (d) => d.lines.filter((l) => !l.hidden && l.pts.length >= 2).map((l) => ({ ...l, n: d.n }));

  // cover
  const cover = pdf.addPage(A4);
  let y = A4[1] - M - 10;
  for (const l of wrap(bold, trip.title || tr('Travel book'), 28, width)) {
    cover.drawText(l, { x: M, y, size: 28, font: bold, color: ink });
    y -= 34;
  }
  const first = spur.days[0]?.day;
  const last = spur.days.at(-1)?.day;
  cover.drawText(pdfText(first === last ? dayName(first) : `${dayName(first)} - ${dayName(last)}`), { x: M, y, size: 13, font, color: soft });
  y -= 20;
  cover.drawText(pdfText(tr('{n} days · {km} km', { n: spur.days.length, km: spur.km })), { x: M, y, size: 13, font, color: soft });
  y -= 24;
  const all = spur.days.flatMap(shown);
  const boxH = Math.min(y - M - 30, 520);
  if (all.length) drawLines(cover, all, { x: M, y: y - boxH, w: width, h: boxH }, rgb, cols);
  else cover.drawText(pdfText(tr('No line yet for this tour.')), { x: M, y: y - 20, size: 12, font, color: soft });
  cover.drawText(pdfText(tr('Travel track · Pack Generator')), { x: M, y: M - 20, size: 9, font, color: soft });

  // one page (or more) per day
  for (const d of spur.days) {
    let page = pdf.addPage(A4);
    y = A4[1] - M;
    page.drawText(pdfText(tr('Day {n} · {date}', { n: d.n, date: dayName(d.day) })), { x: M, y: y - 18, size: 20, font: bold, color: ink });
    y -= 40;
    page.drawText(pdfText(d.km ? tr('{km} km', { km: d.km }) : tr('No ride recorded')), { x: M, y, size: 12, font, color: soft });
    y -= 16;
    const lines = shown(d);
    if (lines.length) {
      drawLines(page, lines, { x: M, y: y - 220, w: width, h: 220 }, rgb, cols);
      y -= 236;
    }
    const items = [
      ...d.places.map((p) => ({ at: p.at, text: p.text || tr('I am here'), photo: p.photo, kind: 'place' })),
      ...d.notes.map((x) => ({ at: x.at, text: x.text || '', photo: x.photo, kind: 'note' })),
      ...d.gaps.map((g) => ({ at: new Date(g.from).toISOString(), text: g.filled ? tr('Gap {from}–{to}, filled from Strava', { from: zurichTime(g.from), to: zurichTime(g.to) }) : tr('Gap {from}–{to}', { from: zurichTime(g.from), to: zurichTime(g.to) }), kind: 'gap' })),
    ].sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const room = (need) => {
      if (y - need >= M) return;
      page = pdf.addPage(A4);
      y = A4[1] - M;
      page.drawText(pdfText(tr('Day {n} · {date}', { n: d.n, date: dayName(d.day) })), { x: M, y: y - 12, size: 11, font, color: soft });
      y -= 28;
    };
    for (const it of items) {
      const time = it.at ? zurichTime(Date.parse(it.at)) : '';
      const rows = wrap(font, it.text, 11, width - 52);
      room(rows.length * 15 + 6);
      page.drawText(pdfText(time), { x: M, y, size: 11, font: bold, color: it.kind === 'gap' ? soft : ink });
      rows.forEach((r, i) => page.drawText(r, { x: M + 52, y: y - i * 15, size: 11, font, color: it.kind === 'gap' ? soft : ink }));
      y -= rows.length * 15 + 6;
      if (it.photo && /^data:image\/jpe?g;base64,/.test(it.photo)) {
        try {
          const img = await pdf.embedJpg(it.photo);
          const s = Math.min((width - 52) / img.width, 220 / img.height);
          room(img.height * s + 10);
          page.drawImage(img, { x: M + 52, y: y - img.height * s, width: img.width * s, height: img.height * s });
          y -= img.height * s + 10;
        } catch {
          /* a photo that cannot be read stays out */
        }
      }
    }
    if (!items.length && !lines.length) page.drawText(pdfText(tr('Nothing noted on this day.')), { x: M, y, size: 11, font, color: soft });
  }
  return pdf.save();
}
