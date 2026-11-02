/**
 * «Analyse» own calculations (Noah 27.10.2026 «4a»: own, labelled calculations where Google gives nothing
 * out): Schlafindex, Unruhe im Schlaf and Cardio-Belastung from the values of your watch. Pure; always shown
 * as «eigene Rechnung», never as Fitbit's number.
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const clamp = (x) => Math.max(0, Math.min(1, x));

/** Sleep goal for the full duration part, in minutes. */
export const SLEEP_GOAL = 480;
/** Share of deep + REM sleep that counts as full depth. */
export const DEPTH_GOAL = 0.45;

/**
 * Schlafindex 0–100 of a night { asleepMin, deepMin?, remMin?, awakeMin?, efficiency? }: duration (50,
 * full at 8 h), depth (25, full at 45 % deep + REM) and calm (25, from 70 % to 95 % efficiency). Without
 * stages the depth part is left out and the rest counts up to 100.
 */
export function sleepScoreOf(night) {
  const asleep = fin(night?.asleepMin);
  if (!asleep) return null;
  const awake = fin(night.awakeMin);
  const eff = fin(night.efficiency) ?? (awake != null ? (asleep / (asleep + awake)) * 100 : null);
  const dur = clamp(asleep / SLEEP_GOAL) * 50;
  const calm = eff != null ? clamp((eff - 70) / 25) * 25 : null;
  const deep = fin(night.deepMin);
  const rem = fin(night.remMin);
  const depth = deep != null && rem != null ? clamp((deep + rem) / asleep / DEPTH_GOAL) * 25 : null;
  const parts = [[dur, 50], [calm, 25], [depth, 25]].filter(([v]) => v != null);
  const got = parts.reduce((s, [v]) => s + v, 0);
  const max = parts.reduce((s, [, m]) => s + m, 0);
  return Math.round((got / max) * 100);
}

/** Unruhe im Schlaf: minutes awake per hour asleep (one decimal). */
export function restlessOf(night) {
  const asleep = fin(night?.asleepMin);
  const awake = fin(night?.awakeMin);
  if (!asleep || awake == null) return null;
  return Math.round((awake / (asleep / 60)) * 10) / 10;
}

/** Cardio-Belastung of a day: minutes per pulse zone { light, mod, vig, peak } weighted 1, 2, 3, 4. */
export function cardioLoadOf(zones) {
  if (!zones || typeof zones !== 'object') return null;
  const w = { light: 1, mod: 2, vig: 3, peak: 4 };
  let sum = 0;
  let any = false;
  for (const [k, f] of Object.entries(w)) {
    const v = fin(zones[k]);
    if (v != null) {
      sum += v * f;
      any = true;
    }
  }
  return any ? sum : null;
}
