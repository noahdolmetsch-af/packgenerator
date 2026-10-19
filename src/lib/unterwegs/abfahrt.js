/**
 * Paket K #87 «Blatt Vor der Abfahrt» (Noah 19.10.2026 «5a und b»): one page for the tour day with
 * what you need at hand, offline in the app and as a PDF to print: the tour (day, start, km, metres up,
 * the line of the route), tickets and papers (Dokumente), emergency numbers and your own emergency
 * contacts, the way home. Pure functions, tested in tests/unterwegs-abfahrt.test.js.
 */
export const CONTACTS_KEY = 'notfall';

/** Swiss emergency numbers (label: English key for t()). */
export const EMERGENCY = [
  { nr: '144', label: 'Ambulance' },
  { nr: '1414', label: 'Rega (air rescue)' },
  { nr: '117', label: 'Police' },
  { nr: '118', label: 'Fire brigade' },
  { nr: '112', label: 'Europe-wide emergency' },
  { nr: '145', label: 'Poisoning (Tox Info)' },
];

/** Groups of Dokumente that belong on the sheet, besides every paper marked «in the packing list». */
export const SHEET_GROUPS = ['Travel', 'Insurance and emergency', 'IDs'];

/** The papers for the sheet: marked for the packing list, in a travel or emergency group, or picked for this trip. */
export function sheetDocs(docs = [], picked = []) {
  const want = new Set(picked ?? []);
  return docs.filter((d) => d && (d.inPack || SHEET_GROUPS.includes(String(d.group ?? '').trim()) || want.has(d.id))).sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
}

/* ---------- own emergency contacts (add, rename, delete; rule 18) ---------- */
const cleanPhone = (s) => String(s ?? '').replace(/[^\d+ ]/g, '').trim();
export function contactsOf(v) {
  return (Array.isArray(v?.contacts) ? v.contacts : []).map((c) => (c && String(c.name ?? '').trim() && cleanPhone(c.phone) ? { id: String(c.id ?? c.phone), name: String(c.name).trim(), phone: cleanPhone(c.phone) } : null)).filter(Boolean);
}
export function addContact(list, { name, phone }, id = `nc-${Date.now().toString(36)}`) {
  if (!String(name ?? '').trim() || !cleanPhone(phone)) return null;
  return [...list, { id, name: String(name).trim(), phone: cleanPhone(phone) }];
}
export const editContact = (list, id, { name, phone }) => list.map((c) => (c.id === id ? { ...c, name: String(name ?? '').trim() || c.name, phone: cleanPhone(phone) || c.phone } : c));
export const dropContact = (list, id) => list.filter((c) => c.id !== id);
export const telHref = (nr) => `tel:${String(nr).replace(/\s+/g, '')}`;

/**
 * The route line as an SVG path in a box (w × h, with padding), north up, the same scale both ways.
 * line: [[lat, lon]] → { d, start: [x, y], end: [x, y] } or null.
 */
export function routePath(line, w = 300, h = 160, pad = 10) {
  const pts = (line ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return null;
  const k = Math.cos(((pts.reduce((s, p) => s + p[0], 0) / pts.length) * Math.PI) / 180);
  const xs = pts.map((p) => p[1] * k);
  const ys = pts.map((p) => -p[0]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((w - 2 * pad) / (x1 - x0 || 1e-9), (h - 2 * pad) / (y1 - y0 || 1e-9));
  const ox = (w - (x1 - x0) * s) / 2;
  const oy = (h - (y1 - y0) * s) / 2;
  const xy = pts.map((_, i) => [Math.round((ox + (xs[i] - x0) * s) * 10) / 10, Math.round((oy + (ys[i] - y0) * s) * 10) / 10]);
  return { d: xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '), start: xy[0], end: xy.at(-1), points: xy };
}
