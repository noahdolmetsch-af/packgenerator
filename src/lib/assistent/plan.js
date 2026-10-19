/**
 * «Hilf mir planen» (Noah 15.10.2026 «1 beides»): four short questions (when and how long, kind of trip,
 * the night, the bike), then a plan as a suggestion. «Tour anlegen» opens New trip with the answers
 * filled in (TripDialog reads PLAN_KEY once). Pure functions, no database.
 */
import { t, tn, num } from '../i18n.svelte.js';
import { TRIP_DOMAINS, DOMAIN, BIKEPACKING, inDomain } from '../domains.js';
import { NIGHT_CHOICES } from '../context.js';
import { isInventory } from '../gear.js';

export const PLAN_KEY = 'pack.planPrefill';
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (iso, d) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
const dmy = (iso) => `${+iso.slice(8, 10)}.${+iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** The kinds of trip to pick from (in sight in New trip first). */
export const planKinds = () => TRIP_DOMAINS.map((d) => ({ key: d.key, name: d.sportName ?? d.name, bike: !!d.bike }));

/** The next Saturday from today (today when it is Saturday): a calm default for «when». */
export function nextSaturday(today) {
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // Sunday 0
  return addDays(today, (6 - dow + 7) % 7);
}

/** The answers, checked and filled in: { startDate, days, area, night, bikeId }. */
export function cleanPlan(a = {}, { today, bikes = [] } = {}) {
  const days = Math.min(30, Math.max(1, Math.round(Number(a.days) || 1)));
  const area = DOMAIN[a.area] && DOMAIN[a.area].trip !== false ? a.area : BIKEPACKING;
  const night = days === 1 ? 'none' : NIGHT_CHOICES.some((c) => c.key === a.night) ? a.night : 'hotel';
  const bike = DOMAIN[area]?.bike ? (bikes.find((b) => b.id === a.bikeId) ?? bikes[0] ?? null) : null;
  return { startDate: ISO.test(a.startDate ?? '') ? a.startDate : nextSaturday(today), days, area, night, bikeId: bike?.id ?? null };
}

/** The prefill New trip reads (null when it is missing or broken). */
export function readPlan(json) {
  try {
    const v = JSON.parse(json ?? '');
    return v && typeof v === 'object' && ISO.test(v.startDate ?? '') ? v : null;
  } catch {
    return null;
  }
}

/**
 * The plan: rows { key, title, lines[], tone? } in this order: when, packing list, bike, learnings.
 * care: bikeCare of the chosen bike with the trip (its `soon`), or null. learnings: all of them.
 */
export function planRows(plan, { items = [], bikes = [], care = null, learnings = [] } = {}) {
  const end = addDays(plan.startDate, plan.days - 1);
  const kind = DOMAIN[plan.area];
  const nightName = NIGHT_CHOICES.find((c) => c.key === plan.night)?.name ?? 'None|overnight';
  const bike = bikes.find((b) => b.id === plan.bikeId) ?? null;
  const rows = [];
  rows.push({
    key: 'when',
    title: t('When'),
    lines: [[plan.days > 1 ? `${dmy(plan.startDate)}–${dmy(end)}` : dmy(plan.startDate), tn(plan.days, '{n} day', '{n} days'), t(kind?.sportName ?? kind?.name ?? 'Bikepacking'), plan.days > 1 ? t(nightName) : ''].filter(Boolean).join(' · ')],
  });
  const n = items.filter((i) => isInventory(i) && inDomain(i, plan.area)).length;
  rows.push({ key: 'list', title: t('Packing list'), lines: [n ? t('Made from your {n} items of this kind, with the building blocks for the night and the weather.', { n: num(n) }) : t('No items of this kind yet: the list starts empty.')] });
  if (bike) {
    const due = care ? [...(care.rows ?? []), ...(care.soon ?? [])] : [];
    rows.push({ key: 'bike', title: t('Bike: {bike}', { bike: bike.name }), lines: due.length ? due.slice(0, 4).map((r) => `${r.name}${r.detail ? `, ${r.detail}` : ''}`) : [t('Nothing due before the trip.')], tone: due.length ? 'due' : 'ok' });
  }
  const ls = learnings.filter((l) => l && !l.archived && (l.rule || l.action)).slice(-3).map((l) => [l.rule, l.action].filter(Boolean).join(' · '));
  if (ls.length) rows.push({ key: 'learn', title: t('Your learnings'), lines: ls });
  rows.push({ key: 'weather', title: t('Weather'), lines: [t('The forecast comes in New trip, for the place of the trip.')] });
  return rows;
}
