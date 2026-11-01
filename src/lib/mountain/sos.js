/**
 * Paket J «Berg, Schnee und Notfall»: the pure parts of the emergency pages.
 * - #325 (Noah 3a) Notfall-Knopf: your position big (degrees and Swiss coordinates LV95, which Rega
 *   asks for) and a call to Rega 1414 or 112. #217: the emergency line, also offline.
 * - #311 (Noah 4a) Notfall-QR: an image for the lock screen with a QR code of your emergency card.
 *   The card lives only on this device (settings 'sos.card', in your backup), every line can be
 *   changed or cleared. #1001: a contact (.vcf) fills the emergency contact with one tap.
 * - #220 the colours of the Swiss signposts and the SAC scales, #219 Swiss sources per sport.
 * Tested in tests/bergnotfall.test.js. Labels are English keys for t().
 */

/** settings key of the emergency card. */
export const CARD_KEY = 'sos.card';
/** settings key of the hidden Swiss sources (#219, every suggestion can be taken away). */
export const LINKS_OFF_KEY = 'mountain.linksOff';

/** The numbers (#217). Rega: air rescue in Switzerland; 112: Europe-wide emergency. */
export const CALLS = [
  { key: 'rega', number: '1414', label: 'Rega 1414', sub: 'Air rescue in Switzerland' },
  { key: 'eu', number: '112', label: 'Emergency 112', sub: 'Europe-wide, also without a SIM' },
];

/** The fields of the emergency card, in the order of the QR text. */
export const CARD_FIELDS = [
  { key: 'name', label: 'Name|sos', hint: 'Optional' },
  { key: 'contact', label: 'Emergency contact', hint: 'Who should be called' },
  { key: 'phone', label: 'Their phone number', hint: '+41 …', type: 'tel' },
  { key: 'contact2', label: 'Second contact', hint: 'Optional' },
  { key: 'phone2', label: 'Second phone number', hint: 'Optional', type: 'tel' },
  { key: 'blood', label: 'Blood group', hint: 'Optional' },
  { key: 'allergies', label: 'Allergies', hint: 'Optional' },
  { key: 'meds', label: 'Medicines', hint: 'Optional' },
  { key: 'notes', label: 'Other', hint: 'Optional, e.g. insurance number' },
];

/** The card with every value trimmed; unknown keys are dropped. */
export function cleanCard(card) {
  const out = {};
  for (const f of CARD_FIELDS) {
    const v = String(card?.[f.key] ?? '').trim().slice(0, 120);
    if (v) out[f.key] = v;
  }
  return out;
}

/** Is there something on the card? */
export const hasCard = (card) => Object.keys(cleanCard(card)).length > 0;

/**
 * The text of the QR code: plain lines a phone camera shows without any app.
 * labels(key) gives the label in the current language (t).
 */
export function cardText(card, labels = (k) => k, title = 'EMERGENCY / ICE') {
  const c = cleanCard(card);
  const lines = [title];
  for (const f of CARD_FIELDS) if (c[f.key]) lines.push(`${labels(f.label)}: ${c[f.key]}`);
  return lines.join('\n');
}

/**
 * #1158: the lines of the wallet card, at most 8 so they fit 85.6 × 54 mm: [{ key, label, value }].
 * The QR code beside them holds every line anyway.
 */
export function walletLines(card, labels = (k) => k, max = 8) {
  const c = cleanCard(card);
  return CARD_FIELDS.filter((f) => c[f.key])
    .slice(0, max)
    .map((f) => ({ key: f.key, label: labels(f.label), value: c[f.key] }));
}

/** Phone number for a tel: link (spaces and dashes out). */
export const telOf = (n) => `tel:${String(n ?? '').replace(/[^\d+]/g, '')}`;

/**
 * #1001: the first name and phone number of a vCard (.vcf). Returns { name, phone } or null.
 * Folded lines (a line that starts with a space continues the one before) are joined.
 */
export function parseVcf(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  let name = '';
  let n = '';
  let phone = '';
  for (const raw of lines) {
    const i = raw.indexOf(':');
    if (i < 0) continue;
    const key = raw.slice(0, i).split(';')[0].toUpperCase();
    const val = raw.slice(i + 1).trim();
    if (key === 'FN' && !name) name = val;
    if (key === 'N' && !n) n = val.split(';').slice(0, 2).reverse().filter(Boolean).join(' ');
    if (key === 'TEL' && !phone) phone = val.replace(/^tel:/i, '');
  }
  const who = (name || n).replace(/\\,/g, ',').trim();
  return who || phone ? { name: who, phone: phone.trim() } : null;
}

/**
 * WGS84 → Swiss coordinates LV95 (E, N), with swisstopo's approximate formulas (about 1 m).
 * Null outside Switzerland and Liechtenstein's frame.
 */
export function toLv95(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const p = (lat * 3600 - 169028.66) / 10000;
  const l = (lon * 3600 - 26782.5) / 10000;
  const e = 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3;
  const n = 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p ** 3;
  if (e < 2480000 || e > 2840000 || n < 1070000 || n > 1300000) return null;
  return { e: Math.round(e), n: Math.round(n) };
}

/** 2'600'000 like the Swiss map writes it. */
export const swissNum = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');

/** Degrees with 5 decimals (about 1 m). */
export const deg = (v) => (Number.isFinite(v) ? v.toFixed(5) : '');

/** The position as one line to read out or copy. */
export function positionText(pos) {
  if (!pos) return '';
  const ch = toLv95(pos.lat, pos.lon);
  return [`${deg(pos.lat)}, ${deg(pos.lon)}`, ch ? `LV95 ${swissNum(ch.e)} / ${swissNum(ch.n)}` : '', Number.isFinite(pos.alt) ? `${Math.round(pos.alt)} m` : ''].filter(Boolean).join(' · ');
}

/* ---------- #220 signposts and scales (information, no rating) ---------- */

/** The Swiss hiking signposts by colour, with the SAC hiking grades they go with. */
export const SIGNS = [
  { key: 'yellow', colors: ['#f2c300'], name: 'Hiking trail', text: 'Yellow: wide paths, no special demands. Like SAC T1.', grade: 'T1' },
  { key: 'mountain', colors: ['#ffffff', '#d4202a', '#ffffff'], name: 'Mountain hiking trail', text: 'White-red-white: narrow, steep in places, sure-footedness needed. SAC T2 to T3.', grade: 'T2–T3' },
  { key: 'alpine', colors: ['#ffffff', '#2a62b8', '#ffffff'], name: 'Alpine hiking trail', text: 'White-blue-white: partly without a path, snow fields or easy climbing possible. SAC T4 to T6.', grade: 'T4–T6' },
];

/** The SAC hiking scale. */
export const HIKE_SCALE = [
  { grade: 'T1', name: 'Hiking', text: 'Path well laid out, flat or gently sloping.' },
  { grade: 'T2', name: 'Mountain hiking', text: 'Path with a continuous line, steep in places; some sure-footedness.' },
  { grade: 'T3', name: 'Demanding mountain hiking', text: 'Exposed places, rough ground; hands sometimes needed.' },
  { grade: 'T4', name: 'Alpine hiking', text: 'Not always a path; easy snow fields; experience in the mountains.' },
  { grade: 'T5', name: 'Demanding alpine hiking', text: 'Often without a path; easy climbing; ice axe and crampons possible.' },
  { grade: 'T6', name: 'Difficult alpine hiking', text: 'Mostly without a path; climbing up to II; very exposed.' },
];

/** The SAC ski touring scale. */
export const SKI_SCALE = [
  { grade: 'L', name: 'Easy', text: 'Up to about 30°; smooth, open slopes.' },
  { grade: 'WS', name: 'Fairly easy', text: 'From about 30°; short steeper parts, few obstacles.' },
  { grade: 'ZS', name: 'Fairly difficult', text: 'From about 35°; short steep steps, obstacles to go round.' },
  { grade: 'S', name: 'Difficult', text: 'From about 40°; long steep slopes, narrow passages.' },
  { grade: 'SS', name: 'Very difficult', text: 'From about 45°; steep flanks, rock steps.' },
  { grade: 'AS', name: 'Extremely difficult', text: 'From about 50°; very steep, with jumps over rock.' },
  { grade: 'EX', name: 'Extreme', text: 'From about 55°; extremely steep faces and couloirs.' },
];

/* ---------- #219 Swiss sources per sport ---------- */

/** Suggested Swiss pages by sport. Each one can be hidden (LINKS_OFF_KEY) and shown again. */
export function mountainLinks(lang = 'de') {
  const de = lang !== 'en';
  return [
    { id: 'slf', sport: 'ski', name: 'SLF avalanche bulletin', sub: 'The bulletin the evening before and in the morning', href: de ? 'https://www.slf.ch/de/lawinenbulletin-und-schneesituation/' : 'https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/' },
    { id: 'whiterisk', sport: 'ski', name: 'White Risk', sub: 'Learn about avalanches, plan tours (SLF)', href: 'https://www.whiterisk.ch/' },
    { id: 'sac', sport: 'all', name: 'SAC tour portal', sub: 'Routes, huts and grades of the Swiss Alpine Club', href: 'https://www.sac-cas.ch/de/huetten-und-touren/sac-tourenportal/' },
    { id: 'meteo', sport: 'all', name: 'MeteoSwiss', sub: 'Forecast, warnings and the mountain weather', href: de ? 'https://www.meteoschweiz.admin.ch/' : 'https://www.meteoswiss.admin.ch/' },
    { id: 'swisstopo', sport: 'all', name: 'swisstopo map', sub: 'The national map with slopes and ski routes', href: 'https://map.geo.admin.ch/' },
    { id: 'schweizmobil', sport: 'hiking', name: 'SchweizMobil', sub: 'Official hiking routes of Switzerland', href: de ? 'https://schweizmobil.ch/de/wanderland' : 'https://schweizmobil.ch/en/hiking-in-switzerland' },
    { id: 'rega', sport: 'all', name: 'Rega app', sub: 'Sends your position with the alarm', href: de ? 'https://www.rega.ch/de/die-rega-app' : 'https://www.rega.ch/en/the-rega-app' },
  ];
}

/** The sports in the order of the groups on the page. */
export const LINK_SPORTS = [
  { key: 'ski', name: 'Ski touring' },
  { key: 'hiking', name: 'Hiking' },
  { key: 'all', name: 'For every mountain tour' },
];
