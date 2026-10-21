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
import { ridesIntoDark, sunTimes, offsetFor } from '../blockplan.js';
import { stage, stageCount, pointAt } from '../ride.js';
import { airPrefs, POLLEN_NAMES } from '../air.js';
import { eatPushItems } from '../unterwegs/essen.js';
import { wearPush } from '../wear.js';

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
/** Days before a registration deadline with a reminder (idea 2). */
export const RACE_BEFORE = [3, 1];

/** The kinds, in the order of the switches (English keys for t()). */
export const KINDS = [
  { key: 'birthday', label: 'Birthdays', hint: 'The day before at 18:00 and on the day at 08:00, as set in Merken.' },
  { key: 'plant', label: 'Water the plants', hint: 'On the day a plant needs water.' },
  { key: 'eve', label: 'Evening before a trip', hint: 'The evening-before check, at the time of «Eigene Werte».' },
  { key: 'weather', label: 'Weather on the tour day', hint: 'At 06:30, only for a storm, heat or a thunderstorm.' },
  { key: 'wxwatch', label: 'Weather alarm', hint: 'Before a planned tour: when a good weather window comes or the weather turns. Twice a day, up to 10 days ahead.' },
  { key: 'dark', label: 'Light alarm', hint: 'The evening before, when the ride goes on after sunset: pack the light and the reflective vest.' },
  { key: 'rainsoon', label: 'Rain on the way', hint: 'While you ride: when rain comes in about 15 to 45 minutes where you should be.' },
  { key: 'air', label: 'Ozone and pollen', hint: 'On the tour morning, with much ozone or strong pollen (the kinds you choose on Aktiv).' },
  { key: 'workshop', label: 'Workshop due', hint: 'On the day a workshop job is due.' },
  // «Verschleiss immer im Griff» (Noah 20.10.2026): a part reaches its km (e.g. the chain at 1000 km)
  { key: 'wear', label: 'Parts worn', hint: 'When a part reaches its km, e.g. the chain. At 08:00.' },
  { key: 'backup', label: 'Backup', hint: 'When the last backup is older than set.' },
  // Paket N idea 2 (Noah 19.10.2026 «1-5 a»): a race trip's registration deadline (Touren › Träume)
  { key: 'race', label: 'Race registration', hint: '3 days and 1 day before the registration deadline, at 08:00.' },
  { key: 'own', label: 'Own reminders', hint: 'Your to-dos in Merken with a reminder, at their time.' },
  // Paket H «Packen leichter» (Noah 19.10.2026 «2b», «5 a und b»; #90)
  { key: 'supply', label: 'Supplies expire', hint: '2 weeks before the best-before date, at 08:00.' },
  { key: 'lend', label: 'Lent things come back', hint: 'On the return day at 08:00.' },
  { key: 'shop', label: 'Shopping before a trip', hint: '2 days before a trip, when its shopping list or charging still has open rows.' },
  // Paket K #286 «Ess-Erinnerung» (Noah 19.10.2026 «5a b möglich»): also when the app is closed
  { key: 'eat', label: 'Eat on the ride', hint: 'While the eat reminder runs on On the way, every 30 to 60 minutes.' },
];
/** Paket H (#90): the shopping and charging reminder comes this many days before the trip. */
export const SHOP_BEFORE = 2;

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
 * The next reminders. data: { trips, repairs, bikes, settings: { push, ownValues, merken, homePlace, eatRemind },
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
  const placeOf = (tr) => {
    const home = data.settings?.homePlace;
    const pl = tr.route?.start ?? (Number.isFinite(tr.place?.lat) ? tr.place : null) ?? (home && Number.isFinite(home.lat) ? home : null);
    return pl && Number.isFinite(pl.lat) && Number.isFinite(pl.lon) ? pl : null;
  };
  // Licht-Wecker (Paket G): the evening before, when a stage goes on after sunset
  if (on('dark'))
    for (const tr of upcoming) {
      const place = placeOf(tr);
      if (!ridesIntoDark(tr, place)) continue;
      const sun = place ? sunTimes(tr.startDate, place.lat, place.lon) : null;
      const set = sun ? new Date(sun.set + offsetFor(tr.startDate) * 6e4).toISOString().slice(11, 16) : null;
      add({ key: `dark:${tr.id}:${tr.startDate}`, at: atMs(addDays(tr.startDate, -1), hm(eveAt)), title: t('Light alarm'), body: set ? t('{trip}: you ride after sunset ({time}). Pack the light and the reflective vest.', { trip: tourName(tr), time: set }) : t('{trip}: you ride into the dark. Pack the light and the reflective vest.', { trip: tourName(tr) }), url: '#/pack' });
    }
  // Regen-Warnung unterwegs (Paket G): the expected place every 30 minutes of each riding day
  const rain = [];
  if (on('rainsoon')) {
    const riding = (data.trips ?? []).filter((tr) => tr.status !== 'done' && !tr.skipped && DAY.test(tr.startDate ?? '') && addDays(tr.startDate, Math.max(1, Number(tr.days) || 1) - 1) >= today && tr.startDate <= addDays(today, AHEAD_DAYS));
    for (const tr of riding.slice(0, 5)) {
      const points = [];
      const n = stageCount(tr);
      for (let d = 0; d < n; d++) {
        const st = stage(tr, d);
        if (!st.startAt || !st.endAt) continue;
        const from = atMs(st.startAt.slice(0, 10), st.startAt.slice(11, 16));
        const to = atMs(st.endAt.slice(0, 10), st.endAt.slice(11, 16));
        for (let at = from; at <= to && points.length < 120; at += 30 * 60 * 1000) {
          const frac = (d + (to > from ? (at - from) / (to - from) : 0)) / n;
          const p = tr.route?.line?.length ? pointAt(tr.route.line, frac) : placeOf(tr);
          if (p && at + 30 * 60 * 1000 > ms) points.push({ at, lat: p.lat, lon: p.lon });
        }
      }
      if (points.length) rain.push({ key: `rain:${tr.id}:${tr.startDate}`, title: tourName(tr), url: '#/pack', points });
    }
  }
  if (on('weather') || on('air')) {
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
  // «Verschleiss immer im Griff»: on the day a part reaches its km (at the pace of the last 8 weeks), today when it already has
  if (on('wear'))
    for (const w of wearPush(data.bikes ?? [], { visits: data.visits ?? [], entries: data.kmBook ?? [], today })) {
      let at = atMs(w.day, DAY_AT);
      if (at <= ms) at = atMs(addDays(today, 1), DAY_AT);
      add({ key: w.key, at, title: t('Parts worn'), body: w.left > 0 ? t('{bike}: {part} reaches {life} km soon ({km} km left). Time to replace it.', { bike: w.bike, part: w.part, life: w.life, km: w.left }) : t('{bike}: {part} has reached {life} km. Time to replace it.', { bike: w.bike, part: w.part, life: w.life }), url: w.url });
    }
  if (on('backup')) {
    const last = data.lastBackup ? localDay(new Date(data.lastBackup)) : today;
    let day = addDays(last, backupDays);
    if (day < today) day = today;
    let at = atMs(day, BACKUP_AT);
    if (at <= ms) at = atMs(addDays(today, 1), BACKUP_AT);
    add({ key: `backup:${day}`, at, title: t('Backup'), body: t('Time for a backup.'), url: '#/me/data' });
  }
  if (on('race'))
    for (const tr of data.trips ?? []) {
      const by = tr.event?.signupBy;
      if (tr.skipped || tr.event?.signedUp || !DAY.test(by ?? '') || by < today) continue;
      for (const back of RACE_BEFORE)
        add({ key: `race:${tr.id}:${by}:${back}`, at: atMs(addDays(by, -back), DAY_AT), title: t('Race registration'), body: back === 1 ? t('Tomorrow is the last day to sign up for {trip}.', { trip: tourName(tr) }) : t('{n} days left to sign up for {trip}.', { n: back, trip: tourName(tr) }), url: '#/trips/dreams' });
    }
  // Paket H (answer 2a): a supply 2 weeks before its best-before date (today when that day has passed)
  if (on('supply'))
    for (const it of data.items ?? []) {
      // an expired one is on the shopping list (Vorrat), no more pushes
      if (it.ownership === 'gone' || !DAY.test(it.expires ?? '') || it.expires < today) continue;
      let day = addDays(it.expires, -14);
      if (day < today) day = today;
      let at = atMs(day, DAY_AT);
      if (at <= ms) at = atMs(addDays(today, 1), DAY_AT);
      if (at > atMs(it.expires, '23:59')) continue; // the day itself has passed
      add({ key: `supply:${it.id}:${it.expires}`, at, title: t('Supplies'), body: t('{name} expires on {date}.', { name: it.nameDe || it.name, date: it.expires }), url: '#/gear/supplies' });
    }
  // Paket H (answer 5a): lent things on their return day
  if (on('lend'))
    for (const l of data.lends ?? []) {
      if (l.doneAt || !DAY.test(l.due ?? '') || !(l.items ?? []).some((x) => !x.back)) continue;
      const day = l.due < today ? today : l.due;
      let at = atMs(day, DAY_AT);
      if (at <= ms) at = atMs(addDays(today, 1), DAY_AT);
      add({ key: `lend:${l.id}:${l.due}`, at, title: t('Lent out'), body: t('{person} brings your things back today.', { person: l.person }), url: '#/gear/lend' });
    }
  // Paket H (#90): 2 days before a trip, shopping and charging as a to-do
  if (on('shop'))
    for (const tr of upcoming) {
      const at = atMs(addDays(tr.startDate, -SHOP_BEFORE), DAY_AT);
      add({ key: `shop:${tr.id}:${tr.startDate}`, at, title: t('Before your trip'), body: t('{trip} in 2 days: time to shop and charge.', { trip: tourName(tr) }), url: '#/pack?shop' });
    }
  if (on('eat')) for (const x of eatPushItems(data.settings?.eatRemind, { title: t('Time to eat'), body: t('A bite now keeps the strength up.') }, ms)) add(x);
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
  const wxOn = on('weather');
  const texts = {
    title: t('Weather on the tour day'),
    // with «Weather on the tour day» off (only «Ozone and pollen» on) the server has no weather words
    thunder: wxOn ? t('Thunderstorms are possible today. Have a look at the weather.') : '',
    storm: wxOn ? t('Strong gusts are expected today. Have a look at the weather.') : '',
    heat: wxOn ? t('Up to {temp} °C today. Take enough to drink.', { temp: '{temp}' }) : '',
    rtitle: t('Rain on the way'),
    rain: t('Rain in about {min} minutes on {trip}. Keep the rain jacket at hand.', { min: '{min}', trip: '{trip}' }),
    ozone: t('Much ozone today (up to {n} µg/m³): take it easier at midday.', { n: '{n}' }),
    pollen: t('Strong pollen today: {list}.', { list: '{list}' }),
    pollenNames: Object.fromEntries(Object.entries(POLLEN_NAMES).map(([k, v]) => [k, t(v)])),
    wtitle: t('Weather alarm'),
    bad: t('The weather for {trip} looks bad.', { trip: '{trip}' }),
    turn: t('The weather for {trip} turns: it looks bad now.', { trip: '{trip}' }),
    good: t('Good weather window: {trip} looks good now.', { trip: '{trip}' }),
    window: t('For {trip}, {day} looks better.', { trip: '{trip}', day: '{day}' }),
    better: t('From {day} it looks better.', { day: '{day}' }),
    wdays: [4, 5, 6, 7, 8, 9, 10].map((d) => new Date(Date.UTC(2026, 0, d, 12)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' })), // Sun … Sat
  };
  return { items, weather, watch, rain, air: on('air') ? airPrefs(data.settings?.air) : null, texts, hotC };
}
