// Google Kalender und Aufgaben (GA, Noah 15.10.2026 «3 beides», 21:11 «3b»; built «vorerst ohne mockup»):
// Ich › Termine und Aufgaben connects calendar and tasks with the Google login, shows the next 14 days
// and the tasks, ticks and adds a task and enters an appointment; every change goes to the server first.
// The server (packgen-three.vercel.app/api/google) and the Google login are answered by the test;
// everything else outside the preview server is blocked. Fictional entries only.
import { test, expect } from './clock.js';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';
const de = (en) => DE[en] ?? en;
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  // The whole page in one picture: a viewport as tall as the page, so the fixed bottom bar sits at the end
  // like after scrolling down, not across the middle of the picture.
  const size = page.viewportSize();
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, tall) });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await page.setViewportSize(size);
};
const ev = (id, d, over = {}) => ({ id: `cal1|${id}`, gid: id, cal: 'cal1', title: id, where: '', note: '', allDay: false, day: d, lastDay: d, start: `${d}T08:30:00+02:00`, end: `${d}T09:15:00+02:00`, link: 'https://calendar.example.test/x', busy: true, ...over });

test('Termine und Aufgaben: connect, see the next days, tick and add a task, enter an appointment', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const log = [];
  let allowed = false;
  let failList = 1; // the first fetch after the login fails once: the page shows it and waits for «Jetzt holen»
  const tasks = [
    { id: 't1', list: 'l1', title: 'Kette messen', notes: '', due: day(2), done: false, doneAt: null, parent: null, position: '1' },
    { id: 't2', list: 'l1', title: 'Pneu flicken', notes: 'hinten', due: day(-1), done: false, doneAt: null, parent: null, position: '2' },
    { id: 't3', list: 'l1', title: 'Rechnung Muster zahlen', notes: '', due: null, done: false, doneAt: null, parent: null, position: '3' },
  ];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    log.push({ step, auth: req.headers().authorization ?? null, params: Object.fromEntries(url.searchParams), body });
    const ok = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'status') return ok({ connected: allowed, calendar: allowed, tasks: allowed });
    if (step === 'start') return ok({ url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y' });
    if (step === 'cal-list' && failList-- > 0) return route.fulfill({ status: 503, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ error: 'google_down' }) });
    if (step === 'cal-list') return ok({ calendars: [{ id: 'cal1', name: 'Noah Muster', color: '#4a90d9', primary: true, write: true }, { id: 'cal2', name: 'Feiertage', color: '#7a9a5a', primary: false, write: false }] });
    if (step === 'cal-events') return ok({ events: [ev('Zahnarzt Muster', day(0), { where: 'Praxis Muster' }), ev('Tennis-Lektion', day(1), { start: `${day(1)}T18:00:00+02:00`, end: `${day(1)}T19:00:00+02:00` }), ev('Jura-Wochenende', day(3), { allDay: true, lastDay: day(4), start: day(3) })] });
    if (step === 'task-lists') return ok({ lists: [{ id: 'l1', title: 'Meine Aufgaben' }] });
    if (step === 'tasks') return ok({ tasks });
    if (step === 'task-save') {
      const old = tasks.find((x) => x.id === body.id);
      return ok({ task: { ...(old ?? { id: 'tnew', list: body.list, notes: '', due: null, done: false, doneAt: null, parent: null, position: '0' }), ...body } });
    }
    if (step === 'cal-save') return ok({ event: ev(body.title, body.day, { gid: 'new1', id: 'cal1|new1', start: `${body.day}T${body.from}:00+02:00`, end: `${body.day}T${body.to}:00+02:00` }) });
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/accounts\.google\.com\/o\/oauth2/, (route) => {
    allowed = true;
    return route.fulfill({ status: 302, headers: { location: `${baseURL}#/me/agenda?google=connected` } });
  });
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./');
  await ready(page);

  // Planen › Termine (UI-Ziele #6, was Ich › Termine und Aufgaben): not connected, both ticked
  await viaTab(page, 'week', '#/me/agenda');
  await expect(page.getByRole('heading', { level: 1, name: de('Appointments and tasks') })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: new RegExp(de('Google Calendar')) })).toBeChecked();
  await shot(page, info, 'A1-verbinden');
  await page.getByRole('button', { name: de('Connect with Google') }).click();

  // back: the address is clean, the first fetch asked for the span with this device's key
  await expect(page.getByRole('heading', { name: de('Appointments'), exact: true })).toBeVisible();
  expect(page.url()).not.toContain('google=');
  expect(log.find((x) => x.step === 'start').body.services).toEqual(['calendar', 'tasks']);
  // a failed first fetch is not repeated by itself (no loop against the server); «Jetzt holen» tries again
  await expect.poll(() => log.filter((x) => x.step === 'cal-list').length).toBe(1);
  await page.waitForTimeout(1500);
  expect(log.filter((x) => x.step === 'cal-list').length).toBe(1);
  await page.getByRole('button', { name: de('Fetch now') }).click();
  await expect.poll(() => log.find((x) => x.step === 'cal-events')?.params).toMatchObject({ from: day(-7), to: day(60), cal: 'cal1' });
  expect(log.find((x) => x.step === 'cal-events').auth).toBe(`Bearer ${P}key`);
  await expect(page.getByText('Zahnarzt Muster')).toBeVisible();
  await expect(page.getByText('Jura-Wochenende')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: `${de('Overdue')} · 1` })).toBeVisible();
  await shot(page, info, 'A2-termine-aufgaben');

  // tick a task: it goes to Google, then the copy follows
  await page.getByRole('button', { name: `${de('Done: {name}').replace('{name}', 'Pneu flicken')}` }).click();
  await expect.poll(() => log.find((x) => x.step === 'task-save')?.body).toEqual({ list: 'l1', id: 't2', done: true });
  await expect(page.getByRole('heading', { name: new RegExp(de('Overdue')) })).toHaveCount(0);

  // a new task with a due day
  await page.getByRole('textbox', { name: de('New task') }).fill('Druck erfassen');
  await page.getByRole('button', { name: de('Add') }).click();
  await expect.poll(() => log.filter((x) => x.step === 'task-save').at(-1)?.body).toEqual({ list: 'l1', title: 'Druck erfassen' });
  await expect(page.getByText('Druck erfassen').first()).toBeVisible();

  // a new appointment
  await page.getByRole('button', { name: de('New appointment') }).click();
  const form = page.getByRole('form', { name: de('New appointment') });
  await form.getByLabel(de('Title')).fill('Velo-Service');
  await form.getByLabel(de('From|time')).fill('17:30');
  await form.getByLabel(de('To|time'), { exact: true }).fill('18:00');
  // the editor of Google: a reminder a day before, free, a description
  await form.getByLabel(de('Description (optional)')).fill('Kette und Bremsen');
  await form.getByLabel(de('Google standard reminders')).uncheck();
  await form.getByLabel(de('How long before')).fill('1');
  await form.getByLabel(de('Unit|time')).selectOption('days');
  await form.getByLabel(de('Show me as')).selectOption({ label: de('Free|show') });
  await shot(page, info, 'A3-termin');
  await form.getByRole('button', { name: de('Enter in Google') }).click();
  await expect.poll(() => log.find((x) => x.step === 'cal-save')?.body).toMatchObject({ cal: 'cal1', title: 'Velo-Service', day: day(0), allDay: false, from: '17:30', to: '18:00', note: 'Kette und Bremsen', busy: false, visibility: 'default', tz: 'Europe/Zurich', remind: [{ minutes: 1440, method: 'popup' }] });
  await expect(page.getByText('Velo-Service').first()).toBeVisible();

  // «Duplicate»: the form is filled in and nothing goes to Google before «Enter in Google»
  const saves = log.filter((x) => x.step === 'cal-save').length;
  const row = page.getByRole('button', { name: /Zahnarzt Muster/ });
  const shown = (await row.locator('.time').innerText()).trim(); // the fixture says +02:00; Zurich is on winter time now
  await row.click();
  await page.getByRole('button', { name: de('Duplicate') }).click();
  const copy = page.getByRole('form', { name: de('Copy appointment') });
  await expect(copy.getByLabel(de('Title'))).toHaveValue('Zahnarzt Muster');
  await expect(copy.getByLabel(de('From|time'))).toHaveValue(shown);
  expect(log.filter((x) => x.step === 'cal-save').length).toBe(saves);
  await copy.getByRole('button', { name: de('Enter in Google') }).click();
  await expect.poll(() => log.filter((x) => x.step === 'cal-save').length).toBe(saves + 1);
  const dup = log.filter((x) => x.step === 'cal-save').at(-1).body;
  expect(dup).toMatchObject({ cal: 'cal1', title: 'Zahnarzt Muster', day: day(0), from: shown });
  expect(dup.gid).toBeUndefined();

  // the week grid (Noah 28.10.2026 «wie bei Google»): blocks, a tap opens one, a tap on an empty place starts a new one
  await page.locator('[data-view="week"]').click();
  const grid = page.locator('[data-week-grid]');
  await expect(grid).toBeVisible();
  await expect(grid.getByRole('button', { name: /Zahnarzt Muster/ }).first()).toBeVisible();
  await expect(grid.getByRole('button', { name: /Tennis-Lektion/ })).toBeVisible();
  await shot(page, info, 'A5-wochenraster');
  await grid.getByRole('button', { name: /Tennis-Lektion/ }).click();
  await expect(page.locator('.pk').getByRole('heading', { name: 'Tennis-Lektion' })).toBeVisible();
  await expect(page.locator('.pk').getByRole('button', { name: de('Duplicate') })).toBeVisible();
  const col = grid.locator('.col').first();
  await col.click({ position: { x: 4, y: 44 * 15 + 4 } }); // about 15:00
  const fresh = page.getByRole('form', { name: de('New appointment') });
  await expect(fresh).toBeVisible();
  await expect(fresh.getByLabel(de('From|time'))).toHaveValue('15:00');
  await expect(fresh.getByLabel(de('To|time'), { exact: true })).toHaveValue('16:00');
  await fresh.getByRole('button', { name: de('Cancel') }).click();
  await page.locator('[data-view="list"]').click();

  // which calendars: the holidays too
  await page.getByRole('checkbox', { name: /Feiertage/ }).check();
  await expect.poll(() => log.filter((x) => x.step === 'cal-events').at(-1)?.params.cal).toBe('cal1,cal2');
  await shot(page, info, 'A4-fertig');

  expect(errors).toEqual([]);
});
