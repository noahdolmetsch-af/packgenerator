/**
 * Paket L «Werkzeugkasten» (#308 PDF verkleinern, zusammenfügen, teilen): all on the device with
 * pdf-lib (already in the app, loaded only when a PDF tool is used). Nothing goes to a web page.
 * - merge: PDFs and photos in the chosen order into one PDF (a photo becomes an A4 page).
 * - shrink: the photos inside a PDF are made smaller (JPEG, at most `maxSide` pixels); text and
 *   drawings stay sharp. A photo that would not get smaller stays as it was.
 * The JPEG re-coding needs a canvas; it is given as `recode` so the tests run without a browser.
 */

export const A4 = [595.28, 841.89];

/** Is the file a PDF (by its first bytes, else by its type or name)? */
export function isPdf(bytes, name = '', type = '') {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? []);
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return true; // %PDF
  return type === 'application/pdf' || /\.pdf$/i.test(name);
}

/** Size as «1.2 MB» / «340 KB». */
export function sizeText(n) {
  if (!Number.isFinite(n)) return '';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1e3))} KB`;
}

/** The fit of a w×h picture on an A4 page with a 24 pt margin: { x, y, w, h, page:[pw,ph] }. */
export function fitOnA4(w, h) {
  const page = w > h ? [A4[1], A4[0]] : [...A4];
  const m = 24;
  const s = Math.min((page[0] - 2 * m) / w, (page[1] - 2 * m) / h);
  const dw = w * s;
  const dh = h * s;
  return { x: (page[0] - dw) / 2, y: (page[1] - dh) / 2, w: dw, h: dh, page };
}

/**
 * One PDF from the parts in order. A part: { bytes, kind: 'pdf' | 'jpg' | 'png' }.
 * Returns the bytes and the page count.
 */
export async function mergeParts(parts) {
  const { PDFDocument } = await import('pdf-lib');
  const out = await PDFDocument.create();
  for (const p of parts) {
    if (p.kind === 'pdf') {
      const src = await PDFDocument.load(p.bytes, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((pg) => out.addPage(pg));
    } else {
      const img = p.kind === 'png' ? await out.embedPng(p.bytes) : await out.embedJpg(p.bytes);
      const f = fitOnA4(img.width, img.height);
      const page = out.addPage(f.page);
      page.drawImage(img, { x: f.x, y: f.y, width: f.w, height: f.h });
    }
  }
  const bytes = await out.save({ useObjectStreams: true });
  return { bytes, pages: out.getPageCount() };
}

/**
 * Makes the photos inside a PDF smaller. recode(jpegBytes, { quality, maxSide }) → { bytes, width,
 * height } or null. Returns { bytes, images: how many got smaller }.
 */
export async function shrinkPdf(bytes, recode, { quality = 0.6, maxSide = 1600 } = {}) {
  const { PDFDocument, PDFName, PDFRawStream, PDFArray } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const N = (s) => PDFName.of(s);
  let images = 0;
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const d = obj.dict;
    if (d.get(N('Subtype')) !== N('Image')) continue;
    let filter = d.get(N('Filter'));
    if (filter instanceof PDFArray) filter = filter.size() === 1 ? filter.get(0) : null;
    if (filter !== N('DCTDecode')) continue;
    const cs = d.get(N('ColorSpace'));
    if (cs !== N('DeviceRGB') && cs !== N('DeviceGray')) continue; // CMYK and others stay as they are
    if (d.get(N('Decode')) || d.get(N('ImageMask'))) continue;
    let out = null;
    try {
      out = await recode(obj.contents, { quality, maxSide });
    } catch {
      out = null;
    }
    if (!out?.bytes || out.bytes.length >= obj.contents.length * 0.95) continue;
    const dict = { Type: 'XObject', Subtype: 'Image', Width: out.width, Height: out.height, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode' };
    const stream = doc.context.stream(out.bytes, dict);
    const smask = d.get(N('SMask'));
    if (smask) stream.dict.set(N('SMask'), smask);
    doc.context.assign(ref, stream);
    images++;
  }
  const outBytes = await doc.save({ useObjectStreams: true });
  return { bytes: outBytes, images };
}

/** How many pages a PDF has; 0 when it cannot be read. */
export async function pagesOf(bytes) {
  try {
    const { PDFDocument } = await import('pdf-lib');
    return (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
  } catch {
    return 0;
  }
}
