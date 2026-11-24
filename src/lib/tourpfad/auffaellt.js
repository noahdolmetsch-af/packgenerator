/**
 * «Das fällt auf» nach der Tour (Plan «ganze App», Schritt 7b, Noah 08.11.2026 / 23.11.2026 «a»): ONE sentence about what
 * stood out on this tour, only after the debrief is saved, with the rule behind it («Warum?»). Pure: it reads the trip, its
 * debrief, the rides matched to it and the items (for the weight). It only looks at what was recorded: no verdict, no advice,
 * nothing is stored. Nothing stands out → null (then nothing is shown; the page never says «all fine»).
 *
 *   tourAuffaellt({ trip, debrief, rides, items }) → { key, text, why } | null
 *
 * The rules, in this order (the first that holds is the sentence):
 *   km      the ridden km (rides of this tour, else the km of the debrief) differ from the planned route by 15 % or more
 *   unused  3 or more items were marked «not used»
 *   missing something was marked as missing
 * Tested in tests/tourauffaellt.test.js.
 */
import { t, num } from '../i18n.svelte.js';

export const KM_GAP = 0.15; // 15 % between plan and ride
export const UNUSED_MIN = 3;

const kg = (g) => num(Math.round(g / 100) / 10);

export function tourAuffaellt({ trip, debrief, rides = [], items = [] } = {}) {
  if (!trip || debrief?.status !== 'done') return null;
  // 1. planned against ridden km
  const planned = Number(trip.route?.km) || 0;
  const mine = (rides ?? []).filter((r) => r?.tripId === trip.id);
  const ridden = mine.length ? mine.reduce((s, r) => s + (Number(r.km) || 0), 0) : Number(debrief.km) || 0;
  if (planned > 0 && ridden > 0 && Math.abs(ridden - planned) / planned >= KM_GAP) {
    const diff = Math.round((Math.abs(ridden - planned) / planned) * 100);
    return {
      key: 'km',
      text: ridden < planned
        ? t('You rode {r} km, {p} km were planned: {d} % less.', { r: num(Math.round(ridden)), p: num(Math.round(planned)), d: diff })
        : t('You rode {r} km, {p} km were planned: {d} % more.', { r: num(Math.round(ridden)), p: num(Math.round(planned)), d: diff }),
      why: t('Compared: the kilometres of the ride of this tour against the route in the plan. It shows from a gap of 15 %.'),
    };
  }
  // 2. items not used
  const byId = Object.fromEntries((items ?? []).map((i) => [i.id, i]));
  const unused = (trip.entries ?? []).filter((e) => debrief.items?.[e.itemId] === 'unused');
  if (unused.length >= UNUSED_MIN) {
    const g = unused.reduce((s, e) => s + (Number(byId[e.itemId]?.weightG) || 0) * (e.qty || 1), 0);
    return {
      key: 'unused',
      text: g > 0
        ? t('{n} things stayed unused in the bags ({kg} kg).', { n: unused.length, kg: kg(g) })
        : t('{n} things stayed unused in the bags.', { n: unused.length }),
      why: t('From your debrief: the things you marked «Not used». It shows from 3 things.'),
    };
  }
  // 3. something missing
  const missing = (debrief.missing ?? []).map((m) => `${m?.name ?? ''}`.trim()).filter(Boolean);
  if (missing.length) {
    return {
      key: 'missing',
      text: t('Something was missing: {list}.', { list: missing.slice(0, 3).join(', ') }),
      why: t('From your debrief: what you wrote under «Missing». It shows as soon as one thing is there.'),
    };
  }
  return null;
}
