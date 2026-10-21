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
  // WS2 tip (Noah 14.10.2026 «2a»): the tip «Schnellstart» (tips.js, run 'dayRide') makes the Quick start
  if (!(typeof bikeId === 'string' && bikeId)) return quickRide();
  // v0.46.0 (Noah 14a, 19a): "tagestour factor" and "Other bike" on Today: the ride on that bike.
  keep('pack.dayRide', typeof bikeId === 'string' && bikeId ? bikeId : '1');
  location.hash = '#/pack';
  window.dispatchEvent(new Event('pg:dayride'));
}

/**
 * WS2 «Wieder sichtbar» (Noah 14.10.2026 «1a 2b 3a ws1-ws7 freigeben», tip «2a»): «Quick start» in
 * «New», the search and the tips makes the trip by the same rules as the Quick start on Today
 * (quickstart.js: today, 2.5 h, the bike ridden last, the standard items, the home forecast).
 * Pack makes it and opens it with «Change» and «Undo», as the day ride. bikeId: a bike named in the search.
 */
export function quickRide(bikeId = null) {
  keep('pack.dayRide', typeof bikeId === 'string' && bikeId ? `quick:${bikeId}` : 'quick');
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
 * v0.30.0 (Noah 1a): "Your data" from anywhere (the tip "Try a demo"): the page opens the fold and
 * brings it into view. v0.94.0 «Kachel-Wand» (Noah 5a): «Data and backup» lives under Me now.
 * Design-Refresh P9 (I2): «Daten und Backup» is its own page under Ich (#/me/data).
 */
export function openData() {
  location.hash = '#/me/data';
}

/** v0.94.0 «Kachel-Wand»: the tile «Playground» opens the playground sheet under Me. */
export function openPlay() {
  keep('me.play', '1');
  location.hash = '#/me';
  window.dispatchEvent(new Event('pg:play'));
}

/**
 * v0.23.0 (AP07): the page an address shows, e.g. '#/pack/templates' → 'templates'.
 * #/care is the old address of Bikes → Care.
 */
export function pageOf(hash = '', careTab = false) {
  const h = hash || '';
  if (h.startsWith('#/gear/import')) return 'gearimport'; // v0.36.0: "Import prüfen", the staged gear import
  if (h.startsWith('#/gear/supplies')) return 'supplies'; // Paket H (answer 2b): Material › Vorrat
  if (h.startsWith('#/gear/power')) return 'power'; // Strombudget (Noah 19.10.2026 «2a»): Material › Strom
  if (h.startsWith('#/gear/lend')) return 'lend'; // Paket H (answer 5a+b): Material › Ausgeliehen
  if (h.startsWith('#/gear')) return 'gear';
  if (h.startsWith('#/favorites')) return 'favorites';
  if (h.startsWith('#/wardrobe')) return 'wardrobe'; // v0.42.0: the wardrobe (layers and zones)
  if (h.startsWith('#/blocks/check')) return 'blockcheck'; // v0.66.0 (Noah 4a): «Bausteine prüfen»
  if (h.startsWith('#/blocks')) return 'blocks'; // v0.26.0 (Noah 2b): building blocks, own page
  if (h.startsWith('#/bikes') || h.startsWith('#/care')) return careTab ? 'care' : 'bikes';
  if (h.startsWith('#/equipment')) return 'equipment'; // «Ausrüstung» (AU1, Noah 15.10.2026 «5b»)
  if (h.startsWith('#/trip/')) return 'between'; // v0.67.0 «Übergänge 1»: the interstitials of a trip
  if (h.startsWith('#/trips/fuel')) return 'fuel'; // Verpflegung (Noah 19.10.2026 «1a»): Touren › Verpflegung
  if (h.startsWith('#/trips/dreams')) return 'dreams'; // Paket N: Touren › Träume
  if (h.startsWith('#/quiz')) return 'quiz'; // Paket M «Quiz am Vorabend» (#207): #/quiz, #/quiz/<tripId>
  if (h === '#/live' || h.startsWith('#/live/') || h.startsWith('#/live?')) return 'live'; // Paket U3 «Live-Karte»: #/live, #/live/<tripId>
  if (h === '#/race' || h.startsWith('#/race/') || h.startsWith('#/race?')) return 'race'; // Paket U «Rennen»: Touren › Rennen
  if (h.startsWith('#/travel')) return 'travel'; // «Reise-Links» (Noah 19.10.2026 «5b»): Touren › Reise-Links
  // N1 «Neue Leiste» (Noah 20.10.2026 «2a»): Touren › Fahrten is Auswerten › Fahrten now, same address
  if (isRidesHash(h)) return 'stravarides';
  if (h.startsWith('#/trips')) return 'trips'; // v0.46.1: the trips overview behind «Touren»
  if (h.startsWith('#/komoot/shared')) return 'trips'; // SN1c: a shared komoot tour, its sheet over Touren
  if (h === '#/ski' || h.startsWith('#/ski/') || h.startsWith('#/ski?')) return 'ski'; // v0.97.0 «Skitouren»
  if (h === '#/mountain' || h.startsWith('#/mountain/') || h.startsWith('#/mountain?')) return 'mountain'; // Paket J «Berg, Schnee und Notfall»
  if (h.startsWith('#/pack/templates')) return 'templates';
  if (h.startsWith('#/pack/past')) return 'past'; // v0.25.1 (Noah 3a): Past trips
  if (h.startsWith('#/pack')) return 'pack';
  if (h.startsWith('#/chronik')) return 'chronik'; // Paket M #1027: everything on one time line, one page per month
  if (h.startsWith('#/gelernt')) return 'gelernt'; // Paket M #38: Monatskarte and Jahresbrief
  if (/^#\/jahr(\/|\?|$)/.test(h)) return 'jahr'; // Paket M #208: the year as a picture story
  if (h.startsWith('#/debrief/ride')) return 'rides'; // v0.41.0 (Noah 1): upload a ride, planned vs real
  if (h.startsWith('#/debrief')) return 'debrief';
  if (h.startsWith('#/share/')) return 'share';
  if (h.startsWith('#/spur-link/')) return 'spurlink'; // Paket S «Reise-Spur»: a tour's read link for the family
  if (h.startsWith('#/tour/')) return 'tour'; // «Tour» (19.10.2026): one finished tour
  if (h.startsWith('#/spur/')) return 'spur'; // Paket S «Reise-Spur»: one tour's map, days, link and book
  if (h.startsWith('#/ride')) return 'ride';
  if (h.startsWith('#/inbox')) return 'inbox';
  if (h.startsWith('#/notes')) return 'notes'; // v0.48.0: the Notes page
  if (h.startsWith('#/review')) return 'debrief'; // v0.44.0: the last 12 months; v0.49.0: part of the Rückblick
  if (h.startsWith('#/heatmap')) return 'heatmap'; // «Heatmap» (Noah 20.10.2026): all rides on one map, Touren › Rückblick
  if (h.startsWith('#/tagebuch')) return 'tagebuch'; // «Tagebuch» (Noah 20.10.2026): own page, a tab of Planen
  if (h.startsWith('#/neuland')) return 'neuland'; // «Neuland» (wish #1007): Touren › Rückblick › Neuland
  if (h.startsWith('#/features')) return 'features'; // v0.30.0 (Noah 3a): what the app can do
  if (h.startsWith('#/flow/impulse')) return 'impulse'; // Paket T «Freie Zeit»: Impulse as a tab of Aktiv (Noah «1a und b»)
  if (h.startsWith('#/flow')) return 'flow'; // v0.51.0 «Im Flow»
  if (h.startsWith('#/inspiration')) return 'inspiration'; // «Inspiration» UC2-1: your own links (sidebar; phone: Ich › Inspiration)
  if (h.startsWith('#/assistent')) return 'assistent'; // «Assistent» (Noah 15.10.2026): Frag die App + Hilf mir planen
  if (h.startsWith('#/helper')) return 'helper'; // v0.77.0 KI-Helfer (K1a): Ich › Helfer
  if (h.startsWith('#/me/ki-projekte')) return 'aiprojects'; // «Meine KI-Projekte» (Noah 19.10.2026 «2a»)
  if (h.startsWith('#/me/look')) return 'look'; // v0.97.0 Design-Refresh R1: Ich › Darstellung
  if (h.startsWith('#/me/docs/scan')) return 'docscan'; // Dokumente-PDF: «Dokument fotografieren»
  if (h.startsWith('#/me/docs')) return 'docs'; // Dokumente-PDF: Ich › Dokumente
  if (h.startsWith('#/me/connections')) return 'connections'; // package G #155: Ich › Verbindungen
  if (h.startsWith('#/me/agenda')) return 'agenda'; // GA: Ich › Termine und Aufgaben (Google)
  if (h.startsWith('#/me/mail')) return 'mail'; // GM: Ich › Mail (Gmail)
  if (h.startsWith('#/me/fitbit')) return 'fitbit'; // Fitbit über Google (mockup G1): Ich › Daten und Backup › Fitbit
  if (h.startsWith('#/me/data')) return 'data'; // Design-Refresh P9 (I2): Ich › Daten und Backup, its own page
  if (h.startsWith('#/me/compass')) return 'compass'; // Paket N: Ich › Mein Kompass
  if (h.startsWith('#/me/next')) return 'next'; // Paket N #68: Ich › Was kommt
  if (h.startsWith('#/me/news')) return 'news'; // v0.110.0 Design-Refresh P10 (I11): Ich › Was ist neu
  if (h.startsWith('#/me/phone')) return 'phone'; // Design-Refresh P9 (B35): Ich › Daten › Aufs Handy
  if (h.startsWith('#/zahlen/')) return 'paylink'; // the payer page of an invoice link (mockup QR5, Noah 14.10.2026 04:00)
  if (h.startsWith('#/laden/')) return 'shopbuy'; // the shop link: buy without app or account (mockups SHOP2a + SHOP2b, Noah 14.10.2026 04:00)
  if (h.startsWith('#/me/shop/orders')) return 'shoporders'; // Ich › Bezahlen › Shop › Bestellungen (mockup SHOP3a)
  if (h.startsWith('#/me/shop')) return 'shop'; // Ich › Bezahlen › Shop (mockup SHOP1)
  if (h.startsWith('#/me/pay/bills')) return 'bills'; // Ich › Bezahlen › Zu zahlen (mockup QR9, Noah 14.10.2026 05:10)
  if (h.startsWith('#/me/pay/invoices/')) return 'invoice'; // Ich › Bezahlen › Rechnungen › eine Rechnung (mockups QR1 + QR4)
  if (h.startsWith('#/me/pay/invoices')) return 'invoices'; // Ich › Bezahlen › Rechnungen (mockups QR2 + QR7, Noah 14.10.2026 04:00)
  if (h.startsWith('#/me/handbook')) return 'handbook'; // Ich › Handbuch (mockup HB2, Noah 14.10.2026 «hb freigeben»)
  if (h.startsWith('#/me/tools')) return 'tools'; // Paket L «Werkzeugkasten»: Ich › Werkzeugkasten
  if (h.startsWith('#/me/links')) return 'weblinks'; // Paket L «Werkzeuge und Links» (Noah «1b»)
  if (h.startsWith('#/me/apps')) return 'miniapps'; // Ich › Kleine Apps (mockup HB2)
  if (h.startsWith('#/me/privacy')) return 'privacy'; // Paket R: Ich › Datenschutz und Nutzung
  if (h.startsWith('#/me/pros')) return 'pros'; // Paket R (Noah 19.10.2026 «4a»): Ich › Velomech und Guide
  if (h.startsWith('#/me/offers')) return 'offers'; // Termine buchen (mockups BU1, BU4, BU5, Noah 14.10.2026)
  if (h.startsWith('#/me/pay')) return 'pay'; // Ich › Bezahlen (mockups BZ1 + BZ2b, Noah 14.10.2026)
  if (h.startsWith('#/me/hinweise')) return 'hinweise'; // Paket Q #148: Ich › Hinweise und News
  if (h.startsWith('#/me/push')) return 'push'; // Erinnerungen aufs Handy (Web-Push, Noah 15.10.2026 «1a 2b 3a 4b 5a»)
  if (h.startsWith('#/me/checks')) return 'checks'; // v0.111.0 (mockup V4): Ich › Checks pro Reiseart
  if (h.startsWith('#/me/wohl')) return 'wohl'; // Paket P «Was mir gut tut» (Noah 19.10.2026)
  if (h.startsWith('#/me/weight')) return 'weight'; // TR6/TR6b: Ich › Meine Daten › Gewicht
  // Tages-Check back (Noah 18.10.2026 «1 a und b»): the morning check, the evening review and the questions are pages of Heute again
  if (CHECK_PAGES.some((x) => h === x || h.startsWith(`${x}/`))) return 'check';
  if (h.startsWith('#/me/abfragen') || /^#\/check(\/|\?|$)/.test(h)) return 'abfragen'; // AB1/AB5: Ich › Deine Abfragen; WG: any other #/check address leads there (redirectOf)
  if (h.startsWith('#/me/history')) return 'history'; // AB4: Ich › Daten › Verlauf
  if (h.startsWith('#/me/analysis')) return 'analysis'; // AB6: Ich › Daten › Auswertung
  if (h.startsWith('#/me/werte')) return 'werte'; // «Mehr selbst einstellen» (IS 254–258): Ich › Eigene Werte
  if (h.startsWith('#/me/insights')) return 'insights'; // Erkenntnisse (Noah 19.10.2026 «4b» + own page)
  if (h.startsWith('#/me/lists')) return 'lists'; // v0.134.0 «Listen und Typen» (LI1–LI4)
  if (h.startsWith('#/me/reminders')) return 'reminders'; // ER3 (Noah 14.10.2026 «er1-er3 freigabe»): Ich › Erinnerungen
  if (h.startsWith('#/calendar/list/')) return 'list'; // Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a»): one list
  if (h.startsWith('#/calendar')) return 'calendar'; // PL3 (Noah 14.10.2026 «PL1-PL3 freigeben», «1a»): Kalender › Merken
  if (h.startsWith('#/me/frei')) return 'frei'; // Paket T «Freie Zeit»: Ich › Freie Zeit and its eight pages
  if (h.startsWith('#/me/alltag')) return 'alltag'; // Paket V «Alltag»: Ich › Alltag (Einkauf, Verträge, Menschen)
  if (h.startsWith('#/me')) return 'me'; // v0.76.0 «Fünf Orte»: «Ich», top right
  if (h.startsWith('#/routine')) return 'routine'; // Routine «Das tut mir gut» (mockup D2): the list, a page of Heute
  if (h.startsWith('#/timer')) return 'timer'; // «Timer» (mockups Z2–Z5): Heute › Timer, its faces and its log
  if (h.startsWith('#/week')) return 'week'; // «Woche planen» (WP1–WP3, Noah 15.10.2026 «1a»): its own place
  return 'home';
}

/**
 * v0.49.0 R1 «Rückblick ruhig» (Noah 4a): the old pages «Letzte 12 Monate» (#/review) and «Touren
 * vergleichen» (#/debrief/compare) are parts of the one Rückblick page now. Their addresses lead there
 * (no dead links): → { hash, spot } (spot: the section to scroll to), or null for every other address.
 */
/**
 * The pages of the daily check (v0.127.0). WG had sent them to «Wi gaht's?»; since 18.10.2026 (Noah «1 a und b»)
 * they are pages of Heute again, and their answers stay in «Wi gaht's?» (its history reads them).
 */
export const CHECK_PAGES = ['#/check/morning', '#/check/evening', '#/check/questions'];
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
  // WG «Wi gaht's?»: any other #/check address leads there (quietly)
  if (!CHECK_PAGES.includes(h) && /^#\/check(\/|$)/.test(h)) return { hash: '#/me/abfragen', spot: '', old: null };
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
  // «Woche planen» (mockup WP1, Noah 15.10.2026 21:11 «1a»): the week is its own place, next to Heute.
  // N1 «Neue Leiste» (Noah 20.10.2026 «1a 2a»): it is «Planen» now: the week, appointments and notes.
  { key: 'week', href: '#/week', label: 'Plan|place', letter: 'w' },
  // v0.46.1 (Noah): «Touren» opens the overview of all trips, no longer the last trip at Packen.
  { key: 'trips', href: '#/trips', label: 'Trips|place', letter: 't' },
  // v0.76.0: «Aktiv» is the fifth place; it opens «Im Flow» (v0.51.0).
  // Noah 15.10.2026 (Paket Aktiv «1a»): Aktiv opens at Heute again; Meditation is its second tab.
  // N1: it is «Auswerten» now, with the Strava rides (Fahrten) and the insights; before Velos.
  { key: 'active', href: '#/flow', label: 'Analysis|place', letter: 'a' },
  { key: 'bikes', href: '#/bikes', label: 'Bikes|place', letter: 'v' },
  // N1: Material belongs to Velos (sidebar: under Velos; phone: the slot of Velos, like Ausrüstung).
  { key: 'gear', href: '#/gear', label: 'Gear|place', letter: 'm' },
];

/**
 * «Ausrüstung» (mockup AU1, Noah 15.10.2026 «5b» own place, «1-5a» with «1b»): the main equipment of
 * each sport has its own place. On a computer it stands in the sidebar under Velos (SIDE_PLACES); on a
 * phone the bottom bar keeps five places: Velos and Ausrüstung share one; the switch on top of Ausrüstung leads
 * back to Velos (nav/PlaceSwitch), a row «Ausrüstung ›» on Velos leads there (Gesamttest 20.10.2026 B7). The bar shows BAR_PLACES (below).
 */
export const EQUIPMENT = { key: 'equipment', href: '#/equipment', label: 'Equipment|place', shares: 'bikes' };
/** The places of the sidebar: the five, with Ausrüstung under Velos. */
export const SIDE_PLACES = PLACES.flatMap((p) => (p.key === 'bikes' ? [p, EQUIPMENT] : [p]));
/** N1: the places that share the slot of Velos in the bottom bar (Ausrüstung, Material). */
export const SHARES_BIKES = [EQUIPMENT.key, 'gear'];
/** The place whose slot in the bottom bar a place uses (Ausrüstung and Material → Velos). */
export const barPlace = (place) => (SHARES_BIKES.includes(place) ? 'bikes' : place);
/**
 * The places in the bottom bar of a phone: five (Noah 15.10.2026 «1a»: «Woche» takes the place of «Material»
 * there; Material stays in the sidebar, under Ich › Material and with g m). Ausrüstung shares the slot of Velos.
 */
export const BAR_PLACES = PLACES.filter((p) => p.key !== 'gear');

/** Gesamttest 20.10.2026 B3: Touren › Fahrten, the Strava activities (the page Trips.svelte shows them on their own). */
export const RIDES_HREF = '#/trips/rides';
export function isRidesHash(h = '') {
  return /^#\/trips\/rides(\/|\?|$)/.test(h || '');
}

/**
 * v0.76.0 «Fünf Orte» 1: the pages under each place (sidebar on a computer). Only what is built
 * shows (Noah O2.1a: Neuland, Heft and the rest come with their package). v0.78.0: they are the tabs
 * on top of each place too (nav/PlaceTabs), at most four. match: the addresses that count as this entry.
 */
export const PLACE_TABS = {
  today: [],
  // «Woche planen» WP1–WP3: the week, the Sunday planning and the holidays
  week: [
    // UI-Ziele #6 (Noah 20.10.2026 «freigabe», 4a): «Ich» keeps data, settings and help; what you plan moved here.
    // Woche planen and Ferien are one tap from the week (its buttons), so «Woche» covers all of #/week.
    { key: 'week', label: 'Week|tab', href: '#/week', match: (h) => /^#\/week(\/|\?|$)/.test(h) },
    { key: 'agenda', label: 'Appointments|tab', href: '#/me/agenda', match: (h) => h.startsWith('#/me/agenda') || h.startsWith('#/calendar') },
    { key: 'notes', label: 'Notes|tab', href: '#/notes', match: (h) => h.startsWith('#/notes') },
    // «Tagebuch» (Noah 20.10.2026): what you write about your day sits next to the notes
    { key: 'tagebuch', label: 'Diary|tab', href: '#/tagebuch', match: (h) => h.startsWith('#/tagebuch') },
    { key: 'inbox', label: 'Inbox|tab', href: '#/inbox', match: (h) => h.startsWith('#/inbox') },
    { key: 'mail', label: 'Mail|tab', href: '#/me/mail', match: (h) => h.startsWith('#/me/mail') },
    { key: 'compass', label: 'Compass|tab', href: '#/me/compass', match: (h) => h.startsWith('#/me/compass') },
    { key: 'alltag', label: 'Everyday|tab', href: '#/me/alltag', match: (h) => h.startsWith('#/me/alltag') },
    { key: 'frei', label: 'Free time|tab', href: '#/me/frei', match: (h) => h.startsWith('#/me/frei') },
  ],
  trips: [
    { key: 'overview', label: 'Overview|tab', href: '#/trips', match: (h) => h.startsWith('#/trips') && !h.startsWith('#/trips/dreams') && !isRidesHash(h) },
    { key: 'templates', label: 'Templates', href: '#/pack/templates', match: (h) => h.startsWith('#/pack/templates') },
    { key: 'lookback', label: 'Look back|page', href: '#/debrief', match: (h) => h.startsWith('#/debrief') || h.startsWith('#/pack/past') || h.startsWith('#/neuland') || h.startsWith('#/heatmap') },
    // Paket N (Noah 19.10.2026 «1a»): dream tours with their season, races as event tours
    { key: 'dreams', label: 'Dreams|tab', href: '#/trips/dreams', match: (h) => h.startsWith('#/trips/dreams') },
    // v0.97.0 «Skitouren» (Noah 11.10.2026, 1: Touren › Skitouren): next tour, backpack check, start check, care
    { key: 'ski', label: 'Ski tours', href: '#/ski', match: (h) => h === '#/ski' || h.startsWith('#/ski/') || h.startsWith('#/ski?') || h === '#/mountain' || h.startsWith('#/mountain/') },
  ],
  gear: [
    { key: 'all', label: 'All|gear', href: '#/gear', match: (h) => (h.startsWith('#/gear') && !/[?&]view=wish\b/.test(h)) || h.startsWith('#/favorites') },
    { key: 'clothes', label: 'Clothes|tab', href: '#/wardrobe', match: (h) => h.startsWith('#/wardrobe') },
    { key: 'blocks', label: 'Building blocks', href: '#/blocks', match: (h) => h.startsWith('#/blocks') },
    // v0.78.0 «Fünf Orte» 2 (Noah O2.5a): «Einkauf» shows today's list (the wishlist); typing in comes with D2.
    { key: 'shop', label: 'Shopping|tab', href: '#/gear?view=wish', match: (h) => h.startsWith('#/gear') && /[?&]view=wish\b/.test(h) },
  ],
  bikes: [
    { key: 'overview', label: 'Overview|tab', href: '#/bikes', match: (h) => h.startsWith('#/bikes') && !/[?&]tab=(care|shop|compare|rig)/.test(h) },
    { key: 'care', label: 'Care|tab', href: '#/bikes?tab=care', match: (h) => h.startsWith('#/care') || (h.startsWith('#/bikes') && /[?&]tab=care/.test(h)) },
    { key: 'shop', label: 'Workshop|tab', href: '#/bikes?tab=shop', match: (h) => h.startsWith('#/bikes') && /[?&]tab=shop/.test(h) },
    { key: 'fit', label: 'Equipment|tab', href: '#/bikes?tab=compare', match: (h) => h.startsWith('#/bikes') && /[?&]tab=compare/.test(h) },
    // UC3 (Noah 14.10.2026 «1-5a»): «Setup», your setup per bike and the ideas of others
    { key: 'rig', label: 'My setup|tab', href: '#/bikes?tab=rig', match: (h) => h.startsWith('#/bikes') && /[?&]tab=rig/.test(h) },
  ],
  active: [
    { key: 'today', label: 'Today|active', href: '#/flow', match: (h) => /^#\/flow(\/week|\/rest|\/bags|\/review)?\/?$/.test(h.split('?')[0]) }, // v0.130.0 the week, recovery and the sport bag belong to Heute (mockups AK1–AK3); the Wochenrückblick too
    // «Meditation» (ME2) with its Rückblick (ME3) and timer pages; the second tab (Noah 15.10.2026 «1a»)
    { key: 'meditation', label: 'Meditation', href: '#/flow/act/meditation', match: (h) => isMedHash(h) },
    // «Training» TR2 (Noah 13.10.2026 «1-5a» 1a: its own tab in Aktiv): every Strava activity, one activity under it
    { key: 'training', label: 'Training|tab', href: '#/flow/training', match: (h) => /^#\/flow\/training(\/|\?|$)/.test(h) },
    // Gesamttest 20.10.2026 B3: the Strava activities, tab «Fahrten»; N1 (Noah 20.10.2026 «2a»): under Auswerten, same address
    { key: 'rides', label: 'Rides|tab', href: RIDES_HREF, match: (h) => isRidesHash(h) },
    { key: 'goals', label: 'Activities|tab', href: '#/flow/goals', match: (h) => /^#\/flow\/(goals|edit|new)(\/|\?|$)/.test(h) && !/[?&]from=activity\b/.test(h) },
    // hobby pages 1: Aktivität (tiles, milestones; the editor opened from a tile stays here)
    { key: 'activity', label: 'Activity|tab', href: '#/flow/activity', match: (h) => !isMedHash(h) && (/^#\/flow\/(activity|milestones|trophies|gipfelbuch|sports?(\/|\?|$)|act\/)/.test(h) || (h.startsWith('#/flow/') && /[?&]from=activity\b/.test(h))) },
    // Paket T «Freie Zeit» (Noah 19.10.2026 «1a und b»): Impulse, also under Ich › Freie Zeit
    { key: 'impulse', label: 'Impulses', href: '#/flow/impulse', match: (h) => /^#\/flow\/impulse/.test(h) },
    // N1: Erkenntnisse (resting pulse, sleep and rides together) under Auswerten, same address
    { key: 'insights', label: 'Insights|tab', href: '#/me/insights', match: (h) => h.startsWith('#/me/insights') },
    // UI-Ziele #6: the answers of «Wi gaht's?», what does you good and the weight are Auswerten too
    { key: 'history', label: 'How you are|tab', href: '#/me/abfragen', match: (h) => h.startsWith('#/me/history') || h.startsWith('#/me/abfragen') || h.startsWith('#/me/analysis') },
    { key: 'wohl', label: 'Good for me|tab', href: '#/me/wohl', match: (h) => h.startsWith('#/me/wohl') },
    { key: 'weight', label: 'Weight|tab', href: '#/me/weight', match: (h) => h.startsWith('#/me/weight') },
  ],
};

/** «Meditation» (ME2): the meditation page and its pages (timer, log, Rückblick). */
function isMedHash(h) {
  return /^#\/flow\/act\/meditation(\/|\?|$)/.test(h);
}

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
  if (page === 'timer') return 'today'; // «Timer» (Z2): opened from its tile on Heute
  if (page === 'check') return 'today'; // Tages-Check (Noah 18.10.2026): pages of Heute
  if (page === 'routine') return 'today'; // Routine «Das tut mir gut» (D2): opened from its tile on Heute
  if (page === 'flow') return 'active';
  if (page === 'impulse') return 'active'; // Paket T: Aktiv › Impulse
  // N1 + UI-Ziele #6 (Noah 20.10.2026): what you plan is Planen, what you look back on is Auswerten; Ich keeps data, settings, help
  if (['week', 'agenda', 'calendar', 'notes', 'tagebuch', 'inbox', 'mail', 'compass', 'alltag', 'frei'].includes(page)) return 'week';
  if (['stravarides', 'insights', 'history', 'abfragen', 'analysis', 'wohl', 'weight'].includes(page)) return 'active';
  if (['trips', 'dreams', 'between', 'pack', 'templates', 'past', 'ride', 'debrief', 'rides', 'share', 'review', 'ski', 'mountain', 'quiz', 'chronik', 'gelernt', 'jahr', 'neuland', 'heatmap', 'spur', 'tour', 'travel', 'race', 'live', 'fuel'].includes(page)) return 'trips';
  if (page === 'gear' || page === 'supplies' || page === 'lend' || page === 'power' || page === 'gearimport' || page === 'favorites' || page === 'blocks' || page === 'blockcheck' || page === 'wardrobe') return 'gear';
  if (page === 'bikes' || page === 'care') return 'bikes';
  if (page === 'equipment') return 'equipment';
  if (page === 'me' || page === 'aiprojects' || page === 'tools' || page === 'weblinks' || page === 'hinweise' || page === 'compass' || page === 'next' || page === 'wohl' || page === 'inbox' || page === 'features' || page === 'helper' || page === 'assistent' || page === 'offers' || page === 'privacy' || page === 'pros' || page === 'push' || page === 'look' || page === 'data' || page === 'docs' || page === 'docscan' || page === 'connections' || page === 'mail' || page === 'fitbit' || page === 'weight' || page === 'phone' || page === 'news' || page === 'checks' || page === 'abfragen' || page === 'history' || page === 'analysis' || page === 'handbook' || page === 'miniapps' || page === 'inspiration' || page === 'lists' || page === 'pay' || page === 'invoices' || page === 'invoice' || page === 'bills' || page === 'shop' || page === 'shoporders' || page === 'werte' || page === 'reminders' || page === 'calendar' || page === 'list') return 'me'; // Kalender: own place once Noah chose the 5 phone places (decision 11.10 1a)
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
