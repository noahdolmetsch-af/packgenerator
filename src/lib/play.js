/**
 * v0.88.0 «Aufräumen und Ausprobieren» (Noah 11.10.2026, 0.88 «alle a», mockup G): the playground.
 * Ich › «Ausprobieren» starts a demo (demo.js) that the app makes itself: your data is kept aside,
 * a made-up trip with made-up gear and a bike comes in («Wochenend-Tour» or «Tagestour»), or nothing
 * at all («Leer»: play with your own data). «Tag spielen» moves the app's day to the packing day,
 * the first riding day or the day after the trip (demo day). The bar on top ends it, and then your
 * data is back exactly as it was: nothing done in the playground counts.
 * Everything made up has the id prefix «play-». Pure, tested in tests/play.test.js.
 */
import { APP_ID } from './backup.js';
import { SCHEMA_VERSION } from './db.js';
import { t } from './i18n.svelte.js';

export const KINDS = ['weekend', 'day', 'empty'];
export const DAYS = ['today', 'pack', 'ride', 'after'];

/** A calendar day plus n days (YYYY-MM-DD, calendar arithmetic, no time zone). */
export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The trip's dates: it starts the day after tomorrow (weekend, 2 days) or tomorrow (day ride). */
export function playDates(kind, today) {
  const days = kind === 'weekend' ? 2 : 1;
  const start = addDays(today, kind === 'weekend' ? 2 : 1);
  return { start, days, pack: addDays(start, -1), after: addDays(start, days) };
}

/** The day «Tag spielen» stands for (YYYY-MM-DD), or null for the real today. */
export function playDay(kind, day, today) {
  if (kind === 'empty' || day === 'today') return null;
  const d = playDates(kind, today);
  return day === 'pack' ? d.pack : day === 'ride' ? d.start : d.after;
}

// [id, name (English key for t()), category, carry, weight g, slot on the trip]
const GEAR = [
  ['play-seat', 'Seat pack 12 L', 'bags', 'luggage', 390, null],
  ['play-frame', 'Frame bag', 'bags', 'luggage', 220, null],
  ['play-sleep', 'Down sleeping bag', 'sleep', 'luggage', 820, 'seat'],
  ['play-mat', 'Sleeping mat', 'sleep', 'luggage', 410, 'seat'],
  ['play-jacket', 'Rain jacket|play', 'rain', 'luggage', 250, 'frame'],
  ['play-tool', 'Tool kit', 'tools', 'luggage', 240, 'frame'],
  ['play-power', 'Power bank|play', 'elec', 'luggage', 180, 'frame'],
  ['play-lamp', 'Head torch', 'light', 'luggage', 90, 'frame'],
  ['play-jersey', 'Jersey|play', 'onbike', 'body', 140, 'body'],
];
const DAY_GEAR = new Set(['play-frame', 'play-jacket', 'play-tool', 'play-jersey']);

/** The demo file of the playground (a backup file with a «demo» field, as demo.js starts it). */
export function playFile(kind, today) {
  const now = new Date().toISOString();
  const tables = {};
  const days = [];
  if (kind !== 'empty') {
    const d = playDates(kind, today);
    const gear = GEAR.filter((g) => kind === 'weekend' || DAY_GEAR.has(g[0]));
    tables.items = gear.map(([id, name, category, carry, weightG]) => ({ id, name: t(name), category, carry, weightG, qty: 1, weightStatus: 'measured', ownership: 'owned', defaultBag: null, role: null, sets: [], domains: ['bikepacking'] }));
    const bags = gear.filter((g) => g[2] === 'bags');
    tables.containers = bags.map(([id, name]) => ({ id: `bag-${id}`, name: t(name), slot: id === 'play-seat' ? 'seat' : 'frame', volumeL: id === 'play-seat' ? 12 : 4, itemId: id, pieces: 1 }));
    const setup = { seat: bags.some((b) => b[0] === 'play-seat') ? 'bag-play-seat' : null, frame: 'bag-play-frame' };
    tables.bikes = [{ id: 'play-bike', name: t('Gravel (playground)'), weightG: 9400, slots: ['seat', 'frame'], setup, fixtures: [] }];
    tables.trips = [
      {
        id: 'play-trip',
        title: kind === 'weekend' ? t('Jura loop') : t('Lake ride'),
        domain: 'bikepacking',
        startDate: d.start,
        days: d.days,
        status: 'planned',
        bikeId: 'play-bike',
        bike: t('Gravel (playground)'),
        setup,
        overnight: kind === 'weekend' ? 'outdoor' : null,
        cook: false,
        sets: {},
        purpose: {},
        ready: [],
        entries: gear.filter((g) => g[5]).map(([itemId, , , , , slot]) => ({ itemId, slot: slot === 'seat' && !setup.seat ? 'frame' : slot, qty: 1, packed: false })),
        createdAt: now,
        updatedAt: now,
      },
    ];
    days.push({ date: d.pack, label: t('Packing day') }, { date: d.start, label: t('On the way') }, { date: d.after, label: t('After the trip') });
  }
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now, demo: { name: t('Playground'), play: true, days }, tables };
}
/** localStorage wish: Ich opens the playground sheet once (the debrief's «Lieber in der Spielwiese probieren»). */
export const PLAY_WISH = 'me.play';
