/**
 * Dokumente-PDF: the pages become one PDF on the device (pdf-lib, free; loaded only when a PDF is
 * made, so the app itself stays small). Each page is as wide as A4; its height follows the paper.
 */
export const A4_WIDTH = 595.28;

/** pages: [{ src: JPEG data URL, w, h }] → PDF as data URL. */
export async function makePdf(pages, { title = '', when = new Date() } = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(title || 'Dokument');
  pdf.setCreator('Pack Generator');
  pdf.setProducer('Pack Generator');
  pdf.setCreationDate(when);
  for (const p of pages) {
    const img = await pdf.embedJpg(p.src);
    const height = (A4_WIDTH * p.h) / p.w;
    pdf.addPage([A4_WIDTH, height]).drawImage(img, { x: 0, y: 0, width: A4_WIDTH, height });
  }
  return pdf.saveAsBase64({ dataUri: true });
}

/** How many pages a PDF file has (for «PDF wählen»); 0 when it cannot be read. */
export async function pageCount(dataUrl) {
  try {
    const { PDFDocument } = await import('pdf-lib');
    return (await PDFDocument.load(dataUrl, { ignoreEncryption: true, updateMetadata: false })).getPageCount();
  } catch {
    return 0;
  }
}
