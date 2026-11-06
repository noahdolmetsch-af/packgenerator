// Spielerplus-Kalender (Noah 06.11.2026): paste a made-up team link on Ich › Verbindungen, the dates stand in the
// week and on Today, the link is shown hidden. The server is answered by the test; fictional link and dates only.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
const ymd = (d) => d.replace(/-/g, '');
const LINK = 'https://www.spielerplus.de/events/ics?t=TESTaaaa11&u=TESTbbbb22';

const ics = () =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:e2e-1@test', 'SUMMARY:Training Muster', `DTSTART:${ymd(day(0))}T190000`, `DTEND:${ymd(day(0))}T203000`, 'LOCATION:Halle Nord', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:e2e-2@test', 'SUMMARY:Spiel Muster', `DTSTART:${ymd(day(1))}T140000`, 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n');

test('Spielerplus: link in, dates in the week and on Today, link hidden', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  let asked = null;
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck\?a=spielerplus/, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    asked = route.request().postDataJSON();
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ics: ics() }) });
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./#/flow');
  await ready(page);

  await page.goto('./#/me/connections');
  const card = page.locator('[data-section="spielerplus"]');
  await expect(card.getByRole('heading', { name: 'Spielerplus-Kalender' })).toBeVisible();
  await card.locator('[data-sp-link]').fill('https://example.com/nope');
  await card.getByLabel('Teamname (frei gewählt)').fill('Muster-Team');
  await card.getByRole('button', { name: 'Testen und hinzufügen' }).click();
  await expect(card.getByRole('status')).toContainText('kein Spielerplus-Kalender-Link');
  expect(asked).toBeNull();

  await card.locator('[data-sp-link]').fill(LINK);
  await card.getByRole('button', { name: 'Testen und hinzufügen' }).click();
  await expect(card.getByRole('status')).toContainText('Fertig: 2 Team-Termine gefunden.');
  expect(asked).toEqual({ url: LINK });
  const row = card.locator('[data-sp-cal]');
  await expect(row).toHaveCount(1);
  await expect(row.getByLabel('Teamname')).toHaveValue('Muster-Team');
  await expect(row.locator('.masked')).not.toContainText('TEST');
  await expect(page.locator('body')).not.toContainText('TESTaaaa11');

  // the week: the dates with the word Spielerplus and the way to sign up
  await page.goto('./#/week');
  await ready(page);
  const en = page.locator('[data-entry^="sp:"]', { hasText: 'Training Muster' });
  await expect(en).toBeVisible();
  await expect(en).toContainText('Spielerplus');
  await expect(en.locator('a')).toHaveAttribute('href', /^https:\/\/www\.spielerplus\.de\//);
  await expect(en.locator('a')).toHaveAttribute('target', '_blank');

  // Today: the training of the day
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('[data-due="sp"]')).toContainText('19:00 Training Muster');

  // off: the dates are gone from the week
  await page.goto('./#/me/connections');
  await page.locator('[data-sp-cal] input[role="switch"]').uncheck();
  await page.goto('./#/week');
  await ready(page);
  await expect(page.locator('[data-entry^="sp:"]')).toHaveCount(0);

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
