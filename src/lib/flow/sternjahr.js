/**
 * «Meilensteine motivierender» PR 5 (Noah 21.11.2026 «1-5 a», Idee 4): «Dein Jahr in Sternen». Pure: the stars of the
 * list by month of one year, the total of the year and of all years, the strongest month and the newest star.
 * Only what was reached; nothing is made up, no goal, no comparison with others. Tests: tests/sternjahr.test.js.
 */

/**
 * list: evaluated milestones (flowms allMilestones; hidden ones drop out), today: 'YYYY-MM-DD'.
 * → { year, months: [12 counts], now (0–11), total, all, best: { month (0–11), n } | null, last: { r, star, day } | null }
 */
export function yearOfStars(list, today) {
  const year = today.slice(0, 4);
  const stars = list.filter((r) => !r.off).flatMap((r) => r.reached.map((s) => ({ r, star: s.star, day: s.day })));
  const months = Array(12).fill(0);
  for (const s of stars) if (s.day.startsWith(year)) months[Number(s.day.slice(5, 7)) - 1]++;
  const top = Math.max(...months);
  const last = [...stars].sort((a, b) => b.day.localeCompare(a.day) || b.star - a.star)[0] ?? null;
  return {
    year,
    months,
    now: Number(today.slice(5, 7)) - 1,
    total: months.reduce((a, b) => a + b, 0),
    all: stars.length,
    best: top > 0 ? { month: months.indexOf(top), n: top } : null,
    last,
  };
}
