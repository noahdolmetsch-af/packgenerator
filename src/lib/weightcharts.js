/**
 * TR6b (Noah 14.10.2026 «TR5–TR7 freigegeben»): the weight over time with a 7-day mean, and watts per
 * kg over the weeks (estimated FTP ÷ weight). Pure rules for pages/Weight.svelte. Observation only.
 */
import { shiftDay, mondayOf, isoWeek, ftpEstimate } from './training.js';
import { kgOn } from './weight.js';

/** Each entry with the mean of the entries of its 7 days (that day and the 6 before), one decimal. */
export function mean7(entries) {
  return entries.map((e) => {
    const from = shiftDay(e.day, -6);
    const w = entries.filter((x) => x.day >= from && x.day <= e.day);
    return { ...e, mean: Math.round((w.reduce((s, x) => s + x.kg, 0) / w.length) * 10) / 10 };
  });
}

/**
 * Watts per kg per week, from the first week with a weight (at most `weeks` weeks back) to this week:
 * the FTP estimated on the week's last day (or today) ÷ the weight of that day. A week without a
 * power-meter ride keeps the value of the 90 days before it (ftpEstimate looks back 90 days).
 * → [{ monday, kw, ftp, kg, wkg }]; weeks without an FTP are left out.
 */
export function wkgWeeks(acts, entries, today, weeks = 26) {
  if (!entries.length) return [];
  const first = mondayOf(entries[0].day);
  let monday = mondayOf(shiftDay(today, -7 * (weeks - 1)));
  if (monday < first) monday = first;
  const out = [];
  for (; monday <= today; monday = shiftDay(monday, 7)) {
    const end = shiftDay(monday, 6) < today ? shiftDay(monday, 6) : today;
    const ftp = ftpEstimate(acts, end);
    const kg = kgOn(entries, end);
    if (ftp && kg) out.push({ monday, kw: isoWeek(monday), ftp, kg, wkg: Math.round((ftp / kg) * 100) / 100 });
  }
  return out;
}
