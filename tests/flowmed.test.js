// Hobby pages 2 «Kissenzeit» (B1, B2, B7): kinds, templates, «Wie letztes Mal», history and streaks,
// the challenge (H12a: only near the best time, at most one a day), links, the session records and the
// quotes (own translations, H28a). Days are calendar days; fictional data only.
import { describe, it, expect } from 'vitest';
import { ARTS, FAV_ARTS, artsOf, addArt, toggleFavArt, SEED_TEMPLATES, seedTemplates, tplOf, sortTemplates, bowlWords, lastSession, recentSessions, daysGrid, streaks, weekMinutes, challenge, choiceList, PLACES, placeCounts, linkOf, linksOf, sessionPlan, sessionRecords } from '../src/lib/flowmed.js';
import { startTimer, elapsedSec } from '../src/lib/flowtimer.js';
import { QUOTES, quotesOf, quoteSet, quoteOfDay } from '../src/lib/flowquotes.js';
import { msContext, actMilestones, evaluate } from '../src/lib/flowms.js';
import { seedActs } from '../src/lib/flow.js';
import { localDay } from '../src/lib/localday.js';

const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TODAY = '2026-10-09';
const e = (day, min, i = 0) => ({ id: `test_${day}_${i}`, actId: 'meditation', day, at: `${day}T05:10:00.000Z`, n: 1, min });

describe('kinds', () => {
  it('twelve as a start, four favourites, own ones added and toggled', () => {
    expect(ARTS).toHaveLength(12);
    expect(ARTS.map((a) => a.id)).toEqual(expect.arrayContaining(['omahhung', 'aware', 'count', 'sit']));
    expect(artsOf(null).favs).toEqual(FAV_ARTS);
    const v = addArt(null, '  Stille am See  ', Date.parse('2026-10-09T08:00:00Z'));
    const s = artsOf(v);
    expect(s.all).toHaveLength(13);
    expect(s.own[0].name).toBe('Stille am See');
    expect(s.favs.at(-1)).toBe(s.own[0].id);
    expect(addArt(null, '   ').own).toEqual([]);
    expect(artsOf(toggleFavArt(null, 'count')).favs).not.toContain('count');
    expect(artsOf(toggleFavArt(null, 'metta')).favs).toContain('metta');
    expect(artsOf({ favs: ['gone', 'sit'] }).favs).toEqual(['sit']);
  });
});

describe('templates', () => {
  it('three suggestions with fictional names; a stored one made whole', () => {
    expect(SEED_TEMPLATES).toHaveLength(3);
    const s = seedTemplates();
    expect(s.map((x) => x.minutes)).toEqual([30, 45, 20]);
    expect(s[1].bowl.marks.map((m) => m.sec)).toEqual([180, 600, 1110, 1800, 2520]);
    const x = tplOf({ id: 'test_t', name: ' Kurz ', minutes: 0.4, bowl: { mode: 'marks', marks: [2] }, sound: 'nope' });
    expect(x).toMatchObject({ name: 'Kurz', minutes: 1, sound: 'bowlHigh', endSound: 'bowlLow', bowl: { mode: 'marks', marks: [{ sec: 120 }] } });
  });
  it('the last used first; the line says what sounds', () => {
    const list = sortTemplates([tplOf({ id: 'a', name: 'A' }), tplOf({ id: 'b', name: 'B', usedAt: '2026-10-08T05:00:00Z' }), tplOf({ id: 'c', name: 'C', usedAt: '2026-10-09T05:00:00Z' })]);
    expect(list.map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(bowlWords({ mode: 'every', every: 5 })).toEqual({ key: 'every {t}', vars: { t: '5:00' } });
    expect(bowlWords({ mode: 'marks', marks: [{ sec: 60 }, { sec: 120 }] }).vars.n).toBe(2);
    expect(bowlWords({ mode: 'none' }).key).toBe('only start and end');
    expect(bowlWords({ mode: 'random', count: 3 }).vars.n).toBe(3);
  });
});

describe('«Wie letztes Mal», the log', () => {
  it('the newest session with its details; without one the newest entry with minutes', () => {
    const sessions = [
      { id: 's1', actId: 'meditation', at: '2026-10-08T05:00:00Z', day: '2026-10-08', min: 30, target: 30, art: 'omahhung', tplId: 'tpl-oah30', bowl: { mode: 'every', every: 5 }, sound: 'bowlLow', endSound: 'gong' },
      { id: 's0', actId: 'meditation', at: '2026-10-01T05:00:00Z', day: '2026-10-01', min: 20, art: 'count' },
    ];
    const l = lastSession(sessions, [], 'meditation');
    expect(l).toMatchObject({ min: 30, art: 'omahhung', tplId: 'tpl-oah30', endSound: 'gong', target: 30 });
    expect(l.bowl.mode).toBe('every');
    expect(lastSession([], [e('2026-10-02', 25), e('2026-10-05', 15)], 'meditation')).toMatchObject({ min: 15, art: null });
    expect(lastSession([], [], 'meditation')).toBeNull();
    const r = recentSessions([e('2026-10-02', 25), e('2026-10-05', 15)], [{ id: 'test_2026-10-05_0', art: 'sit' }], 'meditation');
    expect(r.map((x) => x.e.min)).toEqual([15, 25]);
    expect(r[0].s.art).toBe('sit');
  });
});

describe('history: four weeks, streaks, minutes per week', () => {
  it('the grid and the streaks over a month change; today may still come', () => {
    const log = [0, 1, 2, 3, 4, 5].map((i) => e(addDays(TODAY, -1 - i), 20)).concat([e('2026-09-20', 10), e('2026-09-21', 10)]);
    const g = daysGrid(log, 'meditation', TODAY, 28);
    expect(g).toHaveLength(28);
    expect(g.at(-1)).toMatchObject({ day: TODAY, on: false });
    expect(g.at(-2)).toMatchObject({ on: true, min: 20 });
    expect(streaks(log, 'meditation', TODAY)).toEqual({ now: 6, longest: 6 });
    expect(streaks(log, 'meditation', addDays(TODAY, 2)).now).toBe(0); // two days without: broken
    // across the turn of the year
    const y = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'].map((d) => e(d, 10));
    expect(streaks(y, 'meditation', '2027-01-02')).toEqual({ now: 4, longest: 4 });
  });
  it('minutes per week (Monday on), across the clock change on 25.10.2026', () => {
    const log = [e('2026-10-19', 20), e('2026-10-25', 30), e('2026-10-26', 15)];
    const w = weekMinutes(log, 'meditation', '2026-10-27', 3);
    expect(w).toEqual([
      { week: '2026-10-12', min: 0 },
      { week: '2026-10-19', min: 50 },
      { week: '2026-10-26', min: 15 },
    ]);
  });
});

describe('the challenge (H12a)', () => {
  const near = [e(addDays(TODAY, -20), 40), e(addDays(TODAY, -10), 35), e(addDays(TODAY, -3), 30)];
  it('only near the best time: the next 5 minutes above the best', () => {
    expect(challenge({ log: near, today: TODAY })).toEqual({ target: 45, best: 40 });
    expect(challenge({ log: [e(addDays(TODAY, -2), 45), e(addDays(TODAY, -3), 40), e(addDays(TODAY, -4), 20)], today: TODAY })).toEqual({ target: 50, best: 45 });
  });
  it('not when the recent sessions are far from the best', () => {
    expect(challenge({ log: [e(addDays(TODAY, -40), 60), e(addDays(TODAY, -5), 20), e(addDays(TODAY, -3), 20)], today: TODAY })).toBeNull();
  });
  it('not with too little history or a short best', () => {
    expect(challenge({ log: near.slice(0, 2), today: TODAY })).toBeNull();
    expect(challenge({ log: [e('2026-10-01', 5), e('2026-10-02', 6), e('2026-10-03', 8)], today: TODAY })).toBeNull();
  });
  it('at most one a day: the same all day, gone when reached or put away today, back tomorrow', () => {
    const withToday = [...near, e(TODAY, 42)];
    expect(challenge({ log: withToday, today: TODAY })).toEqual({ target: 45, best: 40 }); // today does not move it
    expect(challenge({ log: [...near, e(TODAY, 45)], today: TODAY })).toBeNull();
    expect(challenge({ log: near, today: TODAY, seen: { day: TODAY, off: true } })).toBeNull();
    expect(challenge({ log: near, today: addDays(TODAY, 1), seen: { day: TODAY, off: true } })).toEqual({ target: 45, best: 40 });
  });
});

describe('places, links', () => {
  it('suggested places plus own ones; counts per place', () => {
    const c = choiceList({ own: ['Balkon'], hidden: ['retreat'], cur: 'own:Balkon' }, PLACES);
    expect(c.list.map((x) => x.id)).toEqual(['home', 'outside', 'away', 'own:Balkon']);
    expect(c.cur).toBe('own:Balkon');
    expect(choiceList({ cur: 'gone' }, PLACES).cur).toBeNull();
    expect(placeCounts([{ actId: 'meditation', place: 'home' }, { actId: 'meditation', place: 'home' }, { actId: 'yoga', place: 'home' }]).get('home')).toBe(2);
  });
  it('only http(s) addresses the user typed', () => {
    expect(linkOf('Eigene Anleitung', 'example.org/atem', 1)).toMatchObject({ title: 'Eigene Anleitung', url: 'https://example.org/atem' });
    expect(linkOf('', 'https://example.org', 1).title).toBe('example.org');
    expect(linkOf('x', 'javascript:alert(1)', 1)).toBeNull();
    expect(linkOf('x', '', 1)).toBeNull();
    expect(linksOf([{ id: 'a', title: 'A', url: 'https://example.org/' }, { id: 'b', url: 'ftp://x' }, null])).toHaveLength(1);
  });
});

describe('the session (B7)', () => {
  const t0 = Date.parse('2026-10-09T07:02:00+02:00');
  const plan = sessionPlan({ minutes: 20, bowl: { mode: 'marks', marks: [{ sec: 300 }, { sec: 600, sound: 'wood' }] }, sound: 'bowlHigh', endSound: 'gong', art: 'omahhung', tplId: 'tpl-oah30', name: 'Morgen 20', place: 'home' });
  const tm = { ...startTimer({ actId: 'meditation', minutes: plan.minutes, bowl: plan.bowl, now: t0 }), ...plan.extra };
  const day = (ms) => localDay(new Date(ms));
  it('the plan carries the marks, sounds and facts', () => {
    expect(tm.bowls).toEqual([0, 300, 600, 1200]);
    expect(tm.session).toMatchObject({ art: 'omahhung', tplId: 'tpl-oah30', place: 'home' });
    expect(tm.endSound).toBe('gong');
  });
  it('a log entry and its details with the same id; saved twice, the same rows', () => {
    const now = t0 + 1200_000;
    const r = sessionRecords(tm, elapsedSec(tm, now), now, day);
    expect(r.entry).toMatchObject({ actId: 'meditation', day: '2026-10-09', n: 1, min: 20, via: 'timer' });
    expect(r.session.id).toBe(r.entry.id);
    expect(r.session).toMatchObject({ min: 20, target: 20, art: 'omahhung', tplId: 'tpl-oah30', place: 'home', sound: 'bowlHigh', endSound: 'gong' });
    expect(r.session.marks).toEqual([{ sec: 300 }, { sec: 600, sound: 'wood' }]);
    expect(sessionRecords(tm, elapsedSec(tm, now), now + 5000, day).entry.id).toBe(r.entry.id);
  });
  it('ended early: what ran; under a minute nothing', () => {
    const r = sessionRecords(tm, 7 * 60 + 20, t0 + 440_000, day);
    expect(r.entry.min).toBe(7);
    expect(r.session.target).toBe(20);
    expect(sessionRecords(tm, 40, t0 + 40_000, day)).toBeNull();
    expect(sessionRecords({ ...tm, session: undefined }, 600, t0, day)).toBeNull();
  });
  it('a saved session counts for the milestones (sessions, longest, morning)', () => {
    const acts = seedActs();
    const r = sessionRecords(tm, 1200, t0 + 1200_000, day);
    const ctx = msContext({ acts, log: [r.entry], sessions: [r.session], today: '2026-10-09' });
    const ms = actMilestones(acts.find((a) => a.id === 'meditation'));
    const val = (id) => evaluate(ms.find((m) => m.id === `meditation.${id}`), ctx).value;
    expect(val('devoted')).toBe(1);
    expect(val('deeper')).toBe(20);
    expect(val('morning')).toBe(1); // 07:02 in Zurich
    expect(val('variety')).toBe(1);
  });
});

describe('quotes (own translations)', () => {
  it('five on by default, six as suggestions, all with their source and original', () => {
    expect(QUOTES).toHaveLength(11);
    const q = quotesOf(null, true);
    expect(q.shown).toHaveLength(5);
    expect(q.sugg).toHaveLength(6);
    expect(q.shown[1].text).toBe('Eine Reise von tausend Meilen beginnt unter deinen Füssen.');
    expect(quotesOf(null, false).shown[1].text).toBe('A journey of a thousand miles begins beneath your feet.');
    for (const x of QUOTES) expect(x.orig && x.de && x.en && x.source && x.author).toBeTruthy();
    expect(QUOTES.every((x) => !/ß/.test(x.de))).toBe(true);
  });
  it('left out, added, own ones; one per day', () => {
    const q = quotesOf({ off: ['pascal-139'], add: ['laozi-16'], own: [{ id: 'own1', text: 'Erfundener Satz', source: 'Ich' }, { id: 'x', text: '  ' }] });
    expect(q.shown.map((x) => x.id)).toEqual(['aurel-5-16', 'laozi-64', 'epiktet-5', 'seneca-104', 'laozi-16', 'own1']);
    expect(q.sugg).toHaveLength(5);
    expect(q.off).toBe(1);
    expect(quoteSet({ own: [{ text: '' }] }).own).toEqual([]);
    const a = quoteOfDay(q.shown, '2026-10-09');
    expect(quoteOfDay(q.shown, '2026-10-09')).toBe(a);
    expect(quoteOfDay(q.shown, '2026-10-10')).not.toBe(a);
    expect(quoteOfDay([], '2026-10-10')).toBeNull();
  });
});
