/**
 * v0.144.0 RE «Regen überall gleich» (mockup RE1, Noah 14.10.2026 «1a 2a»): ONE rain limit for the whole
 * app. It is the limit of the block Regen (Material › Bausteine › Regen, standard 30 %); from it on a
 * trip, an hour or a day counts as wet everywhere: the rain block and the rain gear in Packen, «Was
 * anziehen», the packing weather from the forecast, the weather line and the suggestion of the day on
 * Heute, the plan on the way, the week suggestions in Im Flow.
 * Millimetres stay as they were (5 mm rain, 1 mm showers, 0.5 mm in an hour): they are no chance.
 *
 * The limit is read once from the settings «sets» (App.svelte keeps it current) and kept here as state,
 * so every $derived that asks for it follows a change at once. Pure helpers take the limit as an
 * argument too (tests pass it).
 */

/** The standard limit (the rule Regen in situation.js starts with it). */
export const RAIN_LIMIT = 30;

const live = $state({ limit: RAIN_LIMIT });

/** The rain limit in % from the settings «sets» value: the limit of the block Regen while its rule looks at the rain chance. */
export function rainLimitOf(setsValue) {
  const rec = (Array.isArray(setsValue) ? setsValue : []).find((s) => s?.key === 'rain');
  const rule = rec?.rule;
  if (!rule || typeof rule !== 'object') return RAIN_LIMIT;
  if (rule.metric != null && rule.metric !== 'rainPct') return RAIN_LIMIT;
  const n = rule.limit;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100 ? n : RAIN_LIMIT;
}

/** The limit now (%). */
export const rainLimit = () => live.limit;
/** Keep the limit (App.svelte, from the settings «sets»). */
export function setRainLimit(n) {
  live.limit = typeof n === 'number' && Number.isFinite(n) ? n : RAIN_LIMIT;
}

/** Is this rain chance (%) wet? null/unknown: no. */
export const wetPct = (pct, limit = rainLimit()) => typeof pct === 'number' && Number.isFinite(pct) && pct >= limit;

/** Is one forecast hour wet: 0.5 mm or more, or a chance from the limit on? x: { rainMm, rainPct }. */
export const wetHour = (x, limit = rainLimit()) => (x?.rainMm ?? 0) >= 0.5 || wetPct(x?.rainPct, limit);
