/** Strava-Analyse 1:1: a duration in seconds as Strava writes it: 1:08:11, 27:23 or 0:45. */
export function clock(s) {
  if (!Number.isFinite(s) || s < 0) return '–';
  const v = Math.round(s);
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  const x = v % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
}

/**
 * A duration for the activity page of Training (UI-Test 17.11.2026, Fund 9): under one day h:mm:ss («1:48:20»,
 * «0:06:00»), from one day on dd:hh:mm:ss as Noah wanted for long tours (21.10.2026): «01:02:15:00».
 */
export function hmsOrDays(s) {
  if (!Number.isFinite(s) || s < 0) return '–';
  const v = Math.round(s);
  if (v >= 86400) return dhms(v);
  const p2 = (n) => String(n).padStart(2, '0');
  return `${Math.floor(v / 3600)}:${p2(Math.floor((v % 3600) / 60))}:${p2(v % 60)}`;
}

/**
 * Days, hours, minutes and seconds, dd:hh:mm:ss (Noah 21.10.2026 «verstrichene Zeit in Format hh:mm:ss», then
 * «dd:hh:mm:ss»; also the pauses): 00:00:26:45, 00:09:31:29, 01:02:15:00.
 */
export function dhms(s) {
  if (!Number.isFinite(s) || s < 0) return '–';
  const v = Math.round(s);
  const p2 = (n) => String(n).padStart(2, '0');
  return `${p2(Math.floor(v / 86400))}:${p2(Math.floor((v % 86400) / 3600))}:${p2(Math.floor((v % 3600) / 60))}:${p2(v % 60)}`;
}
