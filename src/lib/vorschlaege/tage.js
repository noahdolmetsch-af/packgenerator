/**
 * Day tours out of stages (Noah 24.11.2026 «ziel 3 mal so viele touren»): two or three stages of the same official route that follow
 * each other (stage numbers in a row, the end of one near the start of the next) make one longer tour. They cost no data of their own:
 * the lines, heights and ground of the stages are joined when the page loads. Pure function, tested in tests/vorschlaege.test.js.
 */
export const MAX_STAGES = 3;
/** The end of a stage and the start of the next one may be this far apart (km). */
export const JOIN_KM = 0.6;

const RANK = { easy: 1, medium: 2, difficult: 3 };
const hardest = (a, b) => {
  if (!a) return b ?? null;
  if (!b) return a;
  return RANK[b] > RANK[a] ? b : a;
};
const km = (p, q) => {
  const dy = (p[0] - q[0]) * 111.2;
  const dx = (p[1] - q[1]) * 111.2 * Math.cos((p[0] * Math.PI) / 180);
  return Math.hypot(dx, dy);
};
const share = (cls, ch) => (cls.length ? Math.round((100 * [...cls].filter((c) => c === ch).length) / cls.length) : 0);
const ends = (t) => (t.title ?? '').split(' → ');

/** One tour out of the stages `list` (in order). */
export function joinStages(list) {
  const first = list[0];
  const last = list.at(-1);
  const line = list.flatMap((t, i) => (i ? t.line.slice(1) : t.line));
  const ele = list.flatMap((t) => t.ele);
  const cls = list.map((t) => t.cls).join('');
  const a = ends(first);
  const b = ends(last);
  const title = a.length === 2 && b.length === 2 ? `${a[0]} → ${b[1]}` : `${first.title} … ${last.title}`;
  const closed = km(line[0], line.at(-1)) < 1.5;
  return {
    id: `sm-${first.route}-${first.et}_${last.et}`,
    route: first.route,
    et: first.et,
    days: list.length,
    title,
    region: first.region,
    kind: closed ? 'loop' : 'oneway',
    km: Math.round(list.reduce((s, t) => s + (t.km ?? 0), 0) * 10) / 10,
    up: list.reduce((s, t) => s + (t.up ?? 0), 0),
    down: list.reduce((s, t) => s + (t.down ?? 0), 0),
    cond: list.reduce((c, t) => hardest(c, t.cond), null),
    tech: list.reduce((c, t) => hardest(c, t.tech), null),
    lenM: list.reduce((s, t) => s + (t.lenM ?? 0), 0),
    max: Math.max(...list.map((t) => t.max)),
    min: Math.min(...list.map((t) => t.min)),
    dz: first.dz,
    single: share(cls, 's'),
    unpaved: share(cls, 'u'),
    paved: share(cls, 'p'),
    line,
    ele,
    cls,
  };
}

/** The day tours of a list of stages: [{ …tour, days: 2 | 3 }], longest windows included, each window once. */
export function daysOf(tours = [], max = MAX_STAGES) {
  const byRoute = new Map();
  for (const t of tours) {
    if (t.days || !t.route || !Number.isFinite(t.et)) continue;
    if (!byRoute.has(t.route)) byRoute.set(t.route, []);
    byRoute.get(t.route).push(t);
  }
  const out = [];
  for (const list of byRoute.values()) {
    if (list.length < 2) continue;
    list.sort((x, y) => x.et - y.et);
    for (let i = 0; i < list.length - 1; i++) {
      const run = [list[i]];
      for (let j = i + 1; j < list.length && run.length < max; j++) {
        const prev = run.at(-1);
        if (list[j].et !== prev.et + 1 || km(prev.line.at(-1), list[j].line[0]) > JOIN_KM) break;
        run.push(list[j]);
        out.push(joinStages(run));
      }
    }
  }
  return out;
}
