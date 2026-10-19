/**
 * Seite «Werkzeuge und Links» (Noah 19.10.2026 11:28 «1b 2a 3a», thread «Notiz-Formate und Werkzeug-Seite";
 * spec notes/notizen-werkzeuge-2026-10-19/README.md §3): its own page under Ich (#/me/links), separate
 * from the Werkzeugkasten. It starts with suggested links to other apps and pages (2a: each one can be
 * switched off and comes back under «Abgewählte Vorschläge»), plus the own links of «Links und Dateien»
 * (ablage.links, no second store; an own link may carry a `group`). Where it can, a link carries the
 * place and the day of the next trip (3a: SBB, Google Maps, Google Kalender, swisstopo, komoot, Windy).
 * Only links: nothing is embedded or fetched, no logos are loaded.
 *
 * Settings 'weblinks' = { groups: [{ id, label? (built-in, English key) | name (typed) }],
 *   hidden: [suggestion ids], place: { linkKey: groupId } (moved suggestions), order: [linkKey] }.
 * A link's key: 's:<id>' for a suggestion, 'o:<id>' for an own link. Group '' = «Ohne Gruppe».
 * Groups: add, rename, delete (asks where the links go), rules 17 and 18. Pure, tested in
 * tests/werkzeugkasten.test.js.
 */
import { sbbUrl, swisstopoUrl, komootUrl, windyUrl, meteoUrl, slfUrl, schweizMobilUrl, bikeShopsUrl, PARKTOOL_URL, GOTCOURTS_URL, STRAVA_URL, BIKEPACKING_URL } from '../sk/links.js';

export const WEBLINKS_KEY = 'weblinks';
export const WEB_GROUPS = [
  { id: 'onway', label: 'On the way|links' },
  { id: 'plan', label: 'Planning|links' },
  { id: 'sport', label: 'Sport|links' },
  { id: 'everyday', label: 'Everyday|links' },
  { id: 'files', label: 'Files|links' },
  { id: 'bike', label: 'Bike|links' },
];

const enc = encodeURIComponent;
const ymd = (iso) => String(iso ?? '').slice(0, 10).replaceAll('-', '');
const nextDay = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** Google Maps: the way to the trip's place by bike; without a place the map. */
export function mapsUrl(place) {
  if (Number.isFinite(place?.lat) && Number.isFinite(place?.lon)) return `https://www.google.com/maps/dir/?api=1&destination=${Math.round(place.lat * 1000) / 1000},${Math.round(place.lon * 1000) / 1000}&travelmode=bicycling`;
  return place?.name ? `https://www.google.com/maps/dir/?api=1&destination=${enc(place.name)}&travelmode=bicycling` : 'https://www.google.com/maps';
}

/** Google Kalender: a new all-day entry with the trip's title and day filled in; else the calendar. */
export function calendarUrl(trip) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trip?.startDate ?? '')) return 'https://calendar.google.com/';
  const days = Math.max(1, Number(trip.days) || 1);
  let end = trip.startDate;
  for (let i = 0; i < days; i++) end = nextDay(end);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(trip.title || 'Tour')}&dates=${ymd(trip.startDate)}/${ymd(end)}`;
}

/**
 * The suggestions (2a). name: the service's own name (not translated); sub: an English key for t();
 * url(ctx) with ctx = { trip, place, lang }; trip: true when it carries the trip's place or day;
 * away: the file goes to a foreign page (the Werkzeugkasten does it on the device).
 */
export const SUGGESTED = [
  { id: 'sbb', group: 'onway', name: 'SBB', sub: 'Timetable to the trip, on its day', trip: true, url: (c) => sbbUrl(c.place, c.trip?.startDate, c.lang) },
  { id: 'maps', group: 'onway', name: 'Google Maps', sub: 'The way to the trip by bike', trip: true, url: (c) => mapsUrl(c.place) },
  { id: 'meteo', group: 'onway', name: 'MeteoSchweiz', sub: 'Weather forecast', url: (c) => meteoUrl(c.lang) },
  { id: 'windy', group: 'onway', name: 'Windy', sub: 'Wind at the trip', trip: true, url: (c) => windyUrl(c.place) },
  { id: 'rega', group: 'onway', name: 'Rega', sub: 'Emergency app and help', url: () => 'https://www.rega.ch/' },
  { id: 'bikeshop', group: 'onway', name: 'Google Maps', sub: 'Bike shop nearby', url: (c) => bikeShopsUrl(null, c.lang) },
  { id: 'komoot', group: 'plan', name: 'komoot', sub: 'Plan the route at the trip', trip: true, url: (c) => komootUrl(c.place) },
  { id: 'swisstopo', group: 'plan', name: 'swisstopo', sub: 'National map at the trip', trip: true, url: (c) => swisstopoUrl(c.place) },
  { id: 'ridewithgps', group: 'plan', name: 'Ride with GPS', sub: 'Routes; bring them in as GPX', url: () => 'https://ridewithgps.com/' },
  { id: 'schweizmobil', group: 'plan', name: 'SchweizMobil', sub: 'Official cycling routes', url: (c) => schweizMobilUrl(c.lang) },
  { id: 'slf', group: 'plan', name: 'SLF', sub: 'Avalanche bulletin', url: (c) => slfUrl(c.lang) },
  { id: 'bikepacking', group: 'plan', name: 'bikepacking.com', sub: 'Routes and ideas', url: () => BIKEPACKING_URL },
  { id: 'gcal', group: 'plan', name: 'Google Kalender', sub: 'Enter the trip in the calendar', trip: true, url: (c) => calendarUrl(c.trip) },
  { id: 'strava', group: 'sport', name: 'Strava', sub: 'Your rides', url: () => STRAVA_URL },
  { id: 'garmin', group: 'sport', name: 'Garmin Connect', sub: 'Your devices and rides', url: () => 'https://connect.garmin.com/' },
  { id: 'gotcourts', group: 'sport', name: 'GotCourts', sub: 'Book a tennis court', url: () => GOTCOURTS_URL },
  { id: 'trello', group: 'everyday', name: 'Trello', sub: 'Boards and cards', url: () => 'https://trello.com/' },
  { id: 'keep', group: 'everyday', name: 'Google Notizen', sub: 'Your notes in Keep', url: () => 'https://keep.google.com/' },
  { id: 'tasks', group: 'everyday', name: 'Google Aufgaben', sub: 'Your tasks', url: () => 'https://tasks.google.com/' },
  { id: 'drive', group: 'everyday', name: 'Google Drive', sub: 'Your files', url: () => 'https://drive.google.com/' },
  { id: 'gmail', group: 'everyday', name: 'Gmail', sub: 'Your mail', url: () => 'https://mail.google.com/' },
  { id: 'wallet', group: 'everyday', name: 'Google Wallet', sub: 'Cards and tickets', url: () => 'https://wallet.google.com/' },
  { id: 'tinywow', group: 'files', name: 'TinyWow', sub: 'File tools; the file goes to a foreign page', away: true, url: () => 'https://tinywow.com/' },
  { id: 'ilovepdf', group: 'files', name: 'iLovePDF', sub: 'PDF tools; the file goes to a foreign page', away: true, url: () => 'https://www.ilovepdf.com/' },
  { id: 'squoosh', group: 'files', name: 'Squoosh', sub: 'Make pictures smaller, in the browser', url: () => 'https://squoosh.app/' },
  { id: 'parktool', group: 'bike', name: 'Park Tool', sub: 'Repair help', url: () => PARKTOOL_URL },
  { id: 'ifixit', group: 'bike', name: 'iFixit', sub: 'Repair guides', url: () => 'https://www.ifixit.com/' },
];
export const suggestionOf = (id) => SUGGESTED.find((s) => s.id === id) ?? null;

/** The state as read from the settings: the built-in groups when there is none yet. */
export function cleanWeb(v) {
  const x = v && typeof v === 'object' ? v : {};
  const groups = Array.isArray(x.groups) ? x.groups.filter((g) => g && g.id && (g.label || g.name)).map((g) => (g.name ? { id: String(g.id), name: String(g.name).slice(0, 60) } : { id: String(g.id), label: g.label })) : WEB_GROUPS.map((g) => ({ ...g }));
  return {
    groups,
    hidden: Array.isArray(x.hidden) ? x.hidden.filter((h) => suggestionOf(h)) : [],
    place: x.place && typeof x.place === 'object' ? { ...x.place } : {},
    order: Array.isArray(x.order) ? x.order.map(String) : [],
  };
}

/** A group's name as shown: built-in ones through t(), typed ones as typed (never through t()). */
export const groupName = (g, t) => (g.name ? g.name : t(g.label));

/** The next trip for the links: on the way now, or starting within 14 days; else none. */
export function linkTrip(trips, today) {
  const real = (trips ?? []).filter((x) => x?.startDate && !x.idea && !x.skipped);
  const end = (x) => {
    let d = x.startDate;
    for (let i = 1; i < Math.max(1, Number(x.days) || 1); i++) d = nextDay(d);
    return d;
  };
  let limit = today;
  for (let i = 0; i < 14; i++) limit = nextDay(limit);
  return real.filter((x) => end(x) >= today && x.startDate <= limit).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

/**
 * Every link to show, in the person's order: [{ key, id, own, group, name, sub, href, trip, away }].
 * own: the links of «Links und Dateien» ([{ id, title, url, group? }]); a group that no longer exists
 * counts as '' («Ohne Gruppe»). Switched-off suggestions are left out.
 */
export function webLinks(state, own, ctx = {}) {
  const ids = new Set(state.groups.map((g) => g.id));
  const g = (x) => (ids.has(x) ? x : '');
  const list = [
    ...SUGGESTED.filter((s) => !state.hidden.includes(s.id)).map((s) => ({ key: `s:${s.id}`, id: s.id, own: false, group: g(state.place[`s:${s.id}`] ?? s.group), name: s.name, sub: s.sub, href: s.url(ctx), trip: !!s.trip && !!ctx.trip, away: !!s.away })),
    ...(own ?? []).map((o) => ({ key: `o:${o.id}`, id: o.id, own: true, group: g(o.group ?? ''), name: o.title, sub: '', href: o.url, trip: false, away: false })),
  ];
  const at = (k) => {
    const i = state.order.indexOf(k);
    return i < 0 ? Infinity : i;
  };
  return list.map((l, i) => ({ l, i })).sort((a, b) => at(a.l.key) - at(b.l.key) || a.i - b.i).map((x) => x.l);
}

/** The links of one group, in order. */
export const linksIn = (links, groupId) => links.filter((l) => l.group === groupId);

/** A new order after moving one link up or down inside its group (dir −1 / +1, or to an index). */
export function moveLink(links, groupId, from, to) {
  const inG = linksIn(links, groupId).map((l) => l.key);
  if (from < 0 || to < 0 || from >= inG.length || to >= inG.length) return links.map((l) => l.key);
  const [k] = inG.splice(from, 1);
  inG.splice(to, 0, k);
  let n = 0;
  return links.map((l) => (l.group === groupId ? inG[n++] : l.key));
}

/**
 * Deleting a group: its links go to `to` ('' = «Ohne Gruppe»). → { state, own } (own: the own links
 * with their new group). Nothing is deleted but the group.
 */
export function deleteWebGroup(state, own, id, to = '') {
  const s = { ...state, groups: state.groups.filter((g) => g.id !== id), place: { ...state.place } };
  for (const x of SUGGESTED) if ((state.place[`s:${x.id}`] ?? x.group) === id) s.place[`s:${x.id}`] = to;
  return { state: s, own: (own ?? []).map((o) => ((o.group ?? '') === id ? { ...o, group: to } : o)) };
}

/** How many links a group holds (switched-off suggestions not counted). */
export const countIn = (state, own, id) => linksIn(webLinks(state, own), id).length;
