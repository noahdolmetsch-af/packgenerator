/**
 * Paket P4 «Aktiv» (mockups TN1, TN2, TN4, TN5; Noah 21.10.2026 «alle offenen Mockups freigegeben», 5b: only
 * for tennis): the top of the tennis page (#/flow/sport/act:tennis).
 *
 *   tennisOf      the settings record «tennis.page»: the cover photo (a small JPEG on the device, in the
 *                 backup) with its crop, and the booking link (the court app or page, set once).
 *   playDraft     the sheet «Tennis gespielt», prefilled like last time (kind, duration, court).
 *   nextSlot      the next planned time on the court that is not answered yet.
 *   askSlot       TN5: a planned time that is over and still open: «Gespielt?».
 *   tennisStats   played this month, lessons given this month, hours on the court this year.
 *   recentTennis  the last entries (played and lessons given), newest first.
 *
 * Entries live in the table sportItems (sportsdb.js): kind 'played' { day, type, min, court, result, worked,
 * flowId }, kind 'taught' { day, min, note, flowId }, kind 'slot' { day, time, min, court, answer }. A played
 * game also writes a tick of the activity Tennis in Aktiv (flowLog, its id in flowId), so it counts there.
 * Pure functions, tested in tests/tennisday.test.js.
 */

export const TENNIS_ID = 'act:tennis';
export const TENNIS_ACT = 'tennis';
export const TENNIS_KEY = 'tennis.page';

/** The choices of the sheet, English keys for t(). */
export const PLAY_TYPES = [
  { key: 'training', label: 'Training|tennis' },
  { key: 'match', label: 'Match|tennis' },
  { key: 'double', label: 'Doubles|tennis' },
  { key: 'fun', label: 'Just for fun|tennis' },
];
export const PLAY_MINUTES = [60, 90, 120];
export const COURTS = [
  { key: 'clay', label: 'Clay|court' },
  { key: 'indoor', label: 'Indoor|court' },
  { key: 'hard', label: 'Hard court|court' },
];
export const RESULTS = [
  { key: 'win', label: 'Win|tennis' },
  { key: 'loss', label: 'Loss|tennis' },
  { key: 'none', label: 'Without|result' },
];
const TYPE_KEYS = PLAY_TYPES.map((x) => x.key);
const COURT_KEYS = COURTS.map((x) => x.key);
const RESULT_KEYS = RESULTS.map((x) => x.key);

/** Only a web address (http or https) is kept as a link; anything else is dropped. */
export function safeUrl(s) {
  const v = String(s ?? '').trim();
  if (!v) return '';
  const full = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(full);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

const clampPct = (n, d = 50) => {
  const x = Number(n);
  return Number.isFinite(x) ? Math.max(0, Math.min(100, Math.round(x))) : d;
};

/** The settings record made whole: { cover: dataURL | null, y: 0–100, bookUrl, bookName }. */
export function tennisOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const cover = typeof v.cover === 'string' && v.cover.startsWith('data:image/') ? v.cover : null;
  return { cover, y: clampPct(v.y), bookUrl: safeUrl(v.bookUrl), bookName: String(v.bookName ?? '').trim().slice(0, 60) };
}

const byDayDesc = (a, b) => String(b.day).localeCompare(String(a.day)) || String(b.at ?? '').localeCompare(String(a.at ?? ''));
const mine = (items, kind) => (Array.isArray(items) ? items : []).filter((x) => x && x.sport === TENNIS_ID && x.kind === kind);

/** The last game played, or null. */
export const lastPlayed = (items) => [...mine(items, 'played')].sort(byDayDesc)[0] ?? null;

/** The sheet's start: like last time (kind, duration, court), result «without», today. */
export function playDraft(items, today) {
  const l = lastPlayed(items);
  return {
    day: today,
    type: TYPE_KEYS.includes(l?.type) ? l.type : 'training',
    min: Number(l?.min) > 0 ? Number(l.min) : 90,
    court: COURT_KEYS.includes(l?.court) ? l.court : 'clay',
    result: 'none',
    worked: '',
  };
}

/** A played entry made clean for saving (without id and flowId). */
export function cleanPlayed(f = {}, today) {
  const min = Math.max(5, Math.min(600, Math.round(Number(f.min) || 90)));
  return {
    sport: TENNIS_ID,
    kind: 'played',
    day: /^\d{4}-\d{2}-\d{2}$/.test(f.day ?? '') ? f.day : today,
    type: TYPE_KEYS.includes(f.type) ? f.type : 'training',
    min,
    court: COURT_KEYS.includes(f.court) ? f.court : 'clay',
    result: RESULT_KEYS.includes(f.result) ? f.result : 'none',
    worked: String(f.worked ?? '').trim().slice(0, 300),
  };
}

const hm = (s) => (/^\d{2}:\d{2}$/.test(s ?? '') ? s : '');
const slotKey = (x) => `${x.day}T${hm(x.time) || '00:00'}`;

/** A planned time made clean for saving. */
export function cleanSlot(f = {}, today) {
  return {
    sport: TENNIS_ID,
    kind: 'slot',
    day: /^\d{4}-\d{2}-\d{2}$/.test(f.day ?? '') ? f.day : today,
    time: hm(f.time) || '18:00',
    min: Math.max(15, Math.min(600, Math.round(Number(f.min) || 60))),
    court: COURT_KEYS.includes(f.court) ? f.court : 'clay',
  };
}

/** The open planned times (not answered), soonest first. */
const openSlots = (items) => mine(items, 'slot').filter((x) => !x.answer).sort((a, b) => slotKey(a).localeCompare(slotKey(b)));

/** The next planned time from now on (today later or a later day), or null. now: 'HH:MM'. */
export function nextSlot(items, today, now = '00:00') {
  return openSlots(items).find((x) => x.day > today || (x.day === today && (hm(x.time) || '00:00') > now)) ?? null;
}

/** TN5: the planned time that is over and still open (at most a week back), the latest first, or null. */
export function askSlot(items, today, now = '23:59', weekAgo = '') {
  const over = openSlots(items).filter((x) => (x.day < today || (x.day === today && (hm(x.time) || '00:00') <= now)) && (!weekAgo || x.day >= weekAgo));
  return over.at(-1) ?? null;
}

/** The numbers of the Verlauf: { month, taught, hours } (month: days played this month, from Aktiv). */
export function tennisStats(items, log, today) {
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const ticks = (Array.isArray(log) ? log : []).filter((e) => e && e.actId === TENNIS_ACT && e.day <= today);
  const days = new Set(ticks.filter((e) => String(e.day).startsWith(month)).map((e) => e.day));
  const taught = mine(items, 'taught').filter((x) => String(x.day).startsWith(month)).length;
  const played = mine(items, 'played').filter((x) => String(x.day).startsWith(year));
  const linked = new Set(played.map((x) => x.flowId).filter(Boolean));
  // minutes: every played entry, plus a tick of the year that has minutes and no played entry
  let min = played.reduce((s, x) => s + (Number(x.min) || 0), 0);
  for (const e of ticks) if (String(e.day).startsWith(year) && !linked.has(e.id)) min += Number(e.min) || 0;
  return { month: days.size, taught, hours: Math.round((min / 60) * 10) / 10 };
}

/** The last entries, played and lessons given, newest first. */
export const recentTennis = (items, n = 5) => [...mine(items, 'played'), ...mine(items, 'taught')].sort(byDayDesc).slice(0, n);

/** The label key of a choice (for t()). */
export const labelOf = (list, key) => list.find((x) => x.key === key)?.label ?? '';
