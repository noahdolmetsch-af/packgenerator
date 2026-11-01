/**
 * Mini-Tools «Fair auslosen» (Noah 28.10.2026, idea 9): who cooks, who rides in front in the wind, who sleeps in
 * which tent. Without a server and without sharing: everything stays on this device (db.settings «mini-lose»).
 * Fair: whoever was drawn less often for this draw comes first; ties are random. Groups avoid the pairs of last time.
 * Pure, tested in tests/mini-los.test.js (rnd: a random function, so the tests can fix it).
 *
 *   'mini-lose'  [{ id, title, mode: 'one'|'order'|'groups', size, people: [{ id, name }],
 *                   history: [{ id, at, pick: [ids] | order: [ids] | groups: [[ids]] }] }]
 */
export const LOS_KEY = 'mini-lose';
export const MODES = [
  { key: 'one', label: 'One person', hint: 'e.g. who cooks today' },
  { key: 'order', label: 'An order', hint: 'e.g. who rides in front, one after the other' },
  { key: 'groups', label: 'Groups', hint: 'e.g. who sleeps in which tent' },
];
const MODE_KEYS = new Set(MODES.map((m) => m.key));
export const PEOPLE_MAX = 30;
export const HISTORY_MAX = 50;
/** Ready draws to start from (English keys for t()). */
export const STARTS = [
  { title: 'Who cooks?', mode: 'one' },
  { title: 'Who rides in front?', mode: 'order' },
  { title: 'Who sleeps in which tent?', mode: 'groups', size: 2 },
];

const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const listOf = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string') : []);

/** An id not yet in `taken` (a list of ids); the clock alone can repeat (a frozen clock, two taps in the same ms). */
export function freshId(prefix, taken = []) {
  const seen = new Set(taken);
  let id = `${prefix}-${Date.now().toString(36)}`;
  for (let n = 2; seen.has(id); n++) id = `${prefix}-${Date.now().toString(36)}-${n}`;
  return id;
}

/** A new draw. */
export function newDraw({ title, mode = 'one', size = 2, people = [] }, id = freshId('los')) {
  return {
    id,
    title: clip(title, 60),
    mode: MODE_KEYS.has(mode) ? mode : 'one',
    size: Math.min(10, Math.max(2, Math.round(Number(size)) || 2)),
    people: people.map((p, i) => ({ id: p.id ?? `p${i + 1}`, name: clip(p.name, 40) })).filter((p) => p.name).slice(0, PEOPLE_MAX),
    history: [],
  };
}

/** How often each person was drawn (one: picked; order: first; groups: not counted) → { id: n }. */
export function countsOf(draw) {
  const c = Object.fromEntries(draw.people.map((p) => [p.id, 0]));
  for (const h of draw.history ?? []) {
    const first = h.pick?.[0] ?? h.order?.[0];
    if (first && first in c) c[first] += 1;
  }
  return c;
}

function shuffle(list, rnd) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fair order: fewest times first, random among equals. ids of people taking part. */
export function fairOrder(draw, ids, rnd = Math.random) {
  const c = countsOf(draw);
  return shuffle(ids, rnd).sort((x, y) => (c[x] ?? 0) - (c[y] ?? 0));
}

const pairsOf = (groups) => {
  const s = new Set();
  for (const g of groups) for (const a of g) for (const b of g) if (a < b) s.add(`${a}|${b}`);
  return s;
};
/** Groups of `size` (the last may be smaller); tries a few times to repeat as few pairs of the last draw as possible. */
export function makeGroups(draw, ids, rnd = Math.random) {
  const last = [...(draw.history ?? [])].reverse().find((h) => h.groups);
  const before = last ? pairsOf(last.groups) : new Set();
  let best = null;
  let bestScore = Infinity;
  for (let t = 0; t < 40; t++) {
    const a = shuffle(ids, rnd);
    const groups = [];
    for (let i = 0; i < a.length; i += draw.size) groups.push(a.slice(i, i + draw.size));
    // a last group of one joins the one before
    if (groups.length > 1 && groups.at(-1).length === 1) groups.at(-2).push(...groups.pop());
    const score = [...pairsOf(groups)].filter((p) => before.has(p)).length;
    if (score < bestScore) {
      best = groups;
      bestScore = score;
      if (!score) break;
    }
  }
  return best ?? [];
}

/** Draw now among `ids` (default: everybody) → a history entry. */
export function drawNow(draw, ids = draw.people.map((p) => p.id), rnd = Math.random, at = new Date().toISOString()) {
  const id = `h-${Date.parse(at).toString(36)}-${Math.floor(rnd() * 1e6).toString(36)}`;
  if (draw.mode === 'groups') return { id, at, groups: makeGroups(draw, ids, rnd) };
  const order = fairOrder(draw, ids, rnd);
  return draw.mode === 'one' ? { id, at, pick: order.slice(0, 1) } : { id, at, order };
}

/** The draw with one more entry (newest first in the view; kept oldest first, at most HISTORY_MAX). */
export const withEntry = (draw, h) => ({ ...draw, history: [...(draw.history ?? []), h].slice(-HISTORY_MAX) });

/** Names for ids (removed people: «?»). */
export const namesOf = (draw, ids) => ids.map((id) => draw.people.find((p) => p.id === id)?.name ?? '?');

/** A result as text. T: the app's t(). */
export function resultText(draw, h, T) {
  if (h.pick) return `${draw.title}: ${namesOf(draw, h.pick)[0]}`;
  if (h.order) return [draw.title, ...namesOf(draw, h.order).map((n, i) => `${i + 1}. ${n}`)].join('\n');
  return [draw.title, ...h.groups.map((g, i) => `${T('Group {n}', { n: i + 1 })}: ${namesOf(draw, g).join(', ')}`)].join('\n');
}
