/**
 * «Frag die App» (Noah 15.10.2026 «1 beides 2a und b 3 a und b», thread «Claude in der App»): the app
 * answers a question from your own data, free and on the device. Pure functions, no database.
 *
 * answerFor(question, data) finds the first rule that fits and returns
 *   { kind, title, lines: string[], link?: { label, href?, tripId? } } or null (no rule fits: the
 * search shows the entries that fit, Chrome-KI and, with the AI helper on, Claude).
 * data: { today, book (kmBook entries), trips, items, care (bikeCare results per bike), learnings }.
 *
 * Rules: km / climbing / rides of a period · the last trip · the next trip · what is due on the bikes ·
 * what is still to pack for the next trip · weight and bag of one item · learnings on a topic.
 */
import { fold } from '../search.js';
import { t, tn, num, nameOf } from '../i18n.svelte.js';
import { tripEnd, tripState } from '../tripstate.js';
import { BAG } from '../gear.js';

const has = (q, words) => words.some((w) => q.includes(w));
const addDays = (iso, d) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
const dmy = (iso) => (iso ? `${+iso.slice(8, 10)}.${+iso.slice(5, 7)}.${iso.slice(0, 4)}` : '');

/** The period a question names: { from, to, label } (calendar days, Europe/Zurich via today). */
export function periodOf(q, today) {
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday 0
  if (has(q, ['heute', 'today'])) return { from: today, to: today, label: t('today|period') };
  if (has(q, ['gestern', 'yesterday'])) return { from: addDays(today, -1), to: addDays(today, -1), label: t('yesterday|period') };
  if (has(q, ['letzte woche', 'last week', 'vorwoche'])) return { from: addDays(today, -dow - 7), to: addDays(today, -dow - 1), label: t('last week|period') };
  if (has(q, ['woche', 'week'])) return { from: addDays(today, -dow), to: today, label: t('this week|period') };
  if (has(q, ['letzten monat', 'letzter monat', 'last month', 'vormonat'])) {
    const first = `${today.slice(0, 7)}-01`;
    const prev = addDays(first, -1);
    return { from: `${prev.slice(0, 7)}-01`, to: prev, label: t('last month|period') };
  }
  if (has(q, ['monat', 'month'])) return { from: `${today.slice(0, 7)}-01`, to: today, label: t('this month|period') };
  if (has(q, ['jahr', 'year', today.slice(0, 4)])) return { from: `${today.slice(0, 4)}-01-01`, to: today, label: t('this year|period') };
  return null;
}

/** km, climbing and rides of the ledger in a period (removed entries do not count). */
export function rideSums(book = [], { from, to }) {
  const rs = book.filter((e) => e && e.state !== 'removed' && (e.kind ?? 'ride') === 'ride' && typeof e.date === 'string' && e.date >= from && e.date <= to);
  return { n: rs.length, km: Math.round(rs.reduce((s, e) => s + (Number(e.km) || 0), 0)), hm: Math.round(rs.reduce((s, e) => s + (Number(e.hm) || 0), 0)) };
}

const STAT = ['km', 'kilometer', 'gefahren', 'gefahre', 'hoehenmeter', 'hm', 'fahrten', 'ausfahrten', 'rides', 'ridden', 'climb', 'distance', 'distanz'];
const DUE = ['faellig', 'wartung', 'service', 'due', 'maintenance', 'warten', 'pflege'];
const PACK = ['packen', 'gepackt', 'einpacken', 'fehlt', 'pack', 'packed', 'missing'];
const WEIGHT = ['wie schwer', 'wiegt', 'gewicht', 'weight', 'weigh', 'wo ist', 'where is', 'in welcher tasche', 'which bag'];
const LEARN = ['gelernt', 'lernpunkt', 'learned', 'learning', 'erfahrung', 'tipp'];
const STOP = new Set(['wie', 'schwer', 'ist', 'mein', 'meine', 'meinen', 'die', 'der', 'das', 'den', 'wo', 'was', 'wiegt', 'gewicht', 'von', 'welcher', 'tasche', 'in', 'how', 'heavy', 'is', 'my', 'the', 'where', 'weight', 'of', 'which', 'bag', 'what', 'does', 'weigh', 'habe', 'ich', 'zu', 'zum', 'beim', 'bei', 'gelernt', 'lernpunkte', 'lernpunkt', 'learned', 'about', 'ueber', 'tipp', 'tipps', 'erfahrung', 'erfahrungen', 'did', 'i']);

const words = (q) => q.replace(/[?!.,;:«»"]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** The item a question is about: most question words in its name (at least one). */
export function itemFor(q, items = []) {
  const ws = words(q);
  if (!ws.length) return null;
  let best = null;
  let score = 0;
  for (const i of items) {
    if (i.ownership === 'gone') continue;
    const hay = fold([i.name, i.nameDe, i.brand, i.model].filter(Boolean).join(' '));
    const s = ws.filter((w) => hay.includes(w)).length;
    if (s > score) (best = i), (score = s);
  }
  return best;
}

const live = (trips) => (trips ?? []).filter((x) => x && !x.skipped && !x.archivedAt && x.startDate);

/** The next trip still ahead (or running today), and the last one ridden. */
export function nextTrip(trips, today) {
  return live(trips)
    .filter((x) => (tripEnd(x) ?? x.startDate) >= today && tripState(x, { today }) === 'plan')
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}
export function lastTrip(trips, today) {
  return live(trips)
    .filter((x) => x.startDate <= today && tripState(x, { today }) !== 'plan')
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
}

const tripLine = (x) => [x.title, dmy(x.startDate), x.days > 1 ? tn(x.days, '{n} day', '{n} days') : '', x.route?.km ? `${num(Math.round(x.route.km))} km` : ''].filter(Boolean).join(' · ');

/** The answer to a question, or null. */
export function answerFor(question, data = {}) {
  const q = fold(String(question ?? '')).replace(/\s+/g, ' ').trim();
  if (q.length < 3) return null;
  const today = data.today;

  // what is due on the bikes
  if (has(q, DUE) && !has(q, PACK)) {
    const due = (data.care ?? []).filter((c) => c?.rows?.length);
    if (!due.length) return { kind: 'care', title: t('Nothing is due on your bikes.'), lines: [], link: { label: t('Open bike care'), href: '#/bikes?tab=care' } };
    const lines = due.flatMap((c) => c.rows.slice(0, 3).map((r) => `${c.bikeName}: ${r.name}${r.detail ? `, ${r.detail}` : ''}`));
    return { kind: 'care', title: tn(lines.length, '{n} thing is due on your bikes.', '{n} things are due on your bikes.'), lines: lines.slice(0, 6), link: { label: t('Open bike care'), href: due[0].href ?? '#/bikes?tab=care' } };
  }

  // what is still to pack
  if (has(q, PACK)) {
    const x = nextTrip(data.trips, today);
    if (!x) return { kind: 'pack', title: t('No trip is planned.'), lines: [], link: { label: t('Plan a trip'), href: '#/assistent/plan' } };
    const byId = new Map((data.items ?? []).map((i) => [i.id, i]));
    const open = (x.entries ?? []).filter((e) => !e.packed);
    if (!open.length) return { kind: 'pack', title: t('Everything is packed for {trip}.', { trip: x.title }), lines: [], link: { label: t('Open the trip'), tripId: x.id } };
    const names = open.map((e) => nameOf(byId.get(e.itemId)) || e.name).filter(Boolean);
    return { kind: 'pack', title: tn(open.length, '{n} thing still to pack for {trip}.', '{n} things still to pack for {trip}.', { trip: x.title }), lines: [names.slice(0, 8).join(', ') + (names.length > 8 ? ` ${t('+ {n} more', { n: names.length - 8 })}` : '')], link: { label: t('Open the trip'), tripId: x.id } };
  }

  // km / climbing / rides of a period
  const period = periodOf(q, today);
  if (has(q, STAT) || (period && has(q, ['wie viel', 'wieviel', 'how much', 'how many', 'wie oft']))) {
    const p = period ?? periodOf('monat', today);
    const s = rideSums(data.book, p);
    if (!s.n) return { kind: 'stats', title: t('No rides {period}.', { period: p.label }), lines: [], link: { label: t('Open the ride log'), href: '#/debrief/ride' } };
    return {
      kind: 'stats',
      title: t('{period}: {km} km in {rides}.', { period: p.label, km: num(s.km), rides: tn(s.n, '{n} ride', '{n} rides') }),
      lines: [s.hm ? t('{hm} m climbing', { hm: num(s.hm) }) : '', `${dmy(p.from)}–${dmy(p.to)}`].filter(Boolean),
      link: { label: t('Open the ride log'), href: '#/debrief/ride' },
    };
  }

  // the next and the last trip
  if (has(q, ['naechste tour', 'naechsten tour', 'next trip', 'next ride', 'geplant', 'planned', 'wann geht'])) {
    const x = nextTrip(data.trips, today);
    if (!x) return { kind: 'trip', title: t('No trip is planned.'), lines: [], link: { label: t('Plan a trip'), href: '#/assistent/plan' } };
    return { kind: 'trip', title: t('Your next trip: {trip}.', { trip: x.title }), lines: [tripLine(x)], link: { label: t('Open the trip'), tripId: x.id } };
  }
  if (has(q, ['letzte tour', 'letzten tour', 'last trip', 'last ride', 'zuletzt'])) {
    const x = lastTrip(data.trips, today);
    if (!x) return { kind: 'trip', title: t('No trip ridden yet.'), lines: [], link: null };
    return { kind: 'trip', title: t('Your last trip: {trip}.', { trip: x.title }), lines: [tripLine(x)], link: { label: t('Open the trip'), tripId: x.id } };
  }

  // weight and bag of one item
  if (has(q, WEIGHT)) {
    const i = itemFor(q, data.items);
    if (!i) return null;
    const bag = BAG[i.defaultBag];
    return {
      kind: 'item',
      title: i.weightG != null ? t('{item} weighs {g} g.', { item: nameOf(i), g: num(i.weightG) }) : t('{item} is not weighed yet.', { item: nameOf(i) }),
      lines: [bag ? t('Bag: {bag}', { bag: t(bag) }) : '', i.tempMin != null ? t('Warm down to {n} °C', { n: i.tempMin }) : ''].filter(Boolean),
      link: { label: t('Open in gear'), href: `#/gear?q=${encodeURIComponent(nameOf(i))}&item=${encodeURIComponent(i.id)}` },
    };
  }

  // learnings on a topic
  if (has(q, LEARN)) {
    const ws = words(q);
    const ls = (data.learnings ?? []).filter((l) => l && !l.archived && (l.rule || l.action));
    const hit = ws.length ? ls.filter((l) => ws.some((w) => fold(`${l.rule ?? ''} ${l.action ?? ''} ${l.topic ?? ''}`).includes(w))) : ls;
    if (!hit.length) return { kind: 'learn', title: t('No learnings on this yet.'), lines: [], link: { label: t('Open the learnings'), href: '#/debrief/learnings' } };
    return { kind: 'learn', title: tn(hit.length, '{n} learning fits.', '{n} learnings fit.'), lines: hit.slice(0, 5).map((l) => [l.rule, l.action].filter(Boolean).join(' · ')), link: { label: t('Open the learnings'), href: '#/debrief/learnings' } };
  }
  return null;
}

/** Example questions for the page and the empty search (English keys for t()). */
export const EXAMPLES = ['How many km this month?', 'What is due on my bikes?', 'What is still to pack?', 'When is my next trip?', 'How heavy is my tent?'];
