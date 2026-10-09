// v0.59.0 «Tauschen»: a fictional day ride (test_data_gtp_), 10–16 °C and dry, 2 h, tomorrow, with
// the clothing on me and a small wardrobe of alternatives. Built on pf-fixture.json (bikes, bags);
// its own clothes are set to "gone", so only the pieces here count.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

const cloth = (id, name, f = {}) => ({ id: `${P}${id}`, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
export const CLOTHES = [
  cloth('T01', 'Velokappe gruen', { layer: 'accessory', zone: 'head', tempMin: 8, tempMax: 24, weightG: 35 }),
  cloth('T02', 'Netzunterhemd gruen', { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 30, weightG: 78 }),
  cloth('T03', 'Trikot kurzarm grau', { layer: 'base', zone: 'torso', tempMin: 15, tempMax: 30, weightG: 120 }),
  cloth('T04', 'Windweste gruen', { layer: 'outer', zone: 'torso', tempMin: 4, tempMax: 18, weightG: 83 }),
  cloth('T05', 'Traegerhose kurz schwarz', { layer: 'base', zone: 'legs', tempMin: 12, tempMax: 30, weightG: 162 }),
  cloth('T06', 'Handschuhe Sommer', { layer: 'accessory', zone: 'hands', tempMin: 12, tempMax: 30, weightG: 48 }),
  cloth('T07', 'Merinosocken blau', { layer: 'accessory', zone: 'feet', tempMin: 0, tempMax: 22, weightG: 67 }),
  // the alternatives in the wardrobe
  cloth('T11', 'Trikot langarm orange', { layer: 'base', zone: 'torso', tempMin: 8, tempMax: 18, weightG: 216 }),
  cloth('T12', 'Unterhemd langarm schwarz', { layer: 'base', zone: 'torso', tempMin: 0, tempMax: 15, weightG: 176 }),
  cloth('T13', 'Merino-Shirt kurzarm grau', { layer: 'base', zone: 'torso', tempMin: 12, tempMax: 24, weightG: 149 }),
  cloth('T14', 'Trikot kurzarm schwarz', { layer: 'base', zone: 'torso', tempMin: 18, tempMax: 32, weightG: 146 }),
  cloth('T15', 'Merino-Shirt kurzarm weiss', { layer: 'base', zone: 'torso', tempMin: 16, tempMax: 30, weightG: 127 }),
  cloth('T16', 'Windjacke grau', { layer: 'outer', zone: 'torso', tempMin: 0, tempMax: 15, weightG: 116 }),
  cloth('T17', 'Regenjacke schwarz', { layer: 'outer', zone: 'torso', tempMin: -5, tempMax: 18, weightG: 242, rain: 'yes' }),
  cloth('T18', 'Knielinge blau', { layer: 'mid', zone: 'legs', tempMin: 6, tempMax: 15, weightG: 76 }),
  cloth('T19', 'Handschuhe lang', { layer: 'accessory', zone: 'hands', tempClass: 'mittel', weightG: 90 }),
  cloth('T20', 'Winterhandschuhe', { layer: 'accessory', zone: 'hands', tempClass: 'kalt', weightG: 140 }),
];
export const WORN = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07'].map((id) => `${P}${id}`);
export const TRIP = `${P}event`;

/** The backup to import: the trip of pf-fixture as tomorrow's 2 h day ride, 10–16 °C, dry. */
export function tauschData({ memory = null } = {}) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  fix.tables.items = fix.tables.items.map((i) => (/_KL\d/.test(i.id) ? { ...i, ownership: 'gone' } : i));
  fix.tables.items.push(...CLOTHES);
  const trip = fix.tables.trips.find((x) => x.id === TRIP);
  Object.assign(trip, {
    title: `${P} Napf-Tagestour`,
    startDate: day(1),
    days: 1,
    hours: 2,
    overnight: 'none',
    event: false,
    wx: { min: 10, max: 16, rain: 'none' },
    entries: [...WORN.map((itemId) => ({ itemId, slot: 'body', qty: 1, packed: false })), ...trip.entries.filter((e) => !/_KL\d/.test(e.itemId))],
  });
  if (memory) fix.tables.settings.push({ key: 'swap.memory', value: memory });
  return fix;
}
