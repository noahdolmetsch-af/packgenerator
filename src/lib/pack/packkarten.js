/**
 * «Pack-Karten» (Warteliste 4, Baustein 3; Noah 22.11.2026 «4a»): «Touren» stays, and its page begins with the tours that are being prepared:
 * a card for each (progress, when, «Continue with Clothes» or «Start the packing list», «Open») and the card «New trip».
 * Pure: the rules for which trips get a card and what the button says. PackKarten.svelte reads the tables and draws.
 */
import { stepOfCategory, orderedSteps } from './schritte.js';

/** At most so many cards stand on top (the rest is the list «Planned» below). */
export const MAX_CARDS = 3;

const dayDiff = (a, b) => Math.round((new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`)) / 864e5);

/** Whether a trip is being prepared: it has a start day from today on, is no idea, not skipped, not a test trip and not finished. */
export const isPreparing = (trip, today) => !!trip?.startDate && trip.startDate >= today && !trip.idea && !trip.skipped && !trip.finished && trip.testTrip !== true;

/** The step of the packing list where the next thing waits: the first step (in the person's order) with an item not packed yet, or null. */
export function nextStepOf(trip, items, order = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const open = new Set((trip.entries ?? []).filter((e) => !e.packed).map((e) => stepOfCategory(byId[e.itemId]?.category)));
  return orderedSteps(order).find((s) => open.has(s.key))?.key ?? null;
}

/**
 * The ids of the trips that get a card (the same filter, order and limit as packCards, without the items). «Touren-Seite klarer»
 * (Noah 25.11.2026 «3a»): a race that has a card is not shown a second time as the row «Your race».
 */
export function cardIds(trips = [], today, max = MAX_CARDS) {
  return new Set(
    trips
      .filter((tr) => isPreparing(tr, today))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || String(a.title).localeCompare(String(b.title)))
      .slice(0, max)
      .map((tr) => tr.id),
  );
}

/**
 * The cards: { id, title, pct (0–100 of the items packed), days (until the start), startDate, n (items), step (key or null),
 * kind: 'start' (no list yet) | 'continue' (a step waits) | 'done' (everything packed) }, the nearest start first.
 */
export function packCards({ trips = [], items = [], today, order = [], max = MAX_CARDS } = {}) {
  return trips
    .filter((tr) => isPreparing(tr, today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || String(a.title).localeCompare(String(b.title)))
    .slice(0, max)
    .map((tr) => {
      const entries = tr.entries ?? [];
      const packed = entries.filter((e) => e.packed).length;
      const step = entries.length ? nextStepOf(tr, items, order) : null;
      return {
        id: tr.id,
        title: tr.title,
        startDate: tr.startDate,
        days: dayDiff(tr.startDate, today),
        n: entries.length,
        pct: entries.length ? Math.round((packed / entries.length) * 100) : 0,
        step,
        kind: !entries.length ? 'start' : step ? 'continue' : 'done',
      };
    });
}
