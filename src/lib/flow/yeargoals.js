/**
 * «Werte überall» WU3 (Noah 13.10.2026 «1-5a»: one year goal per value, each can be switched off;
 * mockups approved «ich gebe alle bild mockups frei»): the year goals for km, metres climbed and
 * active zone minutes, and the footprint of the year. Pure functions, tested in tests/yeargoals.test.js.
 * The goals live in the settings record YEAR_GOALS_KEY (in backups). Noah 19.10.2026 «2b und kann manuell
 * geleert werden»: a goal can be emptied by hand (of: null = no goal), and the year sum of the active zone
 * minutes is not counted yet (their week is on Aktiv, health.js azmWeek).
 */
import { localDay } from '../localday.js';

export const YEAR_GOALS_KEY = 'yearGoals';
/** The three values, their unit and the goal they start with (minutes: 150 a week, as the weekly goal). */
export const GOALS = [
  { key: 'km', label: 'Bike km', unit: 'km', of: 5000 },
  { key: 'hm', label: 'Metres climbed', unit: 'm', of: 50000 },
  { key: 'azm', label: 'Active zone minutes', unit: 'min', of: 7800, fitbit: true },
];
/** kg CO₂ a car km would have cost (an estimate, shown with the card). */
export const CO2_PER_KM = 0.15;

/** The stored record made safe: every value { on, of } with a whole goal above 0, or of null when emptied. */
export function goalsOf(value) {
  return Object.fromEntries(GOALS.map((g) => {
    const v = value?.[g.key];
    if (v && v.of === null) return [g.key, { on: v.on !== false, of: null }];
    const of = Number(v?.of);
    return [g.key, { on: v?.on !== false, of: Number.isFinite(of) && of > 0 ? Math.round(of) : g.of }];
  }));
}

/** What the typed text means: a whole number above 0, null for an empty field (no goal), undefined for nonsense. */
export function typedGoal(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;
  const v = Math.round(Number(s.replace(/[^\d]/g, '')));
  return v > 0 ? v : undefined;
}

/** The share of the year gone by today (1 Jan = 1 day of 365 or 366). */
export function yearShare(today = localDay()) {
  const y = Number(today.slice(0, 4));
  const start = Date.UTC(y, 0, 1);
  const days = (Date.UTC(y + 1, 0, 1) - start) / 864e5;
  return (Math.round((Date.parse(`${today}T00:00:00Z`) - start) / 864e5) + 1) / days;
}

/** km and metres climbed of this year's rides (rides: withStravaRides), up to today. */
export function yearSums(rides = [], today = localDay()) {
  const y = today.slice(0, 4);
  const xs = (rides ?? []).filter((r) => typeof r?.date === 'string' && r.date.slice(0, 4) === y && r.date.slice(0, 10) <= today);
  return {
    km: Math.round(xs.reduce((s, r) => s + (Number(r.km) || 0), 0)),
    hm: Math.round(xs.reduce((s, r) => s + (Number.isFinite(r.gainM) ? r.gainM : 0), 0)),
  };
}

/** One goal row: { have, of, fill (0…1), plan (0…1), ahead } — ahead: how far before (+) or behind (−) the plan. */
export function goalRow(have, of, today = localDay()) {
  const plan = yearShare(today);
  return { have, of, fill: Math.min(1, of > 0 ? have / of : 0), plan, ahead: Math.round(have - of * plan) };
}

/** The footprint: kg CO₂ saved by riding instead of driving (an estimate). */
export const co2Saved = (km) => Math.round((Number(km) || 0) * CO2_PER_KM);
