// «Tagebuch» (Noah 20.10.2026, like Day One): entries, tags, «On this day», calendar, export, lock, the 365
// questions and «From the app». Fictional data only.
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import DE from '../src/lib/i18n/de/index.js';
import { QUESTIONS, questionOf, dayOfYear } from '../src/lib/tagebuch/fragen.js';
import { newEntry, isEmpty, sortEntries, filterEntries, byMonth, allTags, retag, onThisDay, streak, stats, monthGrid, shiftMonth, headOf, wordCount, entryMarkdown, journalMarkdown, cleanTags, weatherKind, WEATHER_WORDS, validCode, hashCode, KIND } from '../src/lib/tagebuch/journal.js';
import { saveEntry, deleteEntry, restoreEntry, changeTag, restoreRows, dayThings, weatherNow, nowUrl } from '../src/lib/tagebuch/journaldb.js';

const P = 'test_data_tb_';
const e = (day, extra = {}) => newEntry({ day, time: '20:00', text: `${P}${day}`, ...extra }, { id: `${P}${day}-${extra.time ?? ''}${extra.title ?? ''}`, now: `${day}T18:00:00.000Z` });

describe('the 365 questions', () => {
  it('one per day of the year, all different, each in German', () => {
    expect(QUESTIONS).toHaveLength(365);
    expect(new Set(QUESTIONS.map((q) => q[0])).size).toBe(365);
    for (const [en, de] of QUESTIONS) {
      expect(DE[en], en).toBe(de);
      expect(en.length).toBeLessThan(120);
    }
  });
  it('the question of a day follows the day of the year; «Other question» steps on', () => {
    expect(dayOfYear('2026-01-01')).toBe(0);
    expect(dayOfYear('2026-12-31')).toBe(364);
    expect(questionOf('2026-01-01')).toBe(0);
    expect(questionOf('2026-10-20')).toBe(dayOfYear('2026-10-20'));
    expect(questionOf('2024-12-31')).toBe(0); // day 365 of a leap year wraps round
    expect(questionOf('2026-01-01', 1)).not.toBe(questionOf('2026-01-01'));
    const seen = new Set(Array.from({ length: 10 }, (_, i) => questionOf('2026-05-05', i)));
    expect(seen.size).toBe(10);
  });
});

describe('an entry', () => {
  it('is cleaned: tags without doubles and #, place and weather only when there is something', () => {
    const x = newEntry({ day: '2026-10-20', time: '21:15', title: '  Abend ', text: 'Hallo', tags: ['#Tour', 'tour', ' Familie ', ''], place: { name: '' }, weather: { temp: 11.6, code: 3 } }, { id: 'a', now: '2026-10-20T19:00:00.000Z' });
    expect(x).toMatchObject({ id: 'a', kind: KIND, day: '2026-10-20', time: '21:15', title: 'Abend', tags: ['Tour', 'Familie'], place: null, weather: { temp: 12, code: 3 }, star: false, q: null });
    expect(cleanTags(['A', 'a', '##b'])).toEqual(['A', 'b']);
  });
  it('an empty entry is not saved; a photo alone is enough', () => {
    expect(isEmpty({ title: ' ', text: '\n' })).toBe(true);
    expect(isEmpty({ photos: [{ src: 'data:x' }] })).toBe(false);
  });
  it('the first line is the title when there is none', () => {
    expect(headOf({ text: 'Erste Zeile\nZweite\nDritte' })).toEqual({ title: 'Erste Zeile', preview: 'Zweite Dritte' });
    expect(headOf({ title: 'T', text: 'a  b' })).toEqual({ title: 'T', preview: 'a b' });
    expect(wordCount('Zwei Wörter, und drei-vier!')).toBe(4);
  });
});

describe('the list', () => {
  const list = [e('2025-10-20', { tags: ['Tour'] }), e('2026-10-19', { star: true }), e('2026-10-20', { tags: ['tour', 'Familie'], title: 'Abend' }), e('2026-09-03', { place: { name: 'Seeufer' } })];
  it('newest first, grouped by month', () => {
    expect(sortEntries(list).map((x) => x.day)).toEqual(['2026-10-20', '2026-10-19', '2026-09-03', '2025-10-20']);
    expect(byMonth(list).map((m) => [m.month, m.items.length])).toEqual([['2026-10', 2], ['2026-09', 1], ['2025-10', 1]]);
  });
  it('search, tag, favourites', () => {
    expect(filterEntries(list, { q: 'seeufer' }).map((x) => x.day)).toEqual(['2026-09-03']);
    expect(filterEntries(list, { tag: 'TOUR' })).toHaveLength(2);
    expect(filterEntries(list, { star: true }).map((x) => x.day)).toEqual(['2026-10-19']);
    expect(filterEntries(list, { q: 'abend 2026-10-20' })).toHaveLength(1);
  });
  it('tags with counts; rename, merge and remove only change what has the tag', () => {
    expect(allTags(list)).toEqual([{ name: 'Tour', n: 2 }, { name: 'Familie', n: 1 }]);
    expect(retag(list, 'Tour', 'Velo').map((x) => x.tags)).toEqual([['Velo'], ['Velo', 'Familie']]);
    expect(retag(list, 'Tour', 'Familie').map((x) => x.tags)).toEqual([['Familie'], ['Familie']]);
    expect(retag(list, 'Familie', '').map((x) => x.tags)).toEqual([['tour']]);
    expect(retag(list, 'Tour', 'Tour')).toEqual([]);
  });
  it('«On this day», the series and the numbers', () => {
    expect(onThisDay(list, '2026-10-20').map((g) => [g.years, g.items.length])).toEqual([[1, 1]]);
    expect(onThisDay(list, '2026-10-21')).toEqual([]);
    expect(streak(list, '2026-10-20')).toBe(2);
    expect(streak(list, '2026-10-21')).toBe(2); // not lost before the evening
    expect(streak(list, '2026-10-23')).toBe(0);
    expect(stats(list, '2026-10-20')).toMatchObject({ entries: 4, days: 4, thisYear: 3, streak: 2 });
  });
  it('the calendar month starts on Monday', () => {
    const w = monthGrid('2026-10'); // 1 October 2026 is a Thursday
    expect(w[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(w.flat().filter(Boolean)).toHaveLength(31);
    expect(w.every((x) => x.length === 7)).toBe(true);
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
});

describe('download and weather words', () => {
  it('Markdown: title, date line, text, tags; the whole diary oldest first', () => {
    const x = newEntry({ day: '2026-10-20', time: '21:00', title: 'Herbst', text: 'Nebel am See.', tags: ['Natur Pur'], place: { name: 'Seeufer' }, weather: { temp: 8, code: 45 }, photos: [{ src: 'data:x' }] }, { id: 'm' });
    const md = entryMarkdown(x, { t: (s) => DE[s] ?? s, fmt: (d) => d });
    expect(md).toContain('## Herbst');
    expect(md).toContain('_2026-10-20, 21:00 · Seeufer · 8 °C Nebel_');
    expect(md).toContain('Nebel am See.');
    expect(md).toContain('#Natur_Pur');
    expect(md).toContain('(1 Foto)');
    const all = journalMarkdown([e('2026-10-20'), e('2026-01-02')], { title: 'Tagebuch' });
    expect(all.startsWith('# Tagebuch')).toBe(true);
    expect(all.indexOf('2026-01-02')).toBeLessThan(all.indexOf('2026-10-20'));
  });
  it('every weather word is in German', () => {
    for (const c of [0, 1, 3, 45, 61, 71, 80, 95, null]) expect(DE[WEATHER_WORDS[weatherKind(c)]], String(c)).toBeTruthy();
    expect(weatherKind(0)).toBe('sun');
    expect(weatherKind(73)).toBe('snow');
    expect(weatherKind(96)).toBe('storm');
  });
});

describe('the lock', () => {
  it('a code of 4 to 8 digits; only its hash with a salt is kept', async () => {
    expect(validCode('1234')).toBe(true);
    expect(validCode('123')).toBe(false);
    expect(validCode('12a4')).toBe(false);
    const a = await hashCode('2468', 'salz');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashCode('2468', 'salz')).toBe(a);
    expect(await hashCode('2468', 'pfeffer')).not.toBe(a);
    expect(a).not.toContain('2468');
  });
});

describe('the database', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`${P}${Math.random()}`);
    await db.open();
  });
  it('entries are rows of «frei» (kind diary): save, delete, undo, retag', async () => {
    const a = await saveEntry({ day: '2026-10-20', text: 'eins', tags: ['Tour'] }, db);
    await saveEntry({ day: '2026-10-19', text: 'zwei', tags: ['tour'] }, db);
    expect(await db.frei.where('kind').equals('diary').count()).toBe(2);
    const old = await changeTag('Tour', 'Velo', db);
    expect(old).toHaveLength(2);
    expect((await db.frei.toArray()).map((x) => x.tags[0]).sort()).toEqual(['Velo', 'Velo']);
    await restoreRows(old, db);
    expect((await db.frei.get(a.id)).tags).toEqual(['Tour']);
    const gone = await deleteEntry(a.id, db);
    expect(await db.frei.get(a.id)).toBeUndefined();
    await restoreEntry(gone, db);
    expect((await db.frei.get(a.id)).text).toBe('eins');
  });
  it('«From the app»: rides, Fitbit, tours, notes and appointments of the day', async () => {
    await db.activities.put({ id: `${P}a1`, day: '2026-10-20', kind: 'bike', name: 'Abendrunde', km: 42.34, movingS: 5700, hm: 610, hrAvg: 131 });
    await db.healthDays.put({ date: '2026-10-20', restingHr: 52, steps: 9000, sleep: { asleepMin: 445 } });
    await db.trips.put({ id: `${P}t1`, title: 'Herbstrunde', startDate: '2026-10-19', days: 3 });
    await db.gEvents.put({ id: `${P}c|1`, day: '2026-10-20', cal: 'c', title: 'Zahnarzt', allDay: false, start: '2026-10-20T09:30:00' });
    const at = new Date('2026-10-20T12:00:00').toISOString();
    await db.notes.put({ id: `${P}n1`, at, text: 'Kette quietscht', status: 'open' });
    const things = await dayThings('2026-10-20', (s) => s, db);
    const by = Object.fromEntries(things.map((x) => [x.group, x.text]));
    expect(by.Activities).toBe('Abendrunde · 42.3 km · 1 h 35 min · 610 hm · heart rate 131');
    expect(by.Body).toBe('Sleep 7 h 25 min · resting pulse 52 · 9000 steps');
    expect(by.Tours).toBe('On tour: Herbstrunde');
    expect(by.Notes).toBe('Kette quietscht');
    expect(by.Calendar).toBe('09:30 Zahnarzt');
    expect(await dayThings('2026-10-25', (s) => s, db)).toEqual([]);
  });
  it('the weather now: Open-Meteo, quiet when it fails', async () => {
    expect(nowUrl({ lat: 47.1, lon: 8.2 })).toContain('current=temperature_2m,weather_code');
    const ok = async () => ({ ok: true, json: async () => ({ current: { temperature_2m: 9.6, weather_code: 61 } }) });
    expect(await weatherNow({ lat: 1, lon: 2 }, ok)).toEqual({ temp: 10, code: 61 });
    expect(await weatherNow(null, ok)).toBeNull();
    expect(await weatherNow({ lat: 1, lon: 2 }, async () => { throw new Error('offline'); })).toBeNull();
  });
});
