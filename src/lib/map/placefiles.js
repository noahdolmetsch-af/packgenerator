/**
 * «Weitere Quellen» › own places from a file (Noah 20.10.2026 «2a+b»): the places of a GPX (waypoints
 * <wpt>), a KML (Placemarks with a Point, e.g. a Google My Maps export; also inside a KMZ) or a CSV
 * (columns found by their header: lat / latitude / breite, lon / lng / longitude / länge, name / title,
 * category / kategorie, note / description; or a WKT column «POINT (lon lat)»). They become your own
 * points (ownpoints.js) with the file name as their source, so a whole file can be removed at once.
 *
 * Pure (no browser) except kmzText, which needs DecompressionStream (browsers, Node 18+). Names in the
 * files are kept as they are and never go through t(). Tested in tests/placefiles.test.js.
 */
import { parseWaypoints, kindOfWpt } from '../race/files.js';
import { srcOf } from './ownpoints.js';

export const MAX_FILE_PLACES = 2000;
export const MAX_FILE_MB = 5;

const decode = (s) =>
  String(s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const okPos = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
const cut = (s, n) => String(s ?? '').trim().slice(0, n);

/** The kind of an own point from words (a category, a symbol, a name), or null. */
export function ownKindOf(text) {
  const s = String(text ?? '').toLowerCase();
  if (!s.trim()) return null;
  if (/gefahr|danger|achtung|warn|vorsicht|attention/.test(s)) return 'danger';
  if (/wasser|water|brunnen|fountain|fontaine|drinking|trinken/.test(s)) return 'water';
  if (/hotel|sleep|schlaf|camping|camp|zelt|tent|hostel|herberge|unterkunft|lodging|pension|bed|bett|hütte|huette/.test(s)) return 'sleep';
  if (/aussicht|view|panorama|scenic|lookout/.test(s)) return 'view';
  if (/food|essen|restaurant|caf(e|é)|bistro|shop|laden|einkauf|supermar|b(a|ä)cker|bakery|verpflegung|kiosk|beiz|gasthaus|gasthof|pizz|imbiss/.test(s)) return 'food';
  return null;
}

/** GPX waypoints → [{ name, lat, lon, kind, note }]. Throws 'not-gpx'. */
export function gpxPlaces(text) {
  return parseWaypoints(text).map((w) => {
    const k = kindOfWpt(w);
    const kind = { water: 'water', food: 'food', shop: 'food', sleep: 'sleep' }[k] ?? ownKindOf(`${w.sym} ${w.name}`) ?? 'note';
    return { name: cut(w.name, 120), lat: w.lat, lon: w.lon, kind, note: cut(decode(w.desc), 1000) };
  });
}

/** KML Placemarks with a Point → [{ name, lat, lon, kind, note }] (the folder name counts as category). → { places, skipped } */
export function kmlPlaces(text) {
  const src = String(text ?? '');
  if (!/<kml[\s>]/i.test(src) && !/<Placemark[\s>]/i.test(src)) throw new Error('not-kml');
  const places = [];
  let skipped = 0;
  const folders = [];
  const tokens = /<Folder\b[^>]*>|<\/Folder>|<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi;
  for (const m of src.matchAll(tokens)) {
    const tok = m[0];
    if (/^<Folder/i.test(tok)) {
      const rest = src.slice(m.index + tok.length);
      const stop = rest.search(/<(Placemark|Folder)\b/i);
      const head = stop < 0 ? rest : rest.slice(0, stop);
      folders.push(decode(head.match(/<name>([\s\S]*?)<\/name>/i)?.[1] ?? ''));
      continue;
    }
    if (/^<\/Folder/i.test(tok)) {
      folders.pop();
      continue;
    }
    const body = m[1];
    const pt = body.match(/<Point\b[^>]*>[\s\S]*?<coordinates>\s*([^<]+?)\s*<\/coordinates>/i);
    const [lon, lat] = (pt?.[1] ?? '').split(/[\s,]+/).map(Number);
    if (!pt || !okPos(lat, lon)) {
      skipped++;
      continue;
    }
    const name = decode(body.match(/<name>([\s\S]*?)<\/name>/i)?.[1] ?? '');
    const note = decode(body.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? '');
    const folder = folders.at(-1) ?? '';
    places.push({ name: cut(name, 120), lat, lon, kind: ownKindOf(folder) ?? ownKindOf(name) ?? 'note', note: cut([folder && !ownKindOf(folder) ? folder : '', note].filter(Boolean).join(' · '), 1000) });
  }
  return { places, skipped };
}

/** CSV text → rows of fields (quotes, «;», «,» or tab, whatever the header line uses most). */
export function csvRows(text) {
  const src = String(text ?? '').replace(/^﻿/, '');
  const first = src.split(/\r?\n/, 1)[0] ?? '';
  const outside = first.replace(/"[^"]*"/g, '');
  const sep = [';', '\t', ','].map((c) => [c, outside.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') {
        f += '"';
        i++;
      } else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === sep) {
      row.push(f);
      f = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(f);
      rows.push(row);
      row = [];
      f = '';
    } else f += c;
  }
  if (f || row.length) {
    row.push(f);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const HEAD = {
  lat: /^(lat|latitude|breite|breitengrad)$/,
  lon: /^(lon|lng|long|longitude|länge|laenge|längengrad|laengengrad)$/,
  name: /^(name|title|titel|bezeichnung)$/,
  cat: /^(category|kategorie|kind|type|typ|art)$/,
  note: /^(note|notes|notiz|description|beschreibung|desc|comment|kommentar)$/,
  wkt: /^(wkt|geometry|geometrie)$/,
};
/** The columns of a CSV header: { lat, lon, name, cat, note, wkt } (index or -1). */
export function csvColumns(header = []) {
  const h = header.map((x) => String(x).trim().toLowerCase().replace(/^"|"$/g, ''));
  return Object.fromEntries(Object.entries(HEAD).map(([k, rx]) => [k, h.findIndex((x) => rx.test(x))]));
}
const numOf = (v) => {
  const s = String(v ?? '').trim();
  return s ? Number(/^-?\d+,\d+$/.test(s) ? s.replace(',', '.') : s) : NaN;
};

/** CSV → { places, skipped }. Throws 'no-position' when no lat/lon (or WKT) column is found. */
export function csvPlaces(text) {
  const [header = [], ...rows] = csvRows(text);
  const c = csvColumns(header);
  if ((c.lat < 0 || c.lon < 0) && c.wkt < 0) throw new Error('no-position');
  const places = [];
  let skipped = 0;
  for (const r of rows) {
    let lat = c.lat >= 0 ? numOf(r[c.lat]) : NaN;
    let lon = c.lon >= 0 ? numOf(r[c.lon]) : NaN;
    if (!okPos(lat, lon) && c.wkt >= 0) {
      const m = String(r[c.wkt] ?? '').match(/POINT\s*Z?\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)/i);
      if (m) [lon, lat] = [Number(m[1]), Number(m[2])];
    }
    if (!okPos(lat, lon)) {
      skipped++;
      continue;
    }
    const name = c.name >= 0 ? r[c.name] : '';
    const cat = c.cat >= 0 ? cut(r[c.cat], 60) : '';
    const note = c.note >= 0 ? r[c.note] : '';
    const kind = ownKindOf(cat) ?? ownKindOf(name) ?? 'note';
    places.push({ name: cut(name, 120), lat, lon, kind, note: cut([cat && !ownKindOf(cat) ? cat : '', decode(note)].filter(Boolean).join(' · '), 1000) });
  }
  return { places, skipped };
}

/** What kind of file: 'gpx' | 'kml' | 'kmz' | 'csv' | null (from the name, else the content). */
export function fileKind(name = '', text = '') {
  const ext = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  if (ext === 'kmz' || String(text).startsWith('PK')) return 'kmz';
  if (ext === 'gpx' || /<gpx[\s>]/i.test(text)) return 'gpx';
  if (ext === 'kml' || /<kml[\s>]/i.test(text)) return 'kml';
  if (ext === 'csv' || ext === 'txt' || ext === 'tsv') return 'csv';
  return null;
}

/**
 * The places of a file's text → { places (at most MAX_FILE_PLACES), kind, skipped, cut, error }.
 * error: 'unknown' (not GPX, KML or CSV) | 'broken' | 'no-position' (CSV without lat/lon) | 'empty'.
 */
export function placesFromFile(name, text) {
  const kind = fileKind(name, text);
  const out = (o) => ({ places: [], kind, skipped: 0, cut: false, error: null, ...o });
  if (!kind || kind === 'kmz') return out({ error: 'unknown' });
  let r;
  try {
    if (kind === 'gpx') r = { places: gpxPlaces(text), skipped: 0 };
    else if (kind === 'kml') r = kmlPlaces(text);
    else r = csvPlaces(text);
  } catch (err) {
    return out({ error: err?.message === 'no-position' ? 'no-position' : 'broken' });
  }
  if (!r.places.length) return out({ skipped: r.skipped, error: 'empty' });
  return out({ places: r.places.slice(0, MAX_FILE_PLACES), skipped: r.skipped, cut: r.places.length > MAX_FILE_PLACES });
}

/** The places as own points of the source `src` (ids unique even for thousands at once). */
export function importPoints(places, src, now = new Date()) {
  const s = srcOf(src);
  const stamp = now.getTime().toString(36);
  return places.map((p, i) => ({
    id: `op${stamp}${i.toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    lat: Math.round(Number(p.lat) * 1e5) / 1e5,
    lon: Math.round(Number(p.lon) * 1e5) / 1e5,
    name: cut(p.name, 120),
    note: cut(p.note, 1000),
    kind: p.kind || 'note',
    createdAt: now.toISOString(),
    ...(s ? { src: s } : {}),
  }));
}

/**
 * The first .kml file inside a KMZ (a zip) as text, or '' when there is none. Reads the zip's central
 * directory; stored and deflated entries (DecompressionStream 'deflate-raw').
 */
export async function kmzText(buf) {
  const b = new Uint8Array(buf);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let end = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) return '';
  const count = dv.getUint16(end + 10, true);
  let at = dv.getUint32(end + 16, true);
  const dec = new TextDecoder();
  for (let n = 0; n < count && at + 46 <= b.length; n++) {
    if (dv.getUint32(at, true) !== 0x02014b50) break;
    const method = dv.getUint16(at + 10, true);
    const size = dv.getUint32(at + 20, true);
    const nameLen = dv.getUint16(at + 28, true);
    const extraLen = dv.getUint16(at + 30, true);
    const commentLen = dv.getUint16(at + 32, true);
    const local = dv.getUint32(at + 42, true);
    const name = dec.decode(b.subarray(at + 46, at + 46 + nameLen));
    at += 46 + nameLen + extraLen + commentLen;
    if (!/\.kml$/i.test(name) || dv.getUint32(local, true) !== 0x04034b50) continue;
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    const data = b.subarray(start, start + size);
    if (method === 0) return dec.decode(data);
    if (method !== 8 || typeof DecompressionStream === 'undefined') return '';
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return dec.decode(await new Response(stream).arrayBuffer());
  }
  return '';
}
