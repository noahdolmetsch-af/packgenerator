/**
 * «Kochen» online shop search (Noah 29.10.2026, later step after «Bezug zum Training»): a link per
 * ingredient to the search of an online shop. Free and without any connection of its own: it only builds
 * the address of the shop's own search page; the person taps it and the shop opens in the browser. Off
 * until a shop is chosen, changeable any time. Tested in tests/kochshop.test.js.
 */
export const SHOPS = [
  { key: 'migros', label: 'Migros', url: (q) => `https://www.migros.ch/de/search?query=${q}` },
  { key: 'coop', label: 'Coop', url: (q) => `https://www.coop.ch/de/search/?text=${q}` },
];

/** The chosen shop key if known, else '' (no search links). */
export const shopOf = (v) => (SHOPS.some((s) => s.key === v) ? v : '');

/** The search address of a shop for an ingredient name, or '' without a shop or name. */
export function shopLink(shop, name) {
  const s = SHOPS.find((x) => x.key === shop);
  const q = String(name ?? '').trim();
  return s && q ? s.url(encodeURIComponent(q)) : '';
}
