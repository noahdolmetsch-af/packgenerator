/**
 * Flyer für Tennisstunden (Noah 05.11.2026 «1a 2a+b 3a 4a», 07.11.2026 «ok Flyer», «modular ja»): the pure part.
 * One flyer is a set of building blocks (header, photo, title, table, levels, cards, trainer, free places,
 * own text, sign-up band). Each block can be switched on and off, the movable ones can be moved, and every
 * text comes from the offer and can be overwritten. Languages: German and English, each with its own texts.
 * The flyer words are not UI texts (they are printed on the picture), so they do not go through t().
 *
 * Settings: FLYERS_KEY { byOffer: { <offerId>: config }, templates: [{ id, name, config }] } (synced like the offers);
 * PHOTO_KEY { items: [{ id, src }], current, fx, fy, zoom } stays on this device (DEVICE_SETTINGS), never in a backup.
 * The picture is drawn by flyerdraw.js (canvas). Pure and tested in tests/flyer.test.js.
 */
import { chf, dayOf, shareUrl, timeOf } from './model.js';

export const FLYERS_KEY = 'tennis.flyers';
export const PHOTO_KEY = 'tennis.flyerPhoto';

/** The kinds of flyer (Noah 3a: the same template, the kind is chosen). label: English, through t(). */
export const ARTS = [
  { key: 'group', label: 'Group lessons' },
  { key: 'trial', label: 'Trial lesson' },
  { key: 'holiday', label: 'Holiday course' },
  { key: 'single', label: 'Single lessons' },
];

/**
 * The picture formats: 16:9 for screens, A4 portrait for printing at home, square for WhatsApp and social media, and A5 for the
 * print shop (300 dpi, 3 mm bleed on each side: 1818 × 2550 px, saved as a PDF).
 */
export const FORMATS = [
  { key: '169', label: '16:9', w: 1920, h: 1080 },
  { key: 'a4', label: 'A4 portrait', w: 1240, h: 1754 },
  { key: 'sq', label: 'Square', w: 1080, h: 1080 },
  { key: 'a5', label: 'A5 for printing', w: 1818, h: 2550, bleed: 35, pdf: true },
];
export const LANGS = [
  { key: 'de', label: 'Deutsch' },
  { key: 'en', label: 'English' },
];

/** The blocks in their first order. fixed: stays at its place (header on top, band at the bottom). */
export const BLOCKS = [
  { id: 'top', fixed: true },
  { id: 'photo', fixed: true },
  { id: 'title' },
  { id: 'table' },
  { id: 'levels' },
  { id: 'cards' },
  { id: 'trainer' },
  { id: 'free' },
  { id: 'cta', fixed: true },
];
export const TABLE_ROWS = ['when', 'time', 'where', 'duration'];
export const CARDS = ['gather', 'pickup', 'cost', 'rain', 'bring'];

/** The words printed on the flyer, per language (not UI texts). */
export const WORDS = {
  de: {
    rows: { when: 'Wann', time: 'Uhrzeit', where: 'Wo', duration: 'Dauer' },
    cards: { gather: 'Besammlung', pickup: 'Abholung', cost: 'Kosten', rain: 'Regenregel', bring: 'Mitbringen' },
    days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    free: 'gratis',
    button: 'Jetzt anmelden',
    required: 'Anmeldung erforderlich',
    deadline: 'Anmeldeschluss',
    spots: (n) => (Number(n) === 1 ? 'Noch 1 Platz' : `Noch ${n} Plätze`),
    to: 'bis',
    locale: 'de-CH',
    trainer: 'Dein Trainer',
    mailSubject: (title) => `${title}: Anmeldung`,
    mailHello: 'Hallo',
    mailLink: 'Hier kannst du dich anmelden',
  },
  en: {
    rows: { when: 'When', time: 'Time', where: 'Where', duration: 'Dates' },
    cards: { gather: 'Meeting point', pickup: 'Pick-up', cost: 'Price', rain: 'Rain rule', bring: 'Bring' },
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    free: 'free',
    button: 'Register now',
    required: 'Registration required',
    deadline: 'Register by',
    spots: (n) => (Number(n) === 1 ? '1 place left' : `${n} places left`),
    to: 'to',
    locale: 'en-GB',
    trainer: 'Your coach',
    mailSubject: (title) => `${title}: sign up`,
    mailHello: 'Hello',
    mailLink: 'You can sign up here',
  },
};

/** The first title, subtitle and badge of each kind, per language. */
export const ART_TEXTS = {
  group: { de: { title: 'Tennis Unterricht', sub: 'Gruppenunterricht' }, en: { title: 'Tennis Lessons', sub: 'Group lessons' } },
  trial: { de: { title: 'Schnupperstunde', sub: 'Einmal unverbindlich ausprobieren' }, en: { title: 'Trial Lesson', sub: 'Try it once, no strings attached' } },
  holiday: { de: { title: 'Tennis-Ferienkurs', sub: 'Tennis in den Ferien' }, en: { title: 'Tennis Holiday Course', sub: 'Tennis in the holidays' } },
  single: { de: { title: 'Einzelstunden', sub: 'Training nur für dich' }, en: { title: 'Single Lessons', sub: 'Training just for you' } },
};

/** Which blocks are on at first, by kind (a trial lesson has no levels, a holiday course shows its dates). */
const FIRST_ON = {
  group: ['top', 'photo', 'title', 'table', 'cards', 'free', 'cta'],
  trial: ['top', 'photo', 'title', 'table', 'cards', 'free', 'cta'],
  holiday: ['top', 'photo', 'title', 'table', 'cards', 'free', 'cta'],
  single: ['top', 'photo', 'title', 'table', 'cards', 'cta'],
};

const rid = (rnd = Math.random) => Array.from({ length: 6 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(rnd() * 32)]).join('');

/** A new configuration for a kind of flyer. */
export function newConfig(art = 'group') {
  const kind = ARTS.some((a) => a.key === art) ? art : 'group';
  return {
    art: kind,
    langs: ['de'],
    formats: ['169', 'a4', 'sq'],
    oneEach: false,
    texts: { de: {}, en: {} },
    blocks: BLOCKS.map((b) => ({ id: b.id, on: FIRST_ON[kind].includes(b.id) })),
    rows: { when: true, time: true, where: true, duration: true },
    cardOn: { gather: true, pickup: true, cost: true, rain: false, bring: false },
    custom: [], // own text blocks: { id, title, text, on }
    ownCards: [], // own cards: { id, label, text, on }
    levels: [],
    deadline: '',
    spots: '',
    contact: '',
    qrUrl: '', // where the QR code leads; empty = the sign-up page of the offer
  };
}

/**
 * The address the QR code leads to when the user typed one (Noah 10.11.2026: the flyer leads to his own page, where prices and
 * trust are and where he sees how many come from the flyer). «example.ch/f» works too (https:// is added). Empty or not an
 * address → '' (then the sign-up page of the offer counts).
 */
export function cleanQrUrl(input) {
  const s = String(input ?? '').trim();
  if (!s || s.length > 300 || /\s/.test(s)) return '';
  const full = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(full);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.') ? u.href : '';
  } catch {
    return '';
  }
}

/** A saved configuration, filled up with what a newer app version added. */
export function normalizeConfig(c) {
  const base = newConfig(c?.art);
  if (!c || typeof c !== 'object') return base;
  const have = new Map((c.blocks ?? []).map((b) => [b.id, b]));
  const ordered = [
    ...(c.blocks ?? []).filter((b) => BLOCKS.some((x) => x.id === b.id)),
    ...base.blocks.filter((b) => !have.has(b.id)),
  ];
  return {
    ...base,
    ...c,
    texts: { de: { ...(c.texts?.de ?? {}) }, en: { ...(c.texts?.en ?? {}) } },
    blocks: ordered.map((b) => ({ id: b.id, on: !!b.on })),
    rows: { ...base.rows, ...(c.rows ?? {}) },
    cardOn: { ...base.cardOn, ...(c.cardOn ?? {}) },
    langs: (c.langs ?? []).filter((l) => LANGS.some((x) => x.key === l)).length ? c.langs.filter((l) => LANGS.some((x) => x.key === l)) : ['de'],
    formats: (c.formats ?? []).filter((f) => FORMATS.some((x) => x.key === f)).length ? c.formats.filter((f) => FORMATS.some((x) => x.key === f)) : base.formats,
    custom: (c.custom ?? []).map((x) => ({ id: x.id ?? rid(), title: x.title ?? '', text: x.text ?? '', on: x.on !== false })),
    ownCards: (c.ownCards ?? []).map((x) => ({ id: x.id ?? rid(), label: x.label ?? '', text: x.text ?? '', on: x.on !== false })),
    levels: (c.levels ?? []).map(normalizeLevel),
    qrUrl: String(c.qrUrl ?? ''),
  };
}

/** Moves the item with this id one place up or down; the other items keep their order. */
export function step(list, id, dir) {
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
/** The blocks the user can move: not the header, photo and band, which keep their place. */
export const movable = (blocks) => blocks.filter((b) => !BLOCKS.find((x) => x.id === b.id)?.fixed);
/** Moves a movable block one place among the movable ones (the fixed ones stay where they are). */
export function stepBlock(blocks, id, dir) {
  const mv = step(movable(blocks), id, dir);
  let k = 0;
  return blocks.map((b) => (BLOCKS.find((x) => x.id === b.id)?.fixed ? b : mv[k++]));
}
/** Moves the item at index `from` to index `to` (after dragging). */
export function moveTo(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
/** Drag among the movable blocks: from/to count only the movable ones. */
export function dragBlock(blocks, from, to) {
  const mv = moveTo(movable(blocks), from, to);
  let k = 0;
  return blocks.map((b) => (BLOCKS.find((x) => x.id === b.id)?.fixed ? b : mv[k++]));
}

/* ---------- levels ---------- */

export function normalizeLevel(l = {}) {
  return { id: l.id ?? rid(), offerId: l.offerId ?? null, name: l.name ?? '', day: l.day === '' || l.day == null ? '' : Number(l.day), time: l.time ?? '', place: l.place ?? '', price: l.price ?? '', on: l.on !== false };
}
/** Monday = 0 … Sunday = 6 of a day 'YYYY-MM-DD' (calendar arithmetic, no time zone). */
export function weekdayOf(day) {
  const [y, m, d] = day.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
/** 'HH:MM' + minutes → 'HH:MM' (stays within the day). */
export function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(24 * 60 - 1, h * 60 + m + Math.max(0, minutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
/** The slots of an offer from today on, by time; all slots when none is ahead. */
export function slotsAhead(offer, today) {
  const all = [...(offer?.slots ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const ahead = all.filter((s) => dayOf(s.at) >= today);
  return ahead.length ? ahead : all;
}
/** A level made from an offer: its weekday and time from the next time, its place and its price. */
export function levelFromOffer(entry, today) {
  const o = entry.offer ?? entry;
  const first = slotsAhead(o, today)[0];
  const type = (o.types ?? [])[0];
  const place = first?.venue || (o.venues ?? []).join(' / ') || o.place || '';
  return normalizeLevel({
    offerId: entry.id ?? o.id ?? null,
    name: o.title ?? '',
    day: first ? weekdayOf(dayOf(first.at)) : '',
    time: first ? `${timeOf(first.at)}${o.minutes ? `–${addMinutes(timeOf(first.at), o.minutes)}` : ''}` : '',
    place,
    price: type ? chf(type.price) : '',
  });
}
/** CHF text of a level price field: '140', '62.50', '62,5' → number or null. */
export function parsePrice(s) {
  const n = Number(String(s ?? '').trim().replace(',', '.'));
  return String(s ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
}

/* ---------- the content of one flyer ---------- */

const fmtDate = (day, w, withYear) => new Date(`${day}T12:00:00Z`).toLocaleDateString(w.locale, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const fmtLong = (day, w) => new Date(`${day}T12:00:00Z`).toLocaleDateString(w.locale, { day: 'numeric', month: 'long', timeZone: 'UTC' });
const uniq = (a) => [...new Set(a.filter(Boolean))];

/** The date range of the offers' times: «18. Aug – 10. Sept 2026», one day, or ''. */
export function rangeText(days, w) {
  const d = uniq(days).sort();
  if (!d.length) return '';
  if (d.length === 1) return fmtDate(d[0], w, true);
  const a = d[0];
  const b = d[d.length - 1];
  return `${fmtDate(a, w, a.slice(0, 4) !== b.slice(0, 4))} – ${fmtDate(b, w, true)}`;
}

/** Text that fits CHF: 'CHF 140', 'CHF 120–160' or the word for free. */
export function priceText(levels, w) {
  const p = levels.map((l) => parsePrice(l.price)).filter((x) => x != null);
  if (!p.length) return '';
  const lo = Math.min(...p);
  const hi = Math.max(...p);
  const one = (n) => (n % 1 ? n.toFixed(2) : String(n));
  if (hi === 0) return w.free;
  return lo === hi ? `CHF ${one(lo)}` : `CHF ${one(lo)}–${one(hi)}`;
}

/** The level lines for the block «Levels»: name + day, time, place, price. */
export function levelLine(l, w) {
  const price = parsePrice(l.price);
  return [l.day === '' ? '' : w.days[l.day], l.time, l.place, price == null ? '' : price === 0 ? w.free : `CHF ${price % 1 ? price.toFixed(2) : price}`].filter(Boolean).join(' · ');
}

/**
 * The content of one picture. cfg: the configuration, entries: the offers [{ id, offer }], lang: 'de'|'en',
 * variant: a level id when there is one flyer per level (that level only), today: 'YYYY-MM-DD'.
 */
export function buildModel(cfg, entries, lang, { variant = null, today = '' } = {}) {
  const w = WORDS[lang] ?? WORDS.de;
  const c = normalizeConfig(cfg);
  const own = c.texts[lang] ?? {};
  const first = ART_TEXTS[c.art][lang];
  const all = c.levels.filter((l) => l.on);
  const levels = variant ? all.filter((l) => l.id === variant) : all;
  const offerOf = (l) => entries.find((e) => e.id === l.offerId);
  const mainId = (levels[0]?.offerId) ?? c.offerId ?? entries[0]?.id ?? null;
  const days = uniq(levels.map((l) => l.day).filter((d) => d !== '').map((d) => w.days[d]));
  const slotDays = levels.flatMap((l) => slotsAhead(offerOf(l)?.offer, today).map((s) => dayOf(s.at)));
  // what the app fills in itself; the texts the person wrote win over it
  const auto = {
    title: first.title,
    sub: first.sub,
    when: days.join(' / '),
    time: uniq(levels.map((l) => l.time)).join(' / '),
    where: uniq(levels.map((l) => l.place)).join(' / '),
    duration: rangeText(slotDays, w),
    cost: priceText(levels, w),
    button: w.button,
    note: w.required,
  };
  const pick = (k) => (own[k] != null && own[k] !== '' ? own[k] : (auto[k] ?? ''));
  const rowValue = { when: pick('when'), time: pick('time'), where: pick('where'), duration: pick('duration') };
  const rows = TABLE_ROWS.filter((k) => c.rows[k] && rowValue[k]).map((k) => [w.rows[k], rowValue[k]]);
  const cardText = { gather: pick('gather'), pickup: pick('pickup'), cost: pick('cost'), rain: pick('rain'), bring: pick('bring') };
  const cards = [
    ...CARDS.filter((k) => c.cardOn[k] && cardText[k]).map((k) => ({ label: w.cards[k], text: cardText[k] })),
    ...c.ownCards.filter((x) => x.on && (x.label || x.text)).map((x) => ({ label: x.label, text: x.text })),
  ];
  const chips = [];
  if (c.deadline) chips.push({ kind: 'deadline', text: `${w.deadline} ${fmtLong(c.deadline, w)}` });
  if (String(c.spots).trim() !== '' && Number(c.spots) > 0) chips.push({ kind: 'spots', text: w.spots(Number(c.spots)) });
  const trainer = pick('trainerText') || pick('trainerName') ? { name: pick('trainerName'), text: pick('trainerText') } : null;
  const on = new Set(c.blocks.filter((b) => b.on).map((b) => b.id));
  const order = c.blocks.filter((b) => b.on).map((b) => b.id).filter((id) => {
    if (id === 'table') return rows.length > 0;
    if (id === 'levels') return levels.length > 0;
    if (id === 'cards') return cards.length > 0;
    if (id === 'trainer') return !!trainer;
    if (id === 'free') return chips.length > 0;
    return true;
  });
  const extra = c.custom.filter((x) => x.on && (x.title || x.text));
  const url = cleanQrUrl(c.qrUrl) || (mainId ? shareUrl(mainId) : '');
  return {
    lang,
    words: w,
    order,
    audience: pick('audience'),
    hint: pick('hint'),
    badge: pick('badge'),
    title: pick('title'),
    sub: pick('sub'),
    rows,
    levels: levels.map((l) => ({ name: l.name, line: levelLine(l, w) })),
    cards,
    trainer,
    chips,
    extra,
    button: pick('button'),
    note: pick('note'),
    auto,
    contact: c.contact,
    url,
    shortUrl: url.replace(/^https?:\/\//, ''),
    has: (id) => on.has(id),
  };
}

/** The pictures to make: one per language and level (when there is one flyer per level). → [{ lang, variant, name }] */
export function variantsOf(cfg) {
  const c = normalizeConfig(cfg);
  const levels = c.oneEach ? c.levels.filter((l) => l.on) : [];
  const vs = levels.length ? levels.map((l) => ({ variant: l.id, name: l.name })) : [{ variant: null, name: '' }];
  return c.langs.flatMap((lang) => vs.map((v) => ({ lang, ...v })));
}
/** The number of pictures «Save all» makes. */
export const countImages = (cfg) => variantsOf(cfg).length * normalizeConfig(cfg).formats.length;
/** A file name for a picture: «tennis-unterricht-unterstufe-a4-de.png». */
export function fileNameOf(model, format, name = '', ext = 'png') {
  const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${[slug(model.title) || 'flyer', slug(name), format, model.lang].filter(Boolean).join('-')}.${ext}`;
}

/* ---------- the prepared mail ---------- */

/** The mail for one language: subject and text. The app sends nothing itself. */
export function mailText(model) {
  const w = model.words;
  const lines = [model.title, model.sub, ''];
  for (const [k, v] of model.rows) lines.push(`${k}: ${v}`);
  for (const l of model.levels) lines.push(`${l.name}: ${l.line}`);
  for (const c of model.cards) lines.push(`${c.label}: ${c.text}`);
  for (const ch of model.chips) lines.push(ch.text);
  lines.push('', model.url ? `${w.mailLink}: ${model.url}` : '');
  if (model.contact) lines.push(model.contact);
  return { subject: w.mailSubject(model.title), body: lines.filter((x, i, a) => !(x === '' && (i === 0 || a[i - 1] === ''))).join('\n').trim() };
}
/** A mailto link; the recipients go into Bcc so nobody sees the others. Mail clients cut very long links: cap the list. */
export function mailtoHref({ subject, body }, bcc = []) {
  const list = uniq(bcc).slice(0, 60);
  const q = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`, ...(list.length ? [`bcc=${encodeURIComponent(list.join(','))}`] : [])];
  return `mailto:?${q.join('&')}`;
}
/** The e-mail addresses among the contacts of the customers. */
export const emailsOf = (customers = []) => uniq(customers.map((c) => String(c.contact ?? '').trim()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)));

/* ---------- the photo ---------- */

/** The part of a picture (iw × ih) that fills a box (bw × bh): cover, zoomed (1–4), around the focus point (fx, fy in 0…1). */
export function photoRect(iw, ih, bw, bh, fx = 0.5, fy = 0.5, zoom = 1) {
  const z = Math.min(4, Math.max(1, Number(zoom) || 1));
  const k = Math.max(bw / iw, bh / ih) * z;
  const sw = bw / k;
  const sh = bh / k;
  const sx = Math.min(iw - sw, Math.max(0, fx * iw - sw / 2));
  const sy = Math.min(ih - sh, Math.max(0, fy * ih - sh / 2));
  return { sx, sy, sw, sh };
}
/** The empty photo store. */
export const emptyPhotos = () => ({ items: [], current: null, fx: 0.5, fy: 0.5, zoom: 1 });
export const MAX_PHOTOS = 6;
/** Adds a picture (a data address) and makes it the current one; the oldest goes when there are too many. */
export function addPhoto(store, src, rnd = Math.random) {
  const s = store?.items ? store : emptyPhotos();
  const id = rid(rnd);
  const items = [...s.items, { id, src }].slice(-MAX_PHOTOS);
  return { ...s, items, current: id, fx: 0.5, fy: 0.5, zoom: 1 };
}
/** Removes a picture; the current one becomes the last one left. */
export function removePhoto(store, id) {
  const items = (store?.items ?? []).filter((p) => p.id !== id);
  return { ...(store ?? emptyPhotos()), items, current: store?.current === id ? (items[items.length - 1]?.id ?? null) : store?.current ?? null };
}
export const currentPhoto = (store) => store?.items?.find((p) => p.id === store.current) ?? null;

/* ---------- templates ---------- */

/** A new template from a configuration: the offer links and the levels' offers are not part of it. */
export function templateFrom(name, cfg, rnd = Math.random) {
  const c = normalizeConfig(cfg);
  return { id: rid(rnd), name: String(name).trim() || 'Template', config: { ...c, levels: c.levels.map((l) => ({ ...l, offerId: null })) } };
}
/** Applies a template to a configuration: its blocks, texts and options; the levels stay (they come from the offers). */
export function applyTemplate(cfg, template) {
  const c = normalizeConfig(cfg);
  const t = normalizeConfig(template.config);
  return normalizeConfig({ ...t, levels: c.levels, deadline: c.deadline, spots: c.spots });
}
