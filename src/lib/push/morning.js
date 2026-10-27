/**
 * «Ein Morgen-Push statt vieler» (idea A1, thread «App intelligenter und vernetzter», Noah 27.10.2026
 * «alle umsetzen 1a 2a 3a 4a 5a», answer 3a): the reminders the app puts at 08:00 (parts worn,
 * chain, supplies, lent things, shopping before a trip, race registration, birthdays at 08:00 …) come
 * together as ONE message at 07:00. Safety stays single and on its own time (weather, ice, light, rain on
 * the way, eating on the ride, ozone and pollen, and the workshop: ruhig/weniger.js SAFETY_PREFIXES).
 *
 * The message starts with what the day holds (a trip that starts, the first appointments of the Google
 * calendar on this device), then the bundled reminders. Only a day with at least one bundled reminder gets
 * a message: a trip or an appointment alone never sends one (no new pushes).
 * On by default (answer 3a); the switch «One message in the morning» on the push page turns it off
 * (settings push.morning = false). Pure, tested in tests/push-morning.test.js.
 */
import { groupOfKey } from '../ruhig/weniger.js';

export const MORNING_AT = '07:00';
/** The reminders at this time of day are bundled (schedule.js DAY_AT). */
export const BUNDLE_AT = '08:00';
/** At most this many lines in the message; the rest is counted («and 2 more»). */
export const MORNING_LINES = 4;

/** Bundling is on unless switched off (answer 3a). */
export const morningOn = (push) => push?.morning !== false;

const two = (n) => String(n).padStart(2, '0');
/** The local day and HH:MM of a time in ms (the phone's clock). */
function localOf(ms) {
  const d = new Date(ms);
  return { day: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`, hm: `${two(d.getHours())}:${two(d.getMinutes())}` };
}

/**
 * items: the reminders of schedule.js buildList ({ key, at, title, body, url }).
 * opts: { ms (now), atMs (day, hm) → ms, trips: [{ title, startDate }] (planned ones), events: db.gEvents rows,
 *         texts: { title, trip, event, more } }.
 * → the new list: the bundled ones taken out, one `morning:<day>` item per day put in.
 */
export function bundleMorning(items = [], opts = {}) {
  const { ms = Date.now(), atMs, trips = [], events = [], texts = {} } = opts;
  const byDay = new Map();
  const keep = [];
  for (const it of items) {
    const { day, hm } = localOf(it.at);
    const morning = atMs(day, MORNING_AT);
    if (hm === BUNDLE_AT && groupOfKey(it.key) !== 'safety' && morning > ms) {
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(it);
    } else keep.push(it);
  }
  for (const [day, list] of byDay) {
    const lines = [];
    for (const tr of trips) if (tr?.startDate === day) lines.push(texts.trip.replace('{trip}', tr.title || ''));
    const evs = events
      .filter((e) => e && e.day === day && e.title)
      .sort((a, b) => (a.allDay ? 0 : 1) - (b.allDay ? 0 : 1) || String(a.start ?? '').localeCompare(String(b.start ?? '')))
      .slice(0, 2);
    for (const e of evs) {
      const at = e.allDay ? NaN : Date.parse(String(e.start ?? ''));
      const time = Number.isFinite(at) ? localOf(at).hm : '';
      lines.push(texts.event.replace('{what}', time ? `${time} ${e.title}` : e.title));
    }
    for (const it of list) lines.push(it.body || it.title);
    const shown = lines.slice(0, MORNING_LINES);
    const rest = lines.length - shown.length;
    if (rest > 0) shown.push(texts.more.replace('{n}', String(rest)));
    keep.push({ key: `morning:${day}`, at: atMs(day, MORNING_AT), title: texts.title, body: shown.join('\n'), url: '#/', bundled: list.map((it) => it.key) });
  }
  return keep.sort((a, b) => a.at - b.at);
}
