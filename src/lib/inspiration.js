/**
 * «Inspiration» (UC2-1, UC2-2, UC2-4; mockups 13.10.2026, Noah «3b» + «a», 4a, 5a): your own links to
 * rigs, packing lists, videos, routes, listening tips, products, races and guides, with your own key
 * words and the note «Das übernehme ich». The app gives no list of its own: only links you add.
 *
 * - The kind comes from the address only (detectType); nothing is fetched online, no text or photo is
 *   copied from the page. The title is guessed from the address (rig.js guessTitle) and can be changed.
 * - Storage: no new table. Rigs and races live where Velos › Setup keeps them (settings 'rigLinks',
 *   rig.js), so a rig added here shows there too and is never kept twice; every other kind lives in
 *   settings 'inspoLinks'. Both are in every backup (settings is a data table).
 * - «Aus der Notiz wird …» (UC2-2): a note becomes a packing rule (a learning with `inspo`, shown as a
 *   quiet hint while packing, 5a), a wishlist item or a kept note (4a). Each one is remembered on the
 *   link (`taken`) for «Zuletzt übernommen».
 * Pure functions, tested in tests/inspiration.test.js. Labels are English keys for t().
 */
import { domainOf, fullUrl, guessTitle, guessYear } from './rig.js';
import { newKeptNote } from './notebook.js';

export const INSPO_KEY = 'inspoLinks';
export const RIG_KEY = 'rigLinks';
/** A link shared from another app waits here (localStorage) until the page opens (App.svelte). */
export const INSPO_WISH = 'insp.add';

/** The kinds of a link, in the order of the filter chips. name: the badge, plural: the filter chip. */
export const TYPES = [
  { key: 'rig', name: 'Rig|insp', plural: 'Rigs|insp' },
  { key: 'packlist', name: 'Packing list|insp', plural: 'Packing lists|insp' },
  { key: 'video', name: 'Video|insp', plural: 'Videos|insp' },
  { key: 'route', name: 'Route|insp', plural: 'Routes|insp' },
  { key: 'podcast', name: 'Listening tip|insp', plural: 'Listening tips|insp' },
  { key: 'product', name: 'Product|insp', plural: 'Products|insp' },
  { key: 'race', name: 'Race|insp', plural: 'Races|insp' },
  { key: 'article', name: 'Guide|insp', plural: 'Guides|insp' },
];
export const TYPE = Object.fromEntries(TYPES.map((x) => [x.key, x]));
/** Kinds that live in settings 'rigLinks' (Velos › Setup). */
const RIG_TYPES = ['rig', 'race'];

/** The button that opens the page, per kind (English keys for t(); {site} is the domain). */
export const OPEN_LABEL = {
  video: 'Watch video',
  podcast: 'Listen',
  product: 'See in the shop',
  race: 'Open event page',
};
export const openLabel = (type) => OPEN_LABEL[type] ?? 'Open on {site}';

/** What a card's note can become, per kind (the action chips). */
export const ACTIONS = {
  rig: ['wish', 'rule', 'note'],
  packlist: ['wish', 'rule', 'note'],
  article: ['wish', 'rule', 'note'],
  video: ['rule', 'note'],
  route: ['trip', 'note'],
  podcast: ['rule', 'note'],
  product: ['wish'],
  race: ['calendar'],
};
/** Kinds whose card has the field «Das übernehme ich». */
export const HAS_TAKE = ['rig', 'packlist', 'article', 'video', 'podcast'];

/* ---------- the kind from the address (UC2-4) ---------- */

const VIDEO_HOSTS = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com)$/;
const PODCAST_HOSTS = /(^|\.)(podcasts\.apple\.com|podbean\.com|anchor\.fm|soundcloud\.com|overcast\.fm|pocketcasts\.com|buzzsprout\.com|libsyn\.com|simplecast\.com|podcasters\.spotify\.com|audible\.[a-z.]+)$/;
const ROUTE_HOSTS = /(^|\.)(komoot\.[a-z.]+|ridewithgps\.com|outdooractive\.com|wikiloc\.com|bikemap\.net|gpsies\.com|alltrails\.com|schweizmobil\.ch|plotaroute\.com)$/;
const SHOP_HOSTS = /(^|\.)(bike24\.[a-z.]+|bike-components\.de|bike-discount\.de|rosebikes\.[a-z.]+|chainreactioncycles\.com|wiggle\.[a-z.]+|amazon\.[a-z.]+|galaxus\.ch|digitec\.ch|decathlon\.[a-z.]+|rei\.com|backcountry\.com|bergzeit\.[a-z.]+|transa\.ch|ochsnersport\.ch|sportxx\.ch|bikester\.[a-z.]+|alltricks\.[a-z.]+|ebay\.[a-z.]+|ricardo\.ch|tailfin\.cc|apidura\.com|revelatedesigns\.com|ortlieb\.com|restrap\.com)$/;
const RACE_HOSTS = /(^|\.)(themountainraces\.cc|silkroadmountainrace\.com|atlasmountainrace\.com|tourdivide\.org|transcontinental\.cc|highlandtrail550\.com|bikepackingsuisse\.ch|badlands\.cc|racearoundtheneth?erlands\.com)$/;
const ARTICLE_HOSTS = /(^|\.)(bikepacking\.com|bikeradar\.com|cyclingtips\.com|cyclingweekly\.com|gravelcyclist\.com|outsideonline\.com|adventurecycling\.org|velonews\.com|road\.cc|medium\.com|substack\.com)$/;

/** A link to a video on a video site (the video itself stays there; the app keeps only the link). */
export const isVideoLink = (url) => detectType(url).type === 'video';

/**
 * The kind of a link from its address alone, or null when the app cannot tell (then you choose).
 * Returns { type, domain, title }: title is a suggestion from the last part of the address.
 */
export function detectType(url) {
  const href = fullUrl(url);
  let u;
  try {
    u = new URL(href);
  } catch {
    return { type: null, domain: '', title: '' };
  }
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, '');
  const path = decodeURIComponent(u.pathname).toLowerCase();
  const out = (type) => ({ type, domain: domainOf(href), title: guessTitle(href) });
  // A start page (only the site, no path) says nothing about the kind: you choose (Noah 15.10.2026 «3a»).
  if (!path.replace(/\/+$/, '')) return out(null);
  if (VIDEO_HOSTS.test(host) || /\/(video|videos|watch)(\/|$)/.test(path)) return out('video');
  if (PODCAST_HOSTS.test(host) || (/(^|\.)spotify\.com$/.test(host) && /^\/(episode|show)\//.test(path)) || /podcast/.test(host) || /(^|[/-])podcasts?([/-]|$)/.test(path)) return out('podcast');
  if (ROUTE_HOSTS.test(host) || (/(^|\.)strava\.com$/.test(host) && /^\/routes\//.test(path)) || /\.gpx$/.test(path) || /^\/(routes?|route-guides?|touren?|tour)\//.test(path)) return out('route');
  if (/(^|[/-])(rigs?|bikes-of|rig-rundown)([/-]|$)/.test(path)) return out('rig');
  if (/(gear-list|packing-list|kit-list|what-to-pack|cut-list|packliste|gear-guide|what-s-in-my)/.test(path)) return out('packlist');
  if (RACE_HOSTS.test(host) || /(race|rennen)/.test(host) || /^\/(events?|races?)\//.test(path)) return out('race');
  if (SHOP_HOSTS.test(host) || /^\/(products?|produkt|p|shop|item|dp)\//.test(path) || /(^|\.)shop\./.test(host)) return out('product');
  if (ARTICLE_HOSTS.test(host) || /^\/(blog|guides?|news|articles?|plog|stories|journal)\//.test(path)) return out('article');
  return out(null);
}

/* ---------- the links: one list from two stores ---------- */

/** Numbers you type: «2 400» or «2'400» or «268.07» → a number, else null. */
export const numOf = (v) => {
  const s = `${v ?? ''}`.trim().replace(/[\s'’]/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * A new or changed link from the dialog's fields. Facts are your own numbers (route: km, metres up,
 * days; product: price, grams; race: first and last day, place), all optional.
 */
export function makeLink({ url, title = '', type, notes = [], facts = {}, raceDate = '', raceEnd = '' }, { id, now = new Date().toISOString(), old = null } = {}) {
  const href = fullUrl(url);
  const name = `${title ?? ''}`.trim() || guessTitle(href) || domainOf(href);
  const keep = old ?? {};
  const f = {
    km: numOf(facts.km),
    up: numOf(facts.up),
    days: numOf(facts.days),
    price: `${facts.price ?? ''}`.trim(),
    grams: numOf(facts.grams),
    place: `${facts.place ?? ''}`.trim(),
  };
  const link = {
    ...keep,
    id,
    url: href,
    title: name,
    type,
    notes: notes.map((n) => `${n}`.trim()).filter(Boolean).slice(0, 5),
    facts: Object.fromEntries(Object.entries(f).filter(([, v]) => v !== null && v !== '')),
    take: keep.take ?? '',
    taken: keep.taken ?? [],
    star: !!keep.star,
    addedAt: keep.addedAt ?? now,
  };
  // the day a price was typed: a price can change («Preis vom …, kann sich ändern»)
  if (f.price) link.priceAt = keep.facts?.price === f.price && keep.priceAt ? keep.priceAt : now.slice(0, 10);
  else delete link.priceAt;
  if (RIG_TYPES.includes(type)) {
    // the fields Velos › Setup reads (rig.js newLink)
    link.kind = type;
    link.year = guessYear(`${name} ${href} ${raceDate ?? ''}`);
    link.raceDate = type === 'race' ? raceDate || null : null;
    link.raceEnd = type === 'race' ? raceEnd || null : null;
    link.packKg = keep.packKg ?? null;
    link.raceId = type === 'rig' ? keep.raceId ?? null : null;
  } else {
    for (const k of ['kind', 'year', 'raceDate', 'raceEnd', 'packKg', 'raceId']) delete link[k];
  }
  return link;
}

/** A rig link of Velos › Setup as an Inspiration link (type from its kind). */
const fromRig = (l) => ({ ...l, type: l.kind === 'race' ? 'race' : 'rig', notes: l.notes ?? [], facts: l.facts ?? {}, take: l.take ?? '', taken: l.taken ?? [] });

/** Every link of both stores, newest first: [{ ...link, type }]. */
export function allLinks(rigLinks = [], inspoLinks = []) {
  return [...(rigLinks ?? []).map(fromRig), ...(inspoLinks ?? []).filter((l) => TYPE[l.type] && !RIG_TYPES.includes(l.type))].sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
}

const strip = (l) => {
  const { type, ...rest } = l;
  return RIG_TYPES.includes(type) ? rest : { ...rest, type };
};

/**
 * Put a link into the right store (and out of the other, when its kind changed).
 * Returns { rig, insp }: the new lists for settings 'rigLinks' and 'inspoLinks'.
 */
export function putLink(link, { rig = [], insp = [] } = {}) {
  const r = (rig ?? []).filter((x) => x.id !== link.id);
  const i = (insp ?? []).filter((x) => x.id !== link.id);
  const place = (list, rec) => {
    const old = (RIG_TYPES.includes(link.type) ? rig : insp) ?? [];
    const at = old.findIndex((x) => x.id === link.id);
    if (at < 0) return [...list, rec];
    const out = [...list];
    out.splice(Math.min(at, out.length), 0, rec);
    return out;
  };
  if (RIG_TYPES.includes(link.type)) return { rig: place(r, strip(link)), insp: i };
  // no longer a race: its rigs lose it (like deleting it in Velos › Setup)
  return { rig: r.map((x) => (x.raceId === link.id ? { ...x, raceId: null } : x)), insp: place(i, strip(link)) };
}

/** The newest stored version of a link (a note typed a moment ago is kept), else the given one. */
export const freshLink = (link, { rig = [], insp = [] } = {}) => allLinks(rig, insp).find((l) => l.id === link.id) ?? link;

/** Take a link out of both stores; a race's rigs lose their race (like Velos › Setup). */
export function dropLink(id, { rig = [], insp = [] } = {}) {
  return {
    rig: (rig ?? []).filter((x) => x.id !== id).map((x) => (x.raceId === id ? { ...x, raceId: null } : x)),
    insp: (insp ?? []).filter((x) => x.id !== id),
  };
}

/** The links a filter chip shows: 'all', 'star' or a kind. */
export const filterLinks = (links, filter = 'all') => links.filter((l) => filter === 'all' || (filter === 'star' ? !!l.star : l.type === filter));

/** How many rigs belong to a race (Velos › Setup links them with raceId). */
export const rigsOfRace = (links, raceId) => links.filter((l) => l.type === 'rig' && l.raceId === raceId).length;

/* ---------- «Aus der Notiz wird …» (UC2-2) ---------- */

/** The kinds a note can become (4a) in the dialog, in this order. */
export const MAKES = [
  { key: 'rule', name: 'Packing rule', text: 'Shows as a quiet hint while packing' },
  { key: 'wish', name: 'Wishlist', text: 'Keep an item in mind, with the link' },
  { key: 'note', name: 'Note|insp', text: 'Stays in your notes' },
];
/** The label of a taken note in «Zuletzt übernommen». */
export const TAKEN_LABEL = { rule: 'Packing rule', wish: 'Wishlist', note: 'Note|insp', trip: 'Trip draft', calendar: 'Calendar' };

/** «Guide to Bikepacking Bags»: a title made short for a source line (at most 40 characters). */
export const shortTitle = (s = '') => {
  const x = `${s}`.replace(/^the complete\s+/i, '').trim();
  return x.length > 40 ? `${x.slice(0, 39).trimEnd()}…` : x;
};

/** The source line of a taken note: «bikepacking.com, Guide to Bikepacking Bags». */
export const sourceOf = (link) => [domainOf(link.url), shortTitle(link.title)].filter(Boolean).join(', ');

/**
 * A packing rule from a note: a learning (the table the debriefs fill) marked `inspo`, so the packing
 * page shows it as a quiet hint with its source (5a), and «What the app has learned» lists it.
 */
export function ruleFrom(link, text, { id, now = new Date().toISOString() }) {
  return {
    id,
    topic: 'Inspiration',
    rule: `${text ?? ''}`.trim(),
    priority: 'medium',
    confirmed: 0,
    itemIds: [],
    source: sourceOf(link),
    createdAt: now,
    inspo: { linkId: link.id, url: link.url, title: link.title },
    packHint: true,
  };
}

/** A wishlist item from a note (a product with its price and weight, when you typed them). */
export function wishFrom(link, text, { id, now = new Date().toISOString() }) {
  const name = `${text ?? ''}`.trim() || link.title;
  const grams = link.type === 'product' && typeof link.facts?.grams === 'number' ? Math.round(link.facts.grams) : null;
  const price = link.type === 'product' && link.facts?.price ? ` · ${link.facts.price}${link.priceAt ? ` (${link.priceAt})` : ''}` : '';
  return {
    id,
    name: name.length > 80 ? `${name.slice(0, 79)}…` : name,
    brand: '',
    model: '',
    category: 'lux',
    weightG: grams,
    qty: 1,
    weightStatus: grams ? 'online' : 'missing',
    carry: 'luggage',
    defaultBag: null,
    ownership: 'wishlist',
    role: null,
    sets: [],
    domains: ['bikepacking'],
    note: `Inspiration: ${link.title} · ${link.url}${price}`,
    updatedAt: now,
  };
}

/** A kept note from a note, with the link (Notes page). */
export function noteFrom(link, text, { id, now = new Date().toISOString() }) {
  const body = `${text ?? ''}`.trim() || link.title;
  return newKeptNote({ text: body, link: { title: link.title, url: link.url } }, { id, now });
}

/** Remember on the link what its note became (newest first, at most 10). */
export const withTaken = (link, entry) => ({ ...link, taken: [entry, ...(link.taken ?? [])].slice(0, 10) });

/** «Zuletzt übernommen»: the newest taken notes of all links, at most n: [{ ...entry, from }]. */
export function recentTaken(links, n = 3) {
  return links
    .flatMap((l) => (l.taken ?? []).map((e) => ({ ...e, from: shortTitle(l.title), linkId: l.id })))
    .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
    .slice(0, n);
}

/** The packing rules from Inspiration that show while packing (newest first, at most n). */
export const inspoHints = (learnings = [], n = 2) =>
  learnings
    .filter((l) => l?.inspo && l.packHint !== false && `${l.rule ?? ''}`.trim())
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, n);

/* ---------- a race into the calendar ---------- */

const icsDay = (d) => `${d}`.replaceAll('-', '');
const nextDay = (d) => {
  const [y, m, x] = d.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, x + 1));
  return dt.toISOString().slice(0, 10);
};
const icsText = (s) => `${s ?? ''}`.replace(/\\/g, '\\\\').replace(/[;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** A calendar file (.ics) for a race with its days: an all-day event, the link in it. null without a date. */
export function raceIcs(link, now = new Date().toISOString()) {
  if (!link?.raceDate) return null;
  const end = nextDay(link.raceEnd && link.raceEnd >= link.raceDate ? link.raceEnd : link.raceDate);
  const stamp = now.replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pack Generator//Inspiration//EN',
    'BEGIN:VEVENT',
    `UID:${link.id}@packgenerator`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDay(link.raceDate)}`,
    `DTEND;VALUE=DATE:${icsDay(end)}`,
    `SUMMARY:${icsText(link.title)}`,
    ...(link.facts?.place ? [`LOCATION:${icsText(link.facts.place)}`] : []),
    `URL:${link.url}`,
    `DESCRIPTION:${icsText(link.url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
