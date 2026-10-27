/**
 * Gruppenfahrt für Events (Noah 26.10.2026 «1-5 alle», «6 auch für Rennen bauen 7 8 9», mockups
 * «1a 2b 3a 4a 5a»): what a group of new people at a bikepacking event or a race shares on top of the places.
 *
 * Everything travels sealed with the group key (group.js), the server cannot read it:
 * - the maker's plan (one field '~' of the group): night pause with own times, race mode with checkpoints,
 *   start time;
 * - every member's own part (with the place): ready / in camp, a help call, the things they carry or miss,
 *   the expenses they paid and the debts they settled, the meeting points they set, the checkpoints reached.
 * Each member changes only their own part; the board everyone sees is put together on each device.
 * The weather along the route is read straight from Open-Meteo (free) by every device for itself.
 *
 * Pure, tested in tests/groupevent.test.js.
 */
import { lineKm, pointAt, snap } from '../race/race.js';
import { thundery } from '../wetter/kern.js';
import { isIban, cleanIban } from '../pay/qrbill.js';

export const PLAN_V = 1;
/** How long an event group lives: 1, 3 or 7 days (the server's most is 7 days). */
export const EVENT_DAYS = [1, 3, 7];
export const NIGHT_DEFAULT = { from: '22:00', to: '06:00' };
/** A member this close to a checkpoint (km along the route) gets «Arrived at the checkpoint». */
export const CP_NEAR_KM = 1;
export const TEXT_MAX = 80;
export const ITEMS_MAX = 30;
export const COSTS_MAX = 30;
export const POINTS_MAX = 6;

const r5 = (v) => Math.round(v * 1e5) / 1e5;
const clean = (s, n = TEXT_MAX) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const isAt = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s));
const fin = Number.isFinite;
const newPart = () => Math.random().toString(36).slice(2, 8);
export { newPart };

/* ---------- the maker's plan ---------- */

/**
 * The plan → what is sealed: { v, nf, nt, r, cp: [[name, km]], st }.
 * plan: { night: { from, to } | null, race: bool, cps: [{ name, km }], start: 'HH:MM' | null }.
 */
export function planPayload(plan = {}) {
  const out = { v: PLAN_V };
  if (plan.night && isTime(plan.night.from) && isTime(plan.night.to)) {
    out.nf = plan.night.from;
    out.nt = plan.night.to;
  }
  if (plan.race) out.r = 1;
  const cps = (plan.cps ?? []).filter((c) => fin(Number(c?.km)) && Number(c.km) >= 0).slice(0, 30);
  if (cps.length) out.cp = cps.map((c) => [clean(c.name, 40), Math.round(Number(c.km) * 10) / 10]).sort((a, b) => a[1] - b[1]);
  if (isTime(plan.start)) out.st = plan.start;
  return out;
}

/** The opened plan (or the default when there is none). */
export function readPlan(obj) {
  if (!obj || obj.v !== PLAN_V) return { night: null, race: false, cps: [], start: null };
  return {
    night: isTime(obj.nf) && isTime(obj.nt) ? { from: obj.nf, to: obj.nt } : null,
    race: obj.r === 1,
    cps: Array.isArray(obj.cp) ? obj.cp.filter((c) => Array.isArray(c) && fin(c[1])).map((c) => ({ name: clean(c[0], 40), km: c[1] })) : [],
    start: isTime(obj.st) ? obj.st : null,
  };
}

/** The clock in Switzerland, 'HH:MM'. */
export const zurichTime = (ms) => new Date(ms).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zurich' });

/** Is it night pause now? (from > to goes over midnight, e.g. 22:00–06:00.) */
export function inNight(night, now = Date.now()) {
  if (!night || !isTime(night.from) || !isTime(night.to) || night.from === night.to) return false;
  const t = zurichTime(now);
  return night.from < night.to ? t >= night.from && t < night.to : t >= night.from || t < night.to;
}

/**
 * How often a member sends or reads (ms): more members, less often, so a big event stays under the free
 * server's daily cap (api/_lib/daycap.js, group 1500 calls; about 1000 per group over 16 waking hours).
 * At night (pause) every 15 minutes.
 */
export function everyMs(members = 1, { night = false } = {}) {
  if (night) return 15 * 60_000;
  const min = Math.ceil((Math.max(1, members) * 16 * 60) / 1000);
  return Math.min(20, Math.max(2, min)) * 60_000;
}

/* ---------- one member's own part ---------- */

/**
 * A member's own part → the short keys that go into the place payload (group.js placePayload).
 * part: { status: { kind: 'ready'|'camp', at }, help: { kind, text, at }, has: [], need: [],
 * costs: [{ id, what, cents, for: [mid] | null }], paid: [{ to, cents }], points: [{ id, kind, name, lat, lon, time }],
 * cps: { [index]: at } }.
 */
export function partPayload(part = {}) {
  const o = {};
  if (part.status && ['ready', 'camp'].includes(part.status.kind) && isAt(part.status.at)) o.s = [part.status.kind, part.status.at];
  if (part.help && isAt(part.help.at)) o.h = [clean(part.help.kind, 20), clean(part.help.text), part.help.at];
  const list = (a) => [...new Set((a ?? []).map((x) => clean(x, 40)).filter(Boolean))].slice(0, ITEMS_MAX);
  if (part.has?.length) o.hv = list(part.has);
  if (part.need?.length) o.nd = list(part.need);
  const costs = (part.costs ?? []).filter((c) => fin(c?.cents) && c.cents > 0).slice(0, COSTS_MAX);
  if (costs.length) o.c = costs.map((c) => [String(c.id ?? newPart()).slice(0, 8), clean(c.what, 40), Math.round(c.cents), Array.isArray(c.for) && c.for.length ? c.for.slice(0, 40) : 0]);
  const paid = (part.paid ?? []).filter((p) => p?.to && fin(p.cents) && p.cents > 0);
  if (paid.length) o.pd = paid.map((p) => [String(p.to), Math.round(p.cents)]);
  const pts = (part.points ?? []).filter((p) => fin(p?.lat) && fin(p?.lon)).slice(0, POINTS_MAX);
  if (pts.length) o.pt = pts.map((p) => [String(p.id ?? newPart()).slice(0, 8), ['meet', 'lunch', 'camp'].includes(p.kind) ? p.kind : 'meet', clean(p.name, 40), r5(p.lat), r5(p.lon), isTime(p.time) ? p.time : '']);
  const cps = Object.entries(part.cps ?? {}).filter(([i, at]) => /^\d+$/.test(i) && isAt(at));
  if (cps.length) o.cp = cps.map(([i, at]) => [Number(i), at]);
  return o;
}

/** The short keys of an opened place payload → a member's part (all fields there, empty when missing). */
export function readPart(obj = {}) {
  const arr = (a) => (Array.isArray(a) ? a : []);
  const s = arr(obj.s);
  const h = arr(obj.h);
  return {
    status: ['ready', 'camp'].includes(s[0]) && isAt(s[1]) ? { kind: s[0], at: s[1] } : null,
    help: isAt(h[2]) ? { kind: clean(h[0], 20), text: clean(h[1]), at: h[2] } : null,
    has: arr(obj.hv).map((x) => clean(x, 40)).filter(Boolean),
    need: arr(obj.nd).map((x) => clean(x, 40)).filter(Boolean),
    costs: arr(obj.c)
      .filter((c) => Array.isArray(c) && fin(c[2]) && c[2] > 0)
      .map((c) => ({ id: String(c[0]), what: clean(c[1], 40), cents: Math.round(c[2]), for: Array.isArray(c[3]) && c[3].length ? c[3].map(String) : null })),
    paid: arr(obj.pd).filter((p) => Array.isArray(p) && fin(p[1]) && p[1] > 0).map((p) => ({ to: String(p[0]), cents: Math.round(p[1]) })),
    points: arr(obj.pt)
      .filter((p) => Array.isArray(p) && fin(p[3]) && fin(p[4]))
      .map((p) => ({ id: String(p[0]), kind: ['meet', 'lunch', 'camp'].includes(p[1]) ? p[1] : 'meet', name: clean(p[2], 40), lat: p[3], lon: p[4], time: isTime(p[5]) ? p[5] : null })),
    cps: Object.fromEntries(arr(obj.cp).filter((c) => Array.isArray(c) && Number.isInteger(c[0]) && isAt(c[1])).map((c) => [c[0], c[1]])),
  };
}

/* ---------- the board everyone sees ---------- */

/** «Ready» and «In camp» count only on the day they were tapped (Switzerland). */
const sameDay = (at, now) => new Date(at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }) === new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
export const statusToday = (status, now = Date.now()) => (status && sameDay(status.at, now) ? status : null);

/** How many are ready and in camp today: { ready, camp, total }. rows: memberRows with .part. */
export function statusCount(rows = [], now = Date.now()) {
  let ready = 0;
  let camp = 0;
  for (const r of rows) {
    const s = statusToday(r.part?.status, now);
    if (s?.kind === 'ready') ready++;
    if (s?.kind === 'camp') camp++;
  }
  return { ready, camp, total: rows.length };
}

/** A help call stays up this long unless «It is sorted» takes it away (minutes). */
export const HELP_MIN = 6 * 60;
/** The help calls of the others, the newest first: [{ m, name, kind, text, at, km, pos }]. */
export function helpCalls(rows = [], { now = Date.now(), me = null } = {}) {
  return rows
    .filter((r) => r.part?.help && r.m !== me && now - Date.parse(r.part.help.at) <= HELP_MIN * 60_000)
    .map((r) => ({ m: r.m, name: r.name, ...r.part.help, km: r.km ?? null, pos: r.pos ?? null }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
/** A call's key: a new call (or a new time) alerts again. */
export const helpKey = (c) => `${c.m}@${c.at}`;

/**
 * Distance to the others along the route: each row gets `gap` (km; + ahead of me, − behind) when both are on
 * the route; and the whole group's spread { front, back } (km ahead of the first and behind the last).
 */
export function withGaps(rows = [], meKm = null) {
  const on = rows.filter((r) => fin(r.km));
  const out = rows.map((r) => ({ ...r, gap: fin(meKm) && fin(r.km) && !r.me ? Math.round((r.km - meKm) * 10) / 10 : null }));
  const others = on.filter((r) => !r.me).map((r) => r.km);
  const spread = fin(meKm) && others.length ? { front: Math.max(0, Math.round((Math.max(...others) - meKm) * 10) / 10), back: Math.max(0, Math.round((meKm - Math.min(...others)) * 10) / 10) } : null;
  return { rows: out, spread };
}

/**
 * «Who has what»: every thing someone carries or misses → [{ name, who: [names], mine, missing }]; missing:
 * someone needs it and nobody carries it. Sorted: missing first, then by name.
 */
export function itemsBoard(rows = [], me = null) {
  const by = new Map();
  const key = (s) => s.toLocaleLowerCase('de');
  const get = (n) => {
    const k = key(n);
    if (!by.has(k)) by.set(k, { name: n, who: [], mine: false, needed: false });
    return by.get(k);
  };
  for (const r of rows) {
    for (const n of r.part?.has ?? []) {
      const it = get(n);
      it.who.push(r.name);
      if (r.m === me) it.mine = true;
    }
    for (const n of r.part?.need ?? []) get(n).needed = true;
  }
  return [...by.values()].map((it) => ({ ...it, missing: it.needed && !it.who.length })).sort((a, b) => Number(b.missing) - Number(a.missing) || a.name.localeCompare(b.name, 'de'));
}

/** The kinds of a meeting point and of a help call (English labels for t()). */
export const POINT_KINDS = [
  { key: 'meet', icon: '🚩', label: 'Meeting point' },
  { key: 'lunch', icon: '🍽', label: 'Lunch' },
  { key: 'camp', icon: '⛺', label: 'Camp tonight' },
];
export const HELP_KINDS = [
  { key: 'flat', icon: '🛞', label: 'Flat tyre' },
  { key: 'defect', icon: '🔧', label: 'Broken part' },
  { key: 'fall', icon: '🤕', label: 'Fall' },
  { key: 'tired', icon: '🍌', label: 'Hungry, tired' },
  { key: 'other', icon: '💬', label: 'Something else' },
];
export const kindOf = (list, key) => list.find((k) => k.key === key) ?? list.at(-1);

/** The meeting points of everyone, with who set them: [{ ...point, m, by }]. */
export const pointsOf = (rows = []) => rows.flatMap((r) => (r.part?.points ?? []).map((p) => ({ ...p, m: r.m, by: r.name })));
/** The meeting points as dots for the map (TourMap points). */
export const pointDots = (rows = []) => pointsOf(rows).map((p) => ({ id: `pt-${p.m}-${p.id}`, kind: 'friend', cls: 'stop', pos: [p.lat, p.lon], n: kindOf(POINT_KINDS, p.kind).icon, text: [p.name, p.time].filter(Boolean).join(', ') }));

/**
 * «Split costs»: every expense of every member, the balance of each member and as few payments as possible.
 * An expense is for everyone (for null) or for the listed members. Payments already done (paid) count.
 * → { expenses: [{ ...cost, m, by }], total (cents), balance: { mid: cents (+ gets, − owes) },
 *     transfers: [{ from, to, cents }] }.
 */
export function settle(rows = []) {
  const ids = rows.map((r) => r.m);
  const bal = Object.fromEntries(ids.map((m) => [m, 0]));
  const expenses = [];
  let total = 0;
  for (const r of rows) {
    for (const c of r.part?.costs ?? []) {
      const share = (c.for ?? ids).filter((m) => m in bal);
      if (!share.length) continue;
      expenses.push({ ...c, m: r.m, by: r.name });
      total += c.cents;
      bal[r.m] += c.cents;
      // the cents that do not split evenly go to the first ones (fair to the cent)
      const base = Math.floor(c.cents / share.length);
      let rest = c.cents - base * share.length;
      for (const m of share) {
        bal[m] -= base + (rest > 0 ? 1 : 0);
        if (rest > 0) rest--;
      }
    }
    for (const p of r.part?.paid ?? []) {
      if (!(p.to in bal)) continue;
      bal[r.m] += p.cents;
      bal[p.to] -= p.cents;
    }
  }
  const owes = ids.filter((m) => bal[m] < 0).map((m) => ({ m, v: -bal[m] })).sort((a, b) => b.v - a.v);
  const gets = ids.filter((m) => bal[m] > 0).map((m) => ({ m, v: bal[m] })).sort((a, b) => b.v - a.v);
  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < owes.length && j < gets.length) {
    const v = Math.min(owes[i].v, gets[j].v);
    if (v > 0) transfers.push({ from: owes[i].m, to: gets[j].m, cents: v });
    owes[i].v -= v;
    gets[j].v -= v;
    if (!owes[i].v) i++;
    if (!gets[j].v) j++;
  }
  return { expenses, total, balance: bal, transfers };
}

/** 'CHF 12.50' from cents; and cents from what someone typed ('12.5', '12,50', '12'). */
export const chf = (cents) => `CHF ${(Math.round(cents) / 100).toFixed(2)}`;
export function centsOf(s) {
  const m = /^\s*(\d{1,6})(?:[.,](\d{1,2}))?\s*$/.exec(String(s ?? ''));
  return m ? Number(m[1]) * 100 + Number((m[2] ?? '0').padEnd(2, '0')) : null;
}

/* ---------- start, camp and checkpoints (also in races) ---------- */

/** The checkpoints with the finish (the end of the route) last: [{ i, name, km, finish }]. */
export function checkpoints(plan, route) {
  const cps = (plan?.cps ?? []).map((c, i) => ({ i, name: c.name, km: c.km, finish: false }));
  const km = Number(route?.km) || (route ? (lineKm(route).at(-1)?.km ?? 0) : 0);
  if (km > 0 && !cps.some((c) => Math.abs(c.km - km) < CP_NEAR_KM)) cps.push({ i: cps.length, name: '', km: Math.round(km * 10) / 10, finish: true });
  return cps;
}

/** The checkpoint a member at km is near and has not reached yet, or null. */
export function cpNear(cps = [], km = null, reached = {}) {
  if (!fin(km)) return null;
  return cps.find((c) => Math.abs(c.km - km) <= CP_NEAR_KM && !reached[c.i]) ?? null;
}

/** The last checkpoint a member reached: { cp, at } or null. */
export function lastCp(cps = [], reached = {}) {
  let best = null;
  for (const c of cps) if (reached[c.i] && (!best || c.km > best.cp.km)) best = { cp: c, at: reached[c.i] };
  return best;
}

/** Where along the route a meeting point is (km), or null when it is off the route. */
export function kmOfPoint(route, p) {
  const pts = route ? lineKm(route) : [];
  if (pts.length < 2 || !p) return null;
  const s = snap(pts, { lat: p.lat, lon: p.lon });
  return s.offKm <= 2 ? s.km : null;
}
/** The place at km along the route: { lat, lon } or null. */
export function placeAtKm(route, km) {
  const pts = route ? lineKm(route) : [];
  const p = pts.length > 1 && fin(km) ? pointAt(pts, Math.max(0, km)) : null;
  return p ? { lat: r5(p.lat), lon: r5(p.lon) } : null;
}

/* ---------- thunderstorm warning for everyone ---------- */

export const STORM_EVERY_MS = 15 * 60_000;
export const STORM_STEP_KM = 10;
export const STORM_AHEAD_KM = 40;
export const STORM_HOURS = 3;

/**
 * The places along the route where the weather is read: from the last member (or the start) every 10 km
 * to 40 km ahead of the first, at most 6. → [{ km, lat, lon }].
 */
export function stormSamples(route, rows = []) {
  const pts = route ? lineKm(route) : [];
  if (pts.length < 2) return [];
  const end = pts.at(-1).km;
  const kms = rows.map((r) => r.km).filter(fin);
  const from = kms.length ? Math.min(...kms) : 0;
  const to = Math.min(end, (kms.length ? Math.max(...kms) : 0) + STORM_AHEAD_KM);
  const out = [];
  for (let k = from; k <= to + 0.01 && out.length < 6; k += STORM_STEP_KM) {
    const p = pointAt(pts, k);
    out.push({ km: Math.round(k * 10) / 10, lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000 });
  }
  return out;
}

/** One Open-Meteo call for all samples (free, no key). */
export function stormUrl(samples) {
  const q = new URLSearchParams({
    latitude: samples.map((s) => s.lat).join(','),
    longitude: samples.map((s) => s.lon).join(','),
    hourly: 'weather_code,cape,precipitation_probability',
    forecast_hours: String(STORM_HOURS + 1),
    timeformat: 'unixtime',
    timezone: 'UTC',
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

/**
 * The answer → the first thunderstorm along the route in the next hours: { fromKm, toKm, at (ms) } or null.
 * j: one answer (one place) or a list of answers (one per sample, in order).
 */
export function stormOf(j, samples, now = Date.now()) {
  const list = Array.isArray(j) ? j : [j];
  let first = null;
  const hit = [];
  list.forEach((a, i) => {
    const h = a?.hourly ?? {};
    (h.time ?? []).forEach((s, k) => {
      const ms = s * 1000;
      if (ms + 36e5 < now || ms > now + STORM_HOURS * 36e5) return;
      if (thundery({ code: h.weather_code?.[k], cape: h.cape?.[k], rainP: h.precipitation_probability?.[k] })) {
        hit.push(samples[i].km);
        if (!first || ms < first) first = ms;
      }
    });
  });
  if (!hit.length) return null;
  return { fromKm: Math.min(...hit), toKm: Math.max(...hit), at: Math.max(first, now) };
}

/** Who rides toward the storm (on the route, before its far end): the names. */
export const towardStorm = (storm, rows = []) => (storm ? rows.filter((r) => fin(r.km) && r.km <= storm.toKm).map((r) => r) : []);

/* ---------- the contact card (device only) ---------- */

export const CARD_V = 1;
/**
 * Kontakt-QR-Code (Noah 27.10.2026 «1a 2b 3a 4a 5a»): the card carries more ways to reach you. Still
 * version 1: an older app reads name, Instagram, phone, bike and note and leaves the rest out.
 */
export const CARD_FIELDS = ['name', 'insta', 'phone', 'bike', 'note', 'wa', 'email', 'strava', 'komoot', 'web', 'addr', 'until'];
/** How long each part may be (links and the address are longer). */
export const cardMax = (f) => (f === 'note' || f === 'addr' ? 120 : f === 'web' || f === 'strava' || f === 'komoot' ? 100 : 60);
/**
 * Kontakt-QR-Code step 3 (Noah «3a»): payment details, kept apart from the rest of the card.
 * { t: TWINT number, q: { iban, name, street, house, zip, town } for a Swiss QR bill } → the same, cleaned,
 * or null when neither part is usable. The page shows them only after a tap.
 */
export function cardPay(p) {
  if (!p || typeof p !== 'object') return null;
  const out = {};
  const tw = clean(p.t, 20);
  if (/^\+?[\d ]{9,19}$/.test(tw)) out.t = tw;
  const q = p.q;
  if (q && typeof q === 'object' && isIban(q.iban) && clean(q.name) && clean(q.town)) {
    out.q = { iban: cleanIban(q.iban), name: clean(q.name, 70), street: clean(q.street, 70), house: clean(q.house, 16), zip: clean(q.zip, 16), town: clean(q.town, 35) };
  }
  return out.t || out.q ? out : null;
}
/** A card → the link behind the QR code: …#/karte/<base64url of the card>. Nothing goes to a server. */
export function cardLink(card, base) {
  const o = { v: CARD_V };
  for (const f of CARD_FIELDS) if (clean(card?.[f])) o[f] = clean(card[f], cardMax(f));
  const pay = cardPay(card?.pay);
  if (pay) o.pay = pay;
  const b = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${base}#/karte/${b}`;
}
/** «…#/karte/<…>» → the card { name, insta, phone, bike, note, wa, email, strava, komoot, web, addr } or null. */
export function readCard(hash = '') {
  const m = /^#\/karte\/([A-Za-z0-9_-]{4,2000})$/.exec(hash);
  if (!m) return null;
  try {
    const bin = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'));
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (o?.v !== CARD_V || !clean(o.name)) return null;
    const c = Object.fromEntries(CARD_FIELDS.map((f) => [f, clean(o[f], cardMax(f))]));
    // Kontakt-QR-Code «4a»: the day the card stops showing (soft, the page says «expired»); only a real date counts
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.until)) c.until = '';
    c.pay = cardPay(o.pay);
    return c;
  } catch {
    return null;
  }
}
