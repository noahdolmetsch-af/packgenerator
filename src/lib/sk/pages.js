/**
 * SK «Seiten-Kacheln»: the tiles of each page (SK1–SK5, SK8 «Dazunehmen», SKX4) and their live hints
 * from data the app already has. Labels are English keys for t(). A tile goes to a page of the app
 * (href), opens an outside site in a new tab (url, with the «opens elsewhere» sign), runs one action
 * (run) or scrolls to a part of the same page (spot). extra: only after «Dazunehmen».
 */
import { t, tn, num } from '../i18n.svelte.js';
import { BIKEPACKING_URL, STRAVA_URL, GOTCOURTS_URL, meteoUrl, schweizMobilUrl } from './links.js';
import { toDebrief, nextTrip } from '../debrief.js';
import { homeTrips } from '../home/heute.js';
import { bikeCare } from '../readiness.js';
import { withVisits } from '../workshop.js';
import { sortBikes } from '../bikes.js';
import { checkOf } from '../flowcheck.js';
import { isMedAct } from '../flow/hobby/medstart.js';
import { daysBetween } from './tiles.js';
import { withStravaRides } from '../kmbook.js';
import { monthKm } from '../home/bausteine.js';

const T = {
  velocare: { id: 'velocare', label: 'Bike care', icon: 'wrench', href: '#/bikes?tab=care' },
  flow: { id: 'flow', label: 'In the flow', icon: 'flow', href: '#/flow' },
  bp: { id: 'bp', label: 'bikepacking.com', icon: 'map', url: BIKEPACKING_URL, link: 'bp' },
  analyses: { id: 'analyses', label: 'More analyses', icon: 'chart', href: '#/debrief' },
  nexttrip: { id: 'nexttrip', label: 'Plan the next trip', icon: 'route', run: 'newtrip', href: '#/pack' },
  weather: { id: 'weather', label: 'Weather and getting there', icon: 'cloudsun', url: 'meteo', link: 'x3m' },
  lighter: { id: 'lighter', label: 'Lighter gear', icon: 'feather', href: '#/gear?view=never' },
  learnings: { id: 'learnings', label: 'Learnings', icon: 'bulb', href: '#/debrief/learnings' },
  logbook: { id: 'logbook', label: 'Logbook', icon: 'book', href: '#/debrief/logbook' },
  compare: { id: 'compare', label: 'Compare trips', icon: 'columns', href: '#/debrief/compare' },
  x12: { id: 'x12', label: 'SchweizMobil', icon: 'signpost', url: 'schweizmobil', link: 'x12' },
  tpl: { id: 'tpl', label: 'Adjust a template', icon: 'file', href: '#/pack/templates' },
  pace: { id: 'pace', label: 'Pace', icon: 'counter', href: '#/debrief/pace' },
  past: { id: 'past', label: 'Past trips', icon: 'calendar', href: '#/pack/past' },
  packnext: { id: 'packnext', label: 'Pack the next trip', icon: 'bag', href: '#/pack' },
  pack: { id: 'pack', label: 'Pack|tile', icon: 'bag', href: '#/pack' },
  stravacheck: { id: 'stravacheck', label: 'Check Strava rides', icon: 'flow', href: '#/bikes?tab=care&view=strava-check' },
  workshop: { id: 'workshop', label: 'Workshop|tile', icon: 'wrench', href: '#/bikes?tab=shop' },
  bikecompare: { id: 'bikecompare', label: 'Compare bikes', icon: 'columns', href: '#/bikes?tab=compare&view=all' },
  kmbook: { id: 'kmbook', label: 'Ride ledger', icon: 'counter', href: '#/debrief/ride' },
  tomorrow: { id: 'tomorrow', label: 'Weather for tomorrow', icon: 'cloudsun', url: 'meteo', link: 'x3m' },
  blocks: { id: 'blocks', label: 'Building blocks', icon: 'blocks', href: '#/blocks' },
  templates: { id: 'templates', label: 'Templates', icon: 'file', href: '#/pack/templates' },
  weight: { id: 'weight', label: 'Save weight', icon: 'scale', href: '#/gear?view=never' },
  wardrobe: { id: 'wardrobe', label: 'Wardrobe', icon: 'shirt', href: '#/wardrobe' },
  favs: { id: 'favs', label: 'Favourites', icon: 'star', href: '#/favorites' },
  wish: { id: 'wish', label: 'Wishlist', icon: 'heart', href: '#/gear?view=wish' },
  unweighed: { id: 'unweighed', label: 'Weigh|tile', icon: 'scale', href: '#/gear?view=unweighed' },
  med: { id: 'med', label: 'Meditation', icon: 'lotus', href: '#/flow' },
  x4s: { id: 'x4s', label: 'Strava', icon: 'flow', url: STRAVA_URL, link: 'x4s' },
  goals: { id: 'goals', label: 'Goals|tile', icon: 'target', href: '#/flow/goals' },
  x4g: { id: 'x4g', label: 'GotCourts', icon: 'calendarcheck', url: GOTCOURTS_URL, link: 'x4g' },
  ms: { id: 'ms', label: 'Milestones', icon: 'star', href: '#/flow/milestones' },
  lookback: { id: 'lookback', label: 'Look back|page', icon: 'chart', href: '#/debrief' },
  daycheck: { id: 'daycheck', label: 'Your questions', icon: 'check', spot: 'chk-h' }, // WG: the daily check is «Wi gaht's?» now
  // 0.136.0 (Noah 15.10.2026 «1 weiter auf andere geeignete seite integrieren»): the places of the old «Weiter» row
  rest: { id: 'rest', label: 'Recovery|page', icon: 'moon', href: '#/flow/rest' },
  week: { id: 'week', label: 'Week', icon: 'calendar', href: '#/flow/week' },
  trophies: { id: 'trophies', label: 'Trophy showcase', icon: 'trophy', href: '#/flow/trophies' },
  hepa: { id: 'hepa', label: 'Exercise recommended', icon: 'heart', url: 'https://www.hepa.ch/' },
};
const ex = (d) => ({ ...d, extra: true });

/** The pages with a tile row and their tiles, in the order of the mockups (SK1–SK5, SKX4). */
export const SK_PAGES = {
  past: [T.velocare, T.flow, T.bp, T.analyses, T.nexttrip, T.weather, T.lighter, ex(T.learnings), ex(T.logbook), ex(T.compare), ex(T.x12)],
  debrief: [T.tpl, T.logbook, T.pace, T.learnings, T.past, T.packnext, ex(T.compare), ex(T.flow), ex(T.velocare), ex(T.bp), ex(T.trophies), ex(T.ms)],
  bikes: [T.pack, T.stravacheck, T.workshop, T.bikecompare, T.kmbook, T.tomorrow, ex(T.velocare), ex(T.bp), ex(T.x12)],
  // Impeccable (18.10.2026): Building blocks, Clothes and Shopping are the tabs above; their tiles only after «Dazunehmen»
  gear: [T.templates, T.weight, T.favs, T.pack, ex(T.unweighed), ex(T.lighter), ex(T.blocks), ex(T.wardrobe), ex(T.wish)],
  flow: [T.med, T.x4s, T.goals, T.kmbook, T.x4g, T.ms, T.lookback, T.daycheck, ex(T.rest), ex(T.week), ex(T.trophies), ex(T.hepa)],
};
/** The page names in the sheet's subtitle. */
export const SK_PAGE_NAME = { past: 'Past trips', debrief: 'Look back|page', bikes: 'Bikes', gear: 'Gear|place', flow: 'Active|place', trips: 'Trips|place' };

// SN4i: the content tiles of Touren › Übersicht live in tiles.js (no imports: the browser tests read them)
export { SK_BIG } from './tiles.js';

/** The tables a page's hints read (only those are loaded). */
export const SK_NEEDS = {
  past: ['trips', 'debriefs', 'bikes', 'maintenance', 'visits', 'flowLog', 'learnings'],
  debrief: ['trips', 'debriefs', 'learnings', 'settings', 'bikes', 'maintenance', 'visits'],
  bikes: ['trips', 'bikes', 'visits', 'kmBook', 'maintenance', 'rides'],
  gear: ['items', 'trips', 'settings'],
  flow: ['flowActs', 'flowLog', 'flowChecks', 'kmBook', 'trips', 'debriefs', 'rides'],
};

/** An outside tile's address (a few depend on the language). */
export const tileUrl = (d, lang) => (d.url === 'meteo' ? meteoUrl(lang) : d.url === 'schweizmobil' ? schweizMobilUrl(lang) : d.url);


/**
 * The live hint of every tile on a page: { id: { text } } or { id: { quiet } } when the tile has
 * nothing to say now (it steps aside with a quiet line, SK7). data: the tables of SK_NEEDS.
 */
export function hintsFor(page, data = {}, today) {
  const h = {};
  const trips = homeTrips(data.trips ?? []);
  const debriefs = data.debriefs ?? [];
  const learnings = data.learnings ?? [];
  const bikes = sortBikes(data.bikes ?? []);
  const settings = Object.fromEntries((data.settings ?? []).map((r) => [r.key, r.value]));
  const done = trips.filter((x) => x.startDate && x.startDate <= today);
  const open = toDebrief(trips, debriefs, today);
  const next = nextTrip(trips, today);
  const nextLine = next ? (() => {
    const n = daysBetween(today, next.startDate);
    const when = n <= 0 ? t('today|when') : n === 1 ? t('tomorrow|when') : t('in {n} days', { n });
    const entries = next.entries ?? [];
    const packed = entries.filter((e) => e.packed).length;
    return [next.title, when, entries.length ? t('{a} of {b}', { a: packed, b: entries.length }) : ''].filter(Boolean).join(' · ');
  })() : '';

  // the care of all bikes: how many have something due
  if (data.bikes) {
    const due = bikes.filter((b) => bikeCare(withVisits(b, data.visits ?? []), { tasks: data.maintenance ?? [], visits: data.visits ?? [], today })?.status === 'due').length;
    h.velocare = due ? { text: tn(due, '{n} bike with something due', '{n} bikes with something due') } : { quiet: t('nothing due') };
  }
  if (data.flowLog && page !== 'flow') {
    const n = data.flowLog.filter((x) => x.day === today).length;
    h.flow = { text: n ? tn(n, 'Today {n} tick', 'Today {n} ticks') : t('Nothing ticked today yet') };
  }
  h.bp = { text: t('Routes for your next trip') };
  h.analyses = { text: t('Pace, comparison, logbook') };
  h.nexttrip = { text: trips.length ? t('From your last trip') : t('A new trip') };
  h.weather = { text: t('MeteoSwiss forecast map') };
  h.tomorrow = { text: t('MeteoSwiss forecast map') };
  h.lighter = { text: t('Never used and unweighed') };
  h.weight = { text: t('Never used and unweighed') };
  h.learnings = { text: tn(learnings.length, '{n} learning', '{n} learnings') };
  h.logbook = { text: tn(done.length, '{n} trip', '{n} trips') };
  h.compare = { text: done.length >= 2 ? t('{n} trips side by side', { n: done.length }) : t('From two trips on') };
  h.x12 = { text: t('Official cycling routes of Switzerland') };
  const tpls = settings.templates ?? [];
  h.tpl = { text: Array.isArray(tpls) && tpls.length ? tn(tpls.length, '{n} template', '{n} templates') : t('Make one from a trip') };
  h.templates = h.tpl;
  h.pace = { text: t('Your speed in motion') };
  h.past = { text: [tn(done.length, '{n} trip', '{n} trips'), open.length ? t('{n} without a debrief', { n: open.length }) : ''].filter(Boolean).join(' · ') };
  h.packnext = next ? { text: nextLine } : { quiet: t('no trip planned') };
  h.pack = next ? { text: nextLine } : { quiet: t('no trip planned') };
  if (data.kmBook) {
    // Paket 3 (bug from the 0.136.0 pictures): the same km as «Velo in diesem Monat» on Aktiv: uploaded rides plus
    // counted Strava rides and the Strava rides of «Training» (data.acts, bikeActs), not the ledger alone
    const { km } = monthKm(withStravaRides(data.rides ?? [], data.kmBook, data.acts ?? []), today);
    h.kmbook = { text: km ? t('This month {km} km', { km: num(km) }) : t('No ride this month yet') };
    const check = data.kmBook.filter((e) => e.state === 'open').length;
    h.stravacheck = check ? { text: tn(check, '{n} ride to check', '{n} rides to check') } : { quiet: t('nothing to check') };
  }
  if (data.visits) {
    const ahead = (data.visits ?? []).filter((v) => v.date && v.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    const bike = ahead ? bikes.find((b) => b.id === ahead.bikeId) : null;
    h.workshop = { text: ahead ? [bike?.name, t('booked for {date}', { date: ahead.date.slice(8, 10) + '.' + ahead.date.slice(5, 7) + '.' })].filter(Boolean).join(': ') : t('Visits and receipts') };
  }
  h.bikecompare = { text: bikes.length >= 2 ? t('{n} bikes side by side', { n: bikes.length }) : t('From two bikes on') };
  if (data.items) {
    const own = data.items.filter((i) => i.ownership === 'owned' && !i.gone);
    const favs = own.filter((i) => i.favorite).length;
    const wishes = data.items.filter((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy').length;
    const unweighed = own.filter((i) => i.weightG == null).length;
    h.favs = { text: favs ? tn(favs, '{n} favourite', '{n} favourites') : t('Mark your best things with ☆') };
    h.wish = { text: wishes ? tn(wishes, '{n} wish', '{n} wishes') : t('Nothing on it yet') };
    h.unweighed = unweighed ? { text: t('{n} without weight', { n: unweighed }) } : { quiet: t('everything weighed') };
  }
  h.blocks = { text: t('Your sets of things') };
  h.wardrobe = { text: t('Layers and zones') };
  if (data.flowActs) {
    const med = data.flowActs.find(isMedAct);
    if (!med) h.med = { quiet: t('no meditation yet') };
    else {
      const last = (data.flowLog ?? []).filter((x) => x.actId === med.id).map((x) => x.day).sort().at(-1);
      h.med = { text: !last ? t('Start or tick off') : last === today ? t('Done today') : t('Last: {date}', { date: `${last.slice(8, 10)}.${last.slice(5, 7)}.` }), href: `#/flow/act/${encodeURIComponent(med.id)}` };
    }
    const n = data.flowActs.filter((a) => !a.archived).length;
    h.goals = { text: tn(n, '{n} activity', '{n} activities') };
  }
  if (data.flowChecks) {
    const c = data.flowChecks.find((x) => x.day === today);
    // WG: answered in «Wi gaht's?» (sleep, energy and mood come into the day's check)
    const k = c ? checkOf(c, today) : null;
    h.daycheck = k && (k.sleep != null || k.energy != null || k.mood != null) ? { quiet: t('done today') } : { text: t('Still open today') };
  }
  h.x4s = { text: t('Your latest activity') };
  h.x4g = { text: t('Book a tennis court') };
  h.ms = { text: t('Your stars and the next one') };
  h.rest = { text: t('Sauna, walk, early to bed') };
  h.week = { text: t('Fixed dates and suggestions') };
  h.trophies = { text: t('All your stars') };
  h.hepa = { text: t('How much exercise per week?') };
  h.lookback = { text: open.length ? t('{n} without a debrief', { n: open.length }) : tn(done.length, '{n} trip', '{n} trips') };
  return h;
}
