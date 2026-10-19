/**
 * Paket H #348 «Vorschlagswerte beim Erfassen von Geräten»: while a new item gets its name, the app
 * suggests category, weight, usual bag, brand and (for devices) running and charging time. First from
 * your own gear with a similar name, otherwise from a short list of typical devices. A suggestion only:
 * nothing is set until «Use» is tapped, and only empty fields are filled (category and bag excepted,
 * a new item has no own choice there yet). Pure, tested in tests/paket-h.test.js.
 */

/** Typical devices: words (lower case, German and English), category, grams, bag, hours. Rough values. */
export const DEVICES = [
  { words: ['power bank', 'powerbank', 'akku pack'], category: 'elec', grams: 180, bag: 'top', chargeH: 4 },
  { words: ['bike computer', 'velocomputer', 'radcomputer', 'edge', 'wahoo'], category: 'elec', grams: 130, bag: 'mounted', runH: 15, chargeH: 2 },
  { words: ['front light', 'frontlicht', 'frontlampe', 'scheinwerfer'], category: 'light', grams: 160, bag: 'mounted', runH: 3, chargeH: 4 },
  { words: ['rear light', 'rücklicht', 'ruecklicht'], category: 'light', grams: 40, bag: 'mounted', runH: 8, chargeH: 2 },
  { words: ['headlamp', 'stirnlampe'], category: 'light', grams: 80, bag: 'frame', runH: 5, chargeH: 3 },
  { words: ['phone', 'handy', 'smartphone'], category: 'elec', grams: 200, bag: 'body', runH: 12, chargeH: 2 },
  { words: ['earbuds', 'kopfhörer', 'kopfhoerer'], category: 'elec', grams: 50, bag: 'top', runH: 6, chargeH: 1 },
  { words: ['watch', 'uhr', 'fitbit'], category: 'elec', grams: 45, bag: 'body', runH: 120, chargeH: 2 },
  { words: ['cable', 'kabel'], category: 'elec', grams: 25, bag: 'top' },
  { words: ['charger', 'ladegerät', 'ladegeraet', 'netzteil'], category: 'elec', grams: 90, bag: 'frame' },
  { words: ['camera', 'kamera', 'gopro'], category: 'elec', grams: 150, bag: 'top', runH: 2, chargeH: 3 },
  { words: ['inreach', 'satellite', 'satelliten'], category: 'elec', grams: 110, bag: 'top', runH: 100, chargeH: 3 },
];

const STOP = new Set(['der', 'die', 'das', 'und', 'the', 'and', 'mit', 'for', 'für', 'von', 'test', 'neu', 'new']);
const tokens = (s) => String(s ?? '').toLowerCase().split(/[^a-zäöüß0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));

/** The own item whose name shares the most words with the typed name (at least one), or null. */
export function likeOwn(name, items = [], selfId = null) {
  const want = tokens(name);
  if (!want.length) return null;
  let best = null;
  let bestN = 0;
  for (const it of items) {
    if (!it || it.id === selfId || it.ownership === 'gone') continue;
    const have = new Set(tokens(it.name));
    const n = want.filter((w) => have.has(w)).length;
    if (n > bestN || (n === bestN && n > 0 && (it.weightG != null) && best?.weightG == null)) {
      best = it;
      bestN = n;
    }
  }
  return bestN ? best : null;
}

/** The typical device the name names, or null. */
export function deviceOf(name) {
  const low = ` ${String(name ?? '').toLowerCase()} `;
  return DEVICES.find((d) => d.words.some((w) => low.includes(w))) ?? null;
}

/**
 * The suggestion for a new item named `name`: { from: 'own' | 'device', like, values } with values
 * { category, grams, defaultBag, brand, runH, chargeH } (only those known), or null.
 */
export function suggestValues(name, items = [], selfId = null) {
  if (String(name ?? '').trim().length < 3) return null;
  const own = likeOwn(name, items, selfId);
  if (own) {
    const values = {};
    if (own.category) values.category = own.category;
    if (own.weightG != null) values.grams = own.weightG;
    if (own.defaultBag) values.defaultBag = own.defaultBag;
    if (own.brand) values.brand = own.brand;
    if (own.runH != null) values.runH = own.runH;
    if (own.chargeH != null) values.chargeH = own.chargeH;
    return Object.keys(values).length ? { from: 'own', like: own, values } : null;
  }
  const d = deviceOf(name);
  if (!d) return null;
  const values = { category: d.category, grams: d.grams, defaultBag: d.bag };
  if (d.runH != null) values.runH = d.runH;
  if (d.chargeH != null) values.chargeH = d.chargeH;
  return { from: 'device', like: null, values };
}

const empty = (v) => v == null || String(v).trim() === '';

/** What «Use» changes in the draft: category and bag always, the rest only where the field is empty. */
export function applySuggestion(draft, values) {
  const out = { ...draft };
  for (const [k, v] of Object.entries(values ?? {})) {
    if (k === 'category' || k === 'defaultBag' || empty(out[k])) out[k] = v;
  }
  return out;
}

/** True when «Use» would change something (otherwise the line goes away). */
export function adds(draft, values) {
  const next = applySuggestion(draft, values);
  return Object.keys(values ?? {}).some((k) => String(next[k] ?? '') !== String(draft[k] ?? ''));
}
