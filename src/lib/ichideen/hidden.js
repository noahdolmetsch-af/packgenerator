/**
 * Einzelidee 33 «Ausgeblendetes bleibt auffindbar» (996 Ideen, Noah 25.10.2026): one look at everything you
 * switched off or hid, each with what stays behind it and «Show again». Gathered from the places where the
 * app lets you hide something:
 *   menu    places hidden in the menu (Anpassen 2a)          tabs   tabs hidden of a place (Anpassen)
 *   parts   parts of a page hidden (Anpassen 1a)             lists  entries hidden in «Lists and types»
 *   acts    activities hidden in Aktiv (flowActs.paused)     notfor functions marked «Not for me» (Paket C)
 *   suggest suggestions switched off (by area or kind, Einzelidee 36)
 * Nothing is ever deleted by hiding: the rows say what stays. Pure; the page is ruhig/Aus.svelte.
 * A row: { id, kind, name, tr, where, whereTr, data, dataN, ref } (tr / whereTr: the name is an English key
 * for t(); a name the person typed has tr false and never goes through t()). Tested in tests/ichideen.test.js.
 */

/** The groups in the order of the page (titles are English keys for t()). */
export const HIDDEN_GROUPS = [
  { key: 'menu', title: 'Places in the menu' },
  { key: 'tabs', title: 'Tabs' },
  { key: 'parts', title: 'Parts of pages' },
  { key: 'lists', title: 'Entries of lists' },
  { key: 'acts', title: 'Activities in Active' },
  { key: 'notfor', title: 'Functions «Not for me»' },
  { key: 'suggest', title: 'Suggestions switched off' },
];

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Everything hidden, by group (only groups with rows). In:
 *   cfg       the Anpassen record (anpassen.js clean)
 *   places    [{ key, label }] every place (label: English key)
 *   tabs      { [place]: [{ key, label }] } every tab of a place
 *   lists     [{ key, name, entries: [{ id, name, std, own, hidden }] }] (standard.js listFor)
 *   acts      [{ id, name, paused }] and logs { [actId]: ticks kept }
 *   notFor    { [feature id]: { why, at } } and features [{ id, title }]
 *   suggestOff [area key] and areas [{ key, label }]
 */
export function hiddenGroups({ cfg = null, places = [], tabs = {}, lists = [], acts = [], logs = {}, notFor = {}, features = [], suggestOff = [], areas = [] } = {}) {
  const out = Object.fromEntries(HIDDEN_GROUPS.map((g) => [g.key, []]));
  const placeOf = (k) => places.find((p) => p.key === k);
  if (cfg) {
    for (const k of cfg.menu?.hide ?? []) {
      const p = placeOf(k);
      if (p) out.menu.push({ id: `menu:${k}`, kind: 'menu', name: cfg.menu.names?.[k] ?? p.label, tr: !cfg.menu.names?.[k], data: 'Its pages stay; the search still finds them.', ref: { place: k } });
    }
    for (const [pk, tc] of Object.entries(cfg.tabs ?? {})) {
      const p = placeOf(pk);
      for (const k of tc.hide ?? []) {
        const x = (tabs[pk] ?? []).find((y) => y.key === k);
        if (!x) continue;
        out.tabs.push({ id: `tab:${pk}:${k}`, kind: 'tab', name: tc.names?.[k] ?? x.label, tr: !tc.names?.[k], where: p ? (cfg.menu?.names?.[pk] ?? p.label) : pk, whereTr: !!p && !cfg.menu?.names?.[pk], data: 'The page and its data stay.', ref: { place: pk, tab: k } });
      }
    }
    for (const [page, pc] of Object.entries(cfg.pages ?? {})) {
      for (const k of pc.hide ?? []) {
        const [pl] = String(page).split(':');
        const p = placeOf(pl === 'home' ? 'today' : pl);
        out.parts.push({ id: `part:${page}:${k}`, kind: 'part', name: pc.names?.[k] ?? cap(k), tr: false, where: p ? p.label : page, whereTr: !!p, data: 'Only hidden on the page; nothing in it is lost.', ref: { page, key: k } });
      }
    }
  }
  for (const l of lists) {
    for (const e of l.entries ?? []) {
      if (!e.hidden) continue;
      out.lists.push({ id: `list:${l.key}:${e.id}`, kind: 'list', name: e.own || e.name !== e.std ? e.name : e.std, tr: !e.own && e.name === e.std, where: l.name, whereTr: true, data: 'What already uses it keeps it; it is only no longer offered.', ref: { list: l.key, id: e.id } });
    }
  }
  for (const a of acts) {
    if (!a?.paused) continue;
    const n = logs[a.id] ?? 0;
    out.acts.push({ id: `act:${a.id}`, kind: 'act', name: a.name, tr: false, data: n ? 'ticks' : 'No ticks yet.', dataN: n, ref: { id: a.id } });
  }
  for (const [id, v] of Object.entries(notFor ?? {})) {
    const f = features.find((x) => x.id === id);
    if (f) out.notfor.push({ id: `notfor:${id}`, kind: 'notfor', name: f.title, tr: true, data: 'It stays in «What the app can do» and the search.', ref: { id, why: v?.why ?? '' } });
  }
  for (const k of suggestOff ?? []) {
    const a = areas.find((x) => x.key === k);
    if (a) out.suggest.push({ id: `suggest:${k}`, kind: 'suggest', name: a.label, tr: true, data: 'Nothing is lost: the app only stops suggesting it.', ref: { key: k } });
  }
  return HIDDEN_GROUPS.map((g) => ({ ...g, rows: out[g.key] })).filter((g) => g.rows.length);
}

/** How many things are hidden in all. */
export const hiddenCount = (groups) => groups.reduce((n, g) => n + g.rows.length, 0);
