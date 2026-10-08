/**
 * One search over everything (v0.19.6, start page answer 1a): gear, trips, templates, bikes and
 * notes. Every word has to be found somewhere in the row (English or German name, brand, model,
 * note). Pure function, easy to test.
 */
import { t, tn, num, nameOf } from './i18n.svelte.js';

const norm = (s) => String(s ?? '').toLowerCase();

/** Where each kind of result opens. */
export const KIND = {
  gear: { name: 'Gear', max: 6 },
  trip: { name: 'Trips', max: 4 },
  template: { name: 'Templates', max: 3 },
  bike: { name: 'Bikes', max: 4 },
  note: { name: 'Notes', max: 3 },
  page: { name: 'Pages', max: 2 },
};

/** v0.21.0: pages the search finds by a word, e.g. "favourites" opens all my favourite things. */
const PAGES = [{ id: 'favorites', title: 'All my favourite things', words: 'favourites favorites favourite favorite best things lieblingsstücke favoriten beste', href: '#/favorites' },
  // v0.26.0 (Noah 2b): the building blocks page
  { id: 'blocks', title: 'Building blocks', words: 'building blocks block bausteine baustein sets set', href: '#/blocks' },
];

/**
 * Results grouped by kind, best first: [{ kind, name, rows: [{ id, title, sub, href, tripId? }] }].
 * Empty groups are left out; fewer than 2 letters find nothing.
 */
export function searchAll(q, { items = [], trips = [], templates = [], bikes = [], notes = [] } = {}) {
  const words = norm(q).trim().split(/\s+/).filter(Boolean);
  if (!words.length || norm(q).trim().length < 2) return [];
  const hit = (...fields) => {
    const hay = fields.map(norm).join(' ');
    return words.every((w) => hay.includes(w));
  };
  // Rows whose name starts with the search come first.
  const rank = (title) => (norm(title).startsWith(words[0]) ? 0 : 1);
  const sort = (rows) => rows.sort((a, b) => rank(a.title) - rank(b.title) || a.title.localeCompare(b.title));
  const groups = {
    gear: sort(
      items
        .filter((i) => i.ownership !== 'gone' && hit(i.name, i.nameDe, i.brand, i.model, i.note, i.favNote))
        .map((i) => ({ id: i.id, title: `${i.favorite ? '★ ' : ''}${nameOf(i)}`, sub: [i.brand, i.weightG != null ? `${num(i.weightG)} g` : t('not weighed'), i.ownership === 'wishlist' || i.ownership === 'to-buy' ? t('wishlist') : ''].filter(Boolean).join(' · '), href: `#/gear?q=${encodeURIComponent(nameOf(i))}&item=${encodeURIComponent(i.id)}` })),
    ),
    trip: trips
      .filter((tr) => hit(tr.title, tr.place?.name, tr.bike))
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
      .map((tr) => ({ id: tr.id, title: tr.title, sub: [tr.startDate, tr.bike].filter(Boolean).join(' · '), href: '#/pack', tripId: tr.id })),
    template: sort(templates.filter((tp) => hit(tp.name)).map((tp) => ({ id: tp.id, title: tp.name, sub: tn(tp.entries?.length ?? 0, '{n} item', '{n} items'), href: '#/pack/templates' }))),
    bike: sort(bikes.filter((b) => hit(b.name, b.model, b.kind)).map((b) => ({ id: b.id, title: b.name, sub: b.km != null ? `${num(b.km)} km` : '', href: `#/bikes?bike=${encodeURIComponent(b.id)}` }))),
    note: notes
      .filter((n) => hit(n.text))
      .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
      .map((n) => ({ id: n.id, title: n.text.length > 60 ? `${n.text.slice(0, 57)}…` : n.text, sub: n.status === 'open' ? t('to sort') : t('sorted'), href: '#/inbox' })),
    page: PAGES.filter((p) => hit(p.words, p.title, t(p.title))).map((p) => ({
      id: p.id,
      title: t(p.title),
      sub: tn(items.filter((i) => i.favorite && i.ownership !== 'gone').length, '{n} item', '{n} items'),
      href: p.href,
    })),
  };
  return Object.entries(groups)
    .filter(([, rows]) => rows.length)
    .map(([kind, rows]) => ({ kind, name: KIND[kind].name, rows: rows.slice(0, KIND[kind].max), more: Math.max(0, rows.length - KIND[kind].max) }));
}
