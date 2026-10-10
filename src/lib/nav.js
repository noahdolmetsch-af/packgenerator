/**
 * Start actions from anywhere (v0.19.6): the "New" sheet, the search and the start page open
 * another page with something already started. The wish is kept in localStorage (the page reads
 * it when it opens) and an event tells a page that is already open.
 */
const keep = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the page opens without the dialog */
  }
};

/** Read a wish once (and forget it). */
export function take(key) {
  try {
    const v = localStorage.getItem(key);
    localStorage.removeItem(key);
    return v;
  } catch {
    return null;
  }
}

/**
 * Open the "New" sheet: 'all' (everything) or 'km'. 'list' (plan a trip) opens the "New trip"
 * window straight away (v0.30.0, Noah finding 2: area, start and building blocks are all in it).
 */
export const openNew = (mode = 'all') => (mode === 'list' ? newTrip('standard') : window.dispatchEvent(new CustomEvent('pg:new', { detail: mode })));

/** A trip becomes the one Pack and Ride day show. */
export const openTrip = (id) => keep('pack.currentTrip', id);

/**
 * v0.35.0 (AP29): open another trip at one of its pages (the "In progress" list in the trip band).
 * The trip pages read the chosen trip when they open, so the App opens the page afresh
 * (event 'pg:switchtrip'), also when the address stays the same (#/pack → #/pack).
 */
export function switchTrip(id, href) {
  openTrip(id);
  if (location.hash !== href) location.hash = href;
  window.dispatchEvent(new Event('pg:switchtrip'));
}

/**
 * v0.30.2 (L5): the event preparation is the trip's: Today's line opens the trip (Plan, #/pack)
 * with "Before the trip" open, where the tasks are ticked off.
 */
export function openPrep(id) {
  openTrip(id);
  keep('pack.before', id);
}

/**
 * New packing list: from a template (its id), 'last' (copy the last trip on the bike, or of the
 * area) or 'standard'. domain (v0.21.0): the area chosen in the "New" sheet.
 */
export function newTrip(startFrom, domain = null) {
  keep('pack.startFrom', startFrom);
  if (domain) keep('pack.domain', domain);
  location.hash = '#/pack';
  window.dispatchEvent(new Event('pg:newtrip'));
}

/**
 * v0.25.1 (Noah 1a): a day ride in one tap. Pack makes the trip without a dialog (dayride.js) and
 * opens it with "Change" and "Undo". The App takes the wish to Pack when another page is open.
 */
export function dayRide(bikeId = null) {
  // v0.46.0 (Noah 14a, 19a): "tagestour factor" and "Other bike" on Today: the ride on that bike.
  keep('pack.dayRide', typeof bikeId === 'string' && bikeId ? bikeId : '1');
  location.hash = '#/pack';
  window.dispatchEvent(new Event('pg:dayride'));
}

/**
 * New gear item: Gear opens with the "Add item" dialog.
 * v0.24.0 (Noah): name = what was searched for, so "Add "Spork" as a new item" starts filled in.
 */
export function addItem(name = '') {
  keep('gear.add', typeof name === 'string' && name.trim() ? JSON.stringify({ name: name.trim() }) : '1');
  location.hash = '#/gear';
  window.dispatchEvent(new Event('pg:additem'));
}

/**
 * Quick note from anywhere (the App opens the dialog). prefill: text to start with.
 * v0.25.1 (Noah 3a): bikeId = "Note on a bike" from Today, the bike already chosen.
 */
export const openNote = (prefill = '', bikeId = null) => window.dispatchEvent(new CustomEvent('pg:note', { detail: bikeId ? { text: prefill, bikeId } : prefill }));

/** New bike (v0.23.0, AP07): Bikes opens with the "Add bike" dialog (Today's "Add a bike" link). */
export function wantBike() {
  keep('bikes.add', '1');
  window.dispatchEvent(new Event('pg:addbike'));
}

/**
 * v0.46.0 (Noah 12a, 14a): "What do I wear?" on Today from anywhere (the search command "anziehen"):
 * Today opens its small window with today's clothes.
 */
export function openWear() {
  keep('home.wear', '1');
  if (location.hash !== '#/' && location.hash !== '') location.hash = '#/';
  window.dispatchEvent(new Event('pg:wear'));
}

/**
 * v0.30.0 (Noah 1a): "Your data" on Today from anywhere (the tip "Try a demo"): Today opens the
 * fold and brings it into view.
 */
export function openData() {
  keep('home.data', '1');
  location.hash = '#/';
  window.dispatchEvent(new Event('pg:data'));
}

/**
 * v0.23.0 (AP07): the page an address shows, e.g. '#/pack/templates' → 'templates'.
 * #/care is the old address of Bikes → Care.
 */
export function pageOf(hash = '', careTab = false) {
  const h = hash || '';
  if (h.startsWith('#/gear/import')) return 'gearimport'; // v0.36.0: "Import prüfen", the staged gear import
  if (h.startsWith('#/gear')) return 'gear';
  if (h.startsWith('#/favorites')) return 'favorites';
  if (h.startsWith('#/wardrobe')) return 'wardrobe'; // v0.42.0: the wardrobe (layers and zones)
  if (h.startsWith('#/blocks/check')) return 'blockcheck'; // v0.66.0 (Noah 4a): «Bausteine prüfen»
  if (h.startsWith('#/blocks')) return 'blocks'; // v0.26.0 (Noah 2b): building blocks, own page
  if (h.startsWith('#/bikes') || h.startsWith('#/care')) return careTab ? 'care' : 'bikes';
  if (h.startsWith('#/trip/')) return 'between'; // v0.67.0 «Übergänge 1»: the interstitials of a trip
  if (h.startsWith('#/trips')) return 'trips'; // v0.46.1: the trips overview behind «Touren»
  if (h.startsWith('#/pack/templates')) return 'templates';
  if (h.startsWith('#/pack/past')) return 'past'; // v0.25.1 (Noah 3a): Past trips
  if (h.startsWith('#/pack')) return 'pack';
  if (h.startsWith('#/debrief/ride')) return 'rides'; // v0.41.0 (Noah 1): upload a ride, planned vs real
  if (h.startsWith('#/debrief')) return 'debrief';
  if (h.startsWith('#/share/')) return 'share';
  if (h.startsWith('#/ride')) return 'ride';
  if (h.startsWith('#/inbox')) return 'inbox';
  if (h.startsWith('#/notes')) return 'notes'; // v0.48.0: the Notes page
  if (h.startsWith('#/review')) return 'debrief'; // v0.44.0: the last 12 months; v0.49.0: part of the Rückblick
  if (h.startsWith('#/features')) return 'features'; // v0.30.0 (Noah 3a): what the app can do
  if (h.startsWith('#/flow')) return 'flow'; // v0.51.0 «Im Flow»
  if (h.startsWith('#/helper')) return 'helper'; // v0.77.0 KI-Helfer (K1a): Ich › Helfer
  if (h.startsWith('#/me')) return 'me'; // v0.76.0 «Fünf Orte»: «Ich», top right
  return 'home';
}

/**
 * v0.49.0 R1 «Rückblick ruhig» (Noah 4a): the old pages «Letzte 12 Monate» (#/review) and «Touren
 * vergleichen» (#/debrief/compare) are parts of the one Rückblick page now. Their addresses lead there
 * (no dead links): → { hash, spot } (spot: the section to scroll to), or null for every other address.
 */
export function redirectOf(hash = '') {
  const [h, query = ''] = (hash || '').split('?');
  if (h === '#/review' || h.startsWith('#/review/')) return { hash: '#/debrief', spot: 'period', old: '#/review' };
  if (h === '#/debrief/compare') return { hash: '#/debrief', spot: 'compare', old: '#/debrief/compare' };
  // v0.78.0 «Fünf Orte» 2 (Noah O2.6a): #/care was Bike care; it is Velos › Pflege now.
  if (h === '#/care') {
    const q = new URLSearchParams(query);
    q.delete('tab');
    const rest = q.toString();
    return { hash: `#/bikes?tab=care${rest ? `&${rest}` : ''}`, spot: '', old: '#/care' };
  }
  return null;
}

/**
 * v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): five places, the same on every page and in this
 * order (bottom bar on a phone, sidebar on a computer). Labels are English keys for t(); key: the
 * letter after «g» on a keyboard (g h = Today). colour: the place's light tint (app.css --pc-*).
 * Before: four places (v0.23.0, AP07); «Im Flow» was reached from Today and the menu «More».
 */
export const PLACES = [
  { key: 'today', href: '#/', label: 'Today|place', letter: 'h' },
  // v0.46.1 (Noah): «Touren» opens the overview of all trips, no longer the last trip at Packen.
  { key: 'trips', href: '#/trips', label: 'Trips|place', letter: 't' },
  { key: 'gear', href: '#/gear', label: 'Gear|place', letter: 'm' },
  { key: 'bikes', href: '#/bikes', label: 'Bikes|place', letter: 'v' },
  // v0.76.0: «Aktiv» is the fifth place; it opens «Im Flow» (v0.51.0).
  { key: 'active', href: '#/flow', label: 'Active|place', letter: 'a' },
];

/**
 * v0.76.0 «Fünf Orte» 1: the pages under each place (sidebar on a computer). Only what is built
 * shows (Noah O2.1a: Neuland, Heft and the rest come with their package). v0.78.0: they are the tabs
 * on top of each place too (nav/PlaceTabs), at most four. match: the addresses that count as this entry.
 */
export const PLACE_TABS = {
  today: [],
  trips: [
    { key: 'overview', label: 'Overview|tab', href: '#/trips', match: (h) => h.startsWith('#/trips') },
    { key: 'templates', label: 'Templates', href: '#/pack/templates', match: (h) => h.startsWith('#/pack/templates') },
    { key: 'lookback', label: 'Look back|page', href: '#/debrief', match: (h) => h.startsWith('#/debrief') || h.startsWith('#/pack/past') },
  ],
  gear: [
    { key: 'all', label: 'All|gear', href: '#/gear', match: (h) => (h.startsWith('#/gear') && !/[?&]view=wish\b/.test(h)) || h.startsWith('#/favorites') },
    { key: 'clothes', label: 'Clothes|tab', href: '#/wardrobe', match: (h) => h.startsWith('#/wardrobe') },
    { key: 'blocks', label: 'Building blocks', href: '#/blocks', match: (h) => h.startsWith('#/blocks') },
    // v0.78.0 «Fünf Orte» 2 (Noah O2.5a): «Einkauf» shows today's list (the wishlist); typing in comes with D2.
    { key: 'shop', label: 'Shopping|tab', href: '#/gear?view=wish', match: (h) => h.startsWith('#/gear') && /[?&]view=wish\b/.test(h) },
  ],
  bikes: [
    { key: 'overview', label: 'Overview|tab', href: '#/bikes', match: (h) => h.startsWith('#/bikes') && !/[?&]tab=(care|shop|compare)/.test(h) },
    { key: 'care', label: 'Care|tab', href: '#/bikes?tab=care', match: (h) => h.startsWith('#/care') || (h.startsWith('#/bikes') && /[?&]tab=care/.test(h)) },
    { key: 'shop', label: 'Workshop|tab', href: '#/bikes?tab=shop', match: (h) => h.startsWith('#/bikes') && /[?&]tab=shop/.test(h) },
    { key: 'fit', label: 'Measurements|tab', href: '#/bikes?tab=compare', match: (h) => h.startsWith('#/bikes') && /[?&]tab=compare/.test(h) },
  ],
  active: [
    { key: 'today', label: 'Today|active', href: '#/flow', match: (h) => /^#\/flow\/?$/.test(h.split('?')[0]) },
    { key: 'goals', label: 'Goals|tab', href: '#/flow/goals', match: (h) => h.startsWith('#/flow/') },
  ],
};

/** The entry of PLACE_TABS an address belongs to (its key), or null. */
export function tabOf(place, hash = '') {
  const h = hash || '#/';
  return (PLACE_TABS[place] ?? []).find((x) => x.match(h))?.key ?? null;
}

/**
 * Which place a page belongs to. 'me' (v0.76.0): «Ich» top right, with the Inbox, the notes, your
 * data and what the app can do.
 */
export function placeOf(page) {
  if (page === 'home') return 'today';
  if (page === 'flow') return 'active';
  if (['trips', 'between', 'pack', 'templates', 'past', 'ride', 'debrief', 'rides', 'share', 'review'].includes(page)) return 'trips';
  if (page === 'gear' || page === 'gearimport' || page === 'favorites' || page === 'blocks' || page === 'blockcheck' || page === 'wardrobe') return 'gear';
  if (page === 'bikes' || page === 'care') return 'bikes';
  if (page === 'me' || page === 'inbox' || page === 'notes' || page === 'features' || page === 'helper') return 'me';
  return null;
}

/* ---------- v0.78.0 «Fünf Orte» 2: the last tab of each place (Noah O2.2a) ---------- */
const TAB_KEY = 'nav.tab';

/** The tab of a place opened last on this device (an entry of PLACE_TABS), or null. */
export function lastTab(place) {
  try {
    const key = localStorage.getItem(`${TAB_KEY}.${place}`);
    return (PLACE_TABS[place] ?? []).find((x) => x.key === key) ?? null;
  } catch {
    return null;
  }
}

/** Remember the tab of a place (the App calls it whenever a tab shows). */
export function keepTab(place, key) {
  try {
    localStorage.setItem(`${TAB_KEY}.${place}`, key);
  } catch {
    /* private mode: a place opens at its first tab */
  }
}

/**
 * Where a tap on a place goes: the tab opened last there; a tap on the place you are on goes to its
 * first tab (Noah O2.2a). hash: only read so a bar redraws when the address changes.
 */
export function placeHref(p, current = null, hash = '') {
  void hash;
  const tabs = PLACE_TABS[p.key] ?? [];
  if (p.key === current || tabs.length < 2) return tabs[0]?.href ?? p.href;
  return lastTab(p.key)?.href ?? p.href;
}

/** The tab before (-1) or after (+1) the current one, for a swipe on a phone (Noah O2.3a), or null. */
export function tabStep(place, hash, dir) {
  const tabs = PLACE_TABS[place] ?? [];
  const i = tabs.findIndex((x) => x.key === tabOf(place, hash));
  if (i < 0) return null;
  return tabs[i + dir] ?? null;
}
