/**
 * v0.110.0 Design-Refresh P10 (I11–I11e, Noah 12.10.2026 «Runde 20 freigegeben»): Ich › Was ist neu.
 * The newest version as a card, every function of the catalogue (features.js) one by one, sortable
 * (newest, name, category, place, your top 10, the most important 10) with a search, all versions by
 * month; the message after an update (I11b) and the tile «New» on Today for 14 days (I11e).
 *
 * «Your top 10» counts on this device only (localStorage USES_KEY, never in a backup), how often you
 * open a function; the playground does not count (wasneuStore.js). Pure functions, tested in
 * tests/wasneu.test.js.
 */
import { FEATURES, FEATURE_GROUPS, PAGE_GROUPS, pageOf } from '../features.js';
import { WHATS_NEW, compareVersions } from '../whatsnew.js';

/** localStorage: { featureId: times opened } on this device. */
export const USES_KEY = 'wasneu.uses';
/** localStorage: the version whose message «Do not show again» silenced (until the next update). */
export const MUTE_KEY = 'wasneu.mute';
/** localStorage: { v, from, at } the last update this device got: its version, the one before, the day. */
export const UPDATE_KEY = 'wasneu.update';
/** localStorage: { v, from, done } the tile «New» put on top of the wall for this version. */
export const PIN_KEY = 'wasneu.pin';
/** localStorage: { version: [step indexes] } the ticks of «How to test it». */
export const TESTED_KEY = 'wasneu.tested';
/** v0.127.0 A-U1: the banner on Today stays this many days after an update (or until ×). */
export const BANNER_DAYS = 7;
/** The tile «New» stays on top this many days after an update. */
export const TILE_DAYS = 14;
/** Rows of the list before «All n functions ›». */
export const LIST_ROWS = 10;
/** The addresses of the page (whatsnew.js points lead here). */
export const NEWS_HREF = '#/me/news';
export const TOP_HREF = '#/me/news?all&sort=top';

/**
 * The version that brought each function (its «Since»), from the list of what is new. A function
 * missing here counts as 0.1.0 (from the start).
 */
export const SINCE = {
  // Paket K «Unterwegs»: v0.154.0
  'f.trainhome': '0.154.0', 'f.handlebar': '0.154.0', 'f.glove': '0.154.0', 'f.eatremind': '0.154.0', 'f.departsheet': '0.154.0', 'f.komoottour': '0.154.0', 'f.routeconvert': '0.154.0', 'f.waterfood': '0.154.0', 'f.ready': '0.154.0', 'f.listentip': '0.154.0', 'f.skyplaces': '0.154.0',
  // «Verschleiss» (Noah 20.10.2026): v0.171.0
  'f.partwear': '0.171.0',
  // «Velo-FAQ» Paket 6 (Noah 19.10.2026)
  'f.velofaq': '0.157.0', // bundler: 0.157.0 with Paket 6
  // «Bilder in der App» (Noah 20.10.2026): v0.171.0
  'f.setupphotos': '0.171.0',
  // Paket 4 zu K: Haus-Check, Wohnungs-Hüter, «Bereit für morgen?» (v0.155.0)
  'f.housecheck': '0.155.0', 'f.flatsitter': '0.155.0', 'f.readytomorrow': '0.155.0',
  // «Grösse» (Noah 19.10.2026 «1b 2b»): the whole app smaller or larger, plus «Kompakt»
  'f.uisize': '0.156.0',
  dayride: '0.24.1', blocks: '0.26.0', templates: '0.10.0', gpx: '0.15.0', homeweather: '0.46.0', wxsuggest: '0.15.0', weigh: '0.3.0', fav: '0.19.4', wish: '0.19.2', unused: '0.19.2',
  'f.plan': '0.30.0', 'f.wear': '0.45.0', 'f.onion': '0.42.0', 'f.shop': '0.34.0', 'f.ballast': '0.19.5', 'f.tripbike': '0.19.3', 'f.switch': '0.35.0', 'f.ask': '0.77.0', 'f.wardrobe': '0.42.0', 'f.kit': '0.45.0',
  'f.lighter': '0.63.0', 'f.select': '0.24.1', 'f.merge': '0.37.1', 'f.blockcheck': '0.66.0', 'f.gearimport': '0.36.0',
  bags: '0.5.0', share: '0.16.0', ride: '0.29.0', note: '0.19.3', event: '0.22.1', 'f.basecheck': '0.45.2', 'f.dayblocks': '0.19.5', 'f.evening': '0.34.0', 'f.ridenote': '0.26.0', 'f.finish': '0.20.1',
  debrief: '0.13.0', learn: '0.19.0', pace: '0.19.0', trend: '0.44.0', 'f.unneeded': '0.92.0', 'f.missing': '0.18.1', 'f.upload': '0.41.0', 'f.past': '0.25.1', 'f.logbook': '0.16.0', 'f.learnings': '0.13.0', 'f.best': '0.78.0',
  setup: '0.5.0', care: '0.7.0', order: '0.19.3', receipt: '0.57.0', km: '0.38.0', 'f.kmimport': '0.16.0', 'f.problem': '0.45.2', 'f.workshop': '0.17.0', 'f.equipment': '0.83.0', 'f.bikecompare': '0.57.0',
  'f.folder': '0.69.0', 'f.breakin': '0.70.0', 'f.repairkit': '0.70.0', 'f.warranty': '0.70.0', 'f.theft': '0.70.0', 'f.partstart': '0.68.0', 'f.prep': '0.18.0',
  'f.tick': '0.51.0', 'f.check': '0.51.0', 'f.stopwatch': '0.51.0', 'f.goals': '0.51.0', 'f.milestones': '0.79.0', 'f.meditation': '0.81.0', 'f.medlog': '0.84.0', 'f.medmore': '0.86.0',
  backup: '0.2.0', install: '0.1.0', lang: '0.20.0', demo: '0.18.0', 'f.search': '0.46.0', 'f.inbox': '0.19.3', 'f.notes': '0.57.0', 'f.autobackup': '0.2.0', 'f.tidy': '0.88.0', 'f.playground': '0.88.0', 'f.tour': '0.151.0',
  'f.weekplan': '0.151.0', 'f.standardbike': '0.145.0', 'f.helper': '0.77.0', 'f.shortcuts': '0.76.0', 'f.theme': '0.46.0', 'f.news': '0.110.0', 'f.tripcheck': '0.111.0', 'f.strava': '0.116.0', 'f.explain': '0.117.0', 'f.quickstart': '0.119.0', 'f.packblocks': '0.124.0', 'f.tripstate': '0.132.0', 'f.yeargoals': '0.132.0', 'f.velosetup': '0.132.0', 'f.bagplan': '0.132.0', 'f.setuplog': '0.132.0', 'f.abfragen': '0.133.0', 'f.komoot': '0.133.0', 'f.inspiration': '0.134.0', 'f.lists': '0.134.0', 'f.medreview': '0.135.0', 'f.timer': '0.135.0', 'f.pagetips': '0.135.0', 'f.training': '0.135.0', 'f.invoices': '0.135.0', 'f.bills': '0.135.0', 'f.garmin': '0.149.0', 'f.bagsetups': '0.149.0', 'f.ownvalues': '0.149.0', 'f.gipfelbuch': '0.149.0', 'f.skiequipment': '0.149.0', 'f.remember': '0.149.0', 'f.reminders': '0.149.0', 'f.birthdays': '0.149.0', 'f.measure': '0.149.0', 'f.editall': '0.149.0', 'f.sports': '0.149.0',
  // Paket O «Sportarten» (v0.154.0)
  'f.sportpage': '0.154.0', 'f.progress': '0.154.0', 'f.mosaic': '0.154.0', 'f.sportextras': '0.154.0',
  // Paket I «Velo im Griff»
  'f.bikeservice': '0.154.0', 'f.parttemplate': '0.154.0', 'f.spick': '0.154.0', 'f.inspect': '0.154.0',
  // v0.146.0 P3b «Daten sicher»: Dokumente, the exchange phone–computer and the camera everywhere (P3c)
  'f.docs': '0.146.0', 'f.sync': '0.146.0', 'f.camera': '0.146.0',
  // v0.147.0 Paket B «Server»: Fitbit, Training, PDF, Google, Assistent, Termine buchen, Shop, automatischer Abgleich, Web-Push
  // Paket N «Pläne und Träume» (v0.153.0)
  'f.notelinks': '0.153.0', 'f.next': '0.153.0', 'f.dreams': '0.153.0', 'f.races': '0.153.0', 'f.compass': '0.153.0', 'f.noteformats': '0.153.0',
  // Paket P «Was mir gut tut» (v0.153.0)
  'f.wohl': '0.153.0',
  // Paket Q «App klarer» (v0.153.0)
  'f.alerts': '0.153.0', 'f.backuplock': '0.153.0', 'f.yearcheck': '0.153.0', 'f.suggestoff': '0.153.0', 'f.tipweek': '0.153.0', 'f.comeback': '0.153.0', 'f.tripalert': '0.153.0', 'f.helpsearch': '0.153.0', 'f.offlinesave': '0.153.0',
  // Paket R «Andere Menschen und Geld» (v0.154.0)
  'f.account': '0.154.0', 'f.privacy': '0.154.0', 'f.pros': '0.154.0',
  'f.fitbit': '0.147.0', 'f.analyses': '0.147.0', 'f.weight': '0.147.0', 'f.weekreview': '0.147.0', 'f.docscan': '0.147.0', 'f.agenda': '0.147.0', 'f.assistent': '0.147.0', 'f.offers': '0.147.0', 'f.autosync': '0.147.0', 'f.push': '0.147.0', 'f.webshop': '0.147.0', 'f.mail': '0.147.0',
  // v0.150.0 Paket C «Heute und Aktiv»: Routine «Das tut mir gut»
  'f.routine': '0.150.0', 'f.insights': '0.150.0',
  // Paket G «Daten kommen von selbst» (v0.153.0)
  'f.connections': '0.153.0', 'f.owncal': '0.153.0', 'f.notestasks': '0.153.0', 'f.fitbitold': '0.153.0', 'f.stravaticks': '0.153.0', 'f.lake': '0.153.0', 'f.datastars': '0.153.0', 'f.wxwatch': '0.153.0', 'f.tourhints': '0.153.0', 'f.rainsoon': '0.153.0', 'f.air': '0.153.0', 'f.routepois': '0.153.0',
  // Paket H «Packen leichter» (v0.153.0)
  'f.starters': '0.153.0', 'f.supplies': '0.153.0', 'f.table': '0.153.0', 'f.readaloud': '0.153.0', 'f.lend': '0.153.0', 'f.ownrules': '0.153.0', 'f.startfresh': '0.153.0',
  'f.form': '0.170.0', 'f.overview': '0.170.0', // Form und Erholung + Garmin-Übersicht (Noah 20.10.2026); the bundler sets the release version
  'f.tourpage': '0.161.0', // Tour-Seite (Noah 19.10.2026 «1a 2 beides 3b 4 beides 5a»), Paket 9
  'f.fuel': '0.160.0', // Verpflegung (Noah 19.10.2026 «1a»), Paket 8
  'f.power': '0.155.0', // Strombudget (Noah 19.10.2026 «2a»), Paket 3+4
  // Paket J «Berg, Schnee und Notfall» (v0.153.0)
  'f.snow': '0.153.0', 'f.swissmap': '0.153.0', 'f.sos': '0.153.0', 'f.sosqr': '0.153.0', 'f.scales': '0.153.0',
  // Paket L «Werkzeugkasten» (v0.153.0)
  'f.tools': '0.153.0', 'f.pdftools': '0.153.0', 'f.phototools': '0.153.0', 'f.money': '0.153.0', 'f.tripcosts': '0.153.0', 'f.ablage': '0.153.0',
  // «Mail in die App» (Paket 4+U)
  'f.mailin': '0.156.0',
  'f.weblinks': '0.153.0', 'f.chains': '0.153.0', 'f.convert': '0.153.0', 'f.video': '0.153.0', 'f.qr': '0.153.0', 'f.mapmeasure': '0.153.0', 'f.gears': '0.153.0', 'f.level': '0.153.0', 'f.barcode': '0.153.0', 'f.light': '0.153.0',
  // Paket M «Aus Touren lernen» (v0.154.0)
  'f.diary': '0.154.0', 'f.extraq': '0.154.0', 'f.notetodo': '0.154.0', 'f.future': '0.154.0', 'f.quiz': '0.154.0', 'f.observations': '0.154.0', 'f.chronik': '0.154.0', 'f.gelernt': '0.154.0', 'f.jahr': '0.154.0', 'f.neuland': '0.154.0', 'f.eveningtour': '0.154.0', 'f.ridepage': '0.154.0',
  // Trello (Paket 2, v0.154.0)
  'f.trello': '0.154.0',
  // Paket S «Reise-Spur» (v0.154.0)
  'f.here': '0.154.0', 'f.record': '0.154.0', 'f.spurmap': '0.154.0', 'f.spurlink': '0.154.0', 'f.travelbook': '0.154.0',
  // Paket L2 «Bilderkennung» (v0.154.0)
  'f.packphoto': '0.154.0', 'f.sitpos': '0.154.0',
  // Paket U «Rennen» (v0.171.0)
  'f.race': '0.159.0', 'f.racesample': '0.159.0', 'f.racemap': '0.159.0', 'f.climbs': '0.159.0', 'f.mapoffline': '0.159.0', 'f.live': '0.159.0',
  // Live-Karte Teil 1–3 (v0.171.0)
  'f.livepause': '0.170.0', 'f.sensors': '0.170.0', 'f.datapages': '0.170.0', 'f.turns': '0.170.0', 'f.laps': '0.170.0', 'f.moreplaces': '0.170.0', 'f.rwgps': '0.170.0', 'f.ovnear': '0.170.0', 'f.sharepic': '0.170.0',
  // Paket T «Freie Zeit» (v0.155.0)
  'f.frei': '0.155.0', 'f.impulse': '0.155.0',
  // Paket V «Alltag» (v0.155.0)
  'f.shopping': '0.155.0', 'f.contracts': '0.155.0', 'f.people': '0.155.0', 'f.abroad': '0.155.0',
  // «Reise-Links» (v0.155.0)
  'f.travel': '0.155.0',
  // «Diktat und Fragen» (v0.155.0)
  'f.dictate': '0.155.0', 'f.askfurther': '0.155.0', 'f.aiprojects': '0.155.0',
  // «Erster Start» (v0.171.0)
  'f.firststart': '0.170.0',
  // Paket X «Umweg neu planen» (v0.171.0)
  'f.reroute': '0.170.0',
  // Paket X/Y parts 2–4 (v0.171.0)
  'f.energy': '0.171.0',
  'f.gpxstops': '0.171.0',
  'f.weather': '0.171.0',
  'f.webcams': '0.171.0',
  // Paket Wetter «Webcams auf der Live-Karte und Glätte» (SINCE the version on main; the bundler renumbers)
  'f.webcammap': '0.171.0',
  'f.icepush': '0.171.0',
  // Paket W «Von der Haustür bis zurück» (v0.171.0)
  'f.arrived': '0.170.0', 'f.planb': '0.170.0', 'f.checkin': '0.170.0', 'f.parked': '0.170.0',
  // Paket Z and SP (v0.171.0)
  'f.breakdown': '0.171.0', 'f.sleepspots': '0.171.0', 'f.postcard': '0.171.0',
  'f.packtwo': '0.171.0', 'f.laundry': '0.171.0', 'f.morninglist': '0.171.0', 'f.packtime': '0.171.0',
  // «KI im Gerät» (Noah 20.10.2026; v0.171.0)
  'f.localai': '0.171.0',
  // «Trainingspläne» (v0.157.0, provisional)
  'f.trainplans': '0.157.0', 'f.feel': '0.157.0',
  // «Heatmap» (v0.171.0)
  'f.heatmap': '0.170.0',
  // Paket U4 «Schlafplätze im Rennen» (v0.171.0)
  'f.sleeptonight': '0.171.0', 'f.callhotels': '0.171.0', 'f.powernap': '0.171.0', 'f.sleeplists': '0.171.0', 'f.nightswx': '0.171.0',
  // «Tagebuch» (provisional; the bundler sets the version of its release)
  'f.journal': '0.170.0',
};
export const sinceOf = (id) => SINCE[id] ?? '0.1.0';

/** I11d «Wichtigste 10»: a fixed choice, what brings the most when packing, riding and caring. */
export const BEST = ['f.plan', 'templates', 'f.wear', 'debrief', 'f.unneeded', 'care', 'f.basecheck', 'backup', 'f.search', 'f.playground'];

/** The sorts of the list, in the order of the chips (labels are English keys for t()). */
export const SORTS = [
  { key: 'new', label: 'Newest', note: 'by version, the newest first' },
  { key: 'name', label: 'Name A–Z', note: 'all {n} in alphabetical order' },
  { key: 'group', label: 'Category', note: 'the 6 groups of «What the app can do»' },
  { key: 'place', label: 'Place|sort', note: 'Trips, Gear, Bikes, Active, Me' },
  { key: 'top', label: 'Your top 10', note: 'what you use most, counted on this device' },
  { key: 'best', label: 'Most important 10', note: 'the 10 that bring the most, chosen once' },
];
export const sortKey = (k) => (SORTS.some((s) => s.key === k) ? k : 'new');

/** I11 «Als Nächstes geplant»: from docs/vorhaben.md, without a date (English keys for t()). */
export const PLANNED = [
  { name: 'Ski tour as a timetable', note: 'Plan anew', icon: 'route' },
  { name: 'Bookmarks and agenda', note: 'Calendar', icon: 'book' },
  { name: 'Kinds of travel anew', note: 'Trips|place', icon: 'star' },
];

/** A stored count made safe: { id: whole number > 0 } for functions that exist. */
const KNOWN = new Set(FEATURES.map((f) => f.id));
export function usesOf(value) {
  const out = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) for (const [k, v] of Object.entries(value)) if (KNOWN.has(k) && Number(v) > 0) out[k] = Math.floor(Number(v));
  return out;
}
/** One more opening of a function (unknown ids change nothing). */
export const bumpUse = (value, id) => (KNOWN.has(id) ? { ...usesOf(value), [id]: (usesOf(value)[id] ?? 0) + 1 } : usesOf(value));

/** The 16 buttons of Today (home/fnlist.js) and the search commands count for these functions. */
export const HOME_FEATURE = { dayride: 'f.quickstart', trip: 'f.plan', wear: 'f.wear', weigh: 'weigh', care: 'care', ride: 'f.upload', gear: 'unused', wardrobe: 'f.wardrobe', templates: 'templates', wish: 'wish', review: 'f.past', note: 'note', km: 'km', blocks: 'blocks', favorites: 'fav', debriefs: 'debrief' };

/**
 * The rows of the list: every function with its category, place, since, uses and state.
 * used: Set of ids the data or a tap shows as used (Features: usedTips + seenOf); uses: usesOf.
 * state: 'new' (came with the newest version, not used yet), 'used' or 'never'.
 */
export function rowsOf(used = new Set(), uses = {}, newest = WHATS_NEW[0]?.version) {
  const u = usesOf(uses);
  return FEATURES.map((f) => {
    const n = u[f.id] ?? 0;
    const since = sinceOf(f.id);
    const isUsed = n > 0 || used.has(f.id);
    const state = isUsed ? 'used' : newest && compareVersions(since, newest) === 0 ? 'new' : 'never';
    return { ...f, since, place: pageOf(f), n, used: isUsed, state };
  });
}

const GROUP_AT = Object.fromEntries(FEATURE_GROUPS.map((g, i) => [g.key, i]));
const PLACE_AT = Object.fromEntries(PAGE_GROUPS.map((g, i) => [g.key, i]));
/**
 * The list in a sort. tr: t() (names sort as shown). top: only the counted ones, most first, at most
 * 10; best: the fixed 10 in their order. The others: all rows (newest: by version, then name).
 */
export function sortRows(rows, by = 'new', tr = (s) => s) {
  const name = (r) => tr(r.title);
  const abc = (a, b) => name(a).localeCompare(name(b), undefined, { sensitivity: 'base' });
  const list = [...rows];
  if (by === 'top') return list.filter((r) => r.n > 0).sort((a, b) => b.n - a.n || abc(a, b)).slice(0, 10);
  if (by === 'best') return BEST.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  if (by === 'name') return list.sort(abc);
  if (by === 'group') return list.sort((a, b) => GROUP_AT[a.group] - GROUP_AT[b.group] || abc(a, b));
  if (by === 'place') return list.sort((a, b) => PLACE_AT[a.place] - PLACE_AT[b.place] || abc(a, b));
  return list.sort((a, b) => compareVersions(b.since, a.since) || abc(a, b));
}

/** The rows a search keeps: every word in the name, the text or the words (English and shown). */
export function searchRows(rows, q = '', tr = (s) => s) {
  const words = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  return rows.filter((r) => {
    const hay = [r.title, tr(r.title), r.text, tr(r.text), r.words].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** The functions newer than a version (I11 «Since your last visit»), newest first. */
export const newSince = (rows, from) => (from ? sortRows(rows.filter((r) => compareVersions(r.since, from) > 0), 'new') : []);

/** I11 «Never tried»: functions with a playground day, never used, at most n. */
export const neverTried = (rows, n = 3) => rows.filter((r) => r.play && !r.used).slice(0, n);

/** All versions by month, newest first: [{ key: '2026-10', entries }]. */
export function byMonth(list = WHATS_NEW) {
  const out = [];
  for (const e of list) {
    const key = String(e.date).slice(0, 7);
    let m = out.at(-1);
    if (!m || m.key !== key) out.push((m = { key, entries: [] }));
    m.entries.push(e);
  }
  return out;
}

/** Whole days from one local day (YYYY-MM-DD) to another, by the calendar. */
export function daysBetween(from, to) {
  const d = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return Math.round((d(to) - d(from)) / 864e5);
}

/**
 * v0.127.0 A-U1 (mockup A-U1, Noah 13.10.2026 answer 3a): the hint after an update is a calm banner on
 * Today, no window any more (it replaces I11b/W1's message). It shows when this device got the update to
 * `current`, × or «View» did not close it for that version (mute) and the update is less than
 * BANNER_DAYS calendar days old (today: 'YYYY-MM-DD'; without it the days are not counted).
 */
export const messageOn = ({ update = null, mute = null, current = WHATS_NEW[0]?.version, today = null } = {}) =>
  !!update && update.v === current && mute !== current && (!today || !update.at || daysBetween(update.at, today) < BANNER_DAYS);

/** The days the tile «New» still stays on top (TILE_DAYS … 1), or 0 when the time is over. */
export function tileDaysLeft(update, today, current = WHATS_NEW[0]?.version) {
  if (!update?.at || update.v !== current) return 0;
  const gone = daysBetween(update.at, today);
  return gone < 0 ? TILE_DAYS : Math.max(0, TILE_DAYS - gone);
}

/**
 * I11e: after an update the tile «New» goes on top of the wall, as a whole row. → { tiles, from }:
 * from = where it stood before ({ i, size }) or null when it was not on the wall.
 * 0.155.0 HN4 (Noah 21:27 «meditation, dann Tageskarte, dann Tourkarte»): «on top» is under the tiles that
 * lead the page (head: meditation, the day card, «Important today»), so their order stays.
 */
export function pinNews(tiles, head = []) {
  const i = tiles.findIndex((x) => x.id === 'news');
  const from = i < 0 ? null : { i, size: tiles[i].size };
  const rest = tiles.filter((x) => x.id !== 'news');
  let at = 0;
  while (at < rest.length && head.includes(rest[at].id)) at++;
  rest.splice(at, 0, { id: 'news', size: 'long' });
  return { tiles: rest, from };
}
/**
 * After the 14 days the tile goes back where it stood (or away when it was not there), but only when
 * it is still on top as a whole row (right under the head tiles); moved, resized or taken away by hand
 * it stays as it is (null).
 */
export function unpinNews(tiles, from, head = []) {
  let at = 0;
  while (at < tiles.length && head.includes(tiles[at].id)) at++;
  if (tiles[at]?.id !== 'news' || tiles[at].size !== 'long') return null;
  const rest = tiles.filter((_, k) => k !== at);
  if (from && Number.isInteger(from.i)) rest.splice(Math.max(0, Math.min(from.i, rest.length)), 0, { id: 'news', size: from.size });
  return rest;
}
