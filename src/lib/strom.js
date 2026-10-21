/**
 * Paket P1 «Packen und Strom» (mockups L1, L2, L4 «Strom und Laden», Noah 12.10.2026 «L1-L4 freigeben»,
 * 21.10.2026 «1a … 6a 7a»): the power values of a device, each with where it comes from, the charge to
 * half and to a quarter worked out from the full charge, the light levels of a lamp, and the charging
 * time measured once with a stopwatch. Pure, tested in tests/strom.test.js.
 *
 * Stored on the item (all optional, everything changeable):
 *   runH, chargeH, mah                the values the power budget (power.js) already reads
 *   powerSrc { runH, chargeH, mah }   where each value comes from: SOURCES
 *   lightModes [{ id, name, h }]       a lamp's levels and how long each lasts
 *   chargeTimer { startedAt, plug }    a charge being measured now; chargePlug: the plug of the last measure
 */

/** Where a value comes from. */
export const SOURCES = [
  { key: 'maker', name: 'Maker' },
  { key: 'test', name: 'Test|source' },
  { key: 'measured', name: 'Measured' },
  { key: 'computed', name: 'Calculated' },
  { key: 'assumed', name: 'Assumption' },
];
export const srcName = (key) => SOURCES.find((s) => s.key === key)?.name ?? '';

/** What a device is charged from (for the stopwatch). */
export const PLUGS = [
  { key: 'wall', name: 'Wall plug' },
  { key: 'bank', name: 'Power bank' },
  { key: 'computer', name: 'Computer (USB)' },
  { key: 'dynamo', name: 'Dynamo or solar' },
];
export const plugName = (key) => PLUGS.find((p) => p.key === key)?.name ?? '';

/**
 * A lithium battery charges fast at first and slowly at the end: half full takes about 40 % of the
 * full time, a quarter about 20 %. Rough values, marked «calculated».
 */
export const HALF_SHARE = 0.4;
export const QUARTER_SHARE = 0.2;
const round1 = (x) => Math.round(x * 10) / 10;
const pos = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return String(v ?? '').trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
};

/** From the full charge time (h): { full, half, quarter } in hours, or null. */
export function partialCharge(fullH) {
  const full = pos(fullH);
  if (!full) return null;
  return { full, half: round1(full * HALF_SHARE), quarter: round1(full * QUARTER_SHARE) };
}

/** Hours as «2:30 h» or «45 min». */
export function hoursText(h) {
  const v = pos(h);
  if (!v) return '';
  const min = Math.round(v * 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} h`;
}

/** The hours between the start of a measure and now, rounded to 0.1 (at least 0.1). */
export function elapsedHours(startedAt, now) {
  const a = Date.parse(startedAt);
  const b = typeof now === 'number' ? now : Date.parse(now);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0.1;
  return Math.max(0.1, round1((b - a) / 36e5));
}

/** What «Voll · stoppen» writes on the item: the measured time, its source and the plug; the timer goes. */
export function stopCharge(item, now) {
  const timer = item?.chargeTimer;
  if (!timer?.startedAt) return null;
  return {
    chargeH: elapsedHours(timer.startedAt, now),
    chargePlug: timer.plug || null,
    powerSrc: { ...(item.powerSrc ?? {}), chargeH: 'measured' },
    chargeTimer: null,
  };
}

/** Set where one value comes from (key '' takes it away). */
export function setSource(powerSrc, field, key) {
  const out = { ...(powerSrc ?? {}) };
  if (key) out[field] = key;
  else delete out[field];
  return out;
}

/* a lamp's levels: [{ id, name, h }] — the user's own names (never through t()) */
export const addMode = (list, name, h, id) => {
  const n = String(name ?? '').trim();
  return n ? [...(list ?? []), { id, name: n, h: pos(h) }] : (list ?? []);
};
export const updateMode = (list, id, fields) =>
  (list ?? []).map((m) => (m.id === id ? { ...m, ...fields, ...(fields.name != null ? { name: String(fields.name).trim() || m.name } : {}), ...('h' in fields ? { h: pos(fields.h) } : {}) } : m));
export const dropMode = (list, id) => (list ?? []).filter((m) => m.id !== id);
export function moveMode(list, from, to) {
  const out = [...(list ?? [])];
  if (from < 0 || from >= out.length || to < 0 || to >= out.length || from === to) return out;
  const [m] = out.splice(from, 1);
  out.splice(to, 0, m);
  return out;
}

/** The short line of the fold «Power»: battery, lasts, charges, levels. */
export function powerLine(d, tr = (s) => s) {
  const parts = [];
  if (pos(d?.mah)) parts.push(`${Math.round(pos(d.mah))} mAh`);
  if (pos(d?.runH)) parts.push(tr('lasts {n} h', { n: pos(d.runH) }));
  if (pos(d?.chargeH)) parts.push(tr('charges {h}', { h: hoursText(d.chargeH) }));
  if (d?.lightModes?.length) parts.push(tr('{n} levels', { n: d.lightModes.length }));
  if (d?.chargeTimer?.startedAt) parts.push(tr('measuring'));
  return parts.join(' · ');
}
