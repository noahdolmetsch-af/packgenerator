/**
 * Paket NE parts 1148/1149 «Anhänge und Texterkennung» (Noah 20.10.2026 «7a 8a», formats «Alle»):
 * PDFs and files on a note, a scan straight into a note, and the text of photos and files searchable.
 *
 * Where things live (no new table):
 * - The file itself is a row of db.docs with noteId (and kind 'notefile'); one row per file, so a big PDF
 *   does not make the note too big to sync. Ich › Dokumente leaves these rows out (isNoteFile).
 *   row = { id, kind: 'notefile', noteId, name, mime, fmt, bytes, data (data URL), text, createdAt }
 * - The note keeps a short list for showing and searching: note.atts = [{ id, name, fmt, mime, bytes, text }]
 *   (text: what the app read in the file, at most TEXT_MAX characters). An entry that came by mail keeps
 *   its files inline in note.files (mailin.js); the note shows both (allFiles).
 * - The text read in the note's photos: note.ocr = { [hash of the photo]: text }.
 * Pure functions; the readers that need a browser are in attach.js.
 */
import { hashSrc } from '../draw/ink.js';

/** The biggest file a note keeps (a video is made smaller first). */
export const FILE_MAX_MB = 15;
/** Text kept per file for the search. */
export const TEXT_MAX = 20_000;
/** Videos: at most one minute (Noah «Videos bis 1 min»). */
export const VIDEO_MAX_S = 60;

/**
 * The kinds of files, with their file endings and how the app shows them. name: English key for t().
 * show: 'pdf' | 'doc' (Word, PowerPoint: text) | 'table' (Excel, CSV) | 'text' | 'md' | 'map' | 'ics' |
 * 'vcf' | 'video' | 'web' | 'file' (only kept, opened by the device).
 */
export const FORMATS = [
  { fmt: 'pdf', name: 'PDF', ext: ['pdf'], mime: /^application\/pdf$/, show: 'pdf' },
  { fmt: 'image', name: 'Photo', ext: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'tif', 'tiff'], mime: /^image\/(?!hei[cf]|svg)/, show: 'photo' },
  { fmt: 'heic', name: 'Photo (HEIC)', ext: ['heic', 'heif'], mime: /^image\/hei[cf]/, show: 'photo' },
  { fmt: 'docx', name: 'Word', ext: ['docx'], mime: /wordprocessingml/, show: 'doc' },
  { fmt: 'xlsx', name: 'Excel', ext: ['xlsx'], mime: /spreadsheetml/, show: 'table' },
  { fmt: 'pptx', name: 'PowerPoint', ext: ['pptx'], mime: /presentationml/, show: 'doc' },
  { fmt: 'office', name: 'Office (old)', ext: ['doc', 'xls', 'ppt', 'odt', 'ods', 'odp', 'rtf'], mime: /msword|ms-excel|ms-powerpoint|opendocument|rtf/, show: 'file' },
  { fmt: 'csv', name: 'CSV', ext: ['csv', 'tsv'], mime: /^text\/(csv|tab-separated-values)/, show: 'table' },
  { fmt: 'md', name: 'Markdown', ext: ['md', 'markdown'], mime: /^text\/markdown/, show: 'md' },
  { fmt: 'text', name: 'Text|file', ext: ['txt', 'log', 'json', 'xml'], mime: /^text\/plain|^application\/json/, show: 'text' },
  { fmt: 'gpx', name: 'GPX', ext: ['gpx'], mime: /gpx/, show: 'map' },
  { fmt: 'tcx', name: 'TCX', ext: ['tcx'], mime: /tcx/, show: 'map' },
  { fmt: 'fit', name: 'FIT', ext: ['fit'], mime: /fit$/, show: 'map' },
  { fmt: 'ics', name: 'Calendar', ext: ['ics', 'ical'], mime: /^text\/calendar/, show: 'ics' },
  { fmt: 'vcf', name: 'Contact', ext: ['vcf', 'vcard'], mime: /vcard/, show: 'vcf' },
  { fmt: 'video', name: 'Video', ext: ['mp4', 'mov', 'webm', 'm4v', '3gp', 'mkv'], mime: /^video\//, show: 'video' },
  { fmt: 'web', name: 'Web page', ext: [], mime: /^$/, show: 'web' },
  { fmt: 'other', name: 'File', ext: [], mime: /^$/, show: 'file' },
];
export const formatOf = (fmt) => FORMATS.find((f) => f.fmt === fmt) ?? FORMATS[FORMATS.length - 1];

/** The kind of a file from its name and type: 'pdf', 'docx', 'gpx' … ('other' when unknown). */
export function detectFormat(name = '', mime = '') {
  const ext = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  const byExt = ext && FORMATS.find((f) => f.ext.includes(ext));
  if (byExt) return byExt.fmt;
  const m = String(mime).toLowerCase();
  const byMime = m && FORMATS.find((f) => f.mime.source !== '^$' && f.mime.test(m));
  return byMime?.fmt ?? 'other';
}

/** Is a docs row a file of a note (not one of Ich › Dokumente)? */
export const isNoteFile = (d) => !!d?.noteId || d?.kind === 'notefile';

/** «1.2 MB», «840 KB». */
export function sizeText(bytes = 0) {
  const b = Number(bytes) || 0;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1e3))} KB`;
}
/** Bytes of a data URL (base64). */
export function dataBytes(url = '') {
  const s = String(url);
  const i = s.indexOf(',');
  if (i < 0) return 0;
  const b64 = s.slice(i + 1);
  return /;base64$/.test(s.slice(0, i)) ? Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0) : decodeURIComponent(b64).length;
}

/** The short entry the note keeps for a file row. */
export const fileMeta = (row) => ({ id: row.id, name: row.name, fmt: row.fmt, mime: row.mime ?? '', bytes: row.bytes ?? 0, ...(row.text ? { text: String(row.text).slice(0, TEXT_MAX) } : {}) });

/** The note with one more file (or the file's entry changed, when it is there). */
export function withFile(n, meta) {
  const list = n.atts ?? [];
  const has = list.some((f) => f.id === meta.id);
  return { ...n, atts: has ? list.map((f) => (f.id === meta.id ? { ...f, ...meta } : f)) : [...list, meta] };
}
/** The note without a file (its own, or one that came by mail). */
export function withoutFile(n, id) {
  const atts = (n.atts ?? []).filter((f) => f.id !== id);
  const mail = (n.files ?? []).filter((f) => f.id !== id);
  const { atts: _a, files: _f, ...rest } = n;
  return { ...rest, ...(atts.length ? { atts } : {}), ...(mail.length ? { files: mail } : {}) };
}
/**
 * Every file of a note as shown: its own (data in db.docs) and those that came by mail (data inline).
 * → [{ id, name, fmt, mime, bytes, text?, data?, mail? }]
 */
export function allFiles(n) {
  const mail = (n?.files ?? []).filter((f) => f?.data).map((f) => ({ id: f.id, name: f.name, fmt: detectFormat(f.name, f.type), mime: f.type ?? '', bytes: f.size ?? dataBytes(f.data), data: f.data, mail: true }));
  return [...(n?.atts ?? []), ...mail];
}

/** The note with the text read in one of its photos (1149). '' is kept too: «read, no text». */
export function withOcr(n, src, text) {
  return { ...n, ocr: { ...(n.ocr ?? {}), [hashSrc(src)]: String(text ?? '').slice(0, TEXT_MAX) } };
}
/** The photos of a note whose text was not read yet. */
export const unreadPhotos = (n, photos = []) => photos.filter((p) => !(hashSrc(p) in (n.ocr ?? {})));
/** The text read in a photo, or null when it was not read. */
export const ocrOf = (n, src) => n?.ocr?.[hashSrc(src)] ?? null;
/** Only the texts of photos that are still on the note. */
export function pruneOcr(n, photos = []) {
  if (!n.ocr) return n;
  const keep = new Set(photos.map(hashSrc));
  const ocr = Object.fromEntries(Object.entries(n.ocr).filter(([k]) => keep.has(k)));
  const { ocr: _o, ...rest } = n;
  return Object.keys(ocr).length ? { ...rest, ocr } : rest;
}

/** Everything of a note's files and photos the search reads (names and texts). */
export const fileWords = (n) => [...(n?.atts ?? []).flatMap((f) => [f.name, f.text]), ...(n?.files ?? []).map((f) => f?.name), ...Object.values(n?.ocr ?? {})].filter(Boolean).join(' ');

/* ---------- readers that need no browser ---------- */

/** CSV (comma, semicolon or tab, quotes) → rows of cells. At most maxRows rows. */
export function csvRows(text = '', maxRows = 500) {
  const s = String(text).replace(/^\uFEFF/, '');
  const first = s.split('\n')[0] ?? '';
  const sep = (first.match(/\t/g) ?? []).length > 0 ? '\t' : (first.match(/;/g) ?? []).length > (first.match(/,/g) ?? []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) (row.push(cell), (cell = ''));
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
      if (rows.length >= maxRows) return rows;
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== '')) rows.push(row);
  return rows.slice(0, maxRows);
}

const unfold = (text) => String(text).replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
const vUnesc = (s) => String(s).replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

/** vCard (.vcf) → [{ name, tel: [], email: [], org, adr, note, url }]. */
export function parseVcf(text = '') {
  const out = [];
  let cur = null;
  for (const line of unfold(text).split('\n')) {
    const m = line.match(/^([A-Za-z-]+)((?:;[^:]*)?):(.*)$/);
    if (!m) continue;
    const key = m[1].toUpperCase();
    const val = m[3].trim();
    if (key === 'BEGIN' && /vcard/i.test(val)) cur = { name: '', tel: [], email: [], org: '', adr: '', note: '', url: '' };
    else if (key === 'END' && cur) (out.push(cur), (cur = null));
    else if (!cur) continue;
    else if (key === 'FN') cur.name = vUnesc(val);
    else if (key === 'N' && !cur.name) cur.name = vUnesc(val).split(';').slice(0, 2).reverse().filter(Boolean).join(' ');
    else if (key === 'TEL') cur.tel.push(val.replace(/^tel:/i, ''));
    else if (key === 'EMAIL') cur.email.push(val);
    else if (key === 'ORG') cur.org = vUnesc(val).split(';').filter(Boolean).join(', ');
    else if (key === 'ADR') cur.adr = vUnesc(val).split(';').filter(Boolean).join(', ');
    else if (key === 'NOTE') cur.note = vUnesc(val);
    else if (key === 'URL') cur.url = val;
  }
  return out.filter((c) => c.name || c.tel.length || c.email.length);
}

/** One contact as a small vCard text (to open in the phone's contacts). */
export function vcfOf(c) {
  const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  return ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(c.name)}`, ...c.tel.map((x) => `TEL:${x}`), ...c.email.map((x) => `EMAIL:${x}`), ...(c.org ? [`ORG:${esc(c.org)}`] : []), ...(c.note ? [`NOTE:${esc(c.note)}`] : []), 'END:VCARD'].join('\r\n');
}

/* ---------- Office files (the XML inside the zip; read in the app, nothing is changed) ---------- */

const xmlText = (s) =>
  String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
const mdSafe = (s) => s; // Markdown light has no escapes; a lone * stays as it is

/** A Word document (word/document.xml) → Markdown light: headings, bold, lists, tables. */
export function docxToMd(xml = '') {
  const body = String(xml).match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? String(xml);
  const out = [];
  const para = (p) => {
    const style = p.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? '';
    const list = /<w:numPr[\s/>]/.test(p);
    const runs = [...p.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)].map((r) => {
      const t = [...r[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)].map((m) => (m[0] === '<w:tab/>' ? ' ' : m[0] === '<w:br/>' ? ' ' : xmlText(m[1]))).join('');
      const bold = /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(r[1]);
      const ital = /<w:i\/>|<w:i w:val="(1|true)"\/>/.test(r[1]);
      const tx = mdSafe(t);
      return tx.trim() ? (bold ? `**${tx.trim()}** ` : ital ? `*${tx.trim()}* ` : tx) : tx;
    });
    const text = runs.join('').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const h = style.match(/^(?:Heading|berschrift|Titel|Title)(\d)?/i);
    if (h || /^Title$/i.test(style)) return `${'#'.repeat(Math.min(3, Number(h?.[1] ?? 1)))} ${text.replace(/\*\*/g, '')}`;
    return list ? `- ${text}` : text;
  };
  for (const m of body.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>|<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>|<w:p\/>/g)) {
    if (m[1] != null) {
      const rows = [...m[1].matchAll(/<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g)].map((r) => [...r[1].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)].map((c) => [...c[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((x) => xmlText(x[1])).join(' ').replace(/\|/g, '/').trim()));
      if (rows.length) {
        out.push('');
        rows.forEach((r, i) => (out.push(`| ${r.join(' | ')} |`), i === 0 && out.push(`|${r.map(() => '---').join('|')}|`)));
        out.push('');
      }
    } else if (m[2] != null) {
      const line = para(m[2]);
      if (line) out.push(line);
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** The slides of a PowerPoint (ppt/slides/slideN.xml texts, in order) → Markdown light, one heading per slide. */
export function pptxToMd(slides = [], slideWord = 'Slide') {
  return slides
    .map((xml, i) => {
      const paras = [...String(xml).matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((p) => [...p[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((t) => xmlText(t[1])).join('').trim()).filter(Boolean);
      return [`### ${slideWord} ${i + 1}${paras[0] ? `: ${mdSafe(paras[0])}` : ''}`, ...paras.slice(1).map((p) => `- ${mdSafe(p)}`)].join('\n');
    })
    .join('\n\n');
}

/** The order of the slide files: slide1.xml, slide2.xml … slide10.xml (not by text). */
export const slideOrder = (names = []) => names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/(\d+)\.xml$/)[1]) - Number(b.match(/(\d+)\.xml$/)[1]));

/** «B12» → { c: 1, r: 11 }. */
const cellRef = (ref) => {
  const m = String(ref).match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  const c = [...m[1]].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  return { c, r: Number(m[2]) - 1 };
};

/** The shared strings of an Excel file (xl/sharedStrings.xml) → [text]. */
export const xlsxStrings = (xml = '') => [...String(xml).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => xmlText(t[1])).join(''));

/** One sheet (xl/worksheets/sheetN.xml) → rows of cells (text), at most maxRows × maxCols. */
export function xlsxSheet(xml = '', strings = [], { maxRows = 300, maxCols = 30 } = {}) {
  const rows = [];
  for (const c of String(xml).matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const ref = c[1].match(/\br="([A-Z]+\d+)"/)?.[1];
    const pos = ref && cellRef(ref);
    if (!pos || pos.r >= maxRows || pos.c >= maxCols) continue;
    const type = c[1].match(/\bt="([^"]+)"/)?.[1] ?? '';
    const inner = c[2] ?? '';
    const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
    let text = '';
    if (type === 's') text = strings[Number(v)] ?? '';
    else if (type === 'inlineStr') text = [...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => xmlText(t[1])).join('');
    else if (type === 'b') text = v === '1' ? 'TRUE' : 'FALSE';
    else text = v != null ? xmlText(v) : '';
    (rows[pos.r] ??= [])[pos.c] = text;
  }
  const width = Math.max(0, ...rows.filter(Boolean).map((r) => r.length));
  return rows.filter((r) => r && r.some((x) => x != null && x !== '')).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}

/** The names of the sheets (xl/workbook.xml). */
export const xlsxSheetNames = (xml = '') => [...String(xml).matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => xmlText(m[1]));

/** Rows as plain text for the search. */
export const rowsText = (rows = []) => rows.map((r) => r.join(' ')).join('\n');

/* ---------- FIT (Garmin) ---------- */

const FIT_DEG = 180 / 2 ** 31;

/**
 * The positions of a FIT file (record messages 20, fields 0 and 1, semicircles) → [{ lat, lon }].
 * Reads definition and data messages, also compressed time headers; other messages are skipped.
 */
export function fitPoints(bytes, max = 20000) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? []);
  if (b.length < 14 || String.fromCharCode(b[8], b[9], b[10], b[11]) !== '.FIT') return [];
  const hdr = b[0];
  const dataLen = b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24);
  const end = Math.min(b.length, hdr + dataLen);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const defs = {};
  const pts = [];
  let i = hdr;
  while (i < end && pts.length < max) {
    const h = b[i++];
    if (h & 0x80) {
      // compressed timestamp header: a data message of local type (h >> 5) & 3
      const d = defs[(h >> 5) & 3];
      if (!d) return pts;
      i = readData(d, i);
      continue;
    }
    const local = h & 0x0f;
    if (h & 0x40) {
      const dev = !!(h & 0x20);
      const little = b[i + 1] === 0;
      const gmsg = little ? b[i + 2] | (b[i + 3] << 8) : (b[i + 2] << 8) | b[i + 3];
      const n = b[i + 4];
      const fields = [];
      for (let k = 0; k < n; k++) fields.push({ num: b[i + 5 + k * 3], size: b[i + 6 + k * 3] });
      i += 5 + n * 3;
      let devSize = 0;
      if (dev) {
        const nd = b[i++];
        for (let k = 0; k < nd; k++) devSize += b[i + k * 3 + 1];
        i += nd * 3;
      }
      defs[local] = { gmsg, little, fields, devSize };
    } else {
      const d = defs[local];
      if (!d) return pts;
      i = readData(d, i);
    }
  }
  return pts;

  function readData(d, at) {
    let p = at;
    let lat = null;
    let lon = null;
    for (const f of d.fields) {
      if (d.gmsg === 20 && (f.num === 0 || f.num === 1) && f.size === 4 && p + 4 <= b.length) {
        const v = dv.getInt32(p, d.little);
        if (v !== 0x7fffffff) f.num === 0 ? (lat = v * FIT_DEG) : (lon = v * FIT_DEG);
      }
      p += f.size;
    }
    p += d.devSize;
    if (lat != null && lon != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) pts.push({ lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 });
    return p;
  }
}

/** Every nth point, so a long ride draws quickly (at most max points). */
export const thinTrack = (pts = [], max = 600) => (pts.length <= max ? pts : pts.filter((_, i) => i % Math.ceil(pts.length / max) === 0 || i === pts.length - 1));

/* ---------- web page as readable text ---------- */

/**
 * A web page's HTML → readable Markdown light and the images to keep: { title, md, images: [url] }.
 * Keeps headings, paragraphs, lists and the images of the article; drops menus, scripts and styles.
 * Pure (regex), so it runs anywhere; base: the page's address for relative links.
 */
export function readableOf(html = '', base = '', maxImages = 8) {
  let s = String(html);
  const title = xmlText(s.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)?.[1] ?? s.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  s = s.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|button|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const main = s.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? s.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? s.match(/<body[\s\S]*?<\/body>/i)?.[0] ?? s;
  const abs = (u) => {
    try {
      return new URL(xmlText(u), base || undefined).href;
    } catch {
      return '';
    }
  };
  const images = [];
  const out = [];
  // pictures become their own paragraphs first: [[img:n]] marks where they stand
  const withImgs = main.replace(/<img(\s[^>]*)>/gi, (_, attrs) => {
    const src = attrs.match(/\ssrc="([^"]+)"/i)?.[1] ?? attrs.match(/\sdata-src="([^"]+)"/i)?.[1];
    const u = src && abs(src);
    if (!u || !/^https?:/i.test(u) || images.length >= maxImages || /\.svg(\?|$)/i.test(u)) return ' ';
    if (!images.includes(u)) images.push(u);
    return `<p>[[img:${images.indexOf(u)}]]</p>`;
  });
  for (const m of withImgs.matchAll(/<(h[1-6]|p|li|blockquote|pre|td|th)(?:\s[^>]*)?>([\s\S]*?)(?=<\/\1>|<(?:h[1-6]|p|li|blockquote|pre)[\s>])/gi)) {
    const tag = m[1].toLowerCase();
    const text = xmlText(m[2].replace(/<br\s*\/?>/gi, ' ')).replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2) continue;
    if (/^\[\[img:\d+\]\]$/.test(text)) out.push(text);
    else if (/^h[1-3]$/.test(tag)) out.push(`## ${text}`);
    else if (/^h[4-6]$/.test(tag)) out.push(`### ${text}`);
    else if (tag === 'li') out.push(`- ${text}`);
    else out.push(text);
  }
  // the same line twice in a row (menus that slipped through) only once
  const md = out.filter((l, i) => l !== out[i - 1]).join('\n').slice(0, 60_000);
  return { title, md, images };
}
