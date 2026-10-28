// v0.100.0 Design-Refresh P1 «Zurück, Schritte, Weiter-Leiste» (G7, Noah 11.10.2026 23:10 «Runde 1 alles ★
// und G1–G12 freigegeben»; 12.10.2026 «10 Pakete»): a trip page is light: «‹ Touren» above the name, the
// four steps with a number, and the next step in a bar at the bottom («Schritt 1 von 4 · Zurück zu Touren ·
// Weiter zu …»). On a phone the bar sits above the five places.
import { test, expect } from '@playwright/test';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // Schrittleiste (Noah 26.10.2026 «1b», changed on purpose): the bar's short names
import { base, tr, mockWeather } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const D0 = '2026-10-14';
const day = (n) => {
  const [y, m, d] = D0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const ID = 'test_data_gtp_Schritte';
const entries = base.tables.items.slice(3, 9).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: false }));
const trip = {
  id: ID, title: 'test_data_gtp_ Schritte', domain: 'bikepacking', startDate: day(4), days: 3, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries, ready: [], status: 'planned', createdAt: `${day(-10)}T08:00:00.000Z`,
};

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+02:00`));
  await context.addInitScript((id) => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('pack.currentTrip', id);
  }, ID);
  const d = structuredClone(base);
  d.tables.trips = [trip];
  d.tables.debriefs = [];
  d.tables.notes = [];
  await page.goto('./#/');
  await importAndSettle(page, { name: 'schritte.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), ID);
});

test('a trip page: light head with «‹ Touren», numbered steps, the next step in the bar at the bottom', async ({ page }, info) => {
  await page.goto('./#/pack');
  await page.reload();
  await settle(page);
  const band = page.locator('.trip-band');
  await expect(band.locator('h1')).toContainText('Schritte');
  // light: no dark box behind the name
  expect(await band.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const back = band.locator('.crumb a');
  await expect(back).toHaveText(T('Trips|place'));
  await expect(back).toHaveAttribute('href', '#/trips');
  // the four steps and, since 0.174 «Eine Tour, eine Seite» (UI-Ziele #5), «Auswertung»; the first one is this page
  const steps = band.locator('.stepbar a');
  await expect(steps).toHaveCount(5);
  await expect(steps.first()).toHaveAttribute('aria-current', 'page');
  // the number comes from a counter (on a computer, in a circle), so the link's text stays the name
  await expect(steps.first()).toHaveText(new RegExp(`^${T(BAR.plan)}`));
  if (info.project.name === 'desktop') expect(await steps.first().locator('.no').evaluate((el) => getComputedStyle(el, '::before').content)).toBe('counter(step)');

  await page.screenshot({ path: info.outputPath(`schritte-oben.png`) });
  const bar = page.locator('.mainbar');
  const box = await bar.boundingBox();
  const vh = page.viewportSize().height;
  if (info.project.name === 'desktop') {
    // at the very bottom of the window, next to the sidebar
    expect(Math.abs(box.y + box.height - vh)).toBeLessThan(2);
    expect(box.x).toBeGreaterThanOrEqual(250);
    await expect(bar.locator('.step')).toHaveText(T('Step {n} of {m}', { n: 1, m: 4 }));
    await expect(bar.getByRole('link', { name: T('Back to Trips') })).toBeVisible();
    // the main button is the last thing on the right
    const main = await bar.locator('.btn.hi').boundingBox();
    expect(main.x + main.width).toBeGreaterThan(page.viewportSize().width - 120);
  } else {
    // above the five places at the bottom
    const places = await page.locator('nav.bottom').boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(places.y + 1);
    await expect(bar.locator('.step')).toBeHidden();
  }
  // nothing hides under the bar: the end of the page scrolls above it
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await page.screenshot({ path: info.outputPath(`schritte-unten.png`) });
});
