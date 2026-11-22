/**
 * What one check asks for, before it starts (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt B: three cards on the care
 * page): how many points fit this bike and which tools they need. The same points as InspectRun shows.
 * Pure; tested in tests/inspect-level.test.js.
 */
import { ensureParts, partOnBike, fits, PART } from '../care.js';
import { bikePartOn, kindOf } from '../bikekind.js';
import { checklist } from './inspect.js';

/** → { points: n, tools: [name, …] } for the level of this bike; list: the person's checklist (insp.list). */
export function levelInfo(bike, level, list) {
  const parts = ensureParts(bike);
  const hasPart = (k) => parts.some((p) => p.key === k) && partOnBike(bike, k) && (!PART[k]?.suspension || fits(bike, PART[k]) || bikePartOn(bike, k) === true);
  const points = checklist(list, level, kindOf(bike), hasPart).flatMap((g) => g.points);
  return { points: points.length, tools: [...new Set(points.flatMap((p) => p.tools ?? []))] };
}
