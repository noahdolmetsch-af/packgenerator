/**
 * Paket NE 1148/1149: reading files for a note in the browser. Everything runs on the device; the big
 * readers load only when a file needs them: pdf.js (PDF), heic2any (HEIC photos), the app's own zip reader
 * (Word, Excel, PowerPoint: zipread.js), tesseract.js (text in pictures, docs/ocr.js).
 *
 * prepare(file) → { kind: 'photo', src } for a picture (it goes to the note's photos, so it can be drawn on),
 *                 or { kind: 'file', row } for anything else (a db.docs row, see files.js).
 */
import { t } from '../i18n.svelte.js';
import { shrinkImage } from '../photo.js';
import { detectFormat, FILE_MAX_MB, TEXT_MAX, VIDEO_MAX_S, dataBytes, csvRows, rowsText, parseVcf, docxToMd, pptxToMd, odtToMd, odpToMd, odsSheets, rtfToText, slideOrder, xlsxStrings, xlsxSheet, xlsxSheetNames, fitPoints, readableOf } from './files.js';

export const fileId = () => `nf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** A File or Blob as a data URL. */
export const asDataUrl = (blob) =>
  new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(blob);
  });
/** A data URL back to its bytes. */
export async function bytesOf(url) {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}
const textOf = async (url) => new TextDecoder().decode(await bytesOf(url));

/* ---------- PDF (pdf.js, loaded on first use) ---------- */

let pdfjs = null;
async function pdfLib() {
  if (pdfjs) return pdfjs;
  // the «legacy» build: it brings what older phone browsers lack (e.g. Samsung Internet)
  const [lib, worker] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')]);
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  pdfjs = lib;
  return lib;
}
/** An open PDF from a data URL: { doc, pages }. */
export async function openPdf(url) {
  const lib = await pdfLib();
  const doc = await lib.getDocument({ data: await bytesOf(url), isEvalSupported: false }).promise;
  return { doc, pages: doc.numPages };
}
/** One page of an open PDF on a canvas, width w px. */
export async function renderPdfPage(doc, n, canvas, w = 900) {
  const page = await doc.getPage(n);
  const v1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: w / v1.width });
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp, canvas }).promise;
  return canvas;
}
/** The text in a PDF (its text layer; a scanned PDF has none: then ''). */
export async function pdfText(url, maxPages = 60) {
  const { doc, pages } = await openPdf(url);
  const parts = [];
  for (let n = 1; n <= Math.min(pages, maxPages); n++) {
    const tc = await (await doc.getPage(n)).getTextContent();
    parts.push(tc.items.map((i) => i.str + (i.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').trim());
    if (parts.join('\n').length > TEXT_MAX) break;
  }
  doc.destroy?.();
  return parts.join('\n\n').slice(0, TEXT_MAX);
}
/** Pages of a PDF as JPEG pictures (for the text reader of a scanned PDF). */
export async function pdfImages(url, maxPages = 10) {
  const { doc, pages } = await openPdf(url);
  const out = [];
  for (let n = 1; n <= Math.min(pages, maxPages); n++) out.push((await renderPdfPage(doc, n, document.createElement('canvas'), 1400)).toDataURL('image/jpeg', 0.85));
  doc.destroy?.();
  return out;
}

/* ---------- Office (zip with XML inside) ---------- */

/** The XML files of an Office file (a zip): { name: text }. */
async function unzipOf(url) {
  const { zipEntries } = await import('../zipread.js');
  const want = (n) => /^(word\/document|ppt\/slides\/slide\d+|xl\/sharedStrings|xl\/workbook|xl\/worksheets\/sheet\d+|content)\.xml$/.test(n);
  const out = {};
  for (const e of await zipEntries(new Blob([await bytesOf(url)]), want)) out[e.name] = await e.text();
  return out;
}
const dec = (s) => s ?? '';

/** What a Word, Excel or PowerPoint file (or its LibreOffice twin .odt/.ods/.odp) shows in the app: { md } or { sheets: [{ name, rows }] }. */
export async function readOffice(url, fmt) {
  const z = await unzipOf(url);
  if (fmt === 'docx') return { md: docxToMd(dec(z['word/document.xml'])) };
  if (fmt === 'pptx') return { md: pptxToMd(slideOrder(Object.keys(z)).map((n) => dec(z[n])), t('Slide')) };
  if (fmt === 'odt') return { md: odtToMd(dec(z['content.xml'])) };
  if (fmt === 'odp') return { md: odpToMd(dec(z['content.xml']), t('Slide')) };
  if (fmt === 'ods') return { sheets: odsSheets(dec(z['content.xml'])).map((sh, i) => ({ ...sh, name: /^\d+$/.test(sh.name) ? `${t('Sheet')} ${i + 1}` : sh.name })) };
  const strings = xlsxStrings(dec(z['xl/sharedStrings.xml']));
  const names = xlsxSheetNames(dec(z['xl/workbook.xml']));
  const files = Object.keys(z).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/(\d+)\.xml$/)[1]) - Number(b.match(/(\d+)\.xml$/)[1]));
  return { sheets: files.slice(0, 12).map((f, i) => ({ name: names[i] ?? `${t('Sheet')} ${i + 1}`, rows: xlsxSheet(dec(z[f]), strings) })) };
}

/* ---------- tracks (GPX, TCX, FIT) ---------- */

/** The points of a GPX, TCX or FIT file: [{ lat, lon }]. */
export async function trackOf(url, fmt) {
  if (fmt === 'fit') return fitPoints(await bytesOf(url));
  const text = await textOf(url);
  const pts = [...text.matchAll(/<(?:trkpt|rtept|wpt)\s[^>]*?lat="(-?[\d.]+)"[^>]*?lon="(-?[\d.]+)"|<(?:trkpt|rtept|wpt)\s[^>]*?lon="(-?[\d.]+)"[^>]*?lat="(-?[\d.]+)"/g)].map((m) => ({ lat: Number(m[1] ?? m[4]), lon: Number(m[2] ?? m[3]) }));
  if (pts.length) return pts;
  return [...text.matchAll(/<LatitudeDegrees>(-?[\d.]+)<\/LatitudeDegrees>\s*<LongitudeDegrees>(-?[\d.]+)<\/LongitudeDegrees>/g)].map((m) => ({ lat: Number(m[1]), lon: Number(m[2]) }));
}

/* ---------- video (at most 1 minute, made smaller on the device) ---------- */

/** The length of a video in seconds. */
function videoLength(src) {
  return new Promise((ok, fail) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => ok(v.duration);
    v.onerror = () => fail(new Error(t('This video could not be read.')));
    v.src = src;
  });
}

/**
 * A video up to 1 minute, made smaller on the device (480 p, no sound) with the same code as the tool
 * «Video verkleinern» (tools/video.js); small files and browsers that cannot record keep the file as it is.
 * onstep(share 0–1).
 */
export async function shrinkVideo(file, { onstep = () => {} } = {}) {
  const src = URL.createObjectURL(file);
  try {
    const len = await videoLength(src);
    if (Number.isFinite(len) && len > VIDEO_MAX_S + 0.5) throw new Error(t('The video is longer than 1 minute. Shorten it on the phone first, or keep it there and add its link under «Link».'));
    const { recType, shrinkVideo: shrink } = await import('../tools/video.js');
    const canRecord = typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function' && !!recType();
    if (!canRecord || file.size < 3e6) return { data: await asDataUrl(file), mime: file.type || 'video/mp4', secs: len };
    const blob = await shrink(file, { h: 480, bps: 700_000 }, { onprogress: onstep, audio: false });
    return { data: await asDataUrl(blob), mime: blob.type || 'video/webm', secs: len };
  } finally {
    URL.revokeObjectURL(src);
  }
}

/* ---------- photos, also HEIC ---------- */

/** A photo file (also HEIC from an iPhone) as a smaller JPEG data URL. */
export async function photoOf(file, max = 1600) {
  try {
    return await shrinkImage(file.type ? file : new File([file], file.name, { type: 'image/jpeg' }), max, 0.82);
  } catch (err) {
    if (detectFormat(file.name, file.type) !== 'heic') throw err;
    const { default: heic2any } = await import('heic2any');
    const jpg = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    return shrinkImage(new File([Array.isArray(jpg) ? jpg[0] : jpg], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' }), max, 0.82);
  }
}

/* ---------- one file → what the note keeps ---------- */

/** The text of a file for the search ('' when there is none or it cannot be read). */
export async function textOfFile(row) {
  try {
    if (row.fmt === 'pdf') return await pdfText(row.data);
    if (row.fmt === 'docx' || row.fmt === 'pptx' || row.fmt === 'odt' || row.fmt === 'odp') return (await readOffice(row.data, row.fmt)).md.replace(/[#*|-]+/g, ' ').slice(0, TEXT_MAX);
    if (row.fmt === 'xlsx' || row.fmt === 'ods') return (await readOffice(row.data, row.fmt)).sheets.map((s) => `${s.name}\n${rowsText(s.rows)}`).join('\n').slice(0, TEXT_MAX);
    if (row.fmt === 'rtf') return rtfToText(await textOf(row.data)).slice(0, TEXT_MAX);
    if (row.fmt === 'csv') return rowsText(csvRows(await textOf(row.data))).slice(0, TEXT_MAX);
    if (row.fmt === 'text' || row.fmt === 'md' || row.fmt === 'web') return (await textOf(row.data)).slice(0, TEXT_MAX);
    if (row.fmt === 'ics') return [...(await textOf(row.data)).matchAll(/^(?:SUMMARY|LOCATION|DESCRIPTION):(.*)$/gm)].map((m) => m[1]).join(' ').slice(0, TEXT_MAX);
    if (row.fmt === 'vcf') return parseVcf(await textOf(row.data)).map((c) => [c.name, c.org, ...c.tel, ...c.email].join(' ')).join('\n');
  } catch {
    /* a file the reader does not understand is kept without text */
  }
  return '';
}

/**
 * A file chosen or shared for a note. noteId: the note. onstep(text): what is happening (for the user).
 * → { kind: 'photo', src } | { kind: 'file', row }
 */
export async function prepare(file, { noteId, onstep = () => {} } = {}) {
  const fmt = detectFormat(file.name, file.type);
  if (fmt === 'image' || fmt === 'heic') {
    onstep(t('Reading the photo…'));
    return { kind: 'photo', src: await photoOf(file) };
  }
  let data;
  let mime = file.type || '';
  if (fmt === 'video') {
    onstep(t('Making the video smaller…'));
    const v = await shrinkVideo(file, { onstep: (k) => onstep(t('Making the video smaller: {n} %', { n: Math.round(k * 100) })) });
    data = v.data;
    mime = v.mime;
  } else {
    if (file.size > FILE_MAX_MB * 1e6) throw new Error(t('The file is bigger than {n} MB.', { n: FILE_MAX_MB }));
    data = await asDataUrl(file);
  }
  const bytes = dataBytes(data);
  if (bytes > FILE_MAX_MB * 1e6) throw new Error(t('The file is bigger than {n} MB.', { n: FILE_MAX_MB }));
  const row = { id: fileId(), kind: 'notefile', noteId, name: String(file.name || t('File')).slice(0, 120), mime, fmt, bytes, data, text: '', createdAt: new Date().toISOString() };
  onstep(t('Reading the text…'));
  row.text = await textOfFile(row);
  return { kind: 'file', row };
}

/* ---------- a web page, kept to read offline ---------- */

export const READ_URL = 'https://packgen-three.vercel.app/api/linkcheck';

/**
 * A web page as readable text with its pictures, kept offline: a db.docs row (fmt 'web', the data is a
 * small Markdown file; pictures as data URLs in row.images). The server only fetches the page (a browser
 * may not read other sites); the app makes it readable.
 */
export async function savePage(url, { noteId, doFetch = (...a) => fetch(...a), onstep = () => {} } = {}) {
  onstep(t('Loading the page…'));
  let res;
  try {
    res = await doFetch(`${READ_URL}?read=${encodeURIComponent(url)}`);
  } catch {
    throw new Error(t('No connection. Try again when you are online.'));
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.html) throw new Error(body.message || t('The page could not be loaded.'));
  const page = readableOf(body.html, body.url || url);
  onstep(t('Keeping the pictures…'));
  const images = [];
  for (const u of page.images) {
    try {
      const r = await doFetch(`${READ_URL}?img=${encodeURIComponent(u)}`);
      if (!r.ok) continue;
      const blob = await r.blob();
      images.push(await shrinkImage(new File([blob], 'bild.jpg', { type: blob.type || 'image/jpeg' }), 900, 0.75));
    } catch {
      images.push(null);
    }
  }
  const md = page.md;
  const data = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
  const name = (page.title || new URL(url).hostname).slice(0, 120);
  return { id: fileId(), kind: 'notefile', noteId, name, mime: 'text/markdown', fmt: 'web', bytes: dataBytes(data) + images.reduce((a, s) => a + dataBytes(s ?? ''), 0), data, images, url, text: md.replace(/\[\[img:\d+\]\]/g, ' ').slice(0, TEXT_MAX), createdAt: new Date().toISOString() };
}
