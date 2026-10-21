/**
 * Paket NE «Notizen wie Evernote», part 1146 (Noah 20.10.2026 «1b 2b … 3 beides 4b und a 5a einstellbar»):
 * drawing on every photo and on a pad of one or more pages.
 *
 * An ink is the editable drawing (vector data); the app also keeps a flat picture (JPEG) of each page, so
 * every place that shows photos keeps working without knowing about drawings.
 *
 *   ink = { v: 1, id, base: dataURL | null, w, h, paper: 'plain' | 'squared' | 'lined', pages: [[item]] }
 *   item = { t: 'pen' | 'hi' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text', c: colour, s: size,
 *            p: [[x, y, pressure]] (pen, hi) | a: [x, y], b: [x, y] (shapes) | a, text (text) }
 *
 * A record keeps its inks in a map from a short hash of the flat picture to the ink (inks), so photos can
 * be reordered or removed without losing the drawing of the others. A pad of several pages has one entry
 * per page, each with the whole ink and `at` (its page).
 * Pure functions apart from paint(), which draws on any 2D canvas context.
 */

export const TOOLS = [
  { key: 'pen', name: 'Pen' },
  { key: 'hi', name: 'Highlighter' },
  { key: 'line', name: 'Line|draw' },
  { key: 'arrow', name: 'Arrow' },
  { key: 'rect', name: 'Rectangle' },
  { key: 'ellipse', name: 'Circle|draw' },
  { key: 'text', name: 'Text|draw' },
  { key: 'erase', name: 'Eraser' },
  { key: 'select', name: 'Move|draw' },
];
export const COLORS = ['#1d2a24', '#ffffff', '#d62f2f', '#f28a00', '#f2c200', '#2e9b57', '#2f6fd6', '#8a3fd1'];
export const COLOR_NAMES = ['Black', 'White', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
export const SIZES = [3, 6, 12, 22];
export const PAPERS = [
  { key: 'plain', name: 'Blank|paper' },
  { key: 'squared', name: 'Squared' },
  { key: 'lined', name: 'Lined' },
];
/** A page of the pad: about A4 upright. */
export const PAD_W = 1000;
export const PAD_H = 1400;
/** Longest side of a photo to draw on. */
export const BASE_MAX = 1600;
export const MAX_PAGES = 30;

/** A new ink: on a photo (base, w, h) or a pad (paper, one page). */
export function newInk({ base = null, w = PAD_W, h = PAD_H, paper = 'plain', id = `ink-${Date.now().toString(36)}` } = {}) {
  return { v: 1, id, base, w: Math.round(w), h: Math.round(h), paper: base ? 'plain' : paper, pages: [[]] };
}

/** A short, stable hash of a picture (its data URL), as the key of the inks map (FNV-1a, 32 bit). */
export function hashSrc(src = '') {
  const s = String(src);
  let h = 0x811c9dc5;
  // Long data URLs: every 7th character and the length are enough to tell two pictures apart.
  const step = s.length > 20000 ? 7 : 1;
  for (let i = 0; i < s.length; i += step) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(36)}${s.length.toString(36)}`;
}

/** The ink behind a picture, or null: { ink, at }. */
export function inkFor(map, src) {
  const e = map?.[hashSrc(src)];
  return e?.ink ? { ink: e.ink, at: e.at ?? 0 } : null;
}

/**
 * The inks map after a drawing was saved: the entries of the old pictures go, one entry per new flat
 * picture comes (at = its page).
 */
export function withInk(map = {}, oldSrcs = [], flats = [], ink) {
  const out = { ...(map ?? {}) };
  for (const s of oldSrcs) if (s) delete out[hashSrc(s)];
  flats.forEach((f, at) => (out[hashSrc(f)] = { ink, at }));
  return out;
}

/** Only the entries of pictures that are still there (after a photo was removed). */
export function pruneInks(map = {}, srcs = []) {
  const keep = new Set(srcs.filter(Boolean).map(hashSrc));
  const out = Object.fromEntries(Object.entries(map ?? {}).filter(([k]) => keep.has(k)));
  return Object.keys(out).length ? out : undefined;
}

/**
 * A list of pictures after a drawing was saved: the pictures of the same ink (a pad) are replaced by the
 * new flat pages at the place of the first one; a picture not drawn yet is replaced by the flat page.
 */
export function replaceFlats(list = [], oldSrcs = [], flats = []) {
  const old = new Set(oldSrcs.filter(Boolean));
  const first = list.findIndex((s) => old.has(s));
  const rest = list.filter((s) => !old.has(s));
  if (first < 0) return [...rest, ...flats];
  const at = list.slice(0, first).filter((s) => !old.has(s)).length;
  return [...rest.slice(0, at), ...flats, ...rest.slice(at)];
}

/** A record's photo list and inks after one photo (old) was drawn on: → { list, inks }. */
export function drawnOn(list = [], inks, old, flat, ink) {
  const next = list.map((s) => (s === old ? flat : s));
  return { list: next, inks: pruneInks(withInk(inks, [old], [flat], ink), next) };
}

/** The pictures of a list that belong to the same ink as `src` (all pages of a pad), in page order. */
export function flatsOf(map, list = [], src) {
  const me = inkFor(map, src);
  if (!me) return [src];
  return list
    .map((s) => ({ s, e: inkFor(map, s) }))
    .filter((x) => x.e?.ink?.id === me.ink.id)
    .sort((a, b) => a.e.at - b.e.at)
    .map((x) => x.s);
}

/** Line width at a point: thicker with more pressure when «Pen pressure» is on (0.5 = no pressure). */
export function widthAt(size, pressure = 0.5, usePressure = true) {
  if (!usePressure) return size;
  const p = Number.isFinite(pressure) && pressure > 0 ? pressure : 0.5;
  return Math.max(1, size * (0.35 + 1.3 * p));
}

/** The pressure of a pointer event: a pen's own value; a finger or a mouse counts as 0.5. */
export const pressureOf = (e) => (e?.pointerType === 'pen' && e.pressure > 0 ? Math.round(e.pressure * 100) / 100 : 0.5);

/** The box around an item: { x, y, w, h }. */
export function bbox(it) {
  if (it.t === 'pen' || it.t === 'hi') {
    const xs = it.p.map((q) => q[0]);
    const ys = it.p.map((q) => q[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if (it.t === 'text') {
    const lines = String(it.text ?? '').split('\n');
    const fs = textSize(it.s);
    const w = Math.max(...lines.map((l) => l.length)) * fs * 0.56;
    return { x: it.a[0], y: it.a[1], w, h: lines.length * fs * 1.25 };
  }
  const [x1, y1] = it.a;
  const [x2, y2] = it.b;
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

/** Font size of a text item from the size step. */
export const textSize = (s) => Math.round(18 + s * 2.2);

const distSeg = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const k = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(px - (ax + k * dx), py - (ay + k * dy));
};

/** Does a point (x, y) touch an item (within tol)? Used by the eraser and the «Move» tool. */
export function hitItem(it, x, y, tol = 12) {
  const t = tol + (it.s ?? 0) / 2;
  if (it.t === 'pen' || it.t === 'hi') {
    if (it.p.length === 1) return Math.hypot(x - it.p[0][0], y - it.p[0][1]) <= t;
    for (let i = 1; i < it.p.length; i++) if (distSeg(x, y, it.p[i - 1], it.p[i]) <= t) return true;
    return false;
  }
  if (it.t === 'line' || it.t === 'arrow') return distSeg(x, y, it.a, it.b) <= t;
  const b = bbox(it);
  if (it.t === 'text') return x >= b.x - t && x <= b.x + b.w + t && y >= b.y - t && y <= b.y + b.h + t;
  if (it.t === 'rect') {
    const inX = x >= b.x - t && x <= b.x + b.w + t;
    const inY = y >= b.y - t && y <= b.y + b.h + t;
    const nearEdge = Math.abs(x - b.x) <= t || Math.abs(x - b.x - b.w) <= t || Math.abs(y - b.y) <= t || Math.abs(y - b.y - b.h) <= t;
    return inX && inY && nearEdge;
  }
  // ellipse: near its outline
  const rx = b.w / 2 || 1;
  const ry = b.h / 2 || 1;
  const cx = b.x + rx;
  const cy = b.y + ry;
  const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
  return Math.abs(d - 1) * Math.min(rx, ry) <= t;
}

/** The index of the top item at a point, or -1. */
export function itemAt(items = [], x, y, tol) {
  for (let i = items.length - 1; i >= 0; i--) if (hitItem(items[i], x, y, tol)) return i;
  return -1;
}

/** An item moved by (dx, dy). */
export function moveItem(it, dx, dy) {
  const mv = ([x, y, ...r]) => [x + dx, y + dy, ...r];
  if (it.p) return { ...it, p: it.p.map(mv) };
  return { ...it, a: mv(it.a), ...(it.b ? { b: mv(it.b) } : {}) };
}

/** The two points of an arrow head at b (pointing from a to b). */
export function arrowHead(a, b, size) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const len = Math.max(14, size * 3.2);
  return [-0.45, 0.45].map((d) => [b[0] - len * Math.cos(ang + d), b[1] - len * Math.sin(ang + d)]);
}

/** Pen points without the ones closer than 1.5 px to the last kept one (smaller data). */
export function thinPoints(p = []) {
  const r = (q) => q.map((v, i) => (i < 2 ? Math.round(v * 10) / 10 : v));
  const out = [];
  p.forEach((q, i) => {
    const l = out[out.length - 1];
    if (!l || i === p.length - 1 || Math.hypot(q[0] - l[0], q[1] - l[1]) >= 1.5) out.push(r(q));
  });
  return out;
}

/** Is a page empty (nothing drawn)? */
export const emptyInk = (ink) => !ink?.pages?.some((pg) => pg.length);

/* ---------- history (undo, redo) ---------- */

/** A history of the pages: { list: [pages], at }. */
export const history = (pages) => ({ list: [pages], at: 0 });
export function commit(h, pages) {
  const list = [...h.list.slice(0, h.at + 1), pages].slice(-60);
  return { list, at: list.length - 1 };
}
export const undo = (h) => (h.at > 0 ? { ...h, at: h.at - 1 } : h);
export const redo = (h) => (h.at < h.list.length - 1 ? { ...h, at: h.at + 1 } : h);
export const current = (h) => h.list[h.at];

/* ---------- painting ---------- */

/** The paper of a pad page: white with squares or lines. */
export function paintPaper(g, w, h, paper) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  if (paper === 'plain') return;
  g.save();
  g.strokeStyle = paper === 'squared' ? '#d7e0db' : '#c9d6e6';
  g.lineWidth = 1.5;
  g.beginPath();
  const step = paper === 'squared' ? 40 : 52;
  for (let y = paper === 'lined' ? 110 : step; y < h; y += step) (g.moveTo(0, y), g.lineTo(w, y));
  if (paper === 'squared') for (let x = step; x < w; x += step) (g.moveTo(x, 0), g.lineTo(x, h));
  g.stroke();
  if (paper === 'lined') {
    g.strokeStyle = '#ecbcbc';
    g.beginPath();
    g.moveTo(90, 0);
    g.lineTo(90, h);
    g.stroke();
  }
  g.restore();
}

/** One item on a 2D context. */
export function paintItem(g, it, { pressure = true } = {}) {
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = it.c;
  g.fillStyle = it.c;
  if (it.t === 'hi') {
    g.globalAlpha = 0.38;
    g.lineWidth = it.s * 3;
    g.lineCap = 'square';
    g.beginPath();
    it.p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (it.p.length === 1) g.lineTo(it.p[0][0] + 0.1, it.p[0][1]);
    g.stroke();
  } else if (it.t === 'pen') {
    const p = it.p;
    if (p.length === 1) {
      g.beginPath();
      g.arc(p[0][0], p[0][1], widthAt(it.s, p[0][2], pressure) / 2, 0, Math.PI * 2);
      g.fill();
    } else if (!pressure || p.every((q) => q[2] === p[0][2])) {
      g.lineWidth = widthAt(it.s, p[0][2], pressure);
      g.beginPath();
      p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    } else {
      for (let i = 1; i < p.length; i++) {
        g.lineWidth = widthAt(it.s, (p[i - 1][2] + p[i][2]) / 2, pressure);
        g.beginPath();
        g.moveTo(p[i - 1][0], p[i - 1][1]);
        g.lineTo(p[i][0], p[i][1]);
        g.stroke();
      }
    }
  } else if (it.t === 'text') {
    const fs = textSize(it.s);
    g.font = `600 ${fs}px Inter, system-ui, sans-serif`;
    g.textBaseline = 'top';
    String(it.text ?? '').split('\n').forEach((l, i) => {
      if (it.c === '#ffffff') {
        g.lineWidth = 4;
        g.strokeStyle = '#1d2a24';
        g.strokeText(l, it.a[0], it.a[1] + i * fs * 1.25);
      }
      g.fillText(l, it.a[0], it.a[1] + i * fs * 1.25);
    });
  } else {
    g.lineWidth = it.s;
    g.beginPath();
    if (it.t === 'line' || it.t === 'arrow') {
      g.moveTo(...it.a);
      g.lineTo(...it.b);
      if (it.t === 'arrow') {
        const [l, r] = arrowHead(it.a, it.b, it.s);
        g.moveTo(...l);
        g.lineTo(...it.b);
        g.lineTo(...r);
      }
    } else if (it.t === 'rect') {
      const b = bbox(it);
      g.rect(b.x, b.y, b.w, b.h);
    } else if (it.t === 'ellipse') {
      const b = bbox(it);
      g.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(1, b.w / 2), Math.max(1, b.h / 2), 0, 0, Math.PI * 2);
    }
    g.stroke();
  }
  g.restore();
}

/** A whole page: the photo or the paper, then the items. img: the loaded base photo (or null). */
export function paint(g, ink, page = 0, { img = null, pressure = true, extra = null, selected = -1 } = {}) {
  const { w, h } = ink;
  if (img) {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
  } else paintPaper(g, w, h, ink.paper);
  const items = ink.pages[page] ?? [];
  for (const it of items) paintItem(g, it, { pressure });
  if (extra) paintItem(g, extra, { pressure });
  if (selected >= 0 && items[selected]) {
    const b = bbox(items[selected]);
    g.save();
    g.setLineDash([10, 8]);
    g.lineWidth = 2;
    g.strokeStyle = '#2f6fd6';
    g.strokeRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
    g.restore();
  }
}
