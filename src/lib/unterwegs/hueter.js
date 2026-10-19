/**
 * Paket 4 «Wohnungs-Hüter-Liste» (Noah 19.10.2026 «1a»): what the person who looks after your flat should
 * do (plants, letterbox, key …), with a short note. You share it only as a link or a QR code: the list
 * travels inside the link (#/share/hueter/<code>), nothing goes to a server, and the page that opens the link
 * only reads it. Stored in db.settings 'hueter' = { items: [{ id, key?, text? }], note }.
 */
export const KEEPER_KEY = 'hueter';
export const KEEPER_START = ['Water the plants', 'Empty the letterbox', 'Air the flat now and then', 'Check that the windows are closed'];
/** Links longer than this make a dense QR code that older phones struggle to read. */
export const KEEPER_MAX = 1800;

const clean = (s, n = 160) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export function keeperOf(v) {
  const items = Array.isArray(v?.items)
    ? v.items.filter((x) => x && x.id && (clean(x.text) || clean(x.key))).map((x) => (clean(x.text) ? { id: String(x.id), text: clean(x.text) } : { id: String(x.id), key: clean(x.key) }))
    : KEEPER_START.map((key, i) => ({ id: `ks-${i}`, key }));
  return { items, note: clean(v?.note, 400) };
}
export const keeperLabel = (x, tr = (s) => s) => (x.text ? x.text : tr(x.key));
export function addKeeper(state, text, id = `kh-${Date.now().toString(36)}`) {
  const t = clean(text);
  return t ? { ...state, items: [...state.items, { id, text: t }] } : null;
}
export const renameKeeper = (state, id, text) => (clean(text) ? { ...state, items: state.items.map((x) => (x.id === id ? { id: x.id, text: clean(text) } : x)) } : state);
export const dropKeeper = (state, id) => ({ ...state, items: state.items.filter((x) => x.id !== id) });
export function moveKeeper(state, from, to) {
  if (from === to || from < 0 || to < 0 || from >= state.items.length || to >= state.items.length) return state;
  const items = [...state.items];
  const [x] = items.splice(from, 1);
  items.splice(to, 0, x);
  return { ...state, items };
}
export const keeperValue = (state) => ({ items: state.items.map((x) => (x.text ? { id: x.id, text: x.text } : { id: x.id, key: x.key })), note: state.note });

/* ---------- the link: the list as base64url of UTF-8 JSON { v, l: [lines], n, f, u } ---------- */
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

/** The code for the link: the lines as shown (already translated), the note, from and until (dates). */
export function keeperCode({ lines = [], note = '', from = '', until = '' }) {
  const body = { v: 1, l: lines.map((x) => clean(x)).filter(Boolean).slice(0, 40) };
  if (clean(note)) body.n = clean(note, 400);
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) body.f = from;
  if (/^\d{4}-\d{2}-\d{2}$/.test(until)) body.u = until;
  return b64url(new TextEncoder().encode(JSON.stringify(body)));
}
/** The list back from a code, or null when the code is broken. */
export function readKeeper(code) {
  try {
    const o = JSON.parse(new TextDecoder().decode(unb64url(String(code ?? ''))));
    if (o?.v !== 1 || !Array.isArray(o.l)) return null;
    return { lines: o.l.map((x) => clean(x)).filter(Boolean).slice(0, 40), note: clean(o.n, 400), from: typeof o.f === 'string' ? o.f : '', until: typeof o.u === 'string' ? o.u : '' };
  } catch {
    return null;
  }
}
/** The whole link, from the app's own address (base: origin + path, e.g. https://…/packgenerator/). */
export const keeperUrl = (base, code) => `${String(base).replace(/#.*$/, '')}#/share/hueter/${code}`;
