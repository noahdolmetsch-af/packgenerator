// Hobby pages 2 «Kissenzeit» (B1, B2, B7): kinds, templates, «Wie letztes Mal», history and streaks,
// the challenge (H12a: only near the best time, at most one a day), links, the session records and the
// quotes (own translations, H28a); hobby pages 3 (B3–B6): the note, the comparison, «Als Nächstes» with
// its calendar file, the log's filters, streaks and heatmap, the calendar, the time of day and the month
// comparison. Days are calendar days (Europe/Zurich); fictional data only.
import { describe, it, expect } from 'vitest';
import { ARTS, FAV_ARTS, artsOf, addArt, toggleFavArt, SEED_TEMPLATES, seedTemplates, tplOf, sortTemplates, bowlWords, lastSession, recentSessions, daysGrid, streaks, weekMinutes, challenge, choiceList, PLACES, placeCounts, linkOf, linksOf, sessionPlan, sessionRecords, MOODS, HELPED, noteOf, hasNote, toggleIn, compareSession, starsOfSession, zurichTime, nextUp, icsEvent, TOD, DUR, LOG_DEFAULT, durOf, todOf, filterOf, filterQuery, filterCount, monthAdd, rangeStart, logRows, filterRows, levelOf, heatmap, monthRun, weekendMinutes, doubleDays, monthCalendar, hourHistogram, deepestHours, monthCompare, artMinutes, durationBins } from '../src/lib/flowmed.js';
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

/* ---------- hobby pages 3 «Nach dem Gong» (B3–B6) ---------- */
// a session at a Zurich wall-clock time: summer time (+02:00) up to 24.10.2026, winter time (+01:00) after
const zoff = (day) => (day >= '2026-10-25' && day < '2027-03-28' ? '+01:00' : '+02:00');
const at = (day, hm) => new Date(`${day}T${hm}:00${zoff(day)}`).toISOString();
const se = (day, min, hm = '07:10', i = 0) => ({ id: `test_${day}_${hm}_${i}`, actId: 'meditation', day, at: at(day, hm), n: 1, min });

describe('the note after the gong (H23a)', () => {
  it('everything optional; a depth only 1–5; lists without doubles', () => {
    expect(MOODS.map((m) => m.id)).toEqual(expect.arrayContaining(['calm', 'clear', 'restless', 'tired']));
    expect(HELPED.length).toBeGreaterThanOrEqual(5);
    expect(noteOf(null)).toEqual({ note: '', depth: null, moods: [], helped: [] });
    expect(noteOf({ note: '  still  ', depth: 7, moods: ['calm', 'calm', '', 3], helped: ['own:Tee'] })).toEqual({ note: 'still', depth: null, moods: ['calm'], helped: ['own:Tee'] });
    expect(noteOf({ depth: '4' }).depth).toBe(4);
    expect(hasNote({ depth: 2 })).toBe(true);
    expect(hasNote({ note: '   ' })).toBe(false);
    expect(toggleIn(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleIn(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('the comparison and the stars of a session (B3, B5)', () => {
  it('against the average of the others, this week and last week, a new best', () => {
    const log = [se('2026-09-28', 20), se('2026-09-30', 40), se('2026-10-05', 30), se('2026-10-07', 45)];
    const c = compareSession(log, 'meditation', log[3].id, '2026-10-09');
    expect(c).toMatchObject({ min: 45, avg: 30, week: 75, lastWeek: 60, best: 40, isBest: true });
    expect(compareSession(log, 'meditation', log[2].id, '2026-10-09').isBest).toBe(false);
    expect(compareSession([se('2026-10-09', 10)], 'meditation', 'test_2026-10-09_07:10_0', '2026-10-09')).toMatchObject({ avg: null, best: null, isBest: false });
  });
  it('the star a session made reachable, on its day; an older session made none', () => {
    const acts = seedActs();
    const act = acts.find((a) => a.id === 'meditation');
    const log = Array.from({ length: 10 }, (_, i) => se(addDays('2026-09-20', i * 2), 15));
    const sessions = log.map((x) => ({ id: x.id, actId: 'meditation', day: x.day, at: x.at, min: x.min }));
    const won = starsOfSession({ act, acts, log, sessions, today: '2026-10-09' }, log[9].id);
    expect(won.map((w) => `${w.r.id}:${w.star}`)).toContain('meditation.devoted:1'); // the 10th session
    expect(starsOfSession({ act, acts, log, sessions, today: '2026-10-09' }, log[4].id).map((w) => w.r.id)).not.toContain('meditation.devoted');
    expect(starsOfSession({ act, acts, log, sessions, today: '2026-10-09' }, 'nope')).toEqual([]);
  });
});

describe('«Als Nächstes» and its calendar file (H24a)', () => {
  const tpls = [
    { id: 'tpl-a', name: 'Lang', minutes: 45, art: 'aware', usedAt: '2026-10-08T05:00:00Z' },
    { id: 'tpl-b', name: 'Kurz', minutes: 20, art: 'metta', usedAt: null },
  ];
  it('tomorrow at the same time; after a long session the shortest template, else the same again', () => {
    const log = [se('2026-10-01', 20), se('2026-10-03', 25), se('2026-10-10', 45, '06:52')];
    const s = { ...log[2], tplId: 'tpl-a', art: 'aware' };
    expect(zurichTime(s.at)).toBe('06:52');
    expect(nextUp({ log, tpls, session: s, today: '2026-10-10' })).toEqual({ day: '2026-10-11', time: '06:50', minutes: 20, tplId: 'tpl-b', art: 'metta', why: 'short' });
    const calm = [se('2026-10-01', 45), se('2026-10-03', 40), se('2026-10-10', 45, '06:52')];
    expect(nextUp({ log: calm, tpls, session: { ...calm[2], tplId: 'tpl-a', art: 'aware' }, today: '2026-10-10' })).toMatchObject({ minutes: 45, tplId: 'tpl-a', why: 'same' });
    // opened a day later: still the day after today; without a template the same duration
    expect(nextUp({ log: calm, tpls: [], session: { ...calm[2], target: 45 }, today: '2026-10-12' })).toMatchObject({ day: '2026-10-13', minutes: 45, tplId: null });
    expect(nextUp({ session: null })).toBeNull();
  });
  it('the time stays the wall clock across the clock change on 25.10.2026', () => {
    const s = se('2026-10-24', 20, '07:00');
    expect(nextUp({ log: [s], tpls: [], session: s, today: '2026-10-24' })).toMatchObject({ day: '2026-10-25', time: '07:00' });
    expect(zurichTime(at('2026-10-26', '07:00'))).toBe('07:00');
  });
  it('a calendar file in Zurich time with the zone rules, text escaped, over midnight', () => {
    const ics = icsEvent({ uid: 'med-1', title: 'Meditation · Metta, kurz; weich', day: '2026-10-11', time: '23:50', minutes: 20, now: Date.parse('2026-10-10T06:00:00Z') });
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;TZID=Europe/Zurich:20261011T235000');
    expect(ics).toContain('DTEND;TZID=Europe/Zurich:20261012T001000');
    expect(ics).toContain('SUMMARY:Meditation · Metta\\, kurz\\; weich');
    expect(ics).toContain('DTSTAMP:20261010T060000Z');
    expect(ics).toContain('TZID:Europe/Zurich');
    expect(ics).toContain('RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU');
  });
});

describe('the log: rows and filters (B4)', () => {
  const TODAY3 = '2026-10-28';
  const log = [
    se('2026-07-20', 30, '07:00'), // more than 3 months back (from 28.7.)
    se('2026-09-01', 15, '06:30'),
    se('2026-10-10', 45, '06:52'),
    se('2026-10-24', 20, '19:15'),
    se('2026-10-26', 35, '07:30'), // winter time
    se('2026-10-26', 10, '12:30', 1),
  ];
  const sessions = [
    { id: log[2].id, actId: 'meditation', art: 'aware', tplId: 'tpl-sit45', note: 'ab Minute 30 still', depth: 4 },
    { id: log[3].id, actId: 'meditation', art: 'metta', moods: ['tired'] },
    { id: log[4].id, actId: 'meditation', art: 'aware', depth: 5 },
  ];
  const rows = logRows(log, sessions, 'meditation');
  it('rows newest first, the hour in Zurich, the note joined', () => {
    expect(rows.map((r) => r.min)).toEqual([10, 35, 20, 45, 15, 30]);
    expect(rows[1].hour).toBe(7); // 07:30 winter time
    expect(rows[3]).toMatchObject({ art: 'aware', tplId: 'tpl-sit45', depth: 4, noted: true });
    expect(rows[0].noted).toBe(false);
  });
  it('the time of day and duration bins', () => {
    expect([0, 7, 8, 11, 12, 17, 18, 23].map(todOf)).toEqual(['early', 'early', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening']);
    expect(todOf(null)).toBeNull();
    expect([1, 15, 16, 30, 31, 45, 46, 120].map(durOf)).toEqual(['s', 's', 'm', 'm', 'l', 'l', 'xl', 'xl']);
    expect(TOD).toHaveLength(4);
    expect(DUR).toHaveLength(4);
  });
  it('each filter alone; the default period is 3 months on the calendar', () => {
    const f = (patch) => filterRows(rows, { ...LOG_DEFAULT, ...patch }, TODAY3).map((r) => r.min);
    expect(f({})).toEqual([10, 35, 20, 45, 15]);
    expect(f({ range: 'all' })).toEqual([10, 35, 20, 45, 15, 30]);
    expect(f({ art: 'aware' })).toEqual([35, 45]);
    expect(f({ dur: 'l' })).toEqual([35, 45]);
    expect(f({ dur: 's' })).toEqual([10, 15]);
    expect(f({ tod: 'early' })).toEqual([35, 45, 15]);
    expect(f({ tod: 'evening' })).toEqual([20]);
    expect(f({ tpl: 'tpl-sit45' })).toEqual([45]);
    expect(f({ note: true })).toEqual([35, 20, 45]);
    expect(f({ longest: true, range: 'all' })).toEqual([45, 35, 30, 20, 15, 10]);
    expect(f({ art: 'aware', note: true, longest: true })).toEqual([45, 35]);
    expect(rangeStart('3m', '2026-05-31')).toBe('2026-02-28');
    expect(rangeStart('1m', '2027-01-15')).toBe('2026-12-15');
    expect(rangeStart('all', TODAY3)).toBeNull();
  });
  it('the filter in the address and back; unknown values fall back', () => {
    const q = filterQuery({ ...LOG_DEFAULT, view: 'cal', art: 'metta', note: true, range: '12m', month: '2026-09' });
    expect(q).toBe('?view=cal&art=metta&range=12m&note=1&month=2026-09');
    expect(filterOf(new URLSearchParams(q.slice(1)))).toMatchObject({ view: 'cal', art: 'metta', note: true, longest: false, range: '12m', month: '2026-09', day: null });
    expect(filterOf('view=nope&dur=zz&tod=early&range=5y&day=2026-10-1')).toMatchObject({ view: 'list', dur: 'all', tod: 'early', range: '3m', day: null });
    expect(filterQuery(LOG_DEFAULT)).toBe('');
    expect(filterCount({ ...LOG_DEFAULT, art: 'x', note: true, view: 'chart' })).toBe(2);
    expect(monthAdd('2026-12', 1)).toBe('2027-01');
    expect(monthAdd('2026-01', -2)).toBe('2025-11');
  });
});

describe('streaks, heatmap, weekend minutes, double days (B4)', () => {
  it('streaks across a month change, the turn of the year and the clock change on 25.10.2026', () => {
    const month = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((d) => se(d, 10));
    expect(streaks(month, 'meditation', '2026-10-02')).toEqual({ now: 4, longest: 4 });
    const dst = ['2026-10-24', '2026-10-25', '2026-10-26'].map((d) => se(d, 10, '06:30'));
    expect(streaks(dst, 'meditation', '2026-10-26')).toEqual({ now: 3, longest: 3 });
    expect(streaks(dst, 'meditation', '2026-10-27').now).toBe(3); // today may still come
    const year = ['2026-12-31', '2027-01-01'].map((d) => se(d, 10));
    expect(streaks(year, 'meditation', '2027-01-01').now).toBe(2);
  });
  it('the heatmap: 13 weeks from a Monday, levels by minutes, the future dashed, the share of days', () => {
    const log = [se('2026-10-24', 10), se('2026-10-25', 20), se('2026-10-26', 40), se('2026-10-26', 5, '18:00', 1)];
    const h = heatmap(log, 'meditation', '2026-10-27', 13);
    expect(h.cols).toHaveLength(13);
    expect(h.cols[0][0].day).toBe('2026-08-03'); // a Monday, 12 weeks before this one
    const last = h.cols[12];
    expect(last.map((c) => c.day)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
    expect(last[0]).toMatchObject({ n: 2, min: 45, level: 3 });
    expect(last[2].future).toBe(true);
    const prev = h.cols[11];
    expect(prev[5]).toMatchObject({ day: '2026-10-24', level: 1 });
    expect(prev[6]).toMatchObject({ day: '2026-10-25', level: 2 }); // the day of the clock change counts once
    expect(h.share).toBe(Math.round((3 / (12 * 7 + 2)) * 100));
    expect([levelOf(0, 0), levelOf(1, 0), levelOf(1, 15), levelOf(1, 16), levelOf(1, 31)]).toEqual([0, 1, 1, 2, 3]);
  });
  it('minutes on one weekend and days with two sessions', () => {
    const log = [se('2026-10-23', 30), se('2026-10-24', 20), se('2026-10-25', 25), se('2026-10-25', 15, '18:00', 1), se('2026-10-26', 10)];
    expect(weekendMinutes(log, 'meditation', '2026-10-22')).toBe(60);
    expect(weekendMinutes(log, 'meditation', '2026-10-26')).toBe(0); // the next week
    expect(doubleDays(log, 'meditation')).toBe(1);
    expect(doubleDays([...log, se('2026-10-26', 5, '19:00', 2)], 'meditation')).toBe(2);
  });
});

describe('the calendar, the time of day, the month comparison (B4, B6)', () => {
  it('October 2026 from Monday: three empty days, five weeks, minutes per day, the run in the month', () => {
    const log = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map((d) => se(d, 20));
    const cal = monthCalendar(log, 'meditation', '2026-10', '2026-10-09');
    expect(cal.weeks).toHaveLength(5);
    expect(cal.weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(cal.weeks[0][3]).toMatchObject({ day: '2026-10-01', min: 20, level: 2 });
    expect(cal.weeks[4].filter(Boolean).at(-1).day).toBe('2026-10-31');
    expect(cal.weeks[1][4]).toMatchObject({ day: '2026-10-09', n: 0, future: false });
    expect(cal.weeks[1][5].future).toBe(true);
    expect(monthRun(log, 'meditation', '2026-10', '2026-10-09')).toBe(4);
    expect(monthCalendar([], 'meditation', '2027-02', '2027-02-01').weeks).toHaveLength(4); // Feb 2027 starts on a Monday
  });
  it('sessions per hour in Zurich (summer and winter time) and the deepest two hours', () => {
    const rows = logRows([se('2026-10-20', 20, '06:30'), se('2026-10-27', 20, '06:30'), se('2026-10-28', 20, '07:15'), se('2026-10-28', 20, '19:00', 1)], [
      { id: 'test_2026-10-20_06:30_0', depth: 4 },
      { id: 'test_2026-10-27_06:30_0', depth: 5 },
      { id: 'test_2026-10-28_07:15_0', depth: 4 },
      { id: 'test_2026-10-28_19:00_1', depth: 2 },
    ]);
    const h = hourHistogram(rows);
    expect(h).toHaveLength(24);
    expect(h[6]).toBe(2);
    expect(h[7]).toBe(1);
    expect(h[19]).toBe(1);
    expect(deepestHours(rows)).toEqual({ from: 6, to: 8, n: 3 });
    expect(deepestHours(rows.map((r) => ({ ...r, depth: null })))).toBeNull();
  });
  it('minutes per month for three months, the current one so far, across the turn of the year', () => {
    const log = [se('2026-11-03', 30), se('2026-12-24', 45), se('2026-12-31', 15), se('2027-01-02', 20), se('2026-10-01', 99)];
    expect(monthCompare(log, 'meditation', '2027-01-05', 3)).toEqual([
      { month: '2026-11', min: 30, partial: false },
      { month: '2026-12', min: 60, partial: false },
      { month: '2027-01', min: 20, partial: true },
    ]);
  });
  it('minutes per kind and sessions per duration', () => {
    const rows = [
      { art: 'aware', min: 45 },
      { art: 'aware', min: 30 },
      { art: 'metta', min: 20 },
      { art: null, min: 10 },
      { art: 'metta', min: 0 },
    ];
    expect(artMinutes(rows)).toEqual([
      { art: 'aware', min: 75 },
      { art: 'metta', min: 20 },
      { art: null, min: 10 },
    ]);
    expect(durationBins(rows).map((b) => b.n)).toEqual([1, 2, 1, 0]);
  });
});
