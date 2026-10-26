/**
 * One search over everything (v0.19.6, start page answer 1a): gear, trips, templates, bikes and
 * notes. Every word has to be found somewhere in the row (English or German name, brand, model,
 * note). Pure function, easy to test.
 */
import { t, tn, num, nameOf, locale } from './i18n.svelte.js';
import { PAGE_ROWS, ACTIONS } from './nav/menu.js';

const norm = (s) => String(s ?? '').toLowerCase();
/** The added words of a diary entry (eingabe/inputs.js inputWords, kept short here so search.js stays light). */
const diaryExtra = (e) => [...(e.inputs?.tags ?? []), ...(e.inputs?.files ?? []).map((f) => f?.name), ...(e.inputs?.voices ?? []).map((a) => a?.text)].filter(Boolean).join(' ');
/** v0.40.0 (design check): a trip's day as everywhere: "So., 19. Okt." (the year only when it is another one). */
export const tripDay = (iso, now = new Date()) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso ?? '';
  const other = iso.slice(0, 4) !== String(now.getFullYear());
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', ...(other ? { year: 'numeric' } : {}) });
};

/** Where each kind of result opens. */
export const KIND = {
  gear: { name: 'Gear', max: 6 },
  trip: { name: 'Trips', max: 4 },
  template: { name: 'Templates', max: 3 },
  bike: { name: 'Bikes', max: 4 },
  note: { name: 'Notes', max: 3 },
  diary: { name: 'Diary', max: 3 }, // «Eingaben überall» (Noah 26.10.2026 «5a aber b möglich»): only when the diary is open
  log: { name: 'Logbook', max: 3 }, // v0.42.0 (Noah 9): the old trips of the Excel and the logbook
  page: { name: 'Pages', max: 4 },
  action: { name: 'Actions', max: 3 },
};

/**
 * v0.21.0: pages the search finds by a word, e.g. "favourites" opens all my favourite things.
 * v0.38.0 (Noah 13a): every page of "More" (nav/menu.js), and the things to do of "New".
 * v0.76.0: «More» is gone; the same pages, each under its place or «Ich».
 */
const PAGES = PAGE_ROWS;
/**
 * Results grouped by kind, best first: [{ kind, name, rows: [{ id, title, sub, href, tripId? }] }].
 * Empty groups are left out; fewer than 2 letters find nothing.
 */
export function searchAll(q, { items = [], trips = [], templates = [], bikes = [], notes = [], events = [], diary = [] } = {}) {
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
        .map((i) => ({ id: i.id, title: `${i.favorite ? '★ ' : ''}${nameOf(i)}`, sub: [i.brand, i.weightG != null ? '' : t('not weighed'), i.ownership === 'wishlist' || i.ownership === 'to-buy' ? t('wishlist') : ''].filter(Boolean).join(' · '), v: i.weightG != null ? `${num(i.weightG)} g` : '', href: `#/gear?q=${encodeURIComponent(nameOf(i))}&item=${encodeURIComponent(i.id)}` })),
    ),
    trip: trips
      .filter((tr) => hit(tr.title, tr.place?.name, tr.bike))
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
      .map((tr) => ({ id: tr.id, title: tr.title, sub: [tr.startDate ? tripDay(tr.startDate) : null, tr.bike].filter(Boolean).join(' · '), href: '#/pack', tripId: tr.id })),
    template: sort(templates.filter((tp) => hit(tp.name)).map((tp) => ({ id: tp.id, title: tp.name, sub: tn(tp.entries?.length ?? 0, '{n} item', '{n} items'), href: '#/pack/templates' }))),
    bike: sort(bikes.filter((b) => hit(b.name, b.model, b.kind)).map((b) => ({ id: b.id, title: b.name, sub: b.km != null ? `${num(b.km)} km` : '', href: `#/bikes?bike=${encodeURIComponent(b.id)}` }))),
    note: notes
      .filter((n) => hit(n.text))
      .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
      .map((n) => ({ id: n.id, title: n.text.length > 60 ? `${n.text.slice(0, 57)}…` : n.text, sub: n.status === 'open' ? t('to sort') : t('sorted'), href: '#/inbox' })),
    // diary entries: title, text, tags, place and what was added (voice notes as text, file names)
    diary: diary
      .filter((e) => hit(e.title, e.text, (e.tags ?? []).join(' '), e.place?.name, diaryExtra(e)))
      .sort((a, b) => `${b.day} ${b.time ?? ''}`.localeCompare(`${a.day} ${a.time ?? ''}`))
      .map((e) => {
        const head = String(e.title ?? '').trim() || String(e.text ?? '').trim().split('\n')[0] || t('Untitled');
        return { id: e.id, title: head.length > 60 ? `${head.slice(0, 57)}…` : head, sub: tripDay(e.day), href: `#/tagebuch/${encodeURIComponent(e.id)}` };
      }),
    log: events
      .filter((e) => hit(e.name, e.note, e.date, e.dateText, e.result, e.learnings))
      .sort((a, b) => (b.sortDate ?? '').localeCompare(a.sortDate ?? ''))
      .map((e) => ({ id: e.id, title: e.name, sub: [e.date ?? e.dateText ?? '', e.source === 'excel' ? t('from Excel') : ''].filter(Boolean).join(' · '), href: '#/debrief/logbook' })),
    page: PAGES.filter((p) => hit(p.words, p.title, t(p.title))).map((p) => ({
      id: p.id,
      title: t(p.title),
      // v0.32.0: each page says what it holds (was: the favourites count for every page).
      // v0.38.0: the others say where they are in the menu ("More › Plan"); v0.76.0: their place («Touren»).
      sub: p.id === 'blocks' ? t('Standard, with the night, to add') : p.id === 'templates' ? tn(templates.length, '{n} template', '{n} templates') : p.id === 'favorites' ? tn(items.filter((i) => i.favorite && i.ownership !== 'gone').length, '{n} item', '{n} items') : t(p.group),
      href: p.href ?? null,
      action: p.action ?? null,
    })),
    action: ACTIONS.filter((a) => hit(a.words, a.title, t(a.title))).map((a) => ({ id: a.id, title: t(a.title), sub: t('New'), href: a.href ?? null, action: a.action ?? null })),
  };
  return Object.entries(groups)
    .filter(([, rows]) => rows.length)
    .map(([kind, rows]) => ({ kind, name: KIND[kind].name, rows: rows.slice(0, KIND[kind].max), more: Math.max(0, rows.length - KIND[kind].max) }));
}

/* ---------- v0.46.0 «Startseite neu» (Noah 14a): the search becomes "What do you want to do?" ----------
 * Besides the results it offers actions by keyword: "wiegen" → weigh, "tagestour factor" → a day ride
 * on the Factor, "kette geölt spark" → chain lubed on the Spark, "notiz Sattel knarzt" → a quick note.
 * The first word(s) name the action (German or English, umlauts as typed or as ae/oe/ue, the start of
 * a one-word action with 3 letters is enough: "wieg"); the rest is the bike (a word of its name) or the
 * note's text. Pure: Search.svelte carries out the command ({ kind, bikeId?, text? }).
 */

/** Lower case, umlauts as ae/oe/ue, ß as ss: "Geölt" and "geoelt" are the same. */
export const fold = (s) => norm(s).replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

/**
 * The commands. say: the phrases (one to four words); bike: 'none' | 'optional' | 'required'
 * (required: without a bike word one row per bike); text: the rest is free text (a note).
 */
export const COMMANDS = [
  { kind: 'weigh', say: ['wiegen', 'waegen', 'weigh', 'waage'], bike: 'none' },
  { kind: 'dayride', say: ['schnellstart', 'quick start', 'tagestour', 'day ride', 'dayride', 'ausfahrt'], bike: 'optional' },
  { kind: 'chain', say: ['kette geoelt', 'kette gewachst', 'kette geschmiert', 'geoelt', 'gewachst', 'chain lubed', 'chain waxed', 'chain oiled', 'lubed', 'oiled', 'waxed'], bike: 'required' },
  { kind: 'sealant', say: ['dichtmilch', 'sealant'], bike: 'required' },
  { kind: 'wash', say: ['velo gewaschen', 'gewaschen', 'bike washed', 'washed'], bike: 'required' },
  { kind: 'km', say: ['km nachtragen', 'log km', 'kilometer'], bike: 'none' },
  { kind: 'note', say: ['notiz', 'note', 'zettel'], text: true },
  { kind: 'wear', say: ['was ziehe ich an', 'what do i wear', 'anziehen', 'outfit'], bike: 'none' },
  { kind: 'trip', say: ['tour planen', 'neue tour', 'plan a trip', 'new trip', 'new tour', 'tour'], bike: 'none' },
  // FE17 «Suche kann handeln» (Noah 13.10.2026 23:56): go somewhere from the search (more: true)
  { kind: 'backup', say: ['daten und backup', 'datensicherung', 'sicherung', 'backup'], bike: 'none', more: true },
  { kind: 'settings', say: ['einstellungen', 'settings', 'darstellung', 'bedienung', 'appearance'], bike: 'none', more: true },
  { kind: 'quicknote', say: ['schnelle notiz', 'quick note', 'schnellnotiz'], bike: 'none', more: true },
];
/** FE17: where the go-to commands lead (Search.svelte opens the address). */
export const COMMAND_HREF = { backup: '#/me/data', settings: '#/me/look' };

/** Do the words say the phrase? Each word in full; a one-word phrase may be said by its start (3+ letters). */
function says(words, phrase) {
  const p = phrase.split(' ');
  if (words.length < p.length) return false;
  if (p.length === 1) return words[0] === p[0] || (words.length === 1 && words[0].length >= 3 && p[0].startsWith(words[0]));
  return p.every((w, i) => words[i] === w);
}

/** The bikes the words name: every word starts a word of the bike's name or model (3+ letters). */
function bikesNamed(words, bikes) {
  if (!words.length) return [];
  return bikes.filter((b) => {
    const name = fold(`${b.name ?? ''} ${b.model ?? ''}`).split(/[\s-]+/);
    return words.every((w) => w.length >= 3 && name.some((n) => n.startsWith(w)));
  });
}

const CMD_TITLE = {
  weigh: () => t('Start weighing'),
  dayride: (b) => (b ? t('Quick start with the {bike}', { bike: b.name }) : t('Quick start')),
  chain: (b) => t('{bike}: chain lubed', { bike: b.name }),
  sealant: (b) => t('{bike}: sealant topped up', { bike: b.name }),
  wash: (b) => t('{bike}: washed|command', { bike: b.name }),
  km: () => t('Log km'),
  note: (b, text) => (text ? t('Note: "{text}"', { text }) : t('Write a note')),
  wear: () => t('What do I wear today?'),
  trip: () => t('Plan a trip'),
  backup: () => t('Data and backup'),
  settings: () => t('Settings: appearance and handling'),
  quicknote: () => t('Write a note'),
  bike: (b) => t('Open the {bike}', { bike: b.name }),
};
const SAVED = 'Saved with today’s date, with Undo';
const CMD_SUB = { chain: SAVED, sealant: SAVED, wash: SAVED, note: 'Into the Inbox', quicknote: 'Into the Inbox', dayride: 'today, 2.5 h, the bike ridden last', backup: 'Me|place', settings: 'Me|place', bike: 'Bikes|place' };

/**
 * The commands a search says: [{ id, kind, title, sub, cmd: { kind, bikeId?, text? } }], at most 4.
 * bikes: the bikes as shown (sorted). Nothing for fewer than 3 letters. more: false leaves out the
 * go-to commands of FE17 (backup, settings, quick note, a bike by its name; Ich › Darstellung › Bedienung).
 */
export function commandActions(q, { bikes = [], more = true } = {}) {
  const raw = String(q ?? '').trim();
  const words = fold(raw).split(/\s+/).filter(Boolean);
  if (raw.length < 3 || !words.length) return [];
  const out = [];
  for (const c of COMMANDS) {
    if (c.more && !more) continue;
    // the longest phrase first ("kette geoelt" before "geoelt")
    const phrase = [...c.say].sort((a, b) => b.split(' ').length - a.split(' ').length).find((p) => says(words, p));
    if (!phrase) continue;
    const n = phrase.split(' ').length;
    const rest = words.slice(n);
    const sub = CMD_SUB[c.kind] ? t(CMD_SUB[c.kind]) : '';
    if (c.text) {
      const text = raw.split(/\s+/).slice(n).join(' ');
      out.push({ id: `cmd-${c.kind}`, kind: c.kind, title: CMD_TITLE[c.kind](null, text), sub, cmd: { kind: c.kind, text } });
      continue;
    }
    if (c.bike === 'none') {
      if (rest.length) continue; // "wiegen jacke" is a search, not the command
      out.push({ id: `cmd-${c.kind}`, kind: c.kind, title: CMD_TITLE[c.kind](), sub, cmd: { kind: c.kind } });
      continue;
    }
    const named = bikesNamed(rest, bikes);
    if (rest.length && !named.length) continue; // "tagestour xyz": no bike of that name
    const list = named.length ? named : c.bike === 'required' ? bikes : [null];
    for (const b of list.slice(0, 4)) out.push({ id: `cmd-${c.kind}-${b?.id ?? 'any'}`, kind: c.kind, title: CMD_TITLE[c.kind](b), sub, cmd: { kind: c.kind, ...(b ? { bikeId: b.id } : {}) } });
  }
  // FE17: a bike's name alone («spark») opens that bike's page
  if (more && !out.length) for (const b of bikesNamed(words, bikes).slice(0, 2)) out.push({ id: `cmd-bike-${b.id}`, kind: 'bike', title: CMD_TITLE.bike(b), sub: t(CMD_SUB.bike), cmd: { kind: 'bike', bikeId: b.id } });
  return out.slice(0, 4);
}
