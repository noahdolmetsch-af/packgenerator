/**
 * «Tagesbild» (Noah 27.10.2026, idea «Tagesbild»): one day over its 24 hours: when you slept, steps and
 * pulse per hour, your rides and when you ticked what. Pure; times are local hours as numbers (7.5 = 07:30).
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const hm = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s ?? '');
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
};
const hourOf = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getHours() + d.getMinutes() / 60;
};

/**
 * row: the day of the table ({ night: { start, end }, fit: { hrH, stepH }, acts: [{ start, movingS,
 * elapsedS, name, kind }] }); ticks: the log entries of the day; nameOf(actId) → name.
 * → { sleep: [{ from, to }], hr: 24 | null, steps: 24 | null, rides: [{ from, to, name }], ticks: [{ h, name }], any }
 * The night stored on a day ends that morning: from midnight (or its start after midnight) to its end.
 */
export function dayPicture(row, ticks = [], nameOf = (id) => id) {
  const sleep = [];
  const s = hm(row?.night?.start);
  const e = hm(row?.night?.end);
  if (e != null) sleep.push({ from: s != null && s < e ? s : 0, to: e });
  const arr = (a) => (Array.isArray(a) && a.length === 24 && a.some((v) => fin(v) != null) ? a.map(fin) : null);
  const hr = arr(row?.fit?.hrH);
  const steps = arr(row?.fit?.stepH);
  const rides = (row?.acts ?? [])
    .map((a) => {
      const from = hourOf(a.start);
      const dur = (fin(a.elapsedS) ?? fin(a.movingS) ?? 0) / 3600;
      return from == null ? null : { from, to: Math.min(24, from + Math.max(dur, 0.25)), name: a.name ?? '' };
    })
    .filter(Boolean)
    .sort((a, b) => a.from - b.from);
  const tk = ticks
    .map((x) => ({ h: x.at ? hourOf(x.at) : null, name: nameOf(x.actId) }))
    .filter((x) => x.h != null)
    .sort((a, b) => a.h - b.h);
  return { sleep, hr, steps, rides, ticks: tk, any: !!(sleep.length || hr || steps || rides.length || tk.length) };
}
