/**
 * «Das beste Fenster heute» (Noah 24.11.2026 «1-3», idea 2): one quiet sentence under the Outdoors line on Heute, from the hourly rain
 * of the home forecast: how long it stays dry, when it gets dry, or that today is wet (then a short meditation fits).
 * Pure; tested in tests/fenster.test.js. The rain limit is the app's own (`wetPct`, standard 30 %).
 *
 *   dryWindow(forecast, date, hour) → { kind: 'dry', until: 19 | null } | { kind: 'later', from: 15 } | { kind: 'wet' } | null
 *
 * forecast: homeForecast(db) with days[].hourly.p (24 rain probabilities); hour: the hour now. Looks from hour (at least 7) to 21 o'clock.
 * null without hourly data for that day (never a guess).
 */
import { wetPct } from '../rainlimit.svelte.js';

const FIRST = 7;
const LAST = 21;

export function dryWindow(forecast, date, hour) {
  const p = (forecast?.days ?? []).find((d) => d.date === date)?.hourly?.p;
  if (!Array.isArray(p) || p.length !== 24) return null;
  const from = Math.max(FIRST, Math.floor(hour));
  if (from > LAST) return null;
  const wet = (h) => wetPct(p[h]);
  if (!wet(from)) {
    for (let h = from + 1; h <= LAST; h++) if (wet(h)) return { kind: 'dry', until: h };
    return { kind: 'dry', until: null };
  }
  for (let h = from + 1; h < LAST; h++) if (!wet(h) && !wet(h + 1)) return { kind: 'later', from: h };
  return { kind: 'wet' };
}
