// «Spruch zum Einstieg» PR 1 and 2 (Noah 07.11.2026 «Bau spruch pr1», «bau spruch pr2»): the sentences, the recovery rule, the history,
// the second wordings, steps, weeks in a row, bike km, a year ago, the fog clearing and the quotes.
import { describe, it, expect } from 'vitest';
import { TEMPLATES, TEMPLATE, TONES, TONE_NAME, SOURCE_NAME, HISTORY_MAX, KM_MARKS, baseId, spruchOf, remember, recoveryOf, contextOf, fitting, pickSpruch } from '../src/lib/home/spruch.js';
import DE from '../src/lib/i18n/de/spruch.js';

const TODAY = '2026-11-04'; // a Wednesday
const day = (n) => {
  const d = new Date(Date.UTC(2026, 10, 4 + n, 12));
  return d.toISOString().slice(0, 10);
};
/** n days of health rows before today (and today), sleep and resting pulse around 450 min / 55. */
const rows = ({ sleep = 450, rhr = 55, azm = 20, days = 14, todaySleep = sleep, todayRhr = rhr } = {}) =>
  Array.from({ length: days + 1 }, (_, i) => {
    const date = day(i - days);
    const isToday = date === TODAY;
    return { date, sleep: { asleepMin: isToday ? todaySleep : sleep }, restingHr: isToday ? todayRhr : rhr, azm };
  });
const hours = (fn) => Array.from({ length: 24 }, (_, h) => fn(h));
const forecast = ({ wet = null, min = 6, max = 14 } = {}) => ({
  days: [{ date: TODAY, min, max, rain: 'none', hourly: { t: hours(() => 10), p: hours((h) => (wet && wet(h) ? 90 : 0)) } }],
});
const QUOTES3 = [
  { id: 'q1', text: 'Eine Reise von tausend Meilen beginnt unter deinen Füssen.', author: 'Laozi', source: 'Daodejing 64' },
  { id: 'q2', text: 'Nicht die Dinge beunruhigen die Menschen.', author: 'Epiktet', source: 'Handbüchlein 5' },
  { id: 'own1', text: 'Heute zählt der erste Schritt.', source: '' },
];
const ctx = (o = {}) => contextOf({ today: TODAY, hour: 9, weekday: 3, ...o });
const ids = (c, o) => fitting(c, o).map((x) => x.id);

describe('the sentences', () => {
  it('every source is named, every tone is named, the ids are unique', () => {
    for (const x of TEMPLATES) expect(Object.keys(SOURCE_NAME), x.id).toContain(x.src);
    for (const src of Object.keys(SOURCE_NAME).filter((k) => k !== 'quote')) expect(TEMPLATES.some((x) => x.src === src), src).toBe(true);
    for (const x of TEMPLATES) expect(TONES, x.id).toContain(x.ton);
    expect(Object.keys(TONE_NAME).sort()).toEqual([...TONES].sort());
    expect(new Set(TEMPLATES.map((x) => x.id)).size).toBe(TEMPLATES.length);
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(25);
  });
  it('every name and every «Warum?» text has a German entry', () => {
    for (const k of [...Object.values(TONE_NAME), ...Object.values(SOURCE_NAME)]) expect(DE[k], k).toBeTruthy();
    const c = ctx({
      forecast: forecast({ wet: (h) => h < 12 }),
      rows: rows({ azm: 40, todaySleep: 500, todayRhr: 52 }),
      trip: { startDate: day(3), name: 'Alpen' },
      packed: { packed: 3, of: 4 },
      fog: { now: { top: 904 }, above: 'sun' },
    });
    for (const x of fitting(c)) expect(DE[x.why.key], x.why.key).toBeTruthy();
    // the keys written out in the templates are all German too
    for (const x of TEMPLATES) {
      const src = x.make.toString();
      for (const m of src.matchAll(/key: '([^']+)'/g)) expect(DE[m[1]], m[1]).toBeTruthy();
    }
  });
  it('the sentences are Bernese German: fixed text, no English key', () => {
    const c = ctx({ forecast: forecast({ wet: (h) => h < 14, min: 2 }), rows: rows({ azm: 60 }), trip: { startDate: day(10), name: 'Alpen' }, packed: { packed: 1, of: 2 } });
    for (const x of fitting(c)) {
      expect(x.text.length).toBeGreaterThan(20);
      expect(x.text).not.toMatch(/\{[a-z]+\}/); // no placeholder left
      expect(x.text).not.toContain('undefined');
      expect(x.text).not.toContain('NaN');
    }
  });
});

describe('weather', () => {
  it('rain until the dry hour, said with the Bernese clock («am zwöi»)', () => {
    const c = ctx({ hour: 9, forecast: forecast({ wet: (h) => h >= 6 && h < 14 }) });
    const x = fitting(c).find((y) => y.id === 'w.rain-until');
    expect(x.text).toContain('Bis am zwöi rägnets');
    expect(x.why.vars.h).toBe(14);
    expect(ids(ctx({ hour: 9, forecast: forecast({ wet: (h) => h >= 6 && h < 14 || h === 19 }) }))).not.toContain('w.rain-until'); // wet again later
    expect(ids(ctx({ hour: 15, forecast: forecast({ wet: (h) => h >= 6 && h < 14 }) }))).not.toContain('w.rain-until');
  });
  it('dry and mild, cold morning (a challenge), fog with sun above, none after 18:00', () => {
    expect(ids(ctx({ forecast: forecast({ max: 14 }) }))).toContain('w.dry-mild');
    expect(ids(ctx({ forecast: forecast({ max: 7 }) }))).not.toContain('w.dry-mild');
    const cold = fitting(ctx({ forecast: forecast({ min: -2 }) })).find((y) => y.id === 'w.cold-morning');
    expect(cold.text).toContain('Minus 2 Grad');
    expect(ids(ctx({ forecast: forecast({ min: 5 }) }))).not.toContain('w.cold-morning');
    const fog = fitting(ctx({ fog: { now: { top: 904 }, above: 'sun' } })).find((y) => y.id === 'w.fog-sun');
    expect(fog.text).toContain('ab 900 m Sunne');
    expect(ids(ctx({ fog: { now: { top: 904 }, above: 'cloud' } }))).not.toContain('w.fog-sun');
    expect(ids(ctx({ hour: 19, forecast: forecast({ min: -2, max: 14 }), fog: { now: { top: 900 }, above: 'sun' } })).filter((i) => i.startsWith('w.'))).toEqual([]);
  });
  it('without a forecast no weather sentence', () => {
    expect(ids(ctx()).filter((i) => i.startsWith('w.'))).toEqual([]);
  });
});

describe('zone minutes', () => {
  it('the week so far against the goal, said by the week day', () => {
    const c = (o) => ctx({ rows: rows({ azm: 15, days: 14 }), ...o });
    const close = fitting(c({ goal: 100 })).find((y) => y.id === 'a.close'); // Mon+Tue+Wed = 45 of 100: rest 55
    expect(close.text).toMatch(/^45 vo 100 Zonenminute hesch scho\. Bis Sunntig fähle no 55/);
    expect(fitting(c({ goal: 100, weekday: 7 })).find((y) => y.id === 'a.close').text).toContain('Hüt bis zum Abe');
    expect(ids(c({ goal: 140 }))).toContain('a.close'); // rest 95 is under 100
    expect(ids(c({ goal: 150 }))).not.toContain('a.close'); // rest 105: too far
    expect(ids(c({ goal: 200 }))).not.toContain('a.close');
    expect(ids(c({ goal: 40 }))).toContain('a.goal');
    expect(ids(c({ goal: 40 }))).not.toContain('a.more');
    expect(ids(c({ goal: 150 }))).toContain('a.more');
  });
  it('a new week only on Monday and Tuesday; nothing without a connected watch', () => {
    expect(ids(ctx({ weekday: 1, rows: rows({ azm: 15 }) }))).toContain('a.new-week');
    expect(ids(ctx({ weekday: 4, rows: rows({ azm: 15 }) }))).not.toContain('a.new-week');
    expect(ids(ctx({ weekday: 1, rows: [] })).filter((i) => i.startsWith('a.'))).toEqual([]);
  });
});

describe('sleep and resting pulse: observation only, against the own normal', () => {
  it('more sleep, less sleep, pulse higher, pulse lower', () => {
    const more = fitting(ctx({ rows: rows({ todaySleep: 490 }) })).find((y) => y.id === 'b.sleep-more');
    expect(more.text).toBe('8 h 10 gschlafe, 40 Minute meh aus dys Normal. Das merkt me ofte erscht ungerwägs.');
    const less = fitting(ctx({ rows: rows({ todaySleep: 400 }) })).find((y) => y.id === 'b.sleep-less');
    expect(less.text).toContain('6 h 40 gschlafe, 50 Minute weniger aus dys Normal');
    expect(ids(ctx({ rows: rows({ todaySleep: 430 }) })).filter((i) => i.startsWith('b.'))).toEqual([]); // 20 min under: nothing to say
    expect(fitting(ctx({ rows: rows({ todayRhr: 59 }) })).find((y) => y.id === 'b.rhr-high').text).toContain('4 Schläg höcher');
    expect(fitting(ctx({ rows: rows({ todayRhr: 51 }) })).find((y) => y.id === 'b.rhr-low').text).toContain('4 Schläg tiefer');
  });
  it('no cause and no advice in what a sentence says (words that would give advice or name a cause)', () => {
    const c = ctx({ rows: rows({ todaySleep: 380, todayRhr: 60 }) });
    for (const x of fitting(c, { ton: 'ruhig' })) expect(x.text, x.id).not.toMatch(/krank|Infekt|Stress|solltsch|muesch|Arzt|Rueh dich|usruese/i);
  });
  it('needs at least 7 days for the normal; last night and today only', () => {
    expect(recoveryOf(rows({ days: 5 }), TODAY).state).toBe('unknown');
    const old = rows({ todaySleep: 300 }).filter((r) => r.date < day(-3)); // the last row is 4 days old
    expect(recoveryOf(old, TODAY).sleep).toBeNull();
  });
});

describe('recovery decides on a challenge', () => {
  it('off = sleep 40 min under the normal or the pulse 3 over; more sleep or a lower pulse is not off', () => {
    expect(recoveryOf(rows({ todaySleep: 400 }), TODAY).state).toBe('off');
    expect(recoveryOf(rows({ todayRhr: 58 }), TODAY).state).toBe('off');
    expect(recoveryOf(rows({ todaySleep: 520, todayRhr: 50 }), TODAY).state).toBe('normal');
    expect(recoveryOf(rows({}), TODAY).state).toBe('normal');
    expect(recoveryOf([], TODAY).state).toBe('unknown');
  });
  it('on an off day no challenge sentence can fit or be chosen, however often it is asked', () => {
    const base = { forecast: forecast({ min: -2 }), trip: { startDate: day(4), name: 'Alpen' }, packed: { packed: 1, of: 2 } };
    const good = ctx({ ...base, rows: rows({ azm: 15 }) });
    const off = ctx({ ...base, rows: rows({ azm: 15, todaySleep: 380 }) });
    const chal = TEMPLATES.filter((x) => x.ton === 'chal').map((x) => x.id);
    expect(chal.some((id) => ids(good).includes(id))).toBe(true);
    for (const id of chal) expect(ids(off), id).not.toContain(id);
    for (let i = 0; i < 40; i++) expect(pickSpruch(off, null, { rand: () => (i % 10) / 10 }).ton).not.toBe('chal');
    // no data at all: nothing is off, a challenge may come
    expect(ids(ctx({ ...base })).some((id) => chal.includes(id))).toBe(true);
  });
});

describe('the next trip', () => {
  it('far away, near and not packed, packed, tomorrow', () => {
    const t = (n, p) => ctx({ trip: { startDate: day(n), name: 'Alpenpässe' }, packed: { packed: p, of: 10 } });
    expect(fitting(t(21, 4)).find((y) => y.id === 't.far').text).toBe('I 21 Täg geit’s los. S’Gepäck isch zu 40 % packet, dr Räscht isch Vorfreud.');
    expect(fitting(t(4, 7)).find((y) => y.id === 't.near').text).toBe('No 4 Täg bis Alpenpässe. 70 % packet: schaffsch dr Räscht hüt no?');
    expect(ids(t(4, 10))).toContain('t.packed');
    expect(ids(t(4, 10))).not.toContain('t.near');
    expect(ids(t(1, 3))).toEqual(['t.tomorrow', 't.tomorrow~2']); // two wordings
    expect(ids(ctx({ trip: { startDate: day(21), name: 'x' }, packed: null })).filter((i) => i.startsWith('t.'))).toEqual([]);
    expect(ids(ctx({ trip: { startDate: day(-1), name: 'x' }, packed: { packed: 1, of: 2 } })).filter((i) => i.startsWith('t.'))).toEqual([]);
  });
});

describe('never the same twice', () => {
  const rich = ctx({
    forecast: forecast({ wet: (h) => h >= 6 && h < 14, min: 2 }),
    rows: rows({ azm: 15 }).map((r) => ({ ...r, steps: 9000 })),
    trip: { startDate: day(21), name: 'Alpen' },
    packed: { packed: 4, of: 10 },
    fog: { now: { top: 900 }, above: 'sun', clearing: { kind: 'clears', hour: 13 } },
    series: { n: 4, next: 6, left: 2 },
    km: { now: 1010, week: 960 },
    ago: { title: 'Alpenpässe' },
    quotes: QUOTES3,
  });
  it('the history keeps 30, the newest first, one entry per sentence', () => {
    let rec = null;
    for (let i = 0; i < 40; i++) rec = remember(rec, { id: `x${i}`, src: 'weather', ton: 'mot' });
    expect(rec.recent).toHaveLength(HISTORY_MAX);
    expect(rec.recent[0].id).toBe('x39');
    expect(remember(rec, { id: 'x39', src: 'weather', ton: 'mot' }).recent).toHaveLength(HISTORY_MAX);
    expect(spruchOf(null)).toEqual({ recent: [], off: [] });
    expect(spruchOf({ recent: [null, { id: 3 }, { id: 'a' }], off: ['b', 4] })).toEqual({ recent: [{ id: 'a', src: '', ton: '' }], off: ['b'] });
  });
  it('one after the other: never the one just shown, never the same source twice while another one not shown lately fits', () => {
    let rec = null;
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    let last = null;
    for (let i = 0; i < 365; i++) {
      const p = pickSpruch(rich, rec, { rand });
      expect(p, `day ${i}`).not.toBeNull();
      if (last) {
        expect(p.id).not.toBe(last.id);
        const recent = new Set(rec.recent.map((x) => x.id));
        const others = fitting(rich).filter((x) => x.src !== last.src && x.src !== 'quote' && !recent.has(x.id)); // not shown lately (quotes have their own rhythm)
        if (others.length) expect(p.src, `day ${i}`).not.toBe(last.src);
      }
      rec = remember(rec, p);
      last = p;
    }
  });
  it('none of the last shown comes again while another one fits; when all were shown, the oldest is let free', () => {
    const all = fitting(rich).map((x) => x.id);
    let rec = null;
    const shown = [];
    let seed = 3;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = 0; i < all.length * 3; i++) {
      const p = pickSpruch(rich, rec, { rand });
      // in every round of `all.length` picks each sentence shows exactly once
      const round = shown.slice(Math.floor(i / all.length) * all.length);
      expect(round, `pick ${i}`).not.toContain(p.id);
      shown.push(p.id);
      rec = remember(rec, p);
    }
    expect(new Set(shown.slice(0, all.length)).size).toBe(all.length);
  });
  it('«New» leaves out the one on the screen; a sentence switched off does not come; one tone only', () => {
    const p = pickSpruch(rich, null, { rand: () => 0 });
    for (let i = 0; i < 20; i++) expect(baseId(pickSpruch(rich, null, { rand: () => i / 20, not: p.id }).id)).not.toBe(baseId(p.id)); // not even the other wording
    const only = fitting(rich, { ton: 'vision' }).map((x) => x.id);
    expect(only.length).toBeGreaterThan(0);
    expect(pickSpruch(rich, { off: only }, { ton: 'vision' })).toBeNull();
    expect(pickSpruch(rich, null, { ton: 'vision', rand: () => 0.99 }).ton).toBe('vision');
  });
  it('nothing fits: null (the tile says why it is empty)', () => {
    expect(pickSpruch(ctx(), null)).toBeNull();
  });
});

describe('the pieces are listed', () => {
  it('TEMPLATE finds every id', () => {
    for (const x of TEMPLATES) expect(TEMPLATE[x.id]).toBe(x);
  });
});

describe('PR 2: second wordings', () => {
  it('every template that fits gives a second wording «id~2», with the same source, tone and Warum-text', () => {
    const rich = ctx({
      forecast: forecast({ wet: (h) => h >= 6 && h < 14, min: -2 }),
      rows: rows({ azm: 60, todaySleep: 520, todayRhr: 50 }).map((r) => ({ ...r, steps: 13000 })),
      trip: { startDate: day(21), name: 'Alpen' },
      packed: { packed: 4, of: 10 },
      fog: { now: { top: 900 }, above: 'sun', clearing: { kind: 'clears', hour: 13 } },
      series: { n: 4, next: 6, left: 2 },
      km: { now: 1010, week: 960 },
      ago: { title: 'Alpenpässe' },
    });
    // a second context for the sentences that exclude the first one (little sleep, a trip near and not packed, a trip tomorrow, ...)
    const rich2 = ctx({
      forecast: forecast({ max: 14 }),
      rows: rows({ azm: 125, todaySleep: 390, todayRhr: 60 }).map((r) => ({ ...r, steps: 9000 })),
      trip: { startDate: day(1), name: 'Alpen' },
      packed: { packed: 10, of: 10 },
      weekday: 7,
    });
    const rich3 = ctx({ forecast: forecast({ min: 6, max: 14 }), rows: rows({ azm: 30, todaySleep: 450, todayRhr: 55 }), trip: { startDate: day(4), name: 'Alpen' }, packed: { packed: 5, of: 10 }, weekday: 1, hour: 9 });
    const all = [...fitting(rich), ...fitting(rich2), ...fitting(rich3)];
    const base = all.filter((x) => !x.id.includes('~'));
    expect(new Set(base.map((x) => x.id)).size).toBeGreaterThan(20);
    for (const x of base) {
      const alt = all.find((y) => y.id === `${x.id}~2`);
      expect(alt, x.id).toBeTruthy();
      expect(alt.text, x.id).not.toBe(x.text);
      expect([alt.src, alt.ton, alt.why.key], x.id).toEqual([x.src, x.ton, x.why.key]);
      expect(alt.text.length).toBeGreaterThan(20);
      expect(alt.text).not.toMatch(/\{[a-z]+\}|undefined|NaN/);
    }
  });
  it('the sentences have no cause and no advice about health either in the second wording', () => {
    const c = ctx({ rows: rows({ todaySleep: 380, todayRhr: 60 }).map((r) => ({ ...r, steps: 13000 })), series: { n: 3, next: 4, left: 1 } });
    for (const x of fitting(c, { ton: 'ruhig' })) expect(x.text, x.id).not.toMatch(/krank|Infekt|Stress|solltsch|muesch|Arzt|Rueh dich|usruese/i);
  });
});

describe('PR 2: steps, weeks in a row, bike km, a year ago, the fog clearing', () => {
  const withSteps = (y, t, normal = 8000) =>
    rows({ days: 20 }).map((r) => ({ ...r, steps: r.date === day(-1) ? y : r.date === TODAY ? t : normal }));
  it('steps: yesterday 12000 or more, more than the normal, today so far (before 15:00)', () => {
    const y = fitting(ctx({ rows: withSteps(13200, null) })).find((x) => x.id === 's.yesterday');
    expect(y.text).toBe('Geschter 13200 Schritt. Dr Schrittzähler het gmeint, är müess ufpasse.');
    expect(ids(ctx({ rows: withSteps(11000, null) }))).toContain('s.more-than-usual');
    expect(fitting(ctx({ rows: withSteps(11000, null) })).find((x) => x.id === 's.more-than-usual').text).toContain('3000 meh aus dys Normal');
    expect(ids(ctx({ rows: withSteps(9000, null) })).filter((i) => i.startsWith('s.'))).toEqual([]); // only 1000 over the normal: nothing to say
    expect(ids(ctx({ rows: withSteps(13200, null) }))).not.toContain('s.more-than-usual'); // the sentence for yesterday goes first
    expect(fitting(ctx({ rows: withSteps(null, 6500) })).find((x) => x.id === 's.today').text).toContain('Scho 6500 Schritt hüt');
    expect(ids(ctx({ hour: 16, rows: withSteps(null, 6500) }))).not.toContain('s.today');
    expect(ids(ctx({ rows: rows({}) })).filter((i) => i.startsWith('s.'))).toEqual([]); // no steps in the days
  });
  it('weeks in a row: from 2 weeks; the next goal within 2 weeks is a challenge', () => {
    expect(fitting(ctx({ series: { n: 3, next: 8, left: 5 } })).find((x) => x.id === 'e.run').text).toContain('3 Wuche hinterenang');
    expect(ids(ctx({ series: { n: 1, next: 4, left: 3 } })).filter((i) => i.startsWith('e.'))).toEqual([]);
    expect(ids(ctx({ series: { n: 3, next: 4, left: 1 } }))).toContain('e.next');
    expect(ids(ctx({ series: { n: 3, next: 8, left: 5 } }))).not.toContain('e.next');
    expect(ids(ctx({ series: null })).filter((i) => i.startsWith('e.'))).toEqual([]);
    // a week off the own normal: no challenge
    expect(ids(ctx({ series: { n: 3, next: 4, left: 1 }, rows: rows({ todaySleep: 380 }) }))).not.toContain('e.next');
  });
  it('bike km: a mark reached in the last 7 days, or a mark within 60 km', () => {
    expect(KM_MARKS).toEqual([...KM_MARKS].sort((a, b) => a - b));
    expect(fitting(ctx({ km: { now: 1010, week: 960 } })).find((x) => x.id === 'v.milestone').text).toContain('D’1000 km-Marke isch gschafft: 1010 km');
    expect(ids(ctx({ km: { now: 1010, week: 1005 } }))).not.toContain('v.milestone'); // reached before the last 7 days
    expect(fitting(ctx({ km: { now: 940, week: 900 } })).find((x) => x.id === 'v.close').text).toContain('No 60 km bis 1000 Velo-Kilometer');
    expect(ids(ctx({ km: { now: 900, week: 850 } }))).not.toContain('v.close'); // 100 km away
    expect(ids(ctx({ km: { now: 0, week: 0 } })).filter((i) => i.startsWith('v.'))).toEqual([]);
    expect(ids(ctx({ km: null })).filter((i) => i.startsWith('v.'))).toEqual([]);
  });
  it('a year ago: the trip around this day; the fog clearing today', () => {
    expect(fitting(ctx({ ago: { title: 'Alpenpässe' } })).find((x) => x.id === 'j.ago').text).toContain('Vor emene Jahr isch Alpenpässe dra gsi');
    expect(ids(ctx({ ago: null })).filter((i) => i.startsWith('j.'))).toEqual([]);
    const f = (clearing, hour = 9) => ctx({ hour, fog: { now: { top: 900 }, above: 'cloud', clearing } });
    expect(fitting(f({ kind: 'clears', hour: 13 })).find((x) => x.id === 'w.fog-clears').text).toContain('am eis');
    expect(ids(f({ kind: 'stays' }))).not.toContain('w.fog-clears');
    expect(ids(f({ kind: 'clears', hour: 8 }))).not.toContain('w.fog-clears'); // already past
    expect(ids(f({ kind: 'clears', hour: 20 }, 19))).not.toContain('w.fog-clears');
  });
});

describe('PR 2: the quotes of «Kissenzeit»', () => {
  const q = ctx({ quotes: QUOTES3 });
  it('a quote is High German as written, with the author, and has the language «de»', () => {
    const z = fitting(q).filter((x) => x.src === 'quote');
    expect(z.map((x) => x.id)).toEqual(['z.q1', 'z.q2', 'z.own1']);
    expect(z[0].text).toBe('«Eine Reise von tausend Meilen beginnt unter deinen Füssen.» – Laozi');
    expect(z[2].text).toBe('«Heute zählt der erste Schritt.»'); // an own quote without an author
    for (const x of z) expect([x.lang, x.ton, DE[x.why.key]].map(Boolean)).toEqual([true, true, true]);
    expect(fitting(q).find((x) => x.id === 'z.q1').lang).toBe('de');
    expect(fitting(ctx({ rows: rows({}) })).every((x) => x.lang === 'gsw')).toBe(true);
  });
  it('without any number the quotes come, so the tile is not empty; with no quote on it is empty again', () => {
    expect(pickSpruch(q, null).src).toBe('quote');
    expect(pickSpruch(ctx(), null)).toBeNull();
  });
  it('with numbers: no quote at first, then one as every 4th sentence, never twice in a row', () => {
    const c = ctx({ rows: rows({ azm: 15 }).map((r) => ({ ...r, steps: 9000 })), forecast: forecast({ wet: (h) => h >= 6 && h < 14, min: 2 }), trip: { startDate: day(21), name: 'Alpen' }, packed: { packed: 4, of: 10 }, quotes: QUOTES3 });
    let rec = null;
    let seed = 11;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const srcs = [];
    for (let i = 0; i < 24; i++) {
      const p = pickSpruch(c, rec, { rand });
      srcs.push(p.src);
      rec = remember(rec, p);
    }
    expect(srcs.slice(0, 3)).not.toContain('quote');
    expect(srcs.filter((x) => x === 'quote').length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < srcs.length; i++) expect(srcs[i] === 'quote' && srcs[i - 1] === 'quote', `pick ${i}`).toBe(false);
    for (let i = 0; i + 3 < srcs.length; i++) expect(srcs.slice(i, i + 4).filter((x) => x === 'quote').length, `window ${i}`).toBeLessThanOrEqual(1);
  });
  it('a quote switched off (off list) does not come, and «New» does not give the other wording of the same sentence', () => {
    expect(pickSpruch(q, { off: ['z.q1', 'z.q2', 'z.own1'] })).toBeNull();
    const c = ctx({ forecast: forecast({ max: 14 }) });
    expect(ids(c)).toEqual(['w.dry-mild', 'w.dry-mild~2']);
    expect(pickSpruch(c, null, { not: 'w.dry-mild', rand: () => 0 })).toBeNull();
    expect(baseId('w.dry-mild~2')).toBe('w.dry-mild');
  });
});
