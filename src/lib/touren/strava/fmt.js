/** Strava-Analyse 1:1: a duration in seconds as Strava writes it: 1:08:11, 27:23 or 0:45. */
export function clock(s) {
  if (!Number.isFinite(s) || s < 0) return '–';
  const v = Math.round(s);
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  const x = v % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
}
