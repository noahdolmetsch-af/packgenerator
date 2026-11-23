/**
 * «Fenster teilen» (Wetter-Ausbau H, Noah 22.11.2026 «a»): the best window of the page as one short text for the group chat:
 * «Wed 9–13, 2–10 °C, dry, wind 9 km/h from the west. Start 9:00.» It is only copied; the app sends nothing and shares no data.
 * Pure functions, tested in tests/wetter-teilen.test.js.
 */

/** The facts of a window (bestWindows → best, a day of its list): { date, start, end, tmin, tmax, rain, wind, dir } or null. */
export function windowFacts(win) {
  if (!win || !Number.isFinite(win.start) || !Number.isFinite(win.end)) return null;
  const l = win.line ?? null;
  return {
    date: win.date,
    start: win.start,
    end: win.end,
    tmin: l?.tmin ?? null,
    tmax: l?.tmax ?? null,
    rain: !!l?.rainFrom,
    wind: l?.windMax ?? null,
    dir: l?.dir ?? null,
  };
}

/**
 * The text. f: windowFacts; say: { day(date), hm(ms), num(n), compass(deg) | null, t(key, vars) } the page's words
 * (so it is German in the German app). → one line.
 */
export function windowText(f, say) {
  if (!f) return '';
  const parts = [`${say.day(f.date)} ${say.hm(f.start)}–${say.hm(f.end)}`];
  if (f.tmin != null && f.tmax != null) parts.push(f.tmin === f.tmax ? `${say.num(f.tmin)} °C` : `${say.num(f.tmin)}–${say.num(f.tmax)} °C`);
  parts.push(f.rain ? say.t('rain possible') : say.t('dry'));
  if (f.wind != null) parts.push(f.dir != null && say.compass ? say.t('wind {kmh} km/h from the {dir}', { kmh: say.num(f.wind), dir: say.compass(f.dir) }) : say.t('wind {kmh} km/h', { kmh: say.num(f.wind) }));
  return `${parts.join(', ')}. ${say.t('Start {at}', { at: say.hm(f.start) })}.`;
}
