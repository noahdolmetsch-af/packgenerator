/**
 * Paket H «Packen leichter», answer 1 «1b und a» (Noah 19.10.2026 12:09): a packing list per sport.
 *
 * b) The app builds the start list from your earlier trips of the same sport: what was along on at
 *    least half of them comes in (historyTrip, a third start in «New trip» beside Standard and «Like
 *    the last trip»).
 * a) A ready suggestion list per sport (STARTERS): in Packen «Suggestion list» shows each line with
 *    the item of your own that fits, so you tick what you take; what you do not have can go on the
 *    wishlist. Everything is a suggestion, nothing is added by itself.
 * Pure functions; the sport keys are the trip areas of domains.js.
 */
import { domainOf } from './domains.js';
import { riddenTrips } from './trips.js';
import { localDay } from './localday.js';

/** At least this many earlier trips of the sport before the app builds a list from them. */
export const HISTORY_MIN_TRIPS = 2;
/** An item comes in when it was along on at least this share of those trips. */
export const HISTORY_SHARE = 0.5;

/** The earlier trips of a sport (really ridden or done, newest first). */
export function sportTrips(domain, trips = [], today = localDay()) {
  return riddenTrips(trips, today)
    .filter((tr) => domainOf(tr) === domain)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
}

const mostOf = (list) => {
  const n = new Map();
  for (const x of list) n.set(x, (n.get(x) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

/**
 * How often each item was along: [{ itemId, n, share, qty, slot }], most often first.
 * Archived items (ownership 'gone') and items no longer there stay out.
 */
export function itemCounts(past = [], items = []) {
  const known = new Set(items.filter((i) => i.ownership !== 'gone').map((i) => i.id));
  const seen = new Map();
  for (const tr of past) {
    const once = new Set();
    for (const e of tr.entries ?? []) {
      if (!known.has(e.itemId) || once.has(e.itemId)) continue;
      once.add(e.itemId);
      const s = seen.get(e.itemId) ?? { itemId: e.itemId, n: 0, qty: [], slot: [] };
      s.n++;
      s.qty.push(e.qty || 1);
      s.slot.push(e.slot);
      seen.set(e.itemId, s);
    }
  }
  const total = past.length || 1;
  return [...seen.values()].map((s) => ({ itemId: s.itemId, n: s.n, share: s.n / total, qty: mostOf(s.qty) ?? 1, slot: mostOf(s.slot) })).sort((a, b) => b.n - a.n);
}

/**
 * 1b: a stand-in trip that newTrip / newPackTrip copy like «the last trip»: the items along on at
 * least half of the earlier trips of this sport, each in its usual place and amount. null when there
 * are fewer than HISTORY_MIN_TRIPS of them.
 * bikeId: the bike of the new trip (a bike trip copies only from a trip on the same bike).
 */
export function historyTrip({ domain, bikeId = null, trips = [], items = [], today = localDay(), share = HISTORY_SHARE } = {}) {
  const past = sportTrips(domain, trips, today);
  if (past.length < HISTORY_MIN_TRIPS) return null;
  const entries = itemCounts(past, items)
    .filter((c) => c.share >= share)
    .map((c) => ({ itemId: c.itemId, slot: c.slot ?? 'body', qty: c.qty, packed: false }));
  return {
    id: 'history',
    domain,
    title: '',
    bikeId,
    startDate: past[0].startDate,
    createdAt: past[0].createdAt ?? '',
    packs: past[0].packs,
    entries,
    from: past.length,
  };
}

/**
 * 1a: the ready suggestion list per sport. Each line: an English name for t() and the words that find
 * the item of your own (name, German name, brand or model; lower case, a word is enough).
 * Fictional, general things only.
 */
export const STARTERS = {
  bikepacking: [
    { name: 'Helmet', words: ['helmet', 'helm'] },
    { name: 'Bike computer', words: ['garmin', 'edge', 'wahoo', 'computer', 'navi'] },
    { name: 'Front light', words: ['front light', 'frontlicht', 'lampe vorne', 'scheinwerfer', 'light'] },
    { name: 'Rear light', words: ['rear light', 'rücklicht', 'ruecklicht'] },
    { name: 'Power bank', words: ['power bank', 'powerbank', 'akku'] },
    { name: 'Charging cable', words: ['cable', 'kabel', 'usb'] },
    { name: 'Spare tube', words: ['tube', 'schlauch'] },
    { name: 'Pump', words: ['pump', 'pumpe'] },
    { name: 'Multi-tool', words: ['multi', 'tool', 'werkzeug'] },
    { name: 'Tyre levers', words: ['lever', 'heber'] },
    { name: 'Chain lube', words: ['lube', 'öl', 'kettenöl'] },
    { name: 'Rain jacket', words: ['rain jacket', 'regenjacke', 'jacke'] },
    { name: 'Gloves', words: ['glove', 'handschuh'] },
    { name: 'Water bottles', words: ['bottle', 'flasche', 'bidon'] },
    { name: 'Snacks', words: ['bar', 'riegel', 'gel', 'snack'] },
    { name: 'Sunscreen', words: ['sun', 'sonne'] },
    { name: 'First-aid kit', words: ['first aid', 'erste hilfe', 'apotheke'] },
    { name: 'Lock', words: ['lock', 'schloss'] },
    { name: 'ID and money', words: ['wallet', 'portemonnaie', 'geld', 'ausweis', 'id'] },
    { name: 'Phone', words: ['phone', 'handy', 'telefon'] },
  ],
  ski: [
    { name: 'Avalanche transceiver', words: ['lvs', 'transceiver', 'barryvox', 'pieps'] },
    { name: 'Shovel', words: ['shovel', 'schaufel'] },
    { name: 'Probe', words: ['probe', 'sonde'] },
    { name: 'Skins', words: ['skin', 'felle', 'fell'] },
    { name: 'Ski crampons', words: ['crampon', 'harscheisen'] },
    { name: 'Helmet', words: ['helmet', 'helm'] },
    { name: 'Goggles', words: ['goggle', 'skibrille', 'brille'] },
    { name: 'Warm gloves', words: ['glove', 'handschuh'] },
    { name: 'Spare gloves', words: ['glove', 'handschuh'] },
    { name: 'Down jacket', words: ['down', 'daune', 'jacke'] },
    { name: 'Hat', words: ['hat', 'mütze', 'muetze', 'beanie'] },
    { name: 'Thermos', words: ['thermos', 'thermoskanne'] },
    { name: 'Snacks', words: ['bar', 'riegel', 'snack'] },
    { name: 'Sunscreen', words: ['sun', 'sonne'] },
    { name: 'First-aid kit', words: ['first aid', 'erste hilfe', 'apotheke'] },
    { name: 'Rescue blanket', words: ['blanket', 'rettungsdecke', 'biwak'] },
    { name: 'Head torch', words: ['head', 'stirnlampe', 'headlamp'] },
    { name: 'Phone', words: ['phone', 'handy', 'telefon'] },
  ],
  hiking: [
    { name: 'Hiking boots', words: ['boot', 'schuh', 'wanderschuh'] },
    { name: 'Rain jacket', words: ['rain jacket', 'regenjacke', 'jacke'] },
    { name: 'Warm layer', words: ['fleece', 'pullover', 'midlayer'] },
    { name: 'Hat', words: ['hat', 'mütze', 'muetze', 'cap'] },
    { name: 'Water bottle', words: ['bottle', 'flasche', 'trinkblase'] },
    { name: 'Snacks', words: ['bar', 'riegel', 'snack'] },
    { name: 'Sunscreen', words: ['sun', 'sonne'] },
    { name: 'Sunglasses', words: ['sunglass', 'sonnenbrille', 'brille'] },
    { name: 'Map or app', words: ['map', 'karte'] },
    { name: 'First-aid kit', words: ['first aid', 'erste hilfe', 'apotheke'] },
    { name: 'Head torch', words: ['head', 'stirnlampe', 'headlamp'] },
    { name: 'Poles', words: ['pole', 'stöcke', 'stoecke', 'stock'] },
    { name: 'Phone', words: ['phone', 'handy', 'telefon'] },
  ],
  weekend: [
    { name: 'Toothbrush', words: ['tooth', 'zahn'] },
    { name: 'Toiletry bag', words: ['toiletry', 'kulturbeutel', 'necessaire'] },
    { name: 'Change of clothes', words: ['shirt', 't-shirt', 'hemd'] },
    { name: 'Underwear', words: ['underwear', 'unterwäsche', 'unterhose', 'socken'] },
    { name: 'Charger', words: ['charger', 'ladegerät', 'ladegeraet', 'kabel'] },
    { name: 'Book', words: ['book', 'buch', 'kindle'] },
    { name: 'Ticket', words: ['ticket', 'billett', 'ga'] },
    { name: 'ID and money', words: ['wallet', 'portemonnaie', 'geld', 'ausweis'] },
    { name: 'Phone', words: ['phone', 'handy', 'telefon'] },
  ],
  travel: [
    { name: 'Passport', words: ['passport', 'pass', 'reisepass'] },
    { name: 'Travel adapter', words: ['adapter', 'stecker'] },
    { name: 'Charger', words: ['charger', 'ladegerät', 'ladegeraet', 'kabel'] },
    { name: 'Toiletry bag', words: ['toiletry', 'kulturbeutel', 'necessaire'] },
    { name: 'Medicines', words: ['medic', 'medikament', 'apotheke'] },
    { name: 'Sunscreen', words: ['sun', 'sonne'] },
    { name: 'Rain jacket', words: ['rain jacket', 'regenjacke', 'jacke'] },
    { name: 'Earplugs', words: ['earplug', 'ohropax', 'ohrstöpsel'] },
    { name: 'Travel insurance card', words: ['insurance', 'versicherung'] },
    { name: 'Credit card', words: ['credit', 'kreditkarte', 'karte'] },
    { name: 'Phone', words: ['phone', 'handy', 'telefon'] },
  ],
};

/** The suggestion list of a sport (an own sport without one: none). */
export const startersFor = (domain) => STARTERS[domain] ?? [];

const hay = (i) => [i.name, i.nameDe, i.brand, i.model].filter(Boolean).join(' ').toLowerCase();

/**
 * The own items that fit one suggestion line, best first: items of this sport first, then the rest.
 * Only things you have (owned or unclear).
 */
export function matchesFor(line, items = [], inSport = () => true) {
  const hits = items.filter((i) => (i.ownership === 'owned' || i.ownership === 'unclear') && line.words.some((w) => hay(i).includes(w)));
  return hits.sort((a, b) => Number(inSport(b)) - Number(inSport(a)));
}

/**
 * The whole suggestion list for a trip: [{ line, item, onTrip, others }]; item: the best own match
 * (null: you have nothing that fits), onTrip: it is on the trip already. A thing used for two lines
 * (gloves, spare gloves) shows on both.
 */
export function starterRows(domain, items = [], entries = [], inSport = () => true) {
  const on = new Set(entries.map((e) => e.itemId));
  return startersFor(domain).map((line) => {
    const hits = matchesFor(line, items, inSport);
    const item = hits.find((i) => on.has(i.id)) ?? hits[0] ?? null;
    return { line, item, onTrip: !!item && on.has(item.id), others: hits.filter((i) => i !== item) };
  });
}
