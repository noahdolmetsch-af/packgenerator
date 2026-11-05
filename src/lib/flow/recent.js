/**
 * «Aktiv und Auswerten» 5a (Noah 03.11.2026): «Zuletzt genutzt» on top of «Meine Sportarten». The sports you ticked
 * most recently (latest day first, the same day by the later entry), at most n, each only once; paused sports and
 * entries of sports that are gone are left out. Pure: acts = the list of Aktiv, log = flowLog rows { actId, day, id }.
 */
export function recentActs(acts = [], log = [], n = 3) {
  const byId = new Map(acts.filter((a) => !a.paused).map((a) => [a.id, a]));
  const last = new Map();
  for (const e of log) {
    if (!byId.has(e.actId) || !e.day) continue;
    const key = `${e.day}|${e.id ?? ''}`;
    if (!last.has(e.actId) || key > last.get(e.actId)) last.set(e.actId, key);
  }
  return [...last.entries()]
    .sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0))
    .slice(0, n)
    .map(([id]) => byId.get(id));
}
