// TrainingPeaks-Plan (Noah 19.11.2026): paste a made-up link on Ich › Verbindungen, the planned workouts stand in
// Training › Meine Woche marked «TP», the link is shown hidden and removed with Undo. The server is answered by the
// test; fictional link and workouts only. Screenshots with SHOTS=<folder>.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
const ymd = (d) => d.replace(/-/g, '');
const LINK = 'https://www.trainingpeaks.com/ical/TESTaaaa11bbbb.ics';

const ics = () =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:e2e-tp-1@test', 'SUMMARY:Bike - Endurance Z2', `DTSTART:${ymd(day(1))}T080000`, `DTEND:${ymd(day(1))}T093000`, 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:e2e-tp-2@test', 'SUMMARY:Run Intervals', `DTSTART;VALUE=DATE:${ymd(day(2))}`, 'DESCRIPTION:Planned duration: 0:45', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:e2e-tp-3@test', 'SUMMARY:Swim Technique', `DTSTART;VALUE=DATE:${ymd(day(3))}`, 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n');

test('TrainingPeaks: link in, workouts in My week with TP, link hidden, remove with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  let asked = null;
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck\?a=trainingpeaks/, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    asked = route.request().postDataJSON();
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ics: ics() }) });
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const shot = async (name) => {
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name}.png`, fullPage: false });
  };
  await page.goto('./#/flow');
  await ready(page);

  await page.goto('./#/me/connections');
  const card = page.locator('[data-section="trainingpeaks"]');
  await expect(card.getByRole('heading', { name: 'TrainingPeaks-Plan' })).toBeVisible();
  await expect(card.locator('[data-tp-empty]')).toContainText('Wo finde ich den Link in TrainingPeaks?');
  await card.scrollIntoViewIfNeeded();
  await shot('tp-leer');
  await card.locator('[data-tp-link]').fill('https://example.com/nope');
  await card.getByRole('button', { name: 'Testen und hinzufügen' }).click();
  await expect(card.getByRole('status')).toContainText('kein TrainingPeaks-Kalender-Link');
  expect(asked).toBeNull();

  await card.locator('[data-tp-link]').fill(LINK.replace('https://', 'webcal://'));
  await card.getByRole('button', { name: 'Testen und hinzufügen' }).click();
  await expect(card.getByRole('status')).toContainText('2 geplante Einheiten');
  await expect(card.getByRole('status')).toContainText('1 Eintrag ohne Dauer weggelassen');
  expect(asked).toEqual({ url: LINK });
  await expect(card.locator('[data-tp-card] .masked')).not.toContainText('TEST');
  await expect(page.locator('body')).not.toContainText('TESTaaaa11');
  await card.scrollIntoViewIfNeeded();
  await shot('tp-verbunden');

  await page.goto('./#/flow/training');
  await ready(page);
  const planned = page.locator('[data-planned]');
  await expect(planned).toHaveCount(2);
  await expect(page.locator('[data-planned]', { hasText: 'Bike - Endurance Z2' })).toContainText('TP');
  await page.locator('[data-week-range]').scrollIntoViewIfNeeded();
  await shot('tp-woche');

  // remove with Undo
  await page.goto('./#/me/connections');
  await card.getByRole('button', { name: 'Entfernen' }).click();
  await page.getByRole('button', { name: 'Entfernen' }).last().click();
  await expect(card.locator('[data-tp-empty]')).toBeVisible();
  await page.goto('./#/flow/training');
  await ready(page);
  await expect(page.locator('[data-planned]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('TrainingPeaks: the server is refused (403) and says so; the calendar file read by hand is the way out', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck\?a=trainingpeaks/, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    return route.fulfill({ status: 502, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ error: 'refused', code: 'refused', message: 'TrainingPeaks does not let the server read this calendar (answer 403).', status: 403 }) });
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./#/flow');
  await ready(page);
  await page.goto('./#/me/connections');
  const card = page.locator('[data-section="trainingpeaks"]');
  await card.locator('[data-tp-link]').fill(LINK);
  await card.getByRole('button', { name: 'Testen und hinzufügen' }).click();
  await expect(card.getByRole('status')).toContainText('lässt den Server der App diesen Kalender nicht lesen');
  await expect(card.getByRole('status')).toContainText('Antwort 403');
  await expect(card.locator('[data-tp-file]')).toContainText('Geht der Link nicht?');
  await card.locator('[data-tp-file]').scrollIntoViewIfNeeded();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/tp-403-${info.project.name}.png`, fullPage: false });
  await card.locator('[data-tp-file-input]').setInputFiles({ name: 'plan.ics', mimeType: 'text/calendar', buffer: Buffer.from(ics()) });
  await expect(card.getByRole('status')).toContainText('2 geplante Einheiten');
  await expect(page.locator('body')).not.toContainText('TESTaaaa11');
  await card.locator('[data-tp-file-input]').setInputFiles({ name: 'notes.ics', mimeType: 'text/calendar', buffer: Buffer.from('not a calendar') });
  await expect(card.getByRole('status')).toContainText('Diese Datei ist kein Kalender');
  await card.scrollIntoViewIfNeeded();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/tp-datei-${info.project.name}.png`, fullPage: false });
  await page.goto('./#/flow/training');
  await ready(page);
  await expect(page.locator('[data-planned]')).toHaveCount(2);
  await expect(page.locator('[data-planned]', { hasText: 'Bike - Endurance Z2' })).toContainText('TP');
  expect(errors).toEqual([]);
});

