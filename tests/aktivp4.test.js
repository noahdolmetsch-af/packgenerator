// Paket P4 «Aktiv» (mockups TN1–TN5, ME4, E4, E5): the pure rules of the tennis top, the yoga card,
// the kept good days and «Gewünscht und erlebt». Fictional data only.
import { describe, it, expect } from 'vitest';
import { TENNIS_ID, tennisOf, safeUrl, lastPlayed, playDraft, cleanPlayed, cleanSlot, nextSlot, askSlot, tennisStats, recentTennis, PLAY_MINUTES } from '../src/lib/tennisday.js';
import { yogaOf, addClass, editClass, dropClass, moveClass, nextClass, openVisits, markVisit, unmarkVisit, visitCount, weekdayOf, setStudio } from '../src/lib/yogastudio.js';
import { goodDaysOf, rememberDay, renameGoodDay, dropGoodDay, planAgain, nextSaturday, dueToday, shortVersion, mixRows, stepWish, mixSummary } from '../src/lib/gutertag.js';

const S = TENNIS_ID;
// 2026-10-08 is a Thursday
const TODAY = '2026-10-08';

describe('tennis: settings and links', () => {
  it('keeps only web links and a picture as data URL', () => {
    expect(safeUrl('www.example.ch/booking')).toBe('https://www.example.ch/booking');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('')).toBe('');
    const v = tennisOf({ cover: 'data:image/jpeg;base64,AAA', y: 140, bookUrl: 'ftp://x', bookName: '  App  ' });
    expect(v).toEqual({ cover: 'data:image/jpeg;base64,AAA', y: 100, bookUrl: '', bookName: 'App' });
    expect(tennisOf({ cover: 'http://x/y.jpg' }).cover).toBeNull();
    expect(tennisOf(null).y).toBe(50);
  });
});

describe('tennis: played, like last time', () => {
  const items = [
    { id: 'a', sport: S, kind: 'played', day: '2026-10-01', type: 'match', min: 120, court: 'hard' },
    { id: 'b', sport: S, kind: 'played', day: '2026-10-05', type: 'double', min: 60, court: 'indoor' },
    { id: 'c', sport: 'act:gym', kind: 'played', day: '2026-10-07', type: 'match', min: 30, court: 'clay' },
    { id: 'd', sport: S, kind: 'taught', day: '2026-10-06', min: 60, note: 'x' },
  ];
  it('takes the last game of tennis for the start of the sheet', () => {
    expect(lastPlayed(items).id).toBe('b');
    expect(playDraft(items, TODAY)).toEqual({ day: TODAY, type: 'double', min: 60, court: 'indoor', result: 'none', worked: '' });
    expect(playDraft([], TODAY)).toMatchObject({ type: 'training', min: 90, court: 'clay' });
    expect(PLAY_MINUTES).toContain(90);
  });
  it('cleans what is saved', () => {
    expect(cleanPlayed({ day: 'bad', type: 'x', min: '7', court: 'moon', result: 'win', worked: '  serve ' }, TODAY)).toEqual({ sport: S, kind: 'played', day: TODAY, type: 'training', min: 7, court: 'clay', result: 'win', worked: 'serve' });
    expect(cleanPlayed({ min: 0 }, TODAY).min).toBe(90);
  });
  it('lists played and taught, newest first', () => {
    expect(recentTennis(items).map((x) => x.id)).toEqual(['d', 'b', 'a']);
  });
});

describe('tennis: planned times and «Gespielt?»', () => {
  const slots = [
    { id: 's1', sport: S, kind: 'slot', day: '2026-10-07', time: '18:00', min: 60, court: 'clay' },
    { id: 's2', sport: S, kind: 'slot', day: TODAY, time: '18:00', min: 60, court: 'clay' },
    { id: 's3', sport: S, kind: 'slot', day: '2026-10-10', time: '09:00', min: 90, court: 'clay' },
    { id: 's4', sport: S, kind: 'slot', day: '2026-10-06', time: '18:00', min: 60, court: 'clay', answer: 'played' },
  ];
  it('the next time from now on', () => {
    expect(nextSlot(slots, TODAY, '12:00').id).toBe('s2');
    expect(nextSlot(slots, TODAY, '19:00').id).toBe('s3');
    expect(nextSlot([], TODAY)).toBeNull();
  });
  it('asks after the time is over, the latest open one, not the answered ones', () => {
    expect(askSlot(slots, TODAY, '12:00').id).toBe('s1');
    expect(askSlot(slots, TODAY, '19:00').id).toBe('s2');
    expect(askSlot(slots, TODAY, '12:00', '2026-10-08')).toBeNull();
  });
  it('cleans a planned time', () => {
    expect(cleanSlot({ day: '2026-10-09', time: '7:00', min: 'x', court: 'indoor' }, TODAY)).toEqual({ sport: S, kind: 'slot', day: '2026-10-09', time: '18:00', min: 60, court: 'indoor' });
  });
});

describe('tennis: the numbers', () => {
  it('days this month from Aktiv, lessons of the month, hours of the year without counting twice', () => {
    const log = [
      { id: 'f1', actId: 'tennis', day: '2026-10-02', min: 90 },
      { id: 'f2', actId: 'tennis', day: '2026-10-02', min: 30 },
      { id: 'f3', actId: 'tennis', day: '2026-09-20', min: 60 },
      { id: 'f4', actId: 'run', day: '2026-10-03', min: 40 },
    ];
    const items = [
      { id: 'p1', sport: S, kind: 'played', day: '2026-10-02', min: 90, flowId: 'f1' },
      { id: 't1', sport: S, kind: 'taught', day: '2026-10-04', min: 60 },
      { id: 't2', sport: S, kind: 'taught', day: '2026-09-04', min: 60 },
    ];
    // 90 (p1) + 30 (f2) + 60 (f3) = 180 min
    expect(tennisStats(items, log, TODAY)).toEqual({ month: 1, taught: 1, hours: 3 });
  });
});

describe('yoga: classes, studio, visits', () => {
  it('weekdays are ISO (Monday 1)', () => {
    expect(weekdayOf(TODAY)).toBe(4);
    expect(weekdayOf('2026-10-11')).toBe(7);
  });
  it('adds, changes, moves and deletes classes; visits stay', () => {
    let v = addClass(null, { wd: 2, time: '07:00', name: 'Yin' }, 'c1');
    v = addClass(v, { wd: 4, time: '18:30', name: 'Hatha' }, 'c2');
    v = editClass(v, 'c1', { name: 'Yin Yoga', wd: 9 });
    expect(v.classes).toEqual([{ id: 'c1', wd: 1, time: '07:00', name: 'Yin Yoga' }, { id: 'c2', wd: 4, time: '18:30', name: 'Hatha' }]);
    v = moveClass(v, 1, 0);
    expect(v.classes.map((c) => c.id)).toEqual(['c2', 'c1']);
    v = markVisit(v, { day: '2026-10-01', classId: 'c2', went: true, flowId: 'fl1' });
    v = dropClass(v, 'c2');
    expect(v.classes.map((c) => c.id)).toEqual(['c1']);
    expect(v.visits).toEqual([{ day: '2026-10-01', classId: 'c2', went: true, flowId: 'fl1' }]);
  });
  it('the studio keeps only a web link', () => {
    expect(setStudio(null, { url: 'example.ch/plan', name: ' Studio ' }).studio).toEqual({ url: 'https://example.ch/plan', name: 'Studio' });
    expect(yogaOf({ studio: { url: 'javascript:x' } }).studio.url).toBe('');
  });
  it('the next class, today later or the next days', () => {
    let v = addClass(null, { wd: 4, time: '18:30', name: 'Hatha' }, 'c2');
    v = addClass(v, { wd: 2, time: '07:00', name: 'Yin' }, 'c1');
    expect(nextClass(v, TODAY, '12:00')).toMatchObject({ day: TODAY, inDays: 0, cls: { id: 'c2' } });
    expect(nextClass(v, TODAY, '19:00')).toMatchObject({ day: '2026-10-13', inDays: 5, cls: { id: 'c1' } });
    expect(nextClass(null, TODAY)).toBeNull();
  });
  it('asks after the class, today and yesterday, until answered', () => {
    let v = addClass(null, { wd: 4, time: '18:30', name: 'Hatha' }, 'c2');
    v = addClass(v, { wd: 3, time: '07:00', name: 'Yin' }, 'c1');
    expect(openVisits(v, TODAY, '12:00').map((o) => o.cls.id)).toEqual(['c1']);
    expect(openVisits(v, TODAY, '19:00').map((o) => `${o.day}/${o.cls.id}`)).toEqual([`${TODAY}/c2`, '2026-10-07/c1']);
    v = markVisit(v, { day: TODAY, classId: 'c2', went: false });
    v = markVisit(v, { day: '2026-10-07', classId: 'c1', went: true });
    expect(openVisits(v, TODAY, '19:00')).toEqual([]);
    expect(visitCount(v, TODAY)).toEqual({ went: 1, skipped: 1 });
    v = unmarkVisit(v, TODAY, 'c2');
    expect(openVisits(v, TODAY, '19:00').length).toBe(1);
  });
});

describe('good days: keep, plan again, short version', () => {
  it('keeps one recipe per day, newest first, and changes or deletes it', () => {
    let l = rememberDay([], { day: '2026-10-03', text: ' Morgens Ruhe,  nachmittags raus ' }, 'g1');
    l = rememberDay(l, { day: TODAY, text: 'Freunde' }, 'g2');
    l = rememberDay(l, { day: '2026-10-03', text: 'Morgens Ruhe, nachmittags raus, abends Freunde' }, 'g3');
    expect(l.map((x) => x.id)).toEqual(['g2', 'g1']);
    expect(l[1].text).toBe('Morgens Ruhe, nachmittags raus, abends Freunde');
    expect(renameGoodDay(l, 'g2', '  ')[0].text).toBe('Freunde');
    expect(renameGoodDay(l, 'g2', 'Freunde am See')[0].text).toBe('Freunde am See');
    expect(dropGoodDay(l, 'g2').map((x) => x.id)).toEqual(['g1']);
    expect(goodDaysOf([{ id: 'x', day: 'bad', text: 'a' }, { id: 'y', day: TODAY, text: ' ' }])).toEqual([]);
  });
  it('plans a day again on the next Saturday and shows it that morning', () => {
    expect(nextSaturday(TODAY)).toBe('2026-10-10');
    expect(nextSaturday('2026-10-10')).toBe('2026-10-17');
    expect(nextSaturday('2026-10-11')).toBe('2026-10-17');
    let l = rememberDay([], { day: '2026-10-03', text: 'Ruhe, raus' }, 'g1');
    l = planAgain(l, 'g1', '2026-10-10');
    expect(dueToday(l, '2026-10-10').map((x) => x.id)).toEqual(['g1']);
    expect(dueToday(l, TODAY)).toEqual([]);
    l = planAgain(l, 'g1', null);
    expect(l[0].again).toBeUndefined();
  });
  it('the short version is the first part', () => {
    expect(shortVersion('Morgens Ruhe, nachmittags raus, abends Freunde')).toBe('Morgens Ruhe');
    expect(shortVersion('Sauna und früh ins Bett')).toBe('Sauna');
    expect(shortVersion('Ein langer Ritt')).toBeNull();
  });
});

describe('wished and lived', () => {
  const cats = [
    { key: 'fun', value: 40 },
    { key: 'rest', value: 80 },
    { key: 'sport', value: null },
    { key: 'friends', value: 20 },
  ];
  it('one row per area with value, wish and difference', () => {
    const rows = mixRows(cats, { fun: 60, rest: 50, friends: 30 });
    expect(rows).toEqual([
      { key: 'fun', value: 40, wish: 60, diff: -20 },
      { key: 'rest', value: 80, wish: 50, diff: 30 },
      { key: 'sport', value: null, wish: null, diff: null },
      { key: 'friends', value: 20, wish: 30, diff: -10 },
    ]);
    expect(mixSummary(rows)).toEqual({ under: ['fun'], over: ['rest'], known: 3 });
  });
  it('− / + move the wish in steps of 10 between 0 and 100, a first step from 50', () => {
    expect(stepWish({}, 'fun', 10)).toEqual({ fun: 60 });
    expect(stepWish({ fun: 100 }, 'fun', 10)).toEqual({ fun: 100 });
    expect(stepWish({ fun: 0, rest: 30 }, 'fun', -10)).toEqual({ fun: 0, rest: 30 });
  });
});
