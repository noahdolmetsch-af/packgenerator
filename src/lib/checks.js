/**
 * v0.106.0 «Bausteine bearbeiten» (Noah 1-5a, 12.10.2026; mockups A and B): two more checklists beside
 * the ready check, with its rules: one list per trip, changed only for this trip, saved as the standard
 * of its area by hand.
 *   trip.eve    [{ id, label, done }]  the evening before the start (page «Gepackt», Today from 18:00)
 *   trip.after  [{ id, label, done }]  back home (page «Tour beendet», before the debrief)
 * A trip without its own list shows the standard (settings eveStandard[.<area>] / afterStandard[.<area>])
 * or the suggestion below; the list is written to the trip on its first change.
 * Labels of the suggestions are English keys for t(); own rows keep the words typed.
 */
import { BIKEPACKING, domainOf } from './domains.js';

export const CHECK_KINDS = ['eve', 'after'];

const EVE_BASE = [
  { id: 'weather', label: 'Look at the weather again' },
  { id: 'route', label: 'Route offline on the phone' },
  { id: 'charge', label: 'Charge phone, tracker and lights' },
  { id: 'bottles', label: 'Fill the bottles' },
];
const AFTER_BASE = [
  { id: 'dry', label: 'Dry wet things' },
  { id: 'refill', label: 'Refill first aid, snacks and sun cream' },
  { id: 'charge', label: 'Charge phone, power bank and lamp' },
  { id: 'broken', label: 'Note what broke' },
];

/** The suggested lists per area (Content doc «Skitour und Wandern», 11.10.2026). */
export const CHECKS_BY_DOMAIN = {
  eve: {
    [BIKEPACKING]: [...EVE_BASE, { id: 'tyres', label: 'Check tyres and chain' }],
    ski: [
      { id: 'bulletin', label: 'Read the avalanche bulletin' },
      { id: 'route', label: 'Route offline on the phone' },
      { id: 'charge', label: 'Charge tracker and watch' },
      { id: 'bottles', label: 'Fill the bottle, make tea' },
    ],
    hiking: EVE_BASE,
    weekend: [
      { id: 'tickets', label: 'Tickets and times checked' },
      { id: 'charge', label: 'Charge phone and power bank' },
    ],
    travel: [
      { id: 'docs', label: 'Passport and bookings at hand' },
      { id: 'charge', label: 'Charge phone and power bank' },
    ],
  },
  after: {
    [BIKEPACKING]: [{ id: 'bike', label: 'Clean the bike and oil the chain' }, ...AFTER_BASE],
    ski: [
      { id: 'skins', label: 'Dry the skins on their foil' },
      { id: 'dry', label: 'Dry inner boots, gloves and clothes' },
      { id: 'lvs', label: 'Transceiver off, note the battery' },
      { id: 'refill', label: 'Refill first aid, snacks and sun cream' },
      { id: 'charge', label: 'Charge phone, power bank and lamp' },
      { id: 'broken', label: 'Note what broke' },
    ],
    hiking: [{ id: 'boots', label: 'Dry and clean the boots' }, { id: 'bottle', label: 'Rinse and dry the bottle' }, ...AFTER_BASE.slice(1)],
    weekend: [{ id: 'wash', label: 'Wash the clothes' }, AFTER_BASE[2]],
    travel: [{ id: 'wash', label: 'Wash the clothes' }, AFTER_BASE[2], AFTER_BASE[3]],
  },
};

/** Where the own standard of a check of an area is stored (settings key), like readyKey. */
export const checkKey = (kind, domain) => (!domain || domain === BIKEPACKING ? `${kind}Standard` : `${kind}Standard.${domain}`);

/** The suggestion of an area (an area without its own list gets the bikepacking one's base). */
export const suggested = (kind, domain) => CHECKS_BY_DOMAIN[kind]?.[domain] ?? (kind === 'eve' ? EVE_BASE : AFTER_BASE);

/** A fresh list: the saved standard (if any) or the suggestion, nothing ticked. */
export const freshCheck = (kind, domain, standard = null) => (standard?.length ? standard : suggested(kind, domain)).map((r) => ({ id: r.id, label: r.label, done: false }));

/** The list a trip shows: its own (once changed) or a fresh one. */
export const checkOf = (trip, kind, standard = null) => (Array.isArray(trip?.[kind]) ? trip[kind] : freshCheck(kind, domainOf(trip), standard));

export const checkCount = (list) => ({ done: list.filter((r) => r.done).length, total: list.length });

export const toggleCheck = (list, id) => list.map((r) => (r.id === id ? { ...r, done: !r.done } : r));

export const removeCheck = (list, id) => list.filter((r) => r.id !== id);

/** Add an own row at the end; empty words add nothing. */
export function addCheck(list, label, now = Date.now()) {
  const words = String(label ?? '').trim();
  return words ? [...list, { id: `own-${now.toString(36)}`, label: words, done: false }] : list;
}

/** The trip's list as a standard: ids of own rows become stable, ticks are dropped. */
export const asStandard = (list, now = Date.now()) => list.map((r, n) => ({ id: r.id.startsWith('own-') ? `std-${n}-${now.toString(36)}` : r.id, label: r.label }));

/** Is the trip's list different from the standard it would start with? */
export const differs = (list, fresh) => list.map((r) => r.label).join('|') !== fresh.map((r) => r.label).join('|');
