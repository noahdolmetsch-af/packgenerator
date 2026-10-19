/**
 * Erinnerungen aufs Handy (Web-Push; Noah 15.10.2026 «1a 2b 3a 4b 5a», 18.10.2026 «2b», «3a 4b»):
 * the list of the next reminders the app hands to the server (api/push.js), built from the data on
 * this device. Pure functions; client.js sends the list.
 *
 * - 5a: one main switch and one switch per kind (settings PUSH_KEY = { on, kinds: { [kind]: true } }).
 * - 2b: only the kinds switched on one by one go out; at the start everything is off.
 * - 3a: on the tour day at 06:30 the server checks the weather and warns of a storm, heat or a thunderstorm.
 * - 4b: no quiet hours.
 * - «Eigene Werte» (3a 4b): the evening-before reminder at eveRemindAt (minutes, default 19:00), heat
 *   from hotC (default 30 °C). Read from the raw settings record so this works before that page lands.
 * - Merken (birthdays, plants, own to-dos with a reminder) read from the settings record 'merken' when
 *   it is there (the shapes of src/lib/merken.js and merken/kinds.js).
 * Times are the device's own clock (the phone is in Zurich); 14 days ahead at most.
 */
import { t, locale } from '../i18n.svelte.js';
import { localDay } from '../localday.js';

export const PUSH_KEY = 'push';
export const AHEAD_DAYS = 14;
export const WEATHER_AT = '06:30';
export const DAY_AT = '08:00';
export const BACKUP_AT = '19:00';
export const EVE_STD = 19 * 60;
export const HOT_STD = 30;
export const BACKUP_STD = 14;
/* Wetter-Wecker (Paket G): tours up to 10 days ahead, from tomorrow; first look at 07:00 or 18:00. */
export const WATCH_AHEAD = 10;
export const WATCH_AT = ['07:00', '18:00'];
/** The tours the Wetter-Wecker can watch (for the switch per tour). */
export const watchable = (trips = [], today) =>
  trips.filter((tr) => tr.status === 'planned' && !tr.skipped && DAY_RE.test(tr.startDate ?? '') && tr.startDate > today && tr.startDate <= addDays(today, WATCH_AHEAD)).sort((a, b) => a.startDate.localeCompare(b.startDate));
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The kinds, in the order of the switches (English keys for t()). */
export const KINDS = [
  { key: 'birthday', label: 'Birthdays', hint: 'The day before at 18:00 and on the day at 08:00, as set in Merken.' },
  { key: 'plant', label: 'Water the plants', hint: 'On the day a plant needs water.' },
  { key: 'eve', label: 'Evening before a trip', hint: 'The evening-before check, at the time of «Eigene Werte».' },
  { key: 'weather', label: 'Weather on the tour day', hint: 'At 06:30, only for a storm, heat or a thunderstorm.' },
  { key: 'wxwatch', label: 'Weather alarm', hint: 'Before a planned tour: when a good weather window comes or the weather turns. Twice a day, up to 10 days ahead.' },
  { key: 'workshop', label: 'Workshop due', hint: 'On the day a workshop job is due.' },
  { key: 'backup', label: 'Backup', hint: 'When the last backup is older than set.' },
  { key: 'own', label: 'Own reminders', hint: 'Your to-dos in Merken with a reminder, at their time.' },
];

/** The stored switches, made safe: everything off unless switched on. */
export function pushOf(value) {
  const kinds = Object.fromEntries(KINDS.map((k) => [k.key, value?.kinds?.[k.key] === true]));
  // Wetter-Wecker: single tours switched off (trip ids), everything is a suggestion
  const wxOff = (Array.isArray(value?.wxOff) ? value.wxOff : []).filter((x) => typeof x === 'string').slice(0, 200);
  return { on: value?.on === true, kinds, wxOff };
}
export const anyOn = (p) => p.on && Object.values(p.kinds).some(Boolean);

/* ---------- calendar days and clock times ---------- */
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** 'YYYY-MM-DD' + 'HH:MM' on this device's clock → ms. */
export function atMs(day, hm) {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = String(hm).split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0, 0, 0).getTime();
}
const hm = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const okHm = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/* ---------- Merken shapes (merken.js, merken/kinds.js) ---------- */
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/** The birthday in a year; 29 Feb is 28 Feb in a year without it. */
function birthdayIn(md, year) {
  const [mm, dd] = md.split('-').map(Number);
  return `${year}-${String(mm).padStart(2, '0')}-${String(mm === 2 && dd === 29 && !isLeap(year) ? 28 : dd).padStart(2, '0')}`;
}
/** Plants: «every N days» after the last watering, 1.5 times longer when watered in winter (Nov–Feb). */
function plantNext(p) {
  const winter = [11, 12, 1, 2].includes(+p.last.slice(5, 7)) && p.winter !== false;
  return addDays(p.last, winter ? Math.round(p.every * 1.5) : p.every);
}

/**
 * The next reminders. data: { trips, repairs, bikes, settings: { push, ownValues, merken, homePlace },
 * lastBackup (ISO or null), now (Date) }. → { items: [{ key, at, title, body, url }], weather: [...], texts, hotC }
 */
export function buildList(data) {
  const now = data.now ?? new Date();
  const ms = now.getTime();
  const today = localDay(now);
  const until = ms + AHEAD_DAYS * 864e5;
  const p = pushOf(data.settings?.push);
  const own = data.settings?.ownValues ?? {};
  const eveAt = Number.isInteger(own.eveRemindAt) && own.eveRemindAt >= 0 && own.eveRemindAt < 1440 ? own.eveRemindAt : EVE_STD;
  const hotC = Number.isFinite(own.hotC) ? own.hotC : HOT_STD;
  const backupDays = Number.isInteger(own.backupDays) && own.backupDays > 0 ? own.backupDays : BACKUP_STD;
  const items = [];
  const weather = [];
  const add = (x) => x.at > ms && x.at <= until && items.push(x);
  const on = (k) => p.on && p.kinds[k];

  const upcoming = (data.trips ?? []).filter((tr) => tr.status === 'planned' && !tr.skipped && DAY.test(tr.startDate ?? '') && tr.startDate >= today && tr.startDate <= addDays(today, AHEAD_DAYS));
  const tourName = (tr) => tr.title || t('Your trip');
  if (on('eve'))
    for (const tr of upcoming)
      add({ key: `eve:${tr.id}:${tr.startDate}`, at: atMs(addDays(tr.startDate, -1), hm(eveAt)), title: t('Evening before'), body: t('Tomorrow: {trip}. The evening-before check is waiting.', { trip: tourName(tr) }), url: `#/trip/${tr.id}/packed` });
  if (on('weather')) {
    const home = data.settings?.homePlace;
    for (const tr of upcoming) {
      const place = tr.route?.start ?? (home && Number.isFinite(home.lat) ? home : null);
      if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) continue;
      const at = atMs(tr.startDate, WEATHER_AT);
      if (at > ms) weather.push({ key: `wx:${tr.id}:${tr.startDate}`, at, date: tr.startDate, lat: place.lat, lon: place.lon, title: tourName(tr), url: '#/pack' });
    }
  }
  const watch = [];
  if (on('wxwatch')) {
    const home = data.settings?.homePlace;
    const tomorrow = addDays(today, 1);
    const first = [today, tomorrow].flatMap((d) => WATCH_AT.map((h) => atMs(d, h))).find((x) => x > ms);
    for (const tr of upcoming) {
      if (tr.startDate < tomorrow || tr.startDate > addDays(today, WATCH_AHEAD) || p.wxOff.includes(tr.id)) continue;
      const place = tr.route?.start ?? (home && Number.isFinite(home.lat) ? home : null);
      if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) continue;
      watch.push({ key: `ww:${tr.id}:${tr.startDate}`, at: first, date: tr.startDate, days: Math.min(Math.max(Number(tr.days) || 1, 1), 5), lat: place.lat, lon: place.lon, title: tourName(tr), url: '#/pack' });
    }
  }
  if (on('workshop')) {
    const bikes = Object.fromEntries((data.bikes ?? []).map((b) => [b.id, b.name]));
    for (const r of data.repairs ?? [])
      if (r.status !== 'done' && !r.done && DAY.test(r.dueDate ?? ''))
        add({ key: `ws:${r.id}:${r.dueDate}`, at: atMs(r.dueDate < today ? today : r.dueDate, DAY_AT), title: t('Workshop'), body: t('{bike}: {task} is due before the trip.', { bike: bikes[r.bikeId] ?? r.subject ?? t('Bike'), task: r.task }), url: '#/bikes?tab=care' });
  }
  if (on('backup')) {
    const last = data.lastBackup ? localDay(new Date(data.lastBackup)) : today;
    let day = addDays(last, backupDays);
    if (day < today) day = today;
    let at = atMs(day, BACKUP_AT);
    if (at <= ms) at = atMs(addDays(today, 1), BACKUP_AT);
    add({ key: `backup:${day}`, at, title: t('Backup'), body: t('Time for a backup.'), url: '#/me/data' });
  }
  const merken = Array.isArray(data.settings?.merken) ? data.settings.merken : [];
  for (const td of merken) {
    if (!td || td.off || td.doneAt) continue;
    if (td.kind === 'birthday' && on('birthday') && /^\d{2}-\d{2}$/.test(td.bday?.md ?? '')) {
      const y = +today.slice(0, 4);
      for (const year of [y, y + 1]) {
        const bday = birthdayIn(td.bday.md, year);
        for (const r of td.reminds ?? [])
          if (okHm(r.at)) add({ key: `bday:${td.id}:${bday}:${r.before}`, at: atMs(addDays(bday, -(r.before || 0)), r.at), title: t('Birthday'), body: r.before ? t('Tomorrow is {name}’s birthday.', { name: td.text }) : t('Today is {name}’s birthday.', { name: td.text }), url: '#/calendar' });
      }
    } else if (td.kind === 'plant' && on('plant') && DAY.test(td.plant?.last ?? '') && td.plant.every > 0 && okHm(td.remind?.at)) {
      const next = plantNext(td.plant);
      const day = next < today ? today : next;
      let at = atMs(day, td.remind.at);
      if (at <= ms) at = atMs(addDays(today, 1), td.remind.at);
      add({ key: `plant:${td.id}:${td.plant.last}`, at, title: t('Water the plants'), body: t('{plant} needs water.', { plant: td.text }), url: '#/calendar' });
    } else if (!td.kind && on('own') && DAY.test(td.due ?? '') && okHm(td.remind?.at)) {
      add({ key: `own:${td.id}:${td.due}`, at: atMs(addDays(td.due, -(td.remind.before || 0)), td.remind.at), title: t('Reminder'), body: td.text, url: '#/calendar' });
    }
  }
  items.sort((a, b) => a.at - b.at);
  const texts = {
    title: t('Weather on the tour day'),
    thunder: t('Thunderstorms are possible today. Have a look at the weather.'),
    storm: t('Strong gusts are expected today. Have a look at the weather.'),
    heat: t('Up to {temp} °C today. Take enough to drink.', { temp: '{temp}' }),
    wtitle: t('Weather alarm'),
    bad: t('The weather for {trip} looks bad.', { trip: '{trip}' }),
    turn: t('The weather for {trip} turns: it looks bad now.', { trip: '{trip}' }),
    good: t('Good weather window: {trip} looks good now.', { trip: '{trip}' }),
    window: t('For {trip}, {day} looks better.', { trip: '{trip}', day: '{day}' }),
    better: t('From {day} it looks better.', { day: '{day}' }),
    wdays: [4, 5, 6, 7, 8, 9, 10].map((d) => new Date(Date.UTC(2026, 0, d, 12)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' })), // Sun … Sat
  };
  return { items, weather, watch, texts, hotC };
}
