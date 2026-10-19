/**
 * Paket H (answer 5a): a short list as a PDF with text, made on the device (pdf-lib, free; loaded only
 * when a PDF is made). lines: the text lines; the first one is the heading. → PDF as data URL.
 * Helvetica covers the German letters (ä ö ü), «», • and ×.
 */
export async function textPdf(lines = [], { title = '', when = new Date() } = {}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(title || lines[0] || 'Liste');
  pdf.setCreator('Pack Generator');
  pdf.setProducer('Pack Generator');
  pdf.setCreationDate(when);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28;
  const H = 841.89;
  const M = 56;
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const safe = (s) => String(s).replace(/[^\x20-\x7E -ÿ•–—«»‹›€’‘“”×]/g, '');
  lines.forEach((line, n) => {
    const size = n === 0 ? 20 : 13;
    const f = n === 0 ? bold : font;
    // long lines wrap at the page width
    const words = safe(line).split(' ');
    const rows = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > W - 2 * M && cur) rows.push(cur), (cur = w);
      else cur = next;
    }
    rows.push(cur);
    for (const r of rows) {
      if (y < M + size) (page = pdf.addPage([W, H])), (y = H - M);
      page.drawText(r, { x: M, y, size, font: f, color: rgb(0.06, 0.18, 0.15) });
      y -= size * 1.5;
    }
    if (n === 0) y -= 6;
  });
  return pdf.saveAsBase64({ dataUri: true });
}
