/**
 * «Von selbst» (Noah 21.11.2026 «mehr Daten zu den Aktivitäten, die sinnvoll und interessant sind», T3): the facts that show on the
 * card «How was it?» and next to a finished activity: what the watch or Strava sent, only what is there, nothing judged and nothing
 * invented. Pure; `t` and `num` are the app's own functions so the words stay German in the UI.
 */
const FOOT = new Set(['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike']);
const round1 = (x) => Math.round(x * 10) / 10;

/** 5:12 for 312 seconds. */
export const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

/** The facts of one Strava activity (a db.activities row), in the order a reader asks for them. → string[] */
export function stravaFacts(a, t, num) {
  if (!a) return [];
  const out = [];
  const min = a.movingS > 0 ? Math.round(a.movingS / 60) : 0;
  if (a.km > 0) out.push(`${num(round1(a.km))} km`);
  if (min > 0) out.push(t('{n} min', { n: min }));
  if (a.km > 0 && a.movingS > 0) {
    if (FOOT.has(a.type)) out.push(t('Pace {n} min/km', { n: clock(a.movingS / a.km) }));
    else out.push(t('{n} km/h', { n: num(round1(a.km / (a.movingS / 3600))) }));
  }
  if (a.hm > 0) out.push(t('{n} m up', { n: num(Math.round(a.hm)) }));
  if (a.hrAvg > 0) out.push(t('Heart rate avg {n}', { n: Math.round(a.hrAvg) }));
  if (a.hrMax > 0) out.push(t('Heart rate max {n}', { n: Math.round(a.hrMax) }));
  if (a.wAvg > 0) out.push(t('Power avg {n} W', { n: Math.round(a.wAvg) }));
  if (a.kcal > 0) out.push(t('{n} kcal', { n: Math.round(a.kcal) }));
  return out;
}

/** The facts of one workout of the watch (healthDays.exercises). → string[] */
export function healthFacts(e, t, num) {
  if (!e) return [];
  const out = [];
  if (e.km > 0) out.push(`${num(round1(e.km))} km`);
  if (e.min > 0) out.push(t('{n} min', { n: Math.round(e.min) }));
  if (e.km > 0 && e.min > 0 && /run|walk|hik/i.test(String(e.type ?? ''))) out.push(t('Pace {n} min/km', { n: clock((e.min * 60) / e.km) }));
  if (e.hm > 0) out.push(t('{n} m up', { n: num(Math.round(e.hm)) }));
  if (e.hr > 0) out.push(t('Heart rate avg {n}', { n: Math.round(e.hr) }));
  if (e.azm > 0) out.push(t('{n} zone minutes', { n: Math.round(e.azm) }));
  if (e.kcal > 0) out.push(t('{n} kcal', { n: Math.round(e.kcal) }));
  if (e.steps > 0) out.push(t('{n} steps', { n: num(Math.round(e.steps)) }));
  return out;
}
