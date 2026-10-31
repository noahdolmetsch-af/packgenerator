/**
 * «Heute als Begleiter» PR 4 (Noah 28.10.2026 «1a 2a 3a», variant B): the card «Your moment» on Today. It names the
 * moment you are in (moment.js momentOf), the trip it is about, where you stand in the trip loop and one next step.
 * Pure; the tile (MomentTile.svelte) passes what Today already knows. Texts are English keys for t().
 */
import { LOOP, loopOf } from '../moment.js';
import { daysFrom } from '../phase.js';
import { MOMENT_GROUPS } from '../features.js';

/** The name of a moment (the same words as «What the app can do › By moment»). */
export const momentName = (key) => MOMENT_GROUPS.find((g) => g.key === key)?.label ?? 'App and help|moment';

/** The short names of the trip loop for the strip. */
export const LOOP_NAME = { lust: 'Dream|loop', planen: 'Plan|loop', packen: 'Pack|loop', unterwegs: 'Ride|loop', zurueck: 'Back|loop' };

/** One next step for a moment: { label, href } (the trip's own hash where it needs the trip). */
export function stepFor(key, trip, { inbox = 0 } = {}) {
  const id = trip ? encodeURIComponent(trip.id) : '';
  switch (key) {
    case 'unterwegs': return { label: 'Ride on', href: '#/ride', trip: trip?.id ?? null };
    case 'zurueck': return trip ? { label: 'Write the debrief', href: `#/debrief/${id}` } : { label: 'Open the debriefs', href: '#/trips' };
    case 'packen': return { label: 'Keep packing', href: '#/pack', trip: trip?.id ?? null };
    case 'planen': return { label: 'Plan the trip', href: '#/trips', trip: trip?.id ?? null };
    case 'velo': return { label: 'See the bike care', href: '#/bikes?tab=care' };
    case 'koerper': return { label: 'Your body today', href: '#/flow' };
    case 'alltag': return inbox > 0 ? { label: 'See the inbox', href: '#/inbox' } : { label: 'Plan the week', href: '#/calendar' };
    default: return { label: 'Find an idea', href: '#/inspiration' };
  }
}

/** How the trip stands: a key and its values for t() ('starts in {n} days' …), null without a trip. */
export function whenOf(trip, today) {
  if (!trip?.startDate) return null;
  const n = daysFrom(today, trip.startDate);
  if (n < 0) return { key: 'on the way now' };
  if (n === 0) return { key: 'starts today' };
  if (n === 1) return { key: 'starts tomorrow' };
  return { key: 'starts in {n} days', vars: { n } };
}

/** The strip: [{ key, name, state: 'done' | 'now' | 'next' }] for the five moments of the trip loop, null outside it. */
export function stripOf(key) {
  const at = loopOf(key);
  if (!at) return null;
  return LOOP.map((k) => ({ key: k, name: LOOP_NAME[k], state: at.done.includes(k) ? 'done' : k === at.now ? 'now' : 'next' }));
}
