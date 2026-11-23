/**
 * «Frag die App» answers that came from the list of open questions (S6, Noah 21.11.2026 «5a»; the first two new
 * kinds): «Wie viele Nächte habe ich draussen geschlafen?» and «Wann war ich zuletzt in der Werkstatt?».
 * Pure functions on the data answers.js already gets: no database, no clock. q is folded (search.js fold).
 */
import { t, tn, num } from '../i18n.svelte.js';
import { tripEnd } from '../tripstate.js';

const addDays = (iso, d) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
const dmy = (iso) => (iso ? `${+iso.slice(8, 10)}.${+iso.slice(5, 7)}.${iso.slice(0, 4)}` : '');

const NIGHT = /\b(nacht|naechte|nights?|uebernacht\w*|geschlafen|slept)\b/;
const OUTDOOR = /(draussen|outdoors?|outside|zelt|biwak|bivouac|\btent\b|camp)/;
const SHOP = /(werkstatt|workshop|bike ?shop|velomech)/;

/** Is this a question about nights slept outdoors? */
export const asksNights = (q) => NIGHT.test(q) && OUTDOOR.test(q);
/** Is this a question about the workshop? */
export const asksShop = (q) => SHOP.test(q);

/**
 * The nights of the trips with a night outdoors (trip.overnight 'outdoor' (Bivouac, Bivouac + tent)): the night of each day but the last,
 * only nights already slept (before today), inside the period.
 * → { n, trips, marked } — marked: how many trips say «outdoor» at all (so the answer can tell «none marked» from «zero»).
 */
export function outdoorNights(trips = [], { from, to }, today) {
  const marked = trips.filter((x) => x && !x.skipped && !x.archivedAt && x.startDate && x.overnight === 'outdoor');
  let n = 0;
  const hit = new Set();
  for (const x of marked) {
    const last = tripEnd(x);
    for (let d = x.startDate; d < last; d = addDays(d, 1)) {
      if (d >= from && d <= to && d < today) (n++, hit.add(x.id));
    }
  }
  return { n, trips: hit.size, marked: marked.length };
}

export function nightsAnswer(period, data) {
  const { n, trips, marked } = outdoorNights(data.trips, period, data.today);
  const link = { label: t('Open the trips'), href: '#/trips' };
  if (!marked) {
    return { kind: 'nights', title: t('No trip with a night outdoors yet.'), lines: [t('Choose «Bivouac» or «Bivouac + tent» under «Where do you sleep?» on a trip; then the app counts the nights.')], link };
  }
  if (!n) return { kind: 'nights', title: t('No night outdoors {period}.', { period: period.label }), lines: [], link };
  return {
    kind: 'nights',
    title: t('{period}: {nights} outdoors on {trips}.', { period: period.label, nights: tn(n, '{n} night', '{n} nights'), trips: tn(trips, '{n} trip', '{n} trips') }),
    lines: [t('Only trips with «Bivouac» or «Bivouac + tent» count.'), `${dmy(period.from)}–${dmy(period.to)}`],
    link,
  };
}

/** The visits, newest first (visits without a date go last). */
const byDate = (vs) => [...vs].filter((v) => v && v.date).sort((a, b) => b.date.localeCompare(a.date));

export function shopAnswer(data) {
  const list = byDate(data.visits ?? []);
  const link = { label: t('Open visits and receipts'), href: '#/bikes?tab=shop' };
  if (!list.length) return { kind: 'shop', title: t('No workshop visit recorded yet.'), lines: [], link };
  const names = new Map((data.bikeList ?? []).map((b) => [b.id, b.name]));
  const last = list[0];
  const ago = Math.max(0, daysBetween(last.date, data.today));
  const where = [last.shop, names.get(last.bikeId)].filter(Boolean).join(' · ');
  const lines = [where, last.parts?.length ? tn(last.parts.length, '{n} job', '{n} jobs') : '', last.totalChf != null ? `${num(Math.round(last.totalChf))} CHF` : ''].filter(Boolean);
  // one line per other bike with its own last visit
  const seen = new Set([last.bikeId]);
  for (const v of list.slice(1)) {
    if (!v.bikeId || seen.has(v.bikeId) || !names.has(v.bikeId)) continue;
    seen.add(v.bikeId);
    lines.push(t('{bike}: {date}', { bike: names.get(v.bikeId), date: dmy(v.date) }));
    if (lines.length >= 6) break;
  }
  return { kind: 'shop', title: t('Last workshop visit: {date} ({ago}).', { date: dmy(last.date), ago: ago === 0 ? t('today|visit') : tn(ago, '{n} day ago|visit', '{n} days ago|visit') }), lines, link };
}
