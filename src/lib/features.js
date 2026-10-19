/**
 * v0.96.0 «F1 Alles finden» (Noah 11.10.2026, mockups A/B «1-5 a», Trello vaSqiSQb): every function
 * of the app in one catalogue, sorted by the situation you are in (before the trip, packing and on
 * the way, after the trip, bike, active, data and app). «What the app can do» (#/features) shows it
 * with what you never used on top of each group, and the search finds a function by its words.
 *
 * An entry either reuses a tip of Good to know (tips.js: its title, text and button) or has its own
 * title, text and where it leads: href (a page; «{bike}» is the first bike) or run (an action the
 * screen carries out: trip, wear, note, km, problem, data, play, search).
 * seen: a key of what the data shows as used (see seenOf); a tap on «Take me there» counts too.
 * play: «Try it» starts the playground on that day (play.js: pack, ride, after).
 * Titles and texts are English keys for t(); words: what the search matches besides them.
 * Pure (no database, no screen), tested in tests/features.test.js.
 */
import { TIP, isUsed, tipState } from './tips.js';

/** The situations, in order (labels are English keys for t()). */
export const FEATURE_GROUPS = [
  { key: 'before', label: 'Before the trip', icon: 'compass' },
  { key: 'onway', label: 'Packing and on the way', icon: 'backpack' },
  { key: 'after', label: 'After the trip', icon: 'book' },
  { key: 'bike', label: 'Bike|features', icon: 'bike' },
  { key: 'active', label: 'Active|features', icon: 'leaf' },
  { key: 'data', label: 'Data and app', icon: 'save' },
];

/**
 * The same functions by the place of the app they live on (Noah «1 a und b beides umstellbar»,
 * Trello vaSqiSQb): «What the app can do» switches between situation and page.
 */
export const PAGE_GROUPS = [
  { key: 'trips', label: 'Trips|place', icon: 'compass' },
  { key: 'gear', label: 'Gear|place', icon: 'backpack' },
  { key: 'bikes', label: 'Bikes|place', icon: 'bike' },
  { key: 'flow', label: 'Active|place', icon: 'leaf' },
  { key: 'me', label: 'Me|place', icon: 'save' },
];
const PAGE_OF = [
  [/^#\/(pack|ride|debrief|trips)/, 'trips'],
  [/^#\/(gear|wardrobe|blocks)/, 'gear'],
  [/^#\/(bikes|equipment)/, 'bikes'],
  [/^#\/flow/, 'flow'],
];
const RUN_PAGE = { quick: 'trips', trip: 'trips', wear: 'gear', problem: 'bikes', km: 'bikes', receipt: 'bikes' };

/**
 * The place a function lives on (a key of PAGE_GROUPS): from where it leads, else its action;
 * a trip function that opens a bike (an event's preparation) stays with the trips; the rest is Me.
 */
export function pageOf(f) {
  const href = f.tip ? (TIP[f.tip].go?.href ?? '') : (f.href ?? '');
  const trip = f.group === 'before' || f.group === 'onway' || f.group === 'after';
  for (const [re, k] of PAGE_OF) if (re.test(href)) return trip && k === 'bikes' ? 'trips' : k;
  if (f.run && RUN_PAGE[f.run]) return RUN_PAGE[f.run];
  if (!href && f.group === 'bike') return 'bikes';
  if (!href && trip) return 'trips';
  return 'me';
}

/** Where each tip of Good to know belongs. */
const TIP_GROUP = {
  dayride: 'before', blocks: 'before', templates: 'before', gpx: 'before', homeweather: 'before', wxsuggest: 'before', weigh: 'before', fav: 'before', wish: 'before', unused: 'before',
  bags: 'onway', share: 'onway', ride: 'onway', note: 'onway', event: 'onway',
  debrief: 'after', learn: 'after', pace: 'after', trend: 'after',
  setup: 'bike', care: 'bike', order: 'bike', receipt: 'bike', km: 'bike',
  backup: 'data', install: 'data', lang: 'data', demo: 'data',
};
const TIP_PLAY = { bags: 'pack', share: 'pack', ride: 'ride', debrief: 'after' };

/** The functions that are not a tip. */
const OWN = [
  // Before the trip
  // v0.119.0 «Schnellstart» (Q1–Q3): one click on Today plans a ride for today; «Take me there» opens Today
  { id: 'f.quickstart', group: 'before', title: 'Quick start', text: 'One click on Today plans a ride for today: 2.5 h, the bike you rode last, the standard items and the weather.', run: 'quick', words: 'schnellstart quick start tagestour sofort ein klick heute' },
  { id: 'f.plan', group: 'before', title: 'Plan a trip', text: 'One window «Conditions»: sport, when, how long, the weather from your postcode, the event and the packing list in groups.', run: 'trip', seen: 'trips', words: 'tour planen neue tour new trip' },
  // v0.124.0 «Neue Tour Teil 2» (B4/B5): the building blocks as big buttons in Packen; Repair slim for the ride
  { id: 'f.packblocks', group: 'before', title: 'Building blocks when packing', text: 'Big buttons in Packen: one tap adds or removes a whole block; Repair slimmed to at most 8 parts for the ride.', href: '#/pack?day', words: 'bausteine packen reparatur unterwegs schlank knöpfe' },
  { id: 'f.tripstate', group: 'before', title: 'Trip states', text: 'Every trip shows its state: Planned, Completed or Rated, on Touren, in the trip header and on Today.', href: '#/trips', words: 'zustand geplant abgeschlossen bewertet status touren' },
  { id: 'f.wear', group: 'before', title: 'What do I wear?', text: 'Clothing for the coldest hour of a day ride, from your own wardrobe.', run: 'wear', words: 'anziehen kleider outfit' },
  { id: 'f.onion', group: 'before', title: 'Layer check', text: 'Checks every layer for the coldest riding hour and suggests the kit.', href: '#/pack', play: 'pack', words: 'zwiebel schicht kit temperatur' },
  { id: 'f.shop', group: 'before', title: 'Shopping and charging list', text: 'What you buy and charge 2 days before the trip.', href: '#/pack?shop', play: 'pack', words: 'einkauf einkaufsliste laden ladeliste akku' },
  { id: 'f.ballast', group: 'before', title: 'Ballast card', text: 'What came along and was not used: leave it at home or keep it.', href: '#/pack', words: 'ballast zu hause lassen leichter' },
  { id: 'f.tripbike', group: 'before', title: 'Compare bikes for a trip', text: 'Which bike is lighter for this trip; switch with one tap.', href: '#/pack', play: 'pack', words: 'velo wechseln vergleichen' },
  { id: 'f.switch', group: 'before', title: 'Switch to another trip', text: 'The small «more» button in the dark trip band lists every trip.', href: '#/pack', words: 'andere tour wechseln' },
  { id: 'f.assistent', group: 'before', title: 'Assistant', text: 'Ask the app a question about your data, or let it help you plan a trip. Free; Claude only with the AI helper on.', href: '#/assistent', words: 'assistent frag app fragen planen hilfe ki chrome claude' },
  { id: 'f.ask', group: 'before', title: 'Ask the helper', text: 'A few words become a packing list suggestion (with the helper code only).', href: '#/helper', words: 'helfer ki frag vorschlag claude' },
  { id: 'f.wardrobe', group: 'before', title: 'Wardrobe', text: 'Clothing by layer and zone; gaps go to the wishlist.', href: '#/wardrobe', words: 'kleiderschrank kleider schicht zone' },
  { id: 'f.kit', group: 'before', title: 'Save as a kit', text: 'Save an outfit as a kit; planning then suggests it.', href: '#/wardrobe', words: 'kit outfit speichern' },
  { id: 'f.lighter', group: 'before', title: 'Lighter alternatives', text: 'Open an item, then its weight: lighter things from your own gear.', href: '#/gear', words: 'leichter alternative gewicht' },
  { id: 'f.lists', group: 'before', title: 'Your own categories', text: 'Me › Lists and types: rename categories, add your own, hide, delete, change the order.', href: '#/me/lists?categories', words: 'kategorie kategorien liste listen eigene umbenennen standard' },
  // «Alles selbst bearbeiten» (Noah 19.10.2026): every kind of data can be added, renamed and deleted
  { id: 'f.editall', group: 'before', title: 'Change everything yourself', text: 'Bikes, problems, learnings, rides, ideas, logbook entries and the lists (sports, places on the bike, care parts): add, rename and delete them yourself. Deleting asks first and can be undone.', href: '#/me/lists', words: 'bearbeiten umbenennen löschen hinzufügen velo löschen sportart eigene alles ändern' },
  { id: 'f.select', group: 'before', title: 'Select many items', text: 'Category, bag, archive or a building block for many items at once.', href: '#/gear', words: 'auswählen mehrere viele' },
  { id: 'f.merge', group: 'before', title: 'Merge duplicates', text: '«Merge with …» at the bottom of an item joins two items into one.', href: '#/gear', words: 'doppelt zusammenlegen zusammenführen' },
  { id: 'f.blockcheck', group: 'before', title: 'Check building blocks', text: 'One block after the other: keep, out or elsewhere.', href: '#/blocks/check', words: 'bausteine prüfen aufräumen' },
  { id: 'f.gearimport', group: 'before', title: 'Import a gear list', text: 'Check an imported list: take the safe rows, the others with one tap each.', href: '#/gear/import', words: 'import liste excel' },
  // Packing and on the way
  { id: 'f.tripcheck', group: 'onway', title: 'Checks before and after', text: 'The evening before and after the trip: a list per trip type, tick, sort, add, for one trip or all.', href: '#/me/checks', words: 'vorabend check schluss check lawinenbulletin felle trocknen' },
  { id: 'f.basecheck', group: 'onway', title: 'Basic check before every ride', text: 'Lock, bottle, glasses, helmet, batteries, tyre pressure, phone, keys.', href: '#/ride', play: 'ride', words: 'basischeck startcheck schloss helm' },
  { id: 'f.dayblocks', group: 'onway', title: 'The day in blocks', text: 'Every 3 hours: dress, eat, light, and your arrival at your own pace.', href: '#/ride', play: 'ride', words: 'jetzt karte blöcke ankunft' },
  { id: 'f.evening', group: 'onway', title: 'Evening block', text: 'On a trip of several days: charge tonight, lay out for tomorrow.', href: '#/ride', play: 'ride', words: 'abend laden morgen bereitlegen' },
  { id: 'f.ridenote', group: 'onway', title: 'Note on the way', text: 'A note for the trip and the day; it lands in the debrief.', href: '#/ride', play: 'ride', words: 'notiz unterwegs' },
  { id: 'f.finish', group: 'onway', title: 'End the trip', text: 'Ends the trip, earlier too, with Undo; then the next step.', href: '#/ride', play: 'ride', words: 'tour beenden fertig' },
  // v0.133.0 «Tour aus komoot» (SN1b–SN1d): suggestions near you, a shared tour becomes a planned trip
  // v0.134.0 «Inspiration» (UC2-1, UC2-2, UC2-4): your own links, the kind from the address, a note becomes a packing rule
  { id: 'f.inspiration', group: 'before', title: 'Inspiration', text: 'Your own links to rigs, routes, videos and races; the kind comes from the address, a note becomes a packing rule.', href: '#/inspiration', words: 'inspiration links link rig route video packliste packregel wunschliste rennen kalender ics ideen' },
  // 0.156.0 «Sportart statt Tourart» (SA1–SA3): one sports list, a standard bike per sport, old trips get a sport
  { id: 'f.sports', group: 'before', title: 'Sport of a trip', text: 'Fahrrad, Gravel, Cross Country, Downhill, Bikepacking, Ski touring or Hiking: each bike sport brings its own standard bike.', href: '#/trips', words: 'sportart sport gravel cross country xc downhill bikepacking skitour wandern standard velo' },
  { id: 'f.komoot', group: 'before', title: 'Tour from komoot', text: 'komoot opens with suggestions near you; a tour shared from komoot becomes a planned trip.', href: '#/trips', words: 'komoot route vorschlag gpx teilen geplant' },
  // After the trip
  { id: 'f.unneeded', group: 'after', title: 'What did you not need?', text: 'Tap what stayed in the bag; the app counts how much lighter it could be.', href: '#/debrief', play: 'after', words: 'nicht gebraucht rückblick' },
  { id: 'f.missing', group: 'after', title: 'What was missing?', text: 'Missing things suggest similar items or go to the wishlist.', href: '#/debrief', play: 'after', words: 'gefehlt fehlt wunschliste' },
  { id: 'f.upload', group: 'after', title: 'Upload a ride (GPX)', text: 'Distance, climbing, pauses, planned against real, up to 3 learnings.', href: '#/debrief/ride', seen: 'rides', words: 'fahrt hochladen gpx tcx' },
  { id: 'f.past', group: 'after', title: 'Past trips', text: 'A table with km, climbing, time, rain and the learning of each trip.', href: '#/pack/past', words: 'vergangene touren tabelle' },
  { id: 'f.logbook', group: 'after', title: 'Logbook', text: 'A diary of all trips, old ones too; filter by year and kind.', href: '#/debrief/logbook', seen: 'events', words: 'logbuch tagebuch excel' },
  { id: 'f.learnings', group: 'after', title: 'Learnings', text: 'All learnings by topic, with a search.', href: '#/debrief/learnings', seen: 'learnings', words: 'gelernt learnings' },
  { id: 'f.best', group: 'after', title: 'Best values', text: 'Longest trip, longest day, most climbing, from your GPX.', href: '#/trips', words: 'bestwerte rekord schnitt' },
  // Bike
  { id: 'f.kmimport', group: 'bike', title: 'Import rides', text: 'A Strava export or Garmin files: km per bike, by sensor or your rules.', href: '#/bikes?tab=care&view=import', seen: 'imports', words: 'strava garmin fit import fahrten km' },
  // v0.116.0 «Strava-Verbindung» (E3)
  { id: 'f.strava', group: 'bike', title: 'Strava connection', text: 'Rides with their bike from Strava, fetched by themselves; a changed bike asks first.', href: '#/bikes?tab=care&view=strava', words: 'strava verbinden fahrten holen automatisch velo km' },
  // v0.132.0 «Velo-Setup» (UC3-1 to UC3-3)
  { id: 'f.velosetup', group: 'bike', title: 'Bike setup and race rigs', text: 'Your setup photos, the total weight, your race-rig links and races, and your bike compared.', href: '#/bikes?tab=rig', words: 'setup race rig bikepacking fotos gewicht rennen vergleich links' },
  { id: 'f.standardbike', group: 'bike', title: 'Standard bike and order', text: 'The first bike is your standard bike (★); arrows set the order, and you choose what a new trip brings.', href: '#/bikes?tab=setup', words: 'standard velo stern reihenfolge pfeile neue tour zuletzt gefahren' },
  { id: 'f.bagplan', group: 'bike', title: 'Bag plan', text: 'Which bag sits where, weight front, middle and rear, hints to move an item.', href: '#/bikes?tab=rig&view=bags', words: 'taschen plan gewicht verteilung vorne hinten umpacken' },
  // v0.147.0 «Taschen-Setups» (TS0–TS5)
  { id: 'f.bagsetups', group: 'bike', title: 'Bag setups per bike', text: 'Several bag setups per bike: which bags and what goes where, weights, compare two or all, choose one when planning.', href: '#/bikes?tab=rig', words: 'taschen setup setups vergleichen basisgewicht flasche bikepacking' },
  { id: 'f.setuplog', group: 'bike', title: 'Setup log', text: 'What you changed on the bike, the km since and how the first trip after it felt.', href: '#/bikes?tab=rig&view=log', words: 'logbuch änderung kettenblatt reifen werkstatt' },
  // v0.146.0 «Garmin-Seiten» (GA-1 to GA-10, GA-A1 to GA-A3)
  { id: 'f.garmin', group: 'bike', title: 'Garmin pages', text: 'Model data pages for the Edge 1040 and 850 per bike, with the reason for every value.', href: '#/bikes', words: 'garmin edge 1040 850 540 datenseiten datenfelder profil aktivitätsprofil connect iq zonen' },
  { id: 'f.problem', group: 'bike', title: 'Problem on the bike', text: 'One problem per row with priority and deadline; the app sorts who fixes it.', run: 'problem', seen: 'problems', words: 'problem reparatur kaputt frist' },
  { id: 'f.workshop', group: 'bike', title: 'Workshop and receipts', text: 'Visits with amount, work and receipt photo; costs per year and per 1000 km.', href: '#/bikes?tab=shop', seen: 'visits', words: 'werkstatt besuch beleg kosten' },
  { id: 'f.equipment', group: 'bike', title: 'Equipment', text: 'Every part like a maker’s data sheet: name, details, weight, price.', href: '#/bikes?tab=compare', words: 'ausstattung teile datenblatt' },
  { id: 'f.bikecompare', group: 'bike', title: 'Compare bikes', text: 'Only rows with a value; on a phone two bikes side by side.', href: '#/bikes?tab=compare&view=all', words: 'velos vergleichen' },
  { id: 'f.folder', group: 'bike', title: 'Bike folder', text: 'Bike pass, service plan, workshop order and pickup check, as PDF.', href: '#/bikes?bike={bike}&sheet=all', words: 'mappe blätter pass pdf' },
  { id: 'f.breakin', group: 'bike', title: 'Break-in plan', text: 'A new bike: 4 steps to the first service, with a reminder on Today.', href: '#/bikes?bike={bike}&sheet=breakin', words: 'einfahren neues velo' },
  { id: 'f.repairkit', group: 'bike', title: 'Repair kit', text: 'Fits the parts of your bike; missing things go to Gear.', href: '#/bikes?bike={bike}&sheet=kit', words: 'repair kit werkzeug ersatz' },
  { id: 'f.warranty', group: 'bike', title: 'Warranty and receipts', text: 'Reminds you 30 days before a warranty ends; also as a calendar file.', href: '#/bikes?bike={bike}&sheet=warranty', words: 'garantie beleg kalender ics' },
  { id: 'f.theft', group: 'bike', title: 'Theft sheet', text: 'Frame number, photos and insurance, ready for the police.', href: '#/bikes?bike={bike}&sheet=theft', words: 'diebstahl polizei rahmennummer' },
  { id: 'f.partstart', group: 'bike', title: 'Start point of a part', text: 'When and at which km a part was fitted, from another bike too.', href: '#/bikes?tab=care', words: 'teil montiert startpunkt' },
  { id: 'f.prep', group: 'bike', title: 'Before the trip in the workshop', text: 'From 14 days before a trip: what the workshop still has to do.', href: '#/bikes?tab=care', words: 'werkstatt vor der tour service' },
  // Active
  { id: 'f.tick', group: 'active', title: 'Tick off today', text: 'One tap per activity, with Undo, on Today too.', href: '#/flow', seen: 'flowLog', words: 'abhaken aktivität' },
  { id: 'f.check', group: 'active', title: 'Rings and daily check', text: 'Move, mindful and recovery over 7 days; sleep, energy and mood.', href: '#/flow', seen: 'flowChecks', words: 'ringe tagescheck schlaf energie stimmung' },
  { id: 'f.stopwatch', group: 'active', title: 'Stopwatch with singing bowl', text: 'Long press an activity; it keeps running on every page.', href: '#/flow', words: 'stoppuhr countdown klangschale' },
  { id: 'f.goals', group: 'active', title: 'Goals and days', text: 'Rolling windows: daily, 7, 10 or 30 days, with a season.', href: '#/flow/goals', words: 'ziele tage saison' },
  // v0.125.0 «Werte überall» (WU3): year goals for km, metres climbed and minutes, and the footprint
  { id: 'f.yeargoals', group: 'active', title: 'Year goals and footprint', text: 'One year goal each for km, metres climbed and minutes, each can be switched off; the CO₂ your rides saved.', href: '#/flow/goals', words: 'jahresziel höhenmeter hm fussabdruck co2 km ziel jahr' },
  // v0.133.0 «Wi gaht's?» (AB1–AB6, WG): the questions with their own rhythm, two fixed rounds, history and analysis
  // v0.147.0 Paket B: Termine buchen (BU1–BU5): people book your free times through a link
  { id: 'f.offers', group: 'active', title: 'Offers', text: 'Open free times for tennis, a guided tour or a bike service; people book them through one link, without the app.', href: '#/me/offers', words: 'termine buchen angebote tennis lektion schüler tour service kalender link' },
  // v0.147.0 Paket B: Shop ohne Gebühren (SHOP1–SHOP4b)
  { id: 'f.webshop', group: 'data', title: 'Shop without fees', text: 'Sell downloads, codes or things to send: one shop link, no app or account needed; people pay with TWINT or a QR bill, you see the orders.', href: '#/me/shop', words: 'shop laden verkaufen produkt bestellung versand download code twint qr porto vorrat' },
  { id: 'f.abfragen', group: 'active', title: 'Your questions', text: 'Playful questions with their own rhythm, a morning and an evening round, a history and an analysis.', href: '#/me/abfragen', words: 'wi gahts fragen tagescheck morgen abend runde verlauf auswertung schlaf stimmung' },
  // v0.136.0 «Inhalte Flow» IF1–IF3 + «Wusstest du» WD1–WD3
  { id: 'f.pagetips', group: 'active', title: 'Tips and «Did you know»', text: 'One tip a day on twelve places, what the app can do there and examples to keep as a note; Earth and Everest in Past trips.', href: '#/flow', words: 'tipp tipps wusstest du wissen links kacheln erde everest föhn hitze regen wind beispiel notiz kleider kette hinweis erklärung was hier steht' },
  // «Training» TR2 (Noah 13.10.2026 «1-5a»): every Strava activity with its heart rate zones
  { id: 'f.training', group: 'active', title: 'Training with heart rate zones', text: 'Every activity from Strava with the minutes in each zone; plan the week and look back.', href: '#/flow/training', words: 'training puls pulszonen zonen strava aktivität lauf wandern herzfrequenz' },
  { id: 'f.analyses', group: 'active', title: 'Power and analyses', text: 'With a power meter: power, load and power curve on each ride; analyses on the activity and over the weeks, each can be hidden.', href: '#/flow/training', words: 'leistung watt ftp belastung form fitness analysen leistungskurve vam anstiege trittfrequenz' },
  { id: 'f.weekreview', group: 'active', title: 'Week in review', text: 'Your week in five numbers, a strip Monday to Sunday, highlights and one suggestion for next week; observation only.', href: '#/flow/review', words: 'wochenrückblick woche rückblick zusammenfassung höhepunkte wochenstreifen schlaf stimmung' },
  { id: 'f.weight', group: 'data', title: 'Weight', text: 'Voluntary, only on this device: your weight with a curve, for watts per kg.', href: '#/me/weight', words: 'gewicht kg watt pro kg wkg' },
  { id: 'f.milestones', group: 'active', title: 'Milestones', text: 'Only the next star, and a reward from the wishlist.', href: '#/flow/milestones', seen: 'flowStars', words: 'meilensteine sterne belohnung' },
  { id: 'f.meditation', group: 'active', title: 'Meditation', text: 'Start like last time or from a template; sounds and a calm clock.', href: '#/flow/act/meditation', seen: 'flowSessions', words: 'meditation kissenzeit gong' },
  { id: 'f.medlog', group: 'active', title: 'Meditation log', text: 'Every session, a streak heat map, the best time of day.', href: '#/flow/act/meditation/log', words: 'protokoll wärmebild serie' },
  // v0.135.0 «Meditation und Timer» (ME3, Z1–Z5)
  { id: 'f.medreview', group: 'active', title: 'Meditation look back', text: 'Week, month or year: days, minutes, the calendar and what helps you.', href: '#/flow/act/meditation/rueckblick', words: 'rückblick woche monat jahr kalender' },
  { id: 'f.gipfelbuch', group: 'active', title: 'Summit book', text: 'Passes, summits, trails and halls you reached, for every sport; the app finds tops in your rides and you confirm; stars for new places.', href: '#/flow/gipfelbuch', words: 'gipfelbuch pass gipfel orte höchster punkt trail halle meilenstein' },
  // Skitour AU1 «Ausrüstung» (Noah 15.10.2026 «5b»): own ID, f.equipment is the bike parts' data sheet
  { id: 'f.skiequipment', group: 'bike', title: 'Main equipment', text: 'Skis, skins, transceiver and the like for each sport: a counter of uses and the care, due on Today too.', href: '#/equipment', words: 'ausrüstung hauptausrüstung ski felle lvs pflege zähler einsatz' },
  // Paket E 0.149.0: Merken + Eigene Listen (PL3), Erinnerungen ER1–ER3, Geburtstage + Pflanzen, Werte messen W5–W6
  { id: 'f.remember', group: 'data', title: 'Remember and own lists', text: 'Calendar › Remember: your own to-dos, lists like «My ideas» and what the app reminds you of, in one place.', href: '#/calendar', words: 'merken todo aufgaben liste ideen kalender' },
  { id: 'f.reminders', group: 'data', title: 'Reminders', text: 'Me › Reminders: after a ride, before a trip or after bike care the app asks once; every reminder can be switched off.', href: '#/me/reminders', words: 'erinnerung erinnern fragen nie fragen' },
  { id: 'f.birthdays', group: 'data', title: 'Birthdays and plants', text: 'Birthdays and plants to water in Me › Reminders, shown in Calendar › Remember when it is time.', href: '#/me/reminders', words: 'geburtstag pflanzen giessen' },
  { id: 'f.measure', group: 'bike', title: 'Measure pressure and chain', text: 'Today records the tyre pressure and measures the chain; Enter values suggests a target pressure, the pick-up check checks both.', href: '#/bikes?tab=compare&view=enter', words: 'reifendruck druck kette messen abholcheck' },
  // Routine «Das tut mir gut» (mockups D1 + D2, Noah 12.10.2026 «d1-d5 freigeben»)
  { id: 'f.routine', group: 'active', title: 'What does me good', text: 'A short daily list on Today: tick it off, see days in a row; meditation ticks itself.', href: '#/routine', words: 'routine das tut mir gut vorsätze gewohnheit gewohnheiten habit abhaken serie aufstehen' },
  // Erkenntnisse (Noah 19.10.2026 «4b» + own page): observation only, no cause and no diagnosis
  { id: 'f.insights', group: 'active', title: 'Insights', text: 'What goes together in your data: sleep, battery, mood, rides, meditation and resting pulse; the strongest three in the analysis.', href: '#/me/insights', words: 'erkenntnisse zusammenhang auswertung schlaf akku stimmung ruhepuls muster' },
  { id: 'f.timer', group: 'active', title: 'Timer', text: 'Count up, countdown, interval, Pomodoro or until a time; five faces, a log with notes.', href: '#/timer', seen: 'timerLog', words: 'timer countdown intervall pomodoro uhr log' },
  { id: 'f.medmore', group: 'active', title: 'Meditation · more', text: 'Listen to the sounds; kinds, places, quotes and your own links.', href: '#/flow/act/meditation/mehr', words: 'klänge zitate links' },
  // Data and app
  { id: 'f.search', group: 'data', title: 'Search commands', text: '«kette geölt gravel» enters it right away; «notiz …» writes a note.', run: 'search', words: 'suche befehl befehle' },
  { id: 'f.inbox', group: 'data', title: 'Inbox', text: 'Notes by day; «File as …» with 7 targets; a receipt becomes a workshop visit.', href: '#/inbox', words: 'eingang ablegen' },
  { id: 'f.notes', group: 'data', title: 'Notes', text: 'Write, dictate, photo, link, checklist; topics, #tags, pin up to 3.', href: '#/notes', seen: 'notes', words: 'notizen checkliste tags' },
  // P3b «Daten sicher»: Ich › Dokumente (D3/D4) and the exchange between phone and computer
  { id: 'f.docs', group: 'data', title: 'Documents', text: 'Passport, insurance and emergency sheet as PDF or photo; a reminder before they expire and «ID and cash with you?» in the packing list.', href: '#/me/docs', words: 'dokumente pass ausweis id versicherung notfall pdf gültig ablauf erinnerung cash packliste' },
  { id: 'f.sync', group: 'data', title: 'Phone and computer', text: 'Send the backup file to the other device; it says which is newer and suggests what to do, with a copy of before.', href: '#/me/data', words: 'abgleich handy computer synchron sync teilen backup neuer älter zusammenführen' },
  // P8 «Automatischer Abgleich» (Noah 18.10.2026 «1b … 2b 3b»)
  { id: 'f.autosync', group: 'data', title: 'Automatic sync', text: 'Phone and computer keep the same data by themselves, sealed with a code; when both changed the same entry, the app asks which version counts.', href: '#/me/data', words: 'abgleich automatisch synchron sync koppeln code handy computer server verschlüsselt konflikt beide geändert' },
  // P3b Teil 3 «Kamera überall»: the camera wherever a photo is added, a receipt with several pages
  { id: 'f.camera', group: 'data', title: 'Camera everywhere', text: 'On the phone the camera opens with one tap for a note, an item, a bike, a setup and a problem; a receipt can have several pages.', href: '#/bikes?tab=shop', words: 'kamera foto fotografieren beleg quittung seite galerie bild' },
  // v0.147.0 Paket B: «Fitbit verbinden» (G1–G2)
  { id: 'f.docscan', group: 'data', title: 'Documents as PDF', text: 'Photograph a document or choose photos from the gallery: the app straightens the pages, reads the text and keeps a PDF, also in your Google Drive.', href: '#/me/docs', words: 'dokument pdf scan scannen foto fotografieren quittung brief garantie ablage drive google galerie text' },
  // v0.147.0 Paket B: GM «Mail in der App»
  { id: 'f.mail', group: 'data', title: 'Mail from Gmail', text: 'Your Gmail inbox in the app: read, search, answer and write; the mails to an appointment with one tap.', href: '#/me/mail', words: 'mail email e-mail gmail google posteingang senden antworten schreiben' },
  { id: 'f.agenda', group: 'data', title: 'Google calendar and tasks', text: 'Your Google calendar and Google Tasks in the app: see the next 14 days, enter appointments, tick and add tasks.', href: '#/me/agenda', words: 'google kalender termine termin aufgaben tasks to-do todo agenda woche planen' },
  { id: 'f.fitbit', group: 'data', title: 'Fitbit connection', text: 'Sleep, resting heart rate, HRV, steps and active zone minutes from your watch, fetched by themselves; observation only.', href: '#/me/fitbit', words: 'fitbit google gesundheit schlaf ruhepuls hrv schritte aktivzonen uhr' },
  { id: 'f.autobackup', group: 'data', title: 'Auto backup into a folder', text: 'Writes after every change into a folder you choose (computer only).', run: 'data', seen: 'folder', words: 'auto backup ordner' },
  // v0.139.0 «Rechnungen ohne Gebühren» (mockups QR1–QR9, Noah 14.10.2026 04:00 and 05:10 «a»)
  { id: 'f.invoices', group: 'data', title: 'Invoices with QR bill and TWINT', text: 'A Swiss QR bill from your account with TWINT; see who paid by hand, by amount, from the bank statement or the pay link.', href: '#/me/pay/invoices', words: 'rechnung qr-rechnung twint bezahlt kontoauszug camt geld erhalten zahl-link' },
  { id: 'f.bills', group: 'data', title: 'Bills to pay', text: 'Photograph a bill you got: the app reads it, reminds you before it is due and keeps the photo.', href: '#/me/pay/bills', words: 'zu zahlen rechnung fällig erinnerung beleg foto' },
  { id: 'f.tidy', group: 'data', title: 'Tidy up test data', text: 'Everything with «test» in its name: archive it, with Undo.', href: '#/me', words: 'testdaten aufräumen archiv' },
  { id: 'f.playground', group: 'data', title: 'Playground', text: 'A made-up trip: pack, ride and debrief; afterwards all is as before.', run: 'play', seen: 'play', words: 'ausprobieren spielwiese spielplatz' },
  { id: 'f.helper', group: 'data', title: 'Helper', text: 'The code stays on this device, with a monthly limit; you see what goes to Claude.', href: '#/helper', words: 'helfer ki code limit kosten modell haiku sonnet' },
  { id: 'f.shortcuts', group: 'data', title: 'Keyboard shortcuts', text: 'g h, g t … switch places, n = New, / = search, ? = the list.', href: '#/me', words: 'tastenkürzel tastatur' },
  { id: 'f.ownvalues', group: 'data', title: 'Set your own numbers', text: 'Me › Own values: the packing step, the backup reminder, the bike check, chain wax, sealant, fork service, the workshop lead and «cold».', href: '#/me/werte', words: 'eigene werte einstellungen packtage backup erinnerung velo check kette wachsen dichtmilch gabel werkstatt vorlauf kalt standard' },
  { id: 'f.push', group: 'data', title: 'Reminders on the phone', text: 'Birthdays, plants, the evening before, the tour weather, the workshop and the backup as a message on the phone; each one switched on by itself.', href: '#/me/push', words: 'erinnerung erinnerungen handy benachrichtigung push nachricht geburtstag pflanze wetter' },
  { id: 'f.theme', group: 'data', title: 'Light, dark and colours', text: 'Font, colour world, text size and light or dark, under Me › Appearance.', href: '#/me/look', words: 'hell dunkel farben stil schrift grösse darstellung' },
  // v0.110.0 Design-Refresh P10 (I11): Ich › Was ist neu, the newest version, every function and all versions
  // v0.117.0 «Knöpfe neu» (N1–N4): every button explains itself; «…» lists the rest with a line each
  { id: 'f.explain', group: 'data', title: 'Buttons explain', text: 'Point at a button or hold it: it says what it does; «…» lists the rest, each with one line.', href: '#/bikes?tab=care', words: 'knöpfe erklärung tooltip lange drücken mehr rückgängig' },
  { id: 'f.news', group: 'data', title: 'What is new', text: 'The newest version, every function one by one and all versions by month.', href: '#/me/news', words: 'neu neuigkeiten update version was ist neu top 10' },
  // Paket M «Aus Touren lernen» (Noah 19.10.2026)
  { id: 'f.diary', group: 'after', title: 'Tour diary', text: 'When you open the debrief, a draft of a diary is there: Strava rides, weather, notes and what was new; photos of those days stay on the device.', href: '#/debrief', words: 'tagebuch tour entwurf fotos strava wetter notizen erinnerung' },
  { id: 'f.extraq', group: 'after', title: 'More questions in the debrief', text: '10 optional questions; the 2 that fit the trip best show open; change, switch off or add your own.', href: '#/debrief', words: 'zusatzfragen fragen rückblick lernen moment anders' },
  { id: 'f.notetodo', group: 'after', title: 'Notes become to-dos', text: 'A note on the way becomes a to-do with one tap: in a checklist, one of your notes or Google Tasks.', href: '#/debrief', words: 'notiz to-do aufgabe checkliste google tasks erledigen nach der tour' },
  { id: 'f.future', group: 'after', title: 'A message to your future self', text: 'Write a sentence in the debrief; on the way of your next trip a letter «Mail from you!» waits.', href: '#/debrief', words: 'nachricht zukunft brief ich tipp nächste tour' },
  { id: 'f.quiz', group: 'before', title: 'Quiz the evening before', text: 'Three questions about your gear and route the evening before a trip, with a streak; add your own questions.', href: '#/quiz', words: 'quiz vorabend fragen serie tasche gewicht route lernen eigene' },
  { id: 'f.observations', group: 'active', title: 'Three observations a week', text: 'Every Sunday three observations from your data in the week review, e.g. sleep after riding or the days after a long tour, each with a small chart.', href: '#/flow/review', words: 'beobachtungen woche wochenrückblick schlaf ruhepuls nachwirkung auswertung diagramm sonntag' },
  { id: 'f.chronik', group: 'after', title: 'Chronicle', text: 'Everything on one time line, one page per month: trips, rides, bike care, meditation, notes; «Earlier at this time» shows this day in earlier years.', href: '#/chronik', words: 'chronik zeitachse früher vor einem jahr monat velo pflege meditation notizen' },
  { id: 'f.gelernt', group: 'after', title: 'What the app learned', text: 'A month card and a letter for the year: new learnings, changed templates, your pace, the clothing border, km and trips.', href: '#/gelernt', words: 'gelernt monatskarte jahresbrief fortschritt jahr brief drucken' },
  { id: 'f.jahr', group: 'after', title: 'Your year as pictures', text: 'Your year of trips as slides: photos or routes, numbers and a thank-you; for every year.', href: '#/jahr', words: 'jahr bildgeschichte story fotos jahresrückblick dezember' },
  { id: 'f.neuland', group: 'after', title: 'New ground', text: 'New ground: cantons, municipalities, countries, passes, huts, peaks and lakes you reached for the first time, with a map and the canton bingo; own collections too.', href: '#/neuland', words: 'neuland kantone gemeinden länder pässe hütten sac gipfel viertausender seen bingo karte sammlung erstes mal neu' },
];

/** Every function: the tips (with their group) first, then the own entries, by group order. */
export const FEATURES = FEATURE_GROUPS.flatMap((g) => [
  ...Object.entries(TIP_GROUP)
    .filter(([, k]) => k === g.key)
    .map(([id]) => ({ id, group: g.key, tip: id, title: TIP[id].title, text: TIP[id].text, play: TIP_PLAY[id] ?? null, words: '' })),
  ...OWN.filter((x) => x.group === g.key).map((x) => ({ play: null, words: '', ...x })),
]);
export const FEATURE = Object.fromEntries(FEATURES.map((x) => [x.id, x]));

/**
 * The own entries the data shows as used: Set of ids. counts: { trips, rides, events, learnings,
 * imports, problems, visits, flowLog, flowChecks, flowStars, flowSessions, notes } (numbers);
 * folder: an auto-backup folder is set; play: the playground ran (or runs).
 */
export function seenOf({ counts = {}, folder = false, play = false } = {}) {
  const out = new Set();
  for (const x of OWN) {
    if (!x.seen) continue;
    const yes = x.seen === 'folder' ? folder : x.seen === 'play' ? play : (counts[x.seen] ?? 0) > 0;
    if (yes) out.add(x.id);
  }
  return out;
}

/**
 * The catalogue as the page shows it: [{ ...group, items: [{ ...feature, used }], used, total }],
 * in each group what you never used first (in catalogue order), then the used ones.
 * state: the settings record "tips" (taps count as used); used: tips used (usedTips) and own
 * entries seen (seenOf), one Set; by: 'situation' (FEATURE_GROUPS) or 'page' (PAGE_GROUPS).
 */
export function catalogue(state, used = new Set(), by = 'situation') {
  const s = tipState(state);
  const byPage = by === 'page';
  const groups = (byPage ? PAGE_GROUPS : FEATURE_GROUPS).map((g) => {
    const items = FEATURES.filter((x) => (byPage ? pageOf(x) : x.group) === g.key).map((x) => ({ ...x, used: isUsed(s, x.id, used) }));
    const sorted = [...items.filter((x) => !x.used), ...items.filter((x) => x.used)];
    return { ...g, items: sorted, used: items.filter((x) => x.used).length, total: items.length };
  });
  return { groups, used: groups.reduce((n, g) => n + g.used, 0), total: FEATURES.length };
}

/** Where an entry leads: a tip's or its own href, «{bike}» the first bike (without one: the bikes page). */
export function featureHref(f, { bikeId = null } = {}) {
  const href = f.tip ? (TIP[f.tip].go.href ?? null) : (f.href ?? null);
  if (!href || !href.includes('{bike}')) return href;
  return bikeId ? href.replace('{bike}', encodeURIComponent(bikeId)) : '#/bikes';
}

const norm = (s) => String(s ?? '').toLowerCase();
/**
 * The functions a search finds: every word in the title, the text or the words (English and the
 * shown language: tr is t()). [{ id, title, sub, href, run }], best first, fewer than 2 letters: none.
 */
export function findFeatures(q, tr = (s) => s) {
  const words = norm(q).trim().split(/\s+/).filter(Boolean);
  if (!words.length || norm(q).trim().length < 2) return [];
  const hits = FEATURES.filter((f) => {
    const hay = norm([f.title, tr(f.title), f.text, tr(f.text), f.words].join(' '));
    return words.every((w) => hay.includes(w));
  });
  const rank = (f) => (norm(tr(f.title)).startsWith(words[0]) || norm(f.title).startsWith(words[0]) ? 0 : 1);
  return hits.sort((a, b) => rank(a) - rank(b)).map((f) => ({ id: `feat-${f.id}`, featureId: f.id, title: tr(f.title), sub: tr(FEATURE_GROUPS.find((g) => g.key === f.group).label) }));
}
