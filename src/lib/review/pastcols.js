/**
 * SN4+ «SN4 plus»: the columns of «Vergangene Touren» and the blocks of «In Zahlen» as plain lists (no
 * imports, so the browser tests read them from here). The names are English keys for t().
 */

/** The settings key of the page's view: { hide: [column keys], open: [group keys], off: [block keys], shut: [block keys] }. */
export const VIEW_KEY = 'pastView';
/** Tour and Zustand always stay; every other column can be switched off (all on at first). */
export const COLS = [
  { key: 'km', head: 'km', name: 'km', from: 'trip', n: true },
  { key: 'gainM', head: 'Hm|col', name: 'Climbing|hm', from: 'trip', n: true },
  { key: 'moving', head: 'Moving time|col', name: 'Moving time|col', from: 'strava', n: true },
  { key: 'elapsed', head: 'Elapsed|col', name: 'Elapsed time', from: 'strava', n: true },
  { key: 'kmh', head: 'Ø km/h', name: 'Ø km/h', from: 'strava', n: true },
  { key: 'hrAvg', head: 'Ø heart rate', name: 'Ø heart rate', from: 'strava', n: true },
  { key: 'hrMax', head: 'Max. heart rate', name: 'Max. heart rate', from: 'strava', n: true },
  { key: 'type', head: 'Bike', name: 'Bike type', from: 'trip' },
  { key: 'wx', head: 'Weather', name: 'Weather', from: 'trip' },
  { key: 'temp', head: 'Temp.', name: 'Temperature', from: 'trip', n: true },
  { key: 'comment', head: 'Strava comment', name: 'Strava comment', from: 'strava' },
];
export const COL_KEYS = COLS.map((c) => c.key);
/** The chooser's two parts, in the order of the mockup: from the trip, then from Strava. */
export const COL_GROUPS = [
  { key: 'trip', name: 'Trip', keys: ['km', 'gainM', 'type', 'wx', 'temp'] },
  { key: 'strava', name: 'From Strava', keys: ['moving', 'elapsed', 'kmh', 'hrAvg', 'hrMax', 'comment'] },
];

/* ---------- SN4f-a: the blocks and their groups ---------- */

export const BLOCKS = [
  { key: 'V1', name: 'Per month', group: 'dist' },
  { key: 'V7', name: 'Map', group: 'dist' },
  { key: 'V10', name: 'When you ride', group: 'dist' },
  { key: 'V3', name: 'Per bike', group: 'bikes' },
  { key: 'V12', name: 'Luggage', group: 'bikes' },
  { key: 'V8', name: 'Time in heart rate zones per month', group: 'body' },
  { key: 'V2', name: 'Best values', group: 'records' },
  { key: 'V6', name: 'Compared with last year', group: 'records' },
  { key: 'V9', name: 'Weather', group: 'records' },
  { key: 'V11', name: 'Footprint', group: 'records' },
];
export const BLOCK_KEYS = BLOCKS.map((b) => b.key);
export const GROUPS = [
  { key: 'dist', name: 'Distance and time' },
  { key: 'bikes', name: 'Bikes and luggage' },
  { key: 'body', name: 'Body' },
  { key: 'records', name: 'Records and comparison' },
];
export const GROUP_KEYS = GROUPS.map((g) => g.key);
