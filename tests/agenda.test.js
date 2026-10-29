// Google Kalender und Aufgaben (GA): the pure helpers (src/lib/agenda.js) and the app side with a fake
// server and a test database. Fictional entries only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb, DATA_TABLES } from '../src/lib/db.js';
import { byDay, taskGroups, taskWhen, weekItems, undatedTasks, prefsOf, calsToFetch, timeOf, clockIn, remindRow, remindMinutes, AGENDA_KEY } from '../src/lib/agenda.js';
import { fetchNow, saveTask, deleteTask, saveEvent, takeReturn, agenda } from '../src/lib/agenda/client.svelte.js';

const ev = (id, over = {}) => ({ id: `primary|${id}`, gid: id, cal: 'primary', title: id, where: '', note: '', allDay: false, day: '2026-10-13', lastDay: '2026-10-13', start: '2026-10-13T08:30:00+02:00', end: '2026-10-13T09:00:00+02:00', link: null, busy: true, ...over });
const task = (id, over = {}) => ({ id, list: 'l1', title: id, notes: '', due: null, done: false, doneAt: null, parent: null, position: '', ...over });

describe('days and tasks', () => {
  it('puts an event on every day it lasts, all-day ones first', () => {
    const d = byDay([ev('Zahnarzt'), ev('Jura', { allDay: true, day: '2026-10-12', lastDay: '2026-10-14', start: '2026-10-12' })], '2026-10-13', '2026-10-15');
    expect(d.map((x) => [x.day, x.events.map((e) => e.title)])).toEqual([
      ['2026-10-13', ['Jura', 'Zahnarzt']],
      ['2026-10-14', ['Jura']],
      ['2026-10-15', []],
    ]);
    expect(timeOf(ev('a'))).toBe('08:30');
  });
  it('sorts tasks into late, today, soon, later, open and done', () => {
    const today = '2026-10-15';
    expect(['2026-10-14', '2026-10-15', '2026-10-20', '2026-11-30', null].map((due) => taskWhen(task('x', { due }), today))).toEqual(['late', 'today', 'soon', 'later', 'open']);
    const g = taskGroups([task('b', { due: '2026-10-20' }), task('a', { due: '2026-10-18' }), task('c', { done: true }), task('d', { list: 'l2' })], today);
    expect(g.map((x) => [x.key, x.rows.map((r) => r.id)])).toEqual([['soon', ['a', 'b']], ['open', ['d']], ['done', ['c']]]);
    expect(taskGroups([task('d', { list: 'l2' }), task('e')], today, { list: 'l2' })[0].rows.map((r) => r.id)).toEqual(['d']);
  });
  it('gives «Woche planen» one item per day: appointments first, then dated tasks', () => {
    const items = weekItems({ events: [ev('Tennis')], tasks: [task('Kette messen', { due: '2026-10-13' }), task('ohne')], from: '2026-10-12', to: '2026-10-18' });
    expect(items.map((i) => [i.day, i.kind, i.title, i.time])).toEqual([
      ['2026-10-13', 'termin', 'Tennis', '08:30'],
      ['2026-10-13', 'todo', 'Kette messen', ''],
    ]);
    expect(undatedTasks([task('ohne'), task('x', { due: '2026-10-13' })]).map((x) => x.id)).toEqual(['ohne']);
  });
  it('fetches the main calendar unless others are chosen; the copy is not in backups', () => {
    expect(calsToFetch(prefsOf({ calendars: [{ id: 'me@example.test', primary: true }] }))).toEqual(['me@example.test']);
    expect(calsToFetch(prefsOf({ cals: ['a', 'b'] }))).toEqual(['a', 'b']);
    expect(DATA_TABLES).not.toContain('gEvents');
    expect(DATA_TABLES).not.toContain('gTasks');
  });
});

function fakeServer() {
  const log = [];
  const c = async (step, { params = {}, body = null } = {}) => {
    log.push({ step, params, body });
    if (step === 'cal-list') return { calendars: [{ id: 'me@example.test', name: 'Noah Muster', primary: true, write: true }] };
    if (step === 'cal-events') return { events: [ev('Zahnarzt', { cal: 'me@example.test', id: 'me@example.test|Zahnarzt' })] };
    if (step === 'task-lists') return { lists: [{ id: 'l1', title: 'Meine Aufgaben' }] };
    if (step === 'tasks') return { tasks: [task('Kette messen', { due: '2026-10-16' })] };
    if (step === 'task-save') return { task: task(body.id ?? 'neu', { ...body }) };
    if (step === 'task-delete') return { ok: true };
    if (step === 'cal-save') return { event: ev(body.title, { title: body.title, day: body.day }) };
    if (step === 'status') return { calendar: true, tasks: true };
    return {};
  };
  return { c, log };
}

describe('the app side', () => {
  it('fetch now keeps calendars, events and tasks; changes go to Google first', async () => {
    const db = createDb(`agenda-${Math.random()}`);
    await db.open();
    await db.settings.put({ key: AGENDA_KEY, value: { calendar: true, tasks: true } });
    const s = fakeServer();
    expect(await fetchNow({ db, c: s.c, today: '2026-10-15' })).toBe(true);
    expect(s.log.find((x) => x.step === 'cal-events').params).toEqual({ from: '2026-10-08', to: '2026-12-14', cal: 'me@example.test' });
    expect((await db.gEvents.toArray()).map((e) => e.title)).toEqual(['Zahnarzt']);
    expect((await db.gTasks.toArray()).map((x) => x.title)).toEqual(['Kette messen']);
    const p = (await db.settings.get(AGENDA_KEY)).value;
    expect(p.lists).toEqual([{ id: 'l1', title: 'Meine Aufgaben' }]);
    expect(p.lastSync).toBeTruthy();

    await saveTask({ list: 'l1', id: 'Kette messen', done: true }, { db, c: s.c });
    expect((await db.gTasks.get('Kette messen')).done).toBe(true);
    await deleteTask({ list: 'l1', id: 'Kette messen' }, { db, c: s.c });
    expect(await db.gTasks.count()).toBe(0);
    await saveEvent({ title: 'Velo-Service', day: '2026-10-20' }, { db, c: s.c });
    expect((await db.gEvents.toArray()).map((e) => e.title)).toContain('Velo-Service');
  });
  it('a failed change keeps the copy and says why', async () => {
    const db = createDb(`agenda-${Math.random()}`);
    await db.open();
    const res = await saveTask({ list: 'l1', title: 'x' }, { db, c: async () => Promise.reject(Object.assign(new Error('x'), { code: 'network' })) });
    expect(res).toBeNull();
    expect(agenda.error).toBe('network');
    expect(await db.gTasks.count()).toBe(0);
  });
  it('reads the way back from the Google login only on its own page', () => {
    const loc = (hash) => ({ hash, pathname: '/', search: '' });
    expect(takeReturn(loc('#/me/fitbit?google=connected'), null)).toBeNull();
    expect(takeReturn(loc('#/me/agenda?google=error&error=denied'), null)).toEqual({ error: 'denied' });
  });
});

describe('the editor: clock of a time zone and reminder rows', () => {
  it('shows a moment on the clock of its zone', () => {
    expect(clockIn('2026-10-29T17:30:00Z', 'Europe/Zurich')).toEqual({ day: '2026-10-29', time: '18:30' });
    expect(clockIn('2026-10-29T17:30:00Z', 'America/New_York')).toEqual({ day: '2026-10-29', time: '13:30' });
    expect(clockIn('2026-10-29T23:30:00Z', 'Asia/Tokyo')).toEqual({ day: '2026-10-30', time: '08:30' });
  });
  it('turns reminders into rows in the biggest whole unit and back', () => {
    expect(remindRow({ minutes: 1440, method: 'popup' })).toEqual({ n: 1, unit: 'days', method: 'popup' });
    expect(remindRow({ minutes: 90, method: 'email' })).toEqual({ n: 90, unit: 'minutes', method: 'email' });
    expect(remindRow({ minutes: 120, method: 'popup' })).toEqual({ n: 2, unit: 'hours', method: 'popup' });
    expect(remindMinutes({ n: 2, unit: 'weeks', method: 'popup' })).toEqual({ minutes: 20160, method: 'popup' });
    expect(remindMinutes(remindRow({ minutes: 0, method: 'popup' }))).toEqual({ minutes: 0, method: 'popup' });
  });
});
