/**
 * One search over everything (v0.19.6, start page answer 1a): gear, trips, templates, bikes and
 * notes. Every word has to be found somewhere in the row (English or German name, brand, model,
 * note). Pure function, easy to test.
 */
const norm = (s) => String(s ?? '').toLowerCase();

/** Where each kind of result opens. */
export const KIND = {
  gear: { name: 'Gear', max: 6 },
  trip: { name: 'Trips', max: 4 },
  template: { name: 'Templates', max: 3 },
  bike: { name: 'Bikes', max: 4 },
  note: { name: 'Notes', max: 3 },
};

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
        .map((i) => ({ id: i.id, title: `${i.favorite ? '★ ' : ''}${i.name}`, sub: [i.brand, i.weightG != null ? `${i.weightG} g` : 'not weighed', i.ownership === 'wishlist' || i.ownership === 'to-buy' ? 'wishlist' : ''].filter(Boolean).join(' · '), href: `#/gear?q=${encodeURIComponent(i.name)}` })),
    ),
    trip: trips
      .filter((t) => hit(t.title, t.place?.name, t.bike))
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
      .map((t) => ({ id: t.id, title: t.title, sub: [t.startDate, t.bike].filter(Boolean).join(' · '), href: '#/pack', tripId: t.id })),
    template: sort(templates.filter((t) => hit(t.name)).map((t) => ({ id: t.id, title: t.name, sub: `${t.entries?.length ?? 0} items`, href: '#/pack/templates' }))),
    bike: sort(bikes.filter((b) => hit(b.name, b.model, b.kind)).map((b) => ({ id: b.id, title: b.name, sub: b.km != null ? `${b.km.toLocaleString('en')} km` : '', href: '#/bikes' }))),
    note: notes
      .filter((n) => hit(n.text))
      .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
      .map((n) => ({ id: n.id, title: n.text.length > 60 ? `${n.text.slice(0, 57)}…` : n.text, sub: n.status === 'open' ? 'to sort' : 'sorted', href: '#/inbox' })),
  };
  return Object.entries(groups)
    .filter(([, rows]) => rows.length)
    .map(([kind, rows]) => ({ kind, name: KIND[kind].name, rows: rows.slice(0, KIND[kind].max), more: Math.max(0, rows.length - KIND[kind].max) }));
}
