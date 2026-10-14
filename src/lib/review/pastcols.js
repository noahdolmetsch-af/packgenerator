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

/* ---------- SN4h «In Zahlen» on Touren › Übersicht (Noah 13.10.2026 «SN4g–SN4i freigegeben») ---------- */

/** SN4h: the settings key of the Touren page's «In Zahlen»: { off: [block keys], shut: [block keys] }. */
export const TOUR_VIEW_KEY = 'toursView';
/**
 * SN4h: five groups, every block from an earlier round (SN4 plus, SN2 plus, the Rückblick extras). The
 * map V7 is not here: it is the large tile «Karte aller Touren» (DG-O5) at the end of the page.
 */
export const TOUR_BLOCKS = [
  { key: 'V1', name: 'Per month', group: 'dist' },
  { key: 'V10', name: 'When you ride', group: 'dist' },
  { key: 'T1', name: 'Pace over the months', group: 'tempo' },
  { key: 'T2', name: 'Per bike and surface', group: 'tempo' },
  { key: 'T3', name: 'Planned and ridden', group: 'tempo' },
  { key: 'V3', name: 'Per bike', group: 'bikes' },
  { key: 'V12', name: 'Luggage', group: 'bikes' },
  { key: 'U2', name: 'Wear|parts', group: 'bikes' },
  { key: 'V8', name: 'Time in heart rate zones', group: 'body' },
  { key: 'P1', name: 'Heart rate and power per month', group: 'body' },
  { key: 'V2', name: 'Best values', group: 'records' },
  { key: 'V6', name: 'Compared with last year', group: 'records' },
  { key: 'C1', name: 'Comparison groups', group: 'records' },
  { key: 'V9', name: 'Weather', group: 'records' },
  { key: 'V11', name: 'Footprint', group: 'records' },
];
export const TOUR_BLOCK_KEYS = TOUR_BLOCKS.map((b) => b.key);
export const TOUR_GROUPS = [
  { key: 'dist', name: 'Distance and time' },
  { key: 'tempo', name: 'Pace|group' },
  { key: 'bikes', name: 'Bikes and luggage' },
  { key: 'body', name: 'Body' },
  { key: 'records', name: 'Records and comparison' },
];
export const TOUR_GROUP_KEYS = TOUR_GROUPS.map((g) => g.key);
