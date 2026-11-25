// «Termine ziehen» (Noah 24.11.2026 «1a 2b 3a 4a»): in the week grid of «Termine und Aufgaben» an appointment can be moved
// (mouse: pull the block; keyboard: arrow keys; everywhere: «Move …» in the details). The move goes to Google like the form
// does, offers Undo that writes it back, and an appointment of a read-only calendar stays put and says why.
// The server and the Google login are answered by the test; fictional entries only.
import { test, expect } from './clock.js';
import { viaTab } from './placetab.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const de = (en) => DE[en] ?? en;
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
// a moment on the clock of Zurich (winter or summer time of that day), so the test does not depend on the month
const zurich = (d, hhmm) => {
  const off = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', timeZoneName: 'longOffset' }).formatToParts(new Date(`${d}T12:00:00Z`)).find((x) => x.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  return `${d}T${hhmm}:00${off}`;
};
const ev = (id, d, over = {}) => ({ id: `cal1|${id}`, gid: id, cal: 'cal1', title: id, where: '', note: '', allDay: false, day: d, lastDay: d, start: zurich(d, '18:00'), end: zurich(d, '19:00'), link: null, busy: true, ...over });

test('Termine ziehen: move in the week grid, Move window, Undo, read-only stays put', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const log = [];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const step = new URL(req.url()).searchParams.get('step');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    log.push({ step, body });
    const ok = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'status') return ok({ connected: true, calendar: true, tasks: false });
    if (step === 'cal-list') return ok({ calendars: [{ id: 'cal1', name: 'Noah Muster', color: '#4a90d9', primary: true, write: true }, { id: 'cal2', name: 'Feiertage', color: '#7a9a5a', primary: false, write: false }] });
    if (step === 'cal-events') return ok({ events: [ev('Tennis-Lektion', day(1)), ev('Feiertag Muster', day(1), { id: 'cal2|f1', gid: 'f1', cal: 'cal2', start: zurich(day(1), '10:00'), end: zurich(day(1), '11:00') })] });
    if (step === 'cal-save') return ok({ event: ev(body.title, body.day, { gid: body.gid ?? 'new1', id: `cal1|${body.gid ?? 'new1'}`, start: zurich(body.day, body.from), end: zurich(body.day, body.to) }) });
    return ok({});
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', 'test_data_ziehen_key');
    localStorage.setItem('pg.agenda.view', 'week');
  });
  await page.goto('./');
  await ready(page);
  await viaTab(page, 'week', '#/me/agenda');
  // the connection exists on this device: calendar on, no login needed
  const grid = page.locator('[data-week-grid]');
  await expect(grid).toBeVisible();
  const block = grid.locator('[data-ev="cal1|Tennis-Lektion"]');
  await expect(block).toBeVisible();
  const saves = () => log.filter((x) => x.step === 'cal-save');

  // keyboard: one quarter hour later (the same step the mouse and the finger use)
  await block.focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => saves().at(-1)?.body).toMatchObject({ gid: 'Tennis-Lektion', cal: 'cal1', day: day(1), from: '18:15', to: '19:15' });
  await expect(page.locator('.rtoast')).toContainText('Tennis-Lektion');
  await expect(page.locator('.rtoast')).toContainText('Google Kalender');
  // Undo writes the old time back to Google
  await page.locator('.rtoast').getByRole('button', { name: de('Undo') }).click();
  await expect.poll(() => saves().at(-1)?.body).toMatchObject({ gid: 'Tennis-Lektion', from: '18:00', to: '19:00' });

  // «Move …»: a tap opens the details, the window sets day and time; the length stays
  await grid.locator('[data-ev="cal1|Tennis-Lektion"]').click();
  await page.locator('[data-ev-move]').click();
  const sheet = page.locator('[data-move-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-move-sync]')).toBeVisible();
  await sheet.getByLabel(de('Day')).fill(day(2));
  await sheet.getByLabel(de('Time'), { exact: true }).fill('16:30');
  await sheet.getByRole('button', { name: de('Move|button') }).click();
  await expect.poll(() => saves().at(-1)?.body).toMatchObject({ gid: 'Tennis-Lektion', day: day(2), from: '16:30', to: '17:30' });

  // the mouse pulls the block (a computer; a finger uses press and hold)
  if (info.project.name === 'desktop') {
    const pulled = grid.locator('[data-ev="cal1|Tennis-Lektion"]');
    await expect(pulled).toBeVisible();
    await expect.poll(async () => (await pulled.boundingBox())?.y ?? -1).toBeGreaterThan(0); // the grid has settled after the last move
    const b = await pulled.boundingBox();
    const before = saves().length;
    await page.mouse.move(b.x + b.width / 2, b.y + 10);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 - b.width, b.y + 10 + 22, { steps: 6 }); // half an hour down and one day to the left
    await page.mouse.up();
    await expect.poll(() => saves().length).toBe(before + 1);
    expect(saves().at(-1).body).toMatchObject({ gid: 'Tennis-Lektion', day: day(1), from: '17:00', to: '18:00' });
  }

  // an appointment of a read-only calendar stays put and says why
  const ro = grid.locator('[data-ev="cal2|f1"]');
  const n = saves().length;
  const rb = await ro.boundingBox();
  await page.mouse.move(rb.x + rb.width / 2, rb.y + 8);
  await page.mouse.down();
  await page.mouse.move(rb.x + rb.width / 2, rb.y + 60, { steps: 5 });
  await page.mouse.up();
  await ro.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  expect(saves().length).toBe(n);
  await ro.click();
  await expect(page.locator('[data-ev-lock]')).toContainText(de('This calendar is read-only, so the appointment cannot be moved here.'));
  await expect(page.locator('[data-ev-move]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
