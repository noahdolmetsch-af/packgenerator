/**
 * Paket K #87 «Blatt Vor der Abfahrt» as a PDF to print (Noah «5b»): one A4 page made on the device with
 * pdf-lib (already in the app, loaded only when you tap «Als PDF»). Text in Helvetica; letters the
 * font cannot write become «-».
 * sheet: { title, sub, facts: [[label, value]], path: { points: [[x, y]] } | null, sections: [{ head, rows: [string] }] }
 */
const OK = new Set('–—‘’“”€…•'.split(''));
export const pdfText = (s) => [...String(s ?? '')].map((c) => (c.charCodeAt(0) <= 0xff || OK.has(c) ? c : c === '→' ? '>' : '-')).join('');

export async function sheetPdf(sheet) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(pdfText(sheet.title));
  doc.setCreator('Pack Generator');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28;
  const H = 841.89;
  const M = 48;
  let page = doc.addPage([W, H]);
  let y = H - M;
  const ink = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.4, 0.4, 0.4);
  const need = (h) => {
    if (y - h < M) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };
  // wrap a line to the width
  const wrap = (text, f, size, width) => {
    const out = [];
    for (const para of pdfText(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(next, size) > width && line) {
          out.push(line);
          line = word;
        } else line = next;
      }
      out.push(line);
    }
    return out;
  };
  const write = (text, { f = font, size = 11, color = ink, x = M, width = W - 2 * M, gap = 4 } = {}) => {
    for (const l of wrap(text, f, size, width)) {
      need(size + gap);
      y -= size;
      page.drawText(l, { x, y, size, font: f, color });
      y -= gap;
    }
  };
  write(sheet.title, { f: bold, size: 20, gap: 6 });
  if (sheet.sub) write(sheet.sub, { color: grey, gap: 10 });
  for (const [label, value] of sheet.facts ?? []) {
    need(16);
    y -= 12;
    page.drawText(pdfText(label), { x: M, y, size: 10, font, color: grey });
    const lines = wrap(value, bold, 12, W - 2 * M - 140);
    lines.forEach((l, i) => {
      if (i) {
        need(15);
        y -= 15;
      }
      page.drawText(l, { x: M + 140, y, size: 12, font: bold, color: ink });
    });
    y -= 6;
  }
  if (sheet.path?.points?.length > 1) {
    const bw = 300;
    const bh = 160;
    need(bh + 16);
    y -= 10;
    const top = y;
    page.drawRectangle({ x: M, y: top - bh, width: bw, height: bh, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    const pts = sheet.path.points;
    for (let i = 1; i < pts.length; i++) page.drawLine({ start: { x: M + pts[i - 1][0], y: top - pts[i - 1][1] }, end: { x: M + pts[i][0], y: top - pts[i][1] }, thickness: 2, color: ink });
    page.drawCircle({ x: M + pts[0][0], y: top - pts[0][1], size: 4, color: rgb(0.29, 0.45, 0.38) });
    page.drawCircle({ x: M + pts.at(-1)[0], y: top - pts.at(-1)[1], size: 4, borderColor: ink, borderWidth: 2 });
    y = top - bh - 6;
  }
  for (const s of sheet.sections ?? []) {
    y -= 10;
    write(s.head, { f: bold, size: 14, gap: 6 });
    for (const r of s.rows) write(`• ${r}`, { x: M + 6, width: W - 2 * M - 6 });
  }
  return doc.save();
}
