// «Tagebuch» round 2 (Noah 20.10.2026 «1a 2a 3a 4b 5a»): mood, «what goes together», word cloud, series,
// the evening reminder, Gemini contexts and the server's diary modes, the year book PDF. Fictional data only.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import DE from '../src/lib/i18n/de/index.js';
import { newEntry, entryMarkdown } from '../src/lib/tagebuch/journal.js';
import { MOODS, moodOf, moodByDay, moodSeries, moodPairs, topWords, cloudSize, longestStreak, milestones, remindOf, remindDue, MIN_DAYS } from '../src/lib/tagebuch/insights.js';
import { entryLine, askContext, periodContext, cleanTitle, MAX_CONTEXT, diaryAi } from '../src/lib/tagebuch/ai.js';
import { wrapText, yearEntries, yearsOf, makeYearBook } from '../src/lib/tagebuch/book.js';
import { makeHandler, geminiRequest, DIARY_MODES, DIARY_CONTEXT } from '../api/helper.js';

const P = 'test_data_tbx_';
const day = (n, base = '2026-10-20') => {
  const d = new Date(`${base}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const e = (d, extra = {}) => newEntry({ day: d, time: '20:00', text: `${P}${d}`, ...extra }, { id: `${P}${d}${extra.title ?? ''}`, now: `${d}T18:00:00.000Z` });
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('mood', () => {
  it('is 1 to 5 or nothing, and goes into the download', () => {
    expect(e('2026-10-01', { mood: 4 }).mood).toBe(4);
    expect(e('2026-10-01', { mood: 9 }).mood).toBe(null);
    expect(e('2026-10-01').mood).toBe(null);
    expect(entryMarkdown(e('2026-10-01', { mood: 5, title: 'Hallo' }), { t: (s) => DE[s] ?? s })).toContain('Super');
    expect(MOODS.map((m) => m.v)).toEqual([1, 2, 3, 4, 5]);
    for (const m of MOODS) expect(DE[m.name], m.name).toBeTruthy();
    expect(moodOf(3).emoji).toBe('😐');
  });
  it('a day takes the mean of its entries; the curve keeps the last 90 days', () => {
    const list = [e('2026-10-20', { mood: 2 }), e('2026-10-20', { mood: 4, title: 'b' }), e('2026-07-01', { mood: 5 }), e('2026-10-19')];
    expect(moodByDay(list)).toEqual({ '2026-10-20': 3, '2026-07-01': 5 });
    expect(moodSeries(list, '2026-10-20')).toEqual([{ day: '2026-10-20', mood: 3 }]);
    expect(moodSeries(list, '2026-10-20', 120).map((p) => p.day)).toEqual(['2026-07-01', '2026-10-20']);
  });
  it('shows what goes together only with enough days on both sides and a clear difference', () => {
    const list = [];
    const rideDays = new Set();
    for (let i = 0; i < 12; i++) {
      const d = day(-i);
      const ride = i % 2 === 0;
      if (ride) rideDays.add(d);
      list.push(e(d, { mood: ride ? 5 : 3, tags: i < 3 ? ['Familie'] : [] }));
    }
    const pairs = moodPairs(list, { rideDays, sleep: {} });
    expect(pairs[0]).toMatchObject({ key: 'ride', yes: 5, no: 3, nYes: 6, nNo: 6 });
    expect(pairs.some((p) => p.key === 'sleep')).toBe(false); // no sleep values
    expect(pairs.some((p) => p.key === 'tag:Familie')).toBe(false); // only 3 days < MIN_DAYS
    expect(MIN_DAYS).toBe(5);
    expect(moodPairs(list.slice(0, 4), { rideDays })).toEqual([]);
    for (const k of ['On days with a ride or workout', 'After at least 7 h of sleep', 'On days with #{thing}']) expect(DE[k], k).toBeTruthy();
  });
});

describe('word cloud and series', () => {
  it('counts words used at least twice, without small words or test markers', () => {
    const list = [e('2026-10-01', { text: 'Velo und Velo und Berge' }), e('2026-10-02', { text: 'Berge, Velo! Kaffee' })];
    expect(topWords(list)).toEqual([{ word: 'velo', n: 3 }, { word: 'berge', n: 2 }]);
    expect(cloudSize(3, 3)).toBe(5);
    expect(cloudSize(1, 10)).toBe(1);
    expect(cloudSize(1, 0)).toBe(1);
  });
  it('finds the longest run and calm milestones', () => {
    const list = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05'].map((d) => e(d));
    expect(longestStreak(list)).toBe(3);
    const m = milestones(list);
    expect(m.find((x) => x.key === 'entries-1').done).toBe(true);
    expect(m.find((x) => x.key === 'streak-3').done).toBe(true);
    expect(m.find((x) => x.key === 'streak-7').done).toBe(false);
    expect(milestones([]).every((x) => !x.done)).toBe(true);
    for (const x of m) expect(DE[x.label], x.label).toBeTruthy();
  });
});

describe('evening reminder (3a)', () => {
  const now = new Date('2026-10-20T19:30:00Z');
  const base = { cfg: {}, hasAny: true, hasToday: false, clock: '21:30', now };
  it('is on at 21:00 unless changed', () => {
    expect(remindOf({})).toEqual({ on: true, time: '21:00' });
    expect(remindOf({ remind: { on: false, time: '20:15' } })).toEqual({ on: false, time: '20:15' });
    expect(remindOf({ remind: { time: 'x' } }).time).toBe('21:00');
  });
  it('asks only when the time has come, today has no entry and it does not wait', () => {
    expect(remindDue(base)).toBe(true);
    expect(remindDue({ ...base, clock: '20:59' })).toBe(false);
    expect(remindDue({ ...base, hasToday: true })).toBe(false);
    expect(remindDue({ ...base, hasAny: false })).toBe(false);
    expect(remindDue({ ...base, onDiary: true })).toBe(false);
    expect(remindDue({ ...base, cfg: { remind: { on: false } } })).toBe(false);
    expect(remindDue({ ...base, until: '2026-10-20T20:30:00Z' })).toBe(false);
    expect(remindDue({ ...base, until: '2026-10-20T19:00:00Z' })).toBe(true);
  });
  it('is its own window with «Later» and «Not today», mounted once in the app', () => {
    expect(src('src/lib/tagebuch/Reminder.svelte')).toContain('<CheckWindow');
    expect(src('src/App.svelte')).toContain('<DiaryReminder {hash} />');
  });
});

describe('Gemini in the diary (1a)', () => {
  it('sends date, tags, mood and text, never photos or places', () => {
    const x = e('2026-10-01', { title: 'Pass', tags: ['Tour'], mood: 4, place: { name: 'Geheimort', lat: 46, lon: 8 }, photos: [{ src: 'data:image/jpeg;base64,AAA' }] });
    const line = entryLine(x);
    expect(line).toContain('2026-10-01');
    expect(line).toContain('#Tour');
    expect(line).toContain('mood 4/5');
    expect(line).not.toContain('Geheimort');
    expect(line).not.toContain('base64');
  });
  it('picks the entries that fit a question first and stays under the limit', () => {
    const list = Array.from({ length: 40 }, (_, i) => e(day(-i), { text: `${'Alltag '.repeat(60)}${i === 30 ? 'Gotthard' : ''}` }));
    const ctx = askContext(list, 'Wann war ich am Gotthard?');
    expect(ctx).toContain('Gotthard');
    expect(ctx.length).toBeLessThanOrEqual(MAX_CONTEXT);
    expect(MAX_CONTEXT).toBeLessThan(DIARY_CONTEXT);
    const month = periodContext(list, '2026-10-01', '2026-10-31');
    expect(month.split('\n')[0]).toContain('2026-10-01');
    expect(month).not.toContain('2026-09-30');
  });
  it('cleans a title and sends the mode along', async () => {
    expect(cleanTitle('«Ein Tag am See.»\nmehr')).toBe('Ein Tag am See');
    const fetchFn = vi.fn();
    const r = await diaryAi('title', { context: 'x', fetchFn });
    expect(r).toEqual({ ok: false, error: 'off' }); // without a helper code nothing is sent
    expect(fetchFn).not.toHaveBeenCalled();
  });
  it('the server knows the diary modes: own instruction, more room, tidy stays close', () => {
    expect(DIARY_MODES).toEqual(['title', 'tidy', 'summary', 'ask']);
    const tidy = geminiRequest({ question: 'Q', context: 'c', mode: 'tidy', lang: 'de' });
    expect(tidy.generationConfig.temperature).toBe(0.1);
    expect(tidy.generationConfig.maxOutputTokens).toBe(4096);
    expect(geminiRequest({ question: 'Q', mode: 'nope' }).generationConfig.maxOutputTokens).toBe(1024);
    expect(geminiRequest({ question: 'Q', mode: 'summary', lang: 'en' }).systemInstruction.parts[0].text).not.toBe(geminiRequest({ question: 'Q', lang: 'en' }).systemInstruction.parts[0].text);
  });
  it('the server lets diary text through up to 12000 signs', async () => {
    const TOKEN = 'test-code-not-real-0000';
    const REDIS = 'https://redis.example.test';
    const calls = [];
    const doFetch = vi.fn(async (url, init) => {
      if (url === REDIS) return Response.json({ result: null });
      calls.push(JSON.parse(init.body));
      return Response.json({ candidates: [{ content: { parts: [{ text: 'Ein ruhiger Monat.' }] } }] });
    });
    const env = () => ({ apiKey: '', token: TOKEN, model: 'claude-sonnet-5-5', cap: 2, redisUrl: REDIS, redisToken: 'r', geminiKey: 'g-test-not-real', geminiModel: 'gemini-flash-latest', geminiDaily: 50 });
    const req = (input) => new Request('https://packgen-three.vercel.app/api/helper', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ task: 'gemini', input }) });
    const h = makeHandler({ env, doFetch, now: () => new Date('2026-10-20T10:00:00Z') });
    const long = 'x'.repeat(15000);
    expect((await h(req({ question: 'Zusammenfassen', context: long, mode: 'summary' }))).status).toBe(200);
    expect(calls[0].contents[0].parts[0].text.length).toBeGreaterThan(11000);
    await h(req({ question: 'Frage', context: long }));
    expect(calls[1].contents[0].parts[0].text.length).toBeLessThan(2100);
  });
});

describe('year book (5a)', () => {
  it('picks the years and the entries of one year, oldest first', () => {
    const list = [e('2025-12-31'), e('2026-01-02'), e('2026-03-04')];
    expect(yearsOf(list)).toEqual(['2026', '2025']);
    expect(yearEntries(list, '2026').map((x) => x.day)).toEqual(['2026-01-02', '2026-03-04']);
  });
  it('wraps long text and words', () => {
    const font = { widthOfTextAtSize: (s, size) => s.length * size * 0.5 };
    const rows = wrapText(font, `kurz ${'a'.repeat(50)} ende`, 10, 100);
    expect(rows.every((r) => font.widthOfTextAtSize(r, 10) <= 100)).toBe(true);
    expect(rows.join('')).toContain('ende');
  });
  it('makes a PDF with a cover and a page per month', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const list = [e('2026-01-02', { title: 'Neujahr', mood: 5, tags: ['Familie'] }), e('2026-01-09'), e('2026-02-01', { text: 'Ä ö ü – «Schnee» 😄' })];
    const bytes = await makeYearBook(list, '2026', { when: new Date('2026-10-20T10:00:00Z') });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(3);
    const empty = await PDFDocument.load(await makeYearBook([], '2026'));
    expect(empty.getPageCount()).toBe(1);
    expect(DE['{e} entries · {d} days · {p} photos']).toBeTruthy();
  });
});
