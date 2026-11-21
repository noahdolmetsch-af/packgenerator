// A PDF page with one JPEG picture (for the print shop). No library: a PDF with one picture is a few lines.
// Size in pixels at 300 dpi; the page is as big as the picture, the trim box is the page without the bleed.
const PT = 72 / 300;
const f2 = (n) => (Math.round(n * 100) / 100).toString();

/**
 * @param {Uint8Array} jpeg the picture (JPEG bytes)
 * @param {number} w width in pixels (with bleed)
 * @param {number} h height in pixels (with bleed)
 * @param {number} bleed bleed in pixels on each side
 * @returns {Uint8Array}
 */
export function pdfFromJpeg(jpeg, w, h, bleed = 0) {
  const enc = new TextEncoder();
  const W = w * PT;
  const H = h * PT;
  const b = bleed * PT;
  const parts = [];
  const offsets = [];
  let len = 0;
  const push = (x) => {
    const bytes = typeof x === 'string' ? enc.encode(x) : x;
    parts.push(bytes);
    len += bytes.length;
  };
  const obj = (n, body) => {
    offsets[n] = len;
    push(`${n} 0 obj\n`);
    for (const x of body) push(x);
    push('\nendobj\n');
  };
  push('%PDF-1.4\n');
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  obj(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f2(W)} ${f2(H)}] /TrimBox [${f2(b)} ${f2(b)} ${f2(W - b)} ${f2(H - b)}] /BleedBox [0 0 ${f2(W)} ${f2(H)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);
  const content = `q ${f2(W)} 0 0 ${f2(H)} 0 0 cm /Im0 Do Q`;
  obj(5, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
  const xref = len;
  push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => `${String(offsets[n]).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
