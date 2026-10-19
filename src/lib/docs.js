/**
 * Ich › Dokumente: P3b «Daten sicher» (Noah 15.10.2026 «1a»; mockups D3/D4 approved 12.10.2026 «d1-d5
 * freigeben») keeps passport, insurance, emergency and travel papers with a «valid until» month, a
 * reminder some months before (6 by default) and the packing list row («ID and cash with you?»).
 * Dokumente-PDF (DP, Paket B; Noah «1b 2a mit möglichkeiten zum sortieren 3 beides möglich 4a im normalfall
 * und b möglich 5a», then «1a 2a») adds photographing pages into a PDF, the recognised text, a name and a
 * date from it, and the picture maths (find the paper, straighten it, black and white).
 *
 * The pure part: one row per document in db.docs, sorting, groups, search.
 * Everything here runs without a browser so tests/docs.test.js and tests/datensicher.test.js can check it.
 *
 * A row: { id, kind: 'pdf'|'photo', name, group, createdAt, docDate, source: 'camera'|'gallery'|'file'|'share',
 *          pages, bytes, mode: 'bw'|'gray'|'color', text, data (data URL of the PDF or JPEG), drive: { id, link, at } | null,
 *          until: 'YYYY-MM' | null (valid until, end of that month), remind: months before (0 = off),
 *          note, inPack: true when it stands in the packing list of trips }
 * group '' = the default group: «Importierte PDF» for PDFs, «Importierte Fotos» for photos.
 */

/** The default groups (English source names; German via t(): «Importierte PDF», «Importierte Fotos»). */
export const DEFAULT_GROUP = { pdf: 'Imported PDFs', photo: 'Imported photos' };
/** The groups the earlier D3 mockups showed; offered when a new group is made. */
export const GROUP_IDEAS = ['IDs', 'Insurance and emergency', 'Money', 'Travel', 'Warranties', 'Receipts'];
/** Sorting (Noah «mit möglichkeiten zum sortieren»). */
export const SORTS = ['new', 'name', 'date', 'source'];
/** Looks of a page (Noah «4a im normalfall und b möglich»): black and white by default. */
export const MODES = ['bw', 'gray', 'color'];
/** What several photos become (Noah «1a»: one PDF of all is chosen first). */
export const MAKES = ['one', 'each', 'photos'];
/** Longest side of a stored page in pixels; black and white pages stay at about 0.2 MB. */
export const PAGE_MAX = 1700;

const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** The group a row is in ('' = default). */
export const groupOf = (d) => (typeof d?.group === 'string' ? d.group.trim() : '');

/** Sorted copy: new (newest first), name (A–Z), date (date in the document, newest first), source (camera, gallery, file). */
export function sortDocs(list, by = 'new') {
  const rows = [...(list ?? [])];
  const newer = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
  if (by === 'name') return rows.sort((a, b) => fold(a.name).localeCompare(fold(b.name)) || newer(a, b));
  if (by === 'date') return rows.sort((a, b) => String(b.docDate ?? b.createdAt ?? '').localeCompare(String(a.docDate ?? a.createdAt ?? '')) || newer(a, b));
  if (by === 'source') {
    const rank = { camera: 0, gallery: 1, share: 2, file: 3 };
    return rows.sort((a, b) => (rank[a.source] ?? 9) - (rank[b.source] ?? 9) || newer(a, b));
  }
  return rows.sort(newer);
}

/**
 * The groups with their rows: the default PDF group first, then own groups A–Z, the photo group last.
 * Returns [{ key, kind, name (own name or null for a default), rows }]. Empty own groups that are kept in
 * «extra» (made but still empty) show too.
 */
export function groupDocs(list, by = 'new', extra = []) {
  const map = new Map();
  const add = (key, kind, name) => map.get(key) ?? (map.set(key, { key, kind, name, rows: [] }), map.get(key));
  add('pdf:', 'pdf', null);
  for (const d of list ?? []) {
    const g = groupOf(d);
    const kind = d.kind === 'photo' && !g ? 'photo' : 'pdf';
    add(g ? `own:${fold(g)}` : `${kind}:`, g ? 'own' : kind, g || null).rows.push(d);
  }
  for (const g of extra ?? []) if (String(g ?? '').trim()) add(`own:${fold(g)}`, 'own', String(g).trim());
  const order = (x) => (x.kind === 'pdf' ? 0 : x.kind === 'own' ? 1 : 2);
  return [...map.values()]
    .filter((x) => x.rows.length || x.kind !== 'photo')
    .map((x) => ({ ...x, rows: sortDocs(x.rows, by) }))
    .sort((a, b) => order(a) - order(b) || fold(a.name).localeCompare(fold(b.name)));
}

/* ---------- Paket A (Noah 18.10.2026 «1a»): rename and delete a group ---------- */

/** Same group name? Case and accents do not count («reisen» = «Reisen»). */
export const sameGroup = (a, b) => fold(String(a ?? '').trim()) === fold(String(b ?? '').trim());

/**
 * The name a default group shows: the own name it was given (prefs.names.pdf / .photo), else null
 * (the page then shows t(DEFAULT_GROUP[kind])). The code key stays '' on the documents.
 */
export const defaultName = (kind, names) => {
  const n = names?.[kind === 'photo' ? 'photo' : 'pdf'];
  return typeof n === 'string' && n.trim() ? n.trim() : null;
};

/**
 * Renaming an own group: every document in it gets the new name. → [{ id, before, after }].
 * A new name that is another group's already puts both together (that is what the person asked for).
 */
export function renamePatches(list, from, to) {
  const after = String(to ?? '').trim().slice(0, 60);
  if (!after || !String(from ?? '').trim()) return [];
  return (list ?? []).filter((d) => groupOf(d) && sameGroup(groupOf(d), from) && groupOf(d) !== after).map((d) => ({ id: d.id, before: d.group, after }));
}

/**
 * Deleting an own group: its documents go back to the default group ('' = «Importierte PDF/Fotos») or, with
 * `to` (Paket B, «Gruppen überall»: the delete window asks where), into another own group; none is deleted.
 */
export function deletePatches(list, name, to = '') {
  if (!String(name ?? '').trim()) return [];
  const after = sameGroup(to, name) ? '' : String(to ?? '').trim().slice(0, 60);
  return (list ?? []).filter((d) => groupOf(d) && sameGroup(groupOf(d), name)).map((d) => ({ id: d.id, before: d.group, after }));
}

/** The kept empty groups after a rename (from → to) or a delete (to null), without doubles. */
export function groupsAfter(groups, from, to = null) {
  const out = [];
  for (const g of [...(groups ?? []).map((x) => (sameGroup(x, from) ? to : x))]) {
    const s = String(g ?? '').trim();
    if (s && !out.some((x) => sameGroup(x, s))) out.push(s);
  }
  return out;
}

/** All own group names (for «In Gruppe verschieben»), A–Z, without doubles. */
export function ownGroups(list, extra = []) {
  const seen = new Map();
  for (const g of [...(list ?? []).map(groupOf), ...(extra ?? [])]) {
    const s = String(g ?? '').trim();
    if (s && !seen.has(fold(s))) seen.set(fold(s), s);
  }
  return [...seen.values()].sort((a, b) => fold(a).localeCompare(fold(b)));
}

/** Search in the name and the recognised text (Noah «5a»); all words must be found, accents ignored. */
export function searchDocs(list, q) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [...(list ?? [])];
  return (list ?? []).filter((d) => {
    const hay = `${fold(d.name)} ${fold(d.group)} ${fold(d.text)}`;
    return words.every((w) => hay.includes(w));
  });
}

const MONTHS = { januar: 1, jan: 1, january: 1, februar: 2, feb: 2, february: 2, maerz: 3, marz: 3, mar: 3, march: 3, april: 4, apr: 4, mai: 5, may: 5, juni: 6, jun: 6, june: 6, juli: 7, jul: 7, july: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9, oktober: 10, okt: 10, oct: 10, october: 10, november: 11, nov: 11, dezember: 12, dez: 12, dec: 12, december: 12 };
const pad = (n) => String(n).padStart(2, '0');
const valid = (y, m, d) => {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= last ? `${y}-${pad(m)}-${pad(d)}` : null;
};

/** The first date in the text: 14.10.2026, 14.10.26, 2026-10-14 or 14. Oktober 2026. Else null. */
export function findDate(text) {
  const s = String(text ?? '');
  const hits = [];
  for (const m of s.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})\b/g)) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const iso = valid(y, Number(m[2]), Number(m[1]));
    if (iso) hits.push([m.index, iso]);
  }
  for (const m of s.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const iso = valid(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) hits.push([m.index, iso]);
  }
  for (const m of fold(s).matchAll(/\b(\d{1,2})\.?\s+([a-z]{3,9})\.?\s+(\d{4})\b/g)) {
    const mon = MONTHS[m[2]];
    const iso = mon ? valid(Number(m[3]), mon, Number(m[1])) : null;
    if (iso) hits.push([m.index, iso]);
  }
  return hits.sort((a, b) => a[0] - b[0])[0]?.[1] ?? null;
}

/**
 * A name from the recognised text: the first line that reads like words (at least two words of three
 * letters, not mostly numbers), at most 60 characters. Else null (the page then offers «Scan 15.10.2026»).
 */
export function suggestName(text) {
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.replace(/[|_*~<>{}[\]=]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (line.length < 6) continue;
    const words = line.match(/\p{L}{3,}/gu) ?? [];
    const digits = (line.match(/\d/g) ?? []).length;
    if (words.length >= 2 && digits <= line.length / 3) return line.length > 60 ? `${line.slice(0, 59).replace(/\s+\S*$/, '')}…` : line;
  }
  return null;
}

/** A file name: «quittung-veloladen-muster-2026-10-15.pdf» (no accents, no spaces). */
export function fileName(name, day, ext = 'pdf') {
  const base = fold(name)
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${base || 'dokument'}${day ? `-${day}` : ''}.${ext}`;
}

/** Bytes of a data URL (the size shown, «0,4 MB»). */
export function dataBytes(dataUrl) {
  const s = String(dataUrl ?? '');
  const i = s.indexOf(',');
  if (i < 0) return 0;
  const b64 = s.slice(i + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
}

/* ---------- picture maths (plain arrays; the browser part is src/lib/docs/scan.js) ---------- */

/** Otsu's threshold of a gray array (0–255). */
export function otsu(gray) {
  const hist = new Array(256).fill(0);
  for (const v of gray) hist[v]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let at = 127;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      at = i;
    }
  }
  return at;
}

/**
 * Find the paper in a small gray picture (Noah «3 beides möglich»: the app finds the edge, you can
 * correct it). The paper is the biggest bright area; its corners are the points furthest towards the
 * four corners of the picture. Returns [tl, tr, br, bl] as { x, y } in 0..1, or null when nothing
 * clear is found (then the whole picture is used and the corners can be moved by hand).
 */
export function detectQuad(gray, w, h) {
  if (!gray?.length || w < 8 || h < 8) return null;
  const th = otsu(gray);
  const bright = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) bright[i] = gray[i] > th ? 1 : 0;
  // the biggest connected bright area (4-neighbours)
  const label = new Int32Array(w * h).fill(-1);
  let bestId = -1;
  let bestSize = 0;
  const stack = [];
  let id = 0;
  for (let s = 0; s < bright.length; s++) {
    if (!bright[s] || label[s] !== -1) continue;
    let size = 0;
    stack.push(s);
    label[s] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w;
      for (const q of [p - w, p + w, x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1]) {
        if (q >= 0 && q < bright.length && bright[q] && label[q] === -1) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      bestId = id;
    }
    id++;
  }
  // too small (no paper) or the whole picture (paper fills it): no clear edge
  if (bestSize < w * h * 0.08 || bestSize > w * h * 0.97) return null;
  const best = { tl: [Infinity, 0], tr: [-Infinity, 0], br: [-Infinity, 0], bl: [Infinity, 0] };
  const pts = { tl: null, tr: null, br: null, bl: null };
  for (let p = 0; p < label.length; p++) {
    if (label[p] !== bestId) continue;
    const x = p % w;
    const y = (p - x) / w;
    if (x + y < best.tl[0]) (best.tl[0] = x + y), (pts.tl = { x, y });
    if (x - y > best.tr[0]) (best.tr[0] = x - y), (pts.tr = { x, y });
    if (x + y > best.br[0]) (best.br[0] = x + y), (pts.br = { x, y });
    if (x - y < best.bl[0]) (best.bl[0] = x - y), (pts.bl = { x, y });
  }
  const norm = (p, dx, dy) => ({ x: Math.min(1, Math.max(0, (p.x + dx) / w)), y: Math.min(1, Math.max(0, (p.y + dy) / h)) });
  return [norm(pts.tl, 0, 0), norm(pts.tr, 1, 0), norm(pts.br, 1, 1), norm(pts.bl, 0, 1)];
}

/** The whole picture as corners (no detection, or «Ganzes Foto»). */
export const FULL_QUAD = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/** Size of the straightened page from the corners in pixels: the longer of opposite edges, at most «max». */
export function quadSize(q, max = PAGE_MAX) {
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let w = Math.max(d(q[0], q[1]), d(q[3], q[2]));
  let h = Math.max(d(q[0], q[3]), d(q[1], q[2]));
  const k = Math.min(1, max / Math.max(w, h, 1));
  w = Math.max(1, Math.round(w * k));
  h = Math.max(1, Math.round(h * k));
  return { w, h };
}

/**
 * The 3×3 projection (as 8 numbers, the 9th is 1) that maps the four «from» points onto «to».
 * Used backwards: for every pixel of the straight page, where it lies in the photo.
 */
export function homography(from, to) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i];
    const { x: u, y: v } = to[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  // Gaussian elimination with pivoting
  const n = 8;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    if (Math.abs(A[c][c]) < 1e-12) return null;
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
    x[r] = s / A[r][r];
  }
  return x;
}

/** Apply the projection to one point. */
export function project(H, x, y) {
  const z = H[6] * x + H[7] * y + 1;
  return { x: (H[0] * x + H[1] * y + H[2]) / z, y: (H[3] * x + H[4] * y + H[5]) / z };
}

/**
 * Straighten: copy the area inside «quad» (pixel corners in the source) onto a w×h page.
 * src/out: { data: RGBA bytes, width, height }. Nearest pixel is enough for paper.
 */
export function warp(src, quad, out) {
  const H = homography(
    [
      { x: 0, y: 0 },
      { x: out.width, y: 0 },
      { x: out.width, y: out.height },
      { x: 0, y: out.height },
    ],
    quad,
  );
  if (!H) return out;
  const sw = src.width;
  const sh = src.height;
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const p = project(H, x + 0.5, y + 0.5);
      const sx = Math.min(sw - 1, Math.max(0, Math.floor(p.x)));
      const sy = Math.min(sh - 1, Math.max(0, Math.floor(p.y)));
      const si = (sy * sw + sx) * 4;
      const oi = (y * out.width + x) * 4;
      out.data[oi] = src.data[si];
      out.data[oi + 1] = src.data[si + 1];
      out.data[oi + 2] = src.data[si + 2];
      out.data[oi + 3] = 255;
    }
  }
  return out;
}

/** Gray value of each pixel (0–255). */
export function grayOf(img) {
  const g = new Uint8ClampedArray(img.width * img.height);
  for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = (img.data[i] * 299 + img.data[i + 1] * 587 + img.data[i + 2] * 114) / 1000;
  return g;
}

/**
 * The look of a page in place (Noah «4a»: black and white by default, «b möglich»: gray or colour).
 * Black and white: each pixel against the mean of its neighbourhood (works with shadows on the paper).
 */
export function applyMode(img, mode = 'bw') {
  if (mode === 'color') return img;
  const g = grayOf(img);
  const { width: w, height: h, data } = img;
  if (mode === 'gray') {
    for (let j = 0; j < g.length; j++) data[j * 4] = data[j * 4 + 1] = data[j * 4 + 2] = g[j];
    return img;
  }
  // integral image for the neighbourhood mean
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row;
    }
  }
  const r = Math.max(4, Math.round(Math.min(w, h) / 32));
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const sum = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const v = g[y * w + x] < mean * 0.88 ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }
  return img;
}

/* ---------- P3b: valid until, reminders, packing list ---------- */

/** The reminder choices in months before the end (0 = no reminder); D3/D4: 6 months by default. */
export const REMIND_MONTHS = [0, 1, 3, 6, 12];
export const DEFAULT_REMIND = 6;
/** The group whose papers make the one row «ID and cash with you?» in the packing list. */
export const ID_GROUP = 'IDs';

/** 'YYYY-MM' of a row's «valid until», or null. */
export const untilOf = (d) => (typeof d?.until === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(d.until) ? d.until : null);
const remindOf = (d) => (Number.isFinite(d?.remind) ? Math.max(0, d.remind) : DEFAULT_REMIND);
const monthIndex = (ym) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
const ymOf = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;

/**
 * How it stands with a document's «valid until» on a day (YYYY-MM-DD):
 * { until, left (whole months from this month to the until month), remindFrom ('YYYY-MM', or null
 *   without reminder), soon (inside the reminder time), over (the month is past) } or null without a date.
 */
export function expiry(d, today) {
  const until = untilOf(d);
  if (!until) return null;
  const now = monthIndex(today.slice(0, 7));
  const end = monthIndex(until);
  const r = remindOf(d);
  const remindFrom = r ? ymOf(end - r) : null;
  const over = now > end;
  return { until, left: end - now, remindFrom, soon: !over && !!r && now >= end - r, over };
}

/** The documents with a «valid until», the soonest first, each with its expiry. */
export function reminderRows(list, today) {
  return (list ?? [])
    .map((d) => ({ doc: d, ex: expiry(d, today) }))
    .filter((x) => x.ex)
    .sort((a, b) => a.ex.until.localeCompare(b.ex.until) || String(a.doc.name ?? '').localeCompare(String(b.doc.name ?? '')));
}

/** How many documents need you now (inside the reminder time, or over). */
export const dueCount = (list, today) => reminderRows(list, today).filter((x) => x.ex.soon || x.ex.over).length;

/**
 * The rows for the packing list of a trip (D3 «Für die nächste Reise», D4 «In die Packliste»):
 * the papers of the group «IDs» together as one row «ID and cash with you?» (linked to the first),
 * every other paper marked for the packing list as «{name} with you?». English keys for t().
 * Returns [{ key, label, name?, doc }].
 */
export function packRows(list) {
  const marked = (list ?? []).filter((d) => d.inPack);
  const ids = marked.filter((d) => groupOf(d) === ID_GROUP);
  const rest = sortDocs(marked.filter((d) => groupOf(d) !== ID_GROUP), 'name');
  return [...(ids.length ? [{ key: 'ids', label: 'ID and cash with you?', doc: sortDocs(ids, 'name')[0] }] : []), ...rest.map((d) => ({ key: d.id, label: '{name} with you?', name: d.name, doc: d }))];
}
