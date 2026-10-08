/**
 * v0.31.0 (Noah 9a, variant A "Ruhig und klar"): "Who works on it" on Bikes → Setup.
 * Every care entry stores who did the work (by: 'self' | 'shop'); a workshop visit is always the
 * bike shop. These helpers turn that into the card "Wer schraubt": the split of the year
 * (my jobs against the shop's visits and what they cost), the last jobs with "me" or "bike shop",
 * and what to give the bike shop next (only jobs I have not done myself before).
 *
 * Pure functions only, so they are easy to test. bike: from withVisits (workshop.js), so the
 * jobs of a visit carry visitId and are counted once, as their visit.
 */
import { PART, isPrep, taskBike } from '../care.js';
import { visitsOf, visitTotal, orderSum } from '../workshop.js';
import { t as tr } from '../i18n.svelte.js';

/** An entry I did myself: not a job of a workshop visit and not marked "bike shop". Entries without `by` count as mine (that is how Bike care stores them by default). */
export const bySelf = (h) => !h.visitId && h.by !== 'shop';

/** The words for one part entry: "Chain waxed" for a service by km, "Fork service", else the part's name. */
function what(key, h) {
  const p = PART[key];
  if (!p) return key === 'other' ? tr('Other') : key;
  // Done, not to do: "Chain waxed" (Bike care says "Waxed chain" for what is due).
  if (h.action === 'service' && p.service) return tr(`${p.name} ${p.service.toLowerCase()}`);
  if (h.action === 'service' && p.due) return tr(p.due);
  return tr(p.name);
}

/** Every entry of the bike that is not part of a visit, plus the repairs finished in the app: [{ key, date, km, by, action, what, chf }]. */
function ownEntries(bike, tasks = []) {
  const parts = (bike?.parts ?? []).flatMap((p) => (p.history ?? []).filter((h) => !h.visitId && h.date).map((h) => ({ key: p.key, date: h.date, km: h.km ?? null, by: h.by === 'shop' ? 'shop' : 'self', action: h.action, result: h.result, what: what(p.key, h), chf: typeof h.chf === 'number' ? h.chf : null })));
  const repairs = tasks
    .filter((x) => !isPrep(x) && taskBike(x) === bike?.id && x.status === 'done' && x.statusDate)
    .map((x) => ({ key: null, date: x.statusDate, km: null, by: x.by === 'shop' ? 'shop' : 'self', action: 'repair', result: 'done', what: x.task, chf: null }));
  return [...parts, ...repairs];
}

/** Work that was actually done (a check that found nothing to do still counts; "work needed" is a finding, not work). */
const isWork = (e) => e.result !== 'needed';

/**
 * The year on one bike: { year, self, shop, chf, unknown, share }.
 * self: my jobs (one per part and day); shop: visits to the bike shop (a workshop visit, or the
 * entries marked "bike shop" on one day); chf: what the shop cost (visits without a price count
 * in unknown); share: my part of all work, 0..1 (null when nothing was done).
 */
export function whoYear(bike, visits = [], tasks = [], year = String(new Date().getFullYear())) {
  const own = ownEntries(bike, tasks).filter((e) => e.date.startsWith(year) && isWork(e));
  const self = own.filter((e) => e.by === 'self').length;
  const mine = visitsOf(visits, bike?.id).filter((v) => v.date.startsWith(year));
  // Entries marked "bike shop" without a visit: one visit per day.
  const shopDays = {};
  for (const e of own.filter((x) => x.by === 'shop')) (shopDays[e.date] ??= []).push(e);
  let chf = 0;
  let unknown = 0;
  for (const v of mine) {
    const total = visitTotal(v);
    if (total == null) unknown++;
    else chf += total;
  }
  for (const list of Object.values(shopDays)) {
    const priced = list.filter((e) => e.chf != null);
    if (!priced.length) unknown++;
    else chf += priced.reduce((s, e) => s + e.chf, 0);
  }
  const shop = mine.length + Object.keys(shopDays).length;
  return { year, self, shop, chf: Math.round(chf * 100) / 100, unknown, share: self + shop ? self / (self + shop) : null };
}

/**
 * The last jobs on one bike, newest first: [{ id, date, km, who: 'self' | 'shop', what, shop, chf }].
 * A visit is one row with all its jobs; my entries of one day are one row, too.
 */
export function recentWork(bike, visits = [], tasks = [], n = 3) {
  const rows = [];
  for (const v of visitsOf(visits, bike?.id)) {
    const names = [...new Set((v.parts ?? []).map((l) => (l.part === 'other' && l.what ? l.what : what(l.part, l))))];
    rows.push({ id: `visit:${v.id}`, date: v.date, km: typeof v.km === 'number' ? v.km : null, who: 'shop', what: names.join(', ') || tr('Workshop visit'), shop: v.shop ?? '', chf: visitTotal(v) });
  }
  const days = {};
  for (const e of ownEntries(bike, tasks).filter(isWork)) (days[`${e.by}:${e.date}`] ??= []).push(e);
  for (const [key, list] of Object.entries(days)) {
    const priced = list.filter((e) => e.chf != null);
    rows.push({
      id: `own:${key}`,
      date: list[0].date,
      km: list.find((e) => e.km != null)?.km ?? null,
      who: list[0].by,
      what: [...new Set(list.map((e) => e.what))].join(', '),
      shop: '',
      chf: priced.length ? Math.round(priced.reduce((s, e) => s + e.chf, 0) * 100) / 100 : null,
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || (b.km ?? 0) - (a.km ?? 0)).slice(0, n);
}

/** Did I do this job myself before? key: a part key, or 'check' for the 1000 km check. */
export function doneBySelf(bike, key) {
  const parts = bike?.parts ?? [];
  if (key === 'check') return parts.some((p) => (p.history ?? []).some((h) => bySelf(h) && h.action === 'check' && h.result !== 'needed'));
  const p = parts.find((x) => x.key === key);
  return !!p && (p.history ?? []).some((h) => bySelf(h) && (h.action === 'service' || h.action === 'replace') && h.result !== 'needed');
}

/**
 * "Next for the bike shop": the rows of a workshop order (workshopOrder in workshop.js) without
 * the jobs I have done myself before. Open repairs stay (they have no part).
 * Returns { rows, total, unknown } (total: CHF from the receipts, unknown: rows without a price).
 */
export function nextForShop(order, bike) {
  const rows = (order?.rows ?? []).filter((r) => r.key.startsWith('repair:') || !doneBySelf(bike, r.key.split(':')[0]));
  return { rows, ...orderSum(rows) };
}
