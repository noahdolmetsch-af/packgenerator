/**
 * Package G «Daten kommen von selbst» (#157 «Fitbit-Achtsamkeit ins Meditations-Protokoll», #158
 * «Fitbit-Trainings wie Tennis als Aktiv-Verlauf»): the OLD Fitbit data from the Google Takeout export
 * becomes Aktiv history. New data comes later through the live connection (not here). Pure and tested.
 *
 * The export holds the trainings twice, with different ids:
 *   - Global Export Data/exercise-<n>.json: [{ logId, activityName (in the account's language),
 *     activityTypeId, startTime 'MM/DD/YY HH:MM:SS' (UTC), duration, activeDuration (ms), logType }]
 *   - Health Fitness Data_GoogleData/UserExercises_<date>.csv: exercise_id, exercise_start,
 *     exercise_end (UTC), utc_offset, activity_name (English, with later edits), log_type, deletion_reason
 * Both are merged: the same training starts within 2 minutes; the CSV row wins (it carries edits).
 * The mindfulness sessions are also there twice, with the same id:
 *   - Mindfulness/Mindfulness Sessions.csv: session_id, activity_name, duration (ms), start_date_time,
 *     end_date_time, session_type
 *   - Physical Activity_GoogleData/Mindfulness Session/mindfulness_session_<date>.csv: start time,
 *     end time, metadata_session_name, metadata_type, metadata_active_duration_seconds, metadata_external_id
 *
 * An item: { kind: 'ex'|'mind', src, srcId, name, typeId?, start (ms), min, auto? }.
 * A training becomes a flowLog entry { id 'fl-fb-e-<srcId>', actId, day, at, n: 1, min, via: 'fitbit', fbType };
 * a mindfulness session also gets its flowSessions record (same id 'fl-fb-m-<sessionId>'), like the timer.
 * Day and time in Europe/Zurich. A second import adds nothing twice (same id, or a Fitbit entry
 * starting within 2 minutes, or an own tick of the same activity on that day).
 */

export const VIA = 'fitbit';
const NEAR_MS = 2 * 60 * 1000;

/* ---------- Fitbit types → app activities ---------- */
/**
 * The known Fitbit types: key, English label (shown through t() with '|fbtype'), Fitbit activity type
 * ids, names in English and German (lower case; a name may also start a longer one, «Ski Alpin, …»),
 * the app activities to try by id, and a pattern for the user's own activities by name.
 */
export const FITBIT_TYPES = [
  { key: 'run', label: 'Run|fbtype', ids: [90009], names: ['run', 'running', 'outdoor run', 'laufen', 'joggen'], acts: ['run'], words: /\b(run|running|lauf|laufen|jogg)/i },
  { key: 'treadmill', label: 'Treadmill|fbtype', ids: [90019], names: ['treadmill', 'treadmill run', 'laufband'], acts: ['run'], words: /\b(run|running|lauf|laufen|jogg)/i },
  { key: 'walk', label: 'Walk|fbtype', ids: [90013], names: ['walk', 'walking', 'outdoor walk', 'gehen', 'spazieren'], acts: ['walk', 'hike'], words: /walk|spazier|wander|hike/i },
  { key: 'hike', label: 'Hike|fbtype', ids: [90012], names: ['hike', 'hiking', 'wandern'], acts: ['hike', 'walk'], words: /hike|wander|walk|spazier/i },
  { key: 'outdoorbike', label: 'Outdoor bike|fbtype', ids: [1071], names: ['outdoor bike', 'radfahren im freien'], acts: ['bike'], words: /velo|bike|cycl|radfahr/i },
  { key: 'bike', label: 'Bike|fbtype', ids: [90001], names: ['bike', 'biking', 'cycling', 'radfahren'], acts: ['bike'], words: /velo|bike|cycl|radfahr/i },
  { key: 'spinning', label: 'Spinning|fbtype', ids: [55001], names: ['spinning', 'indoor bike', 'indoor cycling'], acts: ['spin'], words: /spin|indoor/i },
  { key: 'yoga', label: 'Yoga|fbtype', ids: [52000], names: ['yoga'], acts: ['yoga'], words: /yoga/i },
  { key: 'weights', label: 'Weights|fbtype', ids: [2131], names: ['weights', 'weight training', 'gewichte', 'krafttraining'], acts: ['gym'], words: /\bgym\b|kraft|fitness|weights/i },
  { key: 'workout', label: 'Workout|fbtype', ids: [3000], names: ['workout', 'training'], acts: ['gym'], words: /\bgym\b|kraft|fitness/i },
  { key: 'hiit', label: 'Interval workout|fbtype', ids: [], names: ['hiit', 'interval workout', 'intervalltraining'], acts: ['gym'], words: /\bgym\b|kraft|fitness/i },
  { key: 'tennis', label: 'Tennis|fbtype', ids: [15675], names: ['tennis'], acts: ['tennis'], words: /tennis/i },
  { key: 'swim', label: 'Swim|fbtype', ids: [90024], names: ['swim', 'swimming', 'schwimmen'], acts: ['swim'], words: /swim|schwimm/i },
  { key: 'climb', label: 'Climbing|fbtype', ids: [], names: ['climbing', 'bouldering', 'klettern', 'bouldern'], acts: ['climb'], words: /climb|kletter|boulder/i },
  { key: 'hockey', label: 'Ice hockey|fbtype', ids: [], names: ['ice hockey', 'hockey', 'eishockey'], acts: ['hockey'], words: /hockey/i },
  { key: 'stretch', label: 'Stretching|fbtype', ids: [], names: ['stretching', 'dehnen'], acts: ['stretch'], words: /stretch|dehn/i },
  { key: 'pilates', label: 'Pilates|fbtype', ids: [], names: ['pilates'], acts: [], words: /pilates/i },
  { key: 'xcski', label: 'Cross-country ski|fbtype', ids: [91053], names: ['cross-country ski', 'cross-country skiing', 'skilanglauf', 'langlauf'], acts: [], words: /langlauf|cross-country/i },
  { key: 'ski', label: 'Skiing|fbtype', ids: [19160], names: ['skiing', 'ski', 'ski alpin'], acts: ['ski'], words: /\bski\b|skifahr|skiing/i },
  { key: 'elliptical', label: 'Elliptical|fbtype', ids: [20047], names: ['elliptical', 'ellipsentrainer', 'crosstrainer'], acts: [], words: null },
  { key: 'rowing', label: 'Rowing machine|fbtype', ids: [91041], names: ['rowing machine', 'rudermaschine', 'rowing', 'rudern'], acts: [], words: /rowing|rudern/i },
  { key: 'outdoorworkout', label: 'Outdoor workout|fbtype', ids: [1072], names: ['outdoor workout', 'outdoor-training'], acts: [], words: null },
  { key: 'aerobic', label: 'Aerobic workout|fbtype', ids: [3001], names: ['aerobic workout', 'aerobic'], acts: [], words: null },
  { key: 'sport', label: 'Sport|fbtype', ids: [15000], names: ['sport'], acts: [], words: null },
];
const BY_KEY = new Map(FITBIT_TYPES.map((x) => [x.key, x]));
const BY_ID = new Map(FITBIT_TYPES.flatMap((x) => x.ids.map((id) => [id, x])));

const clean = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const startsWord = (name, n) => name.startsWith(n) && (name.length === n.length || /[^a-zäöüß]/.test(name[n.length]));

/** The known Fitbit type of a training (by its name, then its type id), or null. */
export function knownType(item) {
  const name = clean(item?.name);
  if (name) {
    const exact = FITBIT_TYPES.find((x) => x.names.includes(name));
    if (exact) return exact;
    const start = FITBIT_TYPES.find((x) => x.names.some((n) => startsWord(name, n)));
    if (start) return start;
  }
  return BY_ID.get(Number(item?.typeId)) ?? null;
}

/**
 * The type key of an item: a known training type ('tennis'), another training ('x:<name>') or a
 * mindfulness kind ('mind:<name>').
 */
export function typeKey(item) {
  if (item?.kind === 'mind') return `mind:${clean(item.name) || 'session'}`;
  return knownType(item)?.key ?? `x:${clean(item?.name) || 'unknown'}`;
}

/** The label of a type: { text, known } — a known one goes through t(), a name from the file not. */
export function typeLabel(key, name = '') {
  const k = BY_KEY.get(key);
  if (k) return { text: k.label, known: true };
  return { text: String(name || key.replace(/^(x|mind):/, '')), known: false };
}

const actWords = (a) => `${a?.name ?? ''} ${a?.nameDe ?? ''} ${a?.id ?? ''}`;
/**
 * The suggested app activity for a type: by id (seeded activities), then by the name of the user's
 * own; mindfulness goes to «meditation» or the first activity of the ring «Achtsam». null = skip.
 */
export function defaultAct(key, acts = []) {
  const list = [...acts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (key.startsWith('mind:')) return (list.find((a) => a.id === 'meditation') ?? list.find((a) => a.ring === 'mind'))?.id ?? null;
  const k = BY_KEY.get(key);
  if (!k) return null;
  for (const id of k.acts) if (list.some((a) => a.id === id)) return id;
  return (k.words && list.find((a) => k.words.test(actWords(a)))?.id) ?? null;
}

/* ---------- reading the files ---------- */
/** CSV text → rows as objects (quotes, commas and line breaks in quotes, CRLF). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  const s = String(text ?? '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') (f += '"'), i++;
        else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') row.push(f), (f = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(f);
      rows.push(row);
      row = [];
      f = '';
    } else f += c;
  }
  if (f !== '' || row.length) row.push(f), rows.push(row);
  const [head, ...body] = rows.filter((r) => r.some((x) => x !== ''));
  if (!head) return [];
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}

/** Is this path (inside the zip) a file the import reads? */
export function wantedPath(path) {
  const base = String(path ?? '').split('/').pop();
  return /^exercise-\d+\.json$/i.test(base) || /^UserExercises.*\.csv$/i.test(base) || /^Mindfulness Sessions\.csv$/i.test(base) || /^mindfulness_session_.*\.csv$/i.test(base);
}

/** 'MM/DD/YY HH:MM:SS' (UTC in the Takeout export) → ms. */
function fitbitTime(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{2,4}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(s ?? '').trim());
  if (!m) return Number.isFinite(Date.parse(s)) ? Date.parse(s) : NaN;
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return Date.UTC(y, Number(m[1]) - 1, Number(m[2]), Number(m[4]), Number(m[5]), Number(m[6]));
}
const isoMs = (s) => {
  const v = String(s ?? '').trim();
  return v && v !== 'null' ? Date.parse(v) : NaN;
};
const AUTO = /auto/i;

function fromExerciseJson(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((a) => a && a.logId != null && (a.activityName || a.activityTypeId))
    .map((a) => {
      const ms = Number(a.activeDuration) || Number(a.duration) || 0;
      return { kind: 'ex', src: 'json', srcId: String(a.logId), name: String(a.activityName ?? ''), typeId: Number(a.activityTypeId) || null, start: fitbitTime(a.startTime), sec: ms / 1000, auto: AUTO.test(a.logType ?? '') };
    })
    .filter((x) => Number.isFinite(x.start));
}

function fromExerciseCsv(rows) {
  return rows
    .filter((r) => r.exercise_id && !(r.deletion_reason && !/^(unspecified)?$/i.test(r.deletion_reason)))
    .map((r) => {
      const start = isoMs(r.exercise_start);
      const end = isoMs(r.exercise_end);
      return { kind: 'ex', src: 'csv', srcId: String(r.exercise_id), name: String(r.activity_name ?? ''), typeId: null, start, sec: Number.isFinite(end) ? (end - start) / 1000 : 0, auto: AUTO.test(r.log_type ?? '') };
    })
    .filter((x) => Number.isFinite(x.start));
}

function fromMindCsv(rows) {
  return rows
    .filter((r) => r.session_id)
    .map((r) => {
      const start = isoMs(r.start_date_time);
      const end = isoMs(r.end_date_time);
      const sec = Number.isFinite(end) ? (end - start) / 1000 : (Number(r.duration) || 0) / 1000;
      return { kind: 'mind', src: 'mindcsv', srcId: String(r.session_id), name: String(r.activity_name ?? '') || String(r.session_type ?? ''), start, end: Number.isFinite(end) ? end : null, sec };
    })
    .filter((x) => Number.isFinite(x.start));
}

function fromMindSeries(rows) {
  return rows
    .map((r, i) => {
      const start = isoMs(r['start time']);
      const end = isoMs(r['end time']);
      const sec = Number.isFinite(end) ? (end - start) / 1000 : Number(r.metadata_active_duration_seconds) || Number(r.metadata_media_content_duration_seconds) || 0;
      const id = r.metadata_external_id || `t${Number.isFinite(start) ? start.toString(36) : i}`;
      return { kind: 'mind', src: 'mindts', srcId: String(id), name: String(r.metadata_session_name ?? '') || String(r.metadata_type ?? ''), start, end: Number.isFinite(end) ? end : null, sec };
    })
    .filter((x) => Number.isFinite(x.start));
}

/**
 * One file's text → { kind: 'exjson'|'excsv'|'mindcsv'|'mindts'|null, items }. The kind comes from
 * the content (a file chosen out of the unzipped folder keeps only its own name).
 */
export function parseFile(name, text) {
  const s = String(text ?? '').replace(/^﻿/, '');
  const head = s.slice(0, 2000);
  if (/^\s*\[/.test(head)) {
    try {
      const list = JSON.parse(s);
      if (Array.isArray(list) && list.some((a) => a && 'logId' in a && ('activityName' in a || 'activityTypeId' in a))) return { kind: 'exjson', items: fromExerciseJson(list) };
    } catch {
      /* not JSON */
    }
    return { kind: null, items: [] };
  }
  const first = head.split(/\r?\n/)[0];
  if (/(^|,)exercise_id(,|$)/.test(first) && /exercise_start/.test(first)) return { kind: 'excsv', items: fromExerciseCsv(parseCsv(s)) };
  if (/(^|,)session_id(,|$)/.test(first) && /start_date_time/.test(first)) return { kind: 'mindcsv', items: fromMindCsv(parseCsv(s)) };
  if (/^start time,end time,/.test(first) && /metadata_session_name/.test(first)) return { kind: 'mindts', items: fromMindSeries(parseCsv(s)) };
  return { kind: null, items: [] };
}

/**
 * Merge the items of several files: the same session once (by id; the sessions file wins), the same
 * training once (start within 2 minutes; the CSV row wins, it carries later edits such as Sport → Tennis).
 */
export function mergeItems(items = []) {
  const mind = new Map();
  for (const x of items.filter((i) => i.kind === 'mind').sort((a, b) => (a.src === 'mindcsv' ? 0 : 1) - (b.src === 'mindcsv' ? 0 : 1))) if (!mind.has(x.srcId)) mind.set(x.srcId, x);
  const ex = [];
  const seen = new Set();
  const near = new NearSet();
  const order = items.filter((i) => i.kind === 'ex').sort((a, b) => (a.src === 'csv' ? 0 : 1) - (b.src === 'csv' ? 0 : 1));
  for (const x of order) {
    const id = `${x.src}:${x.srcId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    if (x.src !== 'csv' && near.has(x.start)) continue;
    near.add(x.start);
    ex.push(x);
  }
  return [...ex, ...mind.values()].sort((a, b) => a.start - b.start);
}

/** Times within 2 minutes of each other (bucketed by minute). */
class NearSet {
  constructor() {
    this.b = new Map();
  }
  add(ms) {
    const k = Math.floor(ms / 60000);
    if (!this.b.has(k)) this.b.set(k, []);
    this.b.get(k).push(ms);
  }
  has(ms) {
    const k = Math.floor(ms / 60000);
    for (let d = -2; d <= 2; d++) if ((this.b.get(k + d) ?? []).some((t) => Math.abs(t - ms) <= NEAR_MS)) return true;
    return false;
  }
}

/* ---------- time in Zurich ---------- */
let dayFmt = null;
/** The day (YYYY-MM-DD) of a moment in Europe/Zurich. */
export function zurichDay(ms) {
  dayFmt ??= new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' });
  return dayFmt.format(new Date(ms));
}

/* ---------- the plan ---------- */
export const entryIdOf = (item) => `fl-fb-${item.kind === 'mind' ? 'm' : 'e'}-${item.srcId}`;

/**
 * The plan for a preview, nothing written: which items become which entries, and why others not.
 * map: { [typeKey]: actId | '' } the user's choice per type ('' = skip); missing → the suggestion.
 * auto: false leaves out what the watch recognised by itself (logType auto_detected).
 * → {
 *   rows: [{ item, key, actId, state: 'new'|'have'|'skip'|'auto'|'short' }],
 *   types: [{ key, kind, label, known, n, def, actId, fresh, have, auto }],   per Fitbit type, most first
 *   perAct: [{ actId, fresh, have }], entries (flowLog), sessions (flowSessions),
 *   counts: { read, fresh, have, skipped, auto, short }, skipped: [{ key, label, known, n }], range: { from, to }
 * }
 */
export function planImport(items = [], { acts = [], log = [], sessions = [], map = {}, auto = true } = {}) {
  const merged = mergeItems(items);
  const actIds = new Set(acts.map((a) => a.id));
  const ids = new Set([...log.map((e) => e.id), ...sessions.map((s) => s.id)]);
  const fb = new NearSet();
  const own = new Set();
  for (const e of log) {
    if (e.via === VIA) {
      const t = Date.parse(e.at);
      if (Number.isFinite(t)) fb.add(t);
    } else if (e.via !== 'trip') own.add(`${e.actId}|${e.day}`);
  }
  const types = new Map();
  const rows = [];
  const entries = [];
  const newSessions = [];
  for (const item of merged) {
    const key = typeKey(item);
    if (!types.has(key)) {
      const def = defaultAct(key, acts);
      const pick = Object.prototype.hasOwnProperty.call(map, key) ? map[key] || null : def;
      const lab = typeLabel(key, item.name);
      types.set(key, { key, kind: item.kind, label: lab.text, known: lab.known, n: 0, def, actId: pick && actIds.has(pick) ? pick : null, fresh: 0, have: 0, auto: 0 });
    }
    const ty = types.get(key);
    ty.n++;
    const actId = ty.actId;
    const id = entryIdOf(item);
    const day = zurichDay(item.start);
    let state;
    if (item.sec < 60) state = 'short';
    else if (!auto && item.auto) state = 'auto';
    else if (!actId) state = 'skip';
    else if (ids.has(id) || fb.has(item.start) || own.has(`${actId}|${day}`)) state = 'have';
    else state = 'new';
    if (state === 'auto') ty.auto++;
    if (state === 'have') ty.have++;
    if (state === 'new') {
      ty.fresh++;
      const at = new Date(item.start).toISOString();
      const min = Math.max(1, Math.round(item.sec / 60));
      const fbType = ty.label.replace(/\|[a-z]+$/, '');
      entries.push({ id, actId, day, at, n: 1, min, via: VIA, fbType });
      if (item.kind === 'mind') {
        newSessions.push({ id, actId, day, at, endAt: new Date(item.end ?? item.start + item.sec * 1000).toISOString(), min, target: null, art: null, tplId: null, place: null, marks: [], bowl: null, via: VIA, fbType });
      }
      fb.add(item.start); // two items at the same moment: once
    }
    rows.push({ item, key, actId, state });
  }
  const typeList = [...types.values()].sort((a, b) => (a.kind === b.kind ? b.n - a.n : a.kind === 'ex' ? -1 : 1));
  const perAct = new Map();
  for (const r of rows) {
    if (r.state !== 'new' && r.state !== 'have') continue;
    const p = perAct.get(r.actId) ?? { actId: r.actId, fresh: 0, have: 0 };
    p[r.state === 'new' ? 'fresh' : 'have']++;
    perAct.set(r.actId, p);
  }
  const count = (s) => rows.filter((r) => r.state === s).length;
  return {
    rows,
    types: typeList,
    perAct: [...perAct.values()].sort((a, b) => b.fresh - a.fresh || b.have - a.have),
    entries,
    sessions: newSessions,
    counts: { read: rows.length, fresh: entries.length, have: count('have'), skipped: count('skip'), auto: count('auto'), short: count('short') },
    skipped: typeList.filter((x) => !x.actId).map(({ key, label, known, n }) => ({ key, label, known, n })),
    range: merged.length ? { from: zurichDay(merged[0].start), to: zurichDay(merged.at(-1).start) } : null,
  };
}
