// «Spruch zum Einstieg» PR 1 (Noah 07.11.2026 «Bau spruch pr1»): the sentences, the recovery rule, the history.
import { describe, it, expect } from 'vitest';
import { TEMPLATES, TEMPLATE, TONES, TONE_NAME, SOURCE_NAME, HISTORY_MAX, spruchOf, remember, recoveryOf, contextOf, fitting, pickSpruch } from '../src/lib/home/spruch.js';
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
const ctx = (o = {}) => contextOf({ today: TODAY, hour: 9, weekday: 3, ...o });
const ids = (c, o) => fitting(c, o).map((x) => x.id);

describe('the 16 sentences', () => {
  it('four sources with four sentences each, every tone is named', () => {
    expect(TEMPLATES).toHaveLength(16);
    for (const src of Object.keys(SOURCE_NAME)) expect(TEMPLATES.filter((x) => x.src === src), src).toHaveLength(4);
    for (const x of TEMPLATES) expect(TONES, x.id).toContain(x.ton);
    expect(Object.keys(TONE_NAME).sort()).toEqual([...TONES].sort());
    expect(new Set(TEMPLATES.map((x) => x.id)).size).toBe(16);
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
    expect(ids(t(1, 3))).toEqual(['t.tomorrow']);
    expect(ids(ctx({ trip: { startDate: day(21), name: 'x' }, packed: null })).filter((i) => i.startsWith('t.'))).toEqual([]);
    expect(ids(ctx({ trip: { startDate: day(-1), name: 'x' }, packed: { packed: 1, of: 2 } })).filter((i) => i.startsWith('t.'))).toEqual([]);
  });
});

describe('never the same twice', () => {
  const rich = ctx({
    forecast: forecast({ wet: (h) => h >= 6 && h < 14, min: 2 }),
    rows: rows({ azm: 15 }),
    trip: { startDate: day(21), name: 'Alpen' },
    packed: { packed: 4, of: 10 },
    fog: { now: { top: 900 }, above: 'sun' },
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
        const others = fitting(rich).filter((x) => x.src !== last.src && !recent.has(x.id)); // not shown lately
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
    for (let i = 0; i < 20; i++) expect(pickSpruch(rich, null, { rand: () => i / 20, not: p.id }).id).not.toBe(p.id);
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
