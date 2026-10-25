/**
 * Paket B «QR an der Kiste» (Noah 24.10.2026 «2a»): labels for boxes, shelves and bags at home. Each
 * box has a name, a place and its contents (gear items and free lines). The QR code on the printed
 * label opens #/me/tools/labels?box=<id> in the app: what is inside, without opening the box.
 * Kept in settings 'labels' = [{ id, name, place, itemIds: [], lines: [] }] (backup and sync include it).
 * Pure, tested in tests/labels.test.js.
 */
export const LABELS_KEY = 'labels';
export const LABELS_HASH = '#/me/tools/labels';

const uid = () => `box-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const clean = (s) => String(s ?? '').trim();

/** The boxes made safe (unknown fields dropped, every box with an id and a name). */
export function boxesOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((b) => b && b.id && clean(b.name))
    .map((b) => ({ id: b.id, name: clean(b.name), place: clean(b.place), itemIds: Array.isArray(b.itemIds) ? b.itemIds.filter(Boolean) : [], lines: Array.isArray(b.lines) ? b.lines.map(clean).filter(Boolean) : [] }));
}

export function newBox({ name, place = '' }, id = uid()) {
  const nm = clean(name);
  return nm ? { id, name: nm, place: clean(place), itemIds: [], lines: [] } : null;
}

/** One box changed by fn; the others stay. */
export const changeBox = (boxes, id, fn) => boxes.map((b) => (b.id === id ? fn(b) : b));

export const addItem = (box, itemId) => (box.itemIds.includes(itemId) ? box : { ...box, itemIds: [...box.itemIds, itemId] });
export const dropItem = (box, itemId) => ({ ...box, itemIds: box.itemIds.filter((x) => x !== itemId) });
export const addLine = (box, line) => (clean(line) ? { ...box, lines: [...box.lines, clean(line)] } : box);
export const dropLine = (box, i) => ({ ...box, lines: box.lines.filter((_, k) => k !== i) });

/** Move a box from place `from` to place `to` (arrows and drag). */
export function moveBox(boxes, from, to) {
  if (to < 0 || to >= boxes.length || from === to) return boxes;
  const next = [...boxes];
  const [b] = next.splice(from, 1);
  next.splice(to, 0, b);
  return next;
}

/** The address the QR code opens: this app (wherever it runs) at the box. */
export function boxUrl(base, id) {
  return `${String(base).replace(/[#?].*$/, '')}${LABELS_HASH}?box=${encodeURIComponent(id)}`;
}

/** The box asked for in the address (#/me/tools/labels?box=<id>), or ''. */
export function boxFromHash(hash) {
  const q = String(hash ?? '').split('?')[1] ?? '';
  return new URLSearchParams(q).get('box') ?? '';
}

/** The boxes that hold an item (for «Where is it?»). */
export const boxesWith = (boxes, itemId) => boxes.filter((b) => b.itemIds.includes(itemId));

/** Search: boxes whose name, place, lines or item names contain the words. */
export function findBoxes(boxes, q, nameOfId = () => '') {
  const words = clean(q).toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return boxes;
  return boxes.filter((b) => {
    const hay = [b.name, b.place, ...b.lines, ...b.itemIds.map(nameOfId)].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * The page with the labels to print, in a window of its own: two columns, each label with the QR code
 * (svg markup), the big name, the place and «Scan: …». Black on white on paper, so plain colours here.
 */
export function printHtml(boxes, svgOf = () => '', texts = {}) {
  const cards = boxes.map((b) => `<div class="l"><div class="q">${svgOf(b.id) ?? ''}</div><div><b>${esc(b.name)}</b><small>${esc(b.place)}</small><i>${esc(texts.scan ?? '')}</i></div></div>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>${esc(texts.title ?? '')}</title><style>body{font:14px system-ui,sans-serif;margin:12mm}.g{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.l{display:flex;gap:4mm;align-items:center;border:1px dashed #999;padding:4mm;break-inside:avoid}.q{width:32mm;flex:none}.q svg{width:100%;height:auto}b{display:block;font-size:20px}small{display:block;color:#444}i{display:block;margin-top:2mm;font-size:11px;color:#666}</style><div class="g">${cards}</div>`;
}
