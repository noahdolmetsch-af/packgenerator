// v0.73.0 «Ruhige Startseite + Fotoband» (Noah 10.10.2026, Heute ruhiger 1–5 a, Foto auf Heute 1–4 a):
// 0.96.0 (Noah 11.10.2026 «bild wieder vom homescreen weg»): Today shows no photo, even when the bike
// has photos; they stay under Velos › Setup. The 8 buttons stay in the first screen of a 390×844 phone, the greeting is one line, the
// suggestion is one slim row under a trip of today (big beside the greeting without one), and
// «Weitermachen» is left out for the trip the card already shows. Fictional data only (test_data_gtp_),
// the clock on Friday 9 October 2026 (Europe/Zurich), Open-Meteo mocked; SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { D0, homeFixture, openHome, trip, entries } from './home0460-fixture.js';
import { openMore } from './bike-more.js';
import { READY } from '../../src/lib/home/tiles.js';

// calendar days (no 24 h steps): the date at noon UTC plus n days
const cal = (n) => {
  const [y, m, d] = D0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
// a drawn landscape (no real photo): sky, mountains, lake, meadow
const LAND = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#9cc3dd"/><path d="M0 300 L180 120 L320 260 L470 90 L640 250 L800 150 V500 H0Z" fill="#5f6f78"/><rect y="300" width="800" height="70" fill="#3d7fa6"/><rect y="370" width="800" height="130" fill="#4f8a3c"/></svg>',
).toString('base64')}`;
const photo = (id, extra = {}) => ({ id: `test_data_gtp_${id}`, bikeId: 'bike-test', tripId: null, main: false, name: `test_data_gtp_ ${id}`, data: LAND, addedAt: '2025-07-14T10:00:00.000Z', ...extra });

/** A day ride today (made today, so the ride view does not open by itself) on the bike with a photo. */
function withTripToday({ photos = [photo('Seeufer', { main: true })] } = {}) {
  const data = homeFixture();
  data.tables.trips = data.tables.trips.filter((x) => !x.id.endsWith('Herbstrunde'));
  data.tables.trips.unshift(trip('Tagestour', cal(0), { createdAt: `${cal(0)}T06:00:00.000Z`, entries: entries(6, 0) }));
  data.tables.photos = photos;
  return data;
}

const firstScreen = (loc) =>
  loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return r.top >= 0 && r.bottom <= window.innerHeight && !!hit && el.contains(hit);
  });

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

test('a trip today: no photo although the bike has one, the 8 buttons in the first screen, no suggestion, no double Continue', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const phone = info.project.name === 'phone';
  const T = await openHome(page, context, info, { data: withTripToday(), hour: 15 });

  await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Tagestour');
  // Noah 2a: «Weitermachen» would show the same trip: left out
  await expect(page.locator('[data-row="continue"]')).toHaveCount(0);

  // 0.96.0: no photo on Today (the bike has one), the trip card without the band offset
  await expect(page.locator('[data-photo]')).toHaveCount(0);
  await expect(page.locator('section.trip img')).toHaveCount(0);
  const card = await page.locator('section.trip').boundingBox();

  // Noah 5a: the greeting in one line on a computer (no line break in it)
  await expect(page.locator('#hello-h br')).toHaveCount(0);
  if (!phone) expect((await page.locator('#hello-h').boundingBox()).height).toBeLessThan(60);

  // v0.119.0 «Schnellstart» (Noah Q1 1a): the suggestion is always for today, so with a trip today
  // there is none (it was «Idea for tomorrow» as a slim row under the trip card until 0.117)
  await expect(page.locator('[data-suggestion]')).toHaveCount(0);
  expect(card.height).toBeGreaterThan(0);

  // the rule of 0.46: greeting and trip card without scrolling, on a 390×844 phone (v0.94.0 «Kachel-Wand»,
  // mockup A: the 16 functions are small tiles further down the wall)
  if (phone) await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  // «Heute neu» A (0.165.0, Noah «1A 4a», changed on purpose): «Up now» and the trip card come first; 8 chosen
  // shortcuts (the other functions back through «+»)
  await expect(page.locator('.wall [data-fn]')).toHaveCount(READY.filter((x) => x.id.startsWith('fn:')).length);
  expect(await firstScreen(page.locator('#hello-h'))).toBe(true);
  // «Heute neu» N2 (0.169.0, Noah «5a», changed on purpose): the body and the Aktiv tiles first; on a trip day the
  // trip card right under them
  await expect.poll(() => page.locator('.wall [data-tile]').evaluateAll((els) => els.map((e) => e.dataset.tile).slice(0, 3))).toEqual(['body', 'acts', 'trip']);
  await shot(page, info, 'heute-mit-tour');

  // the photo is still there, under Velos › Setup › More
  await page.goto('./#/bikes?bike=bike-test');
  // Design-Refresh P7 (V1): «Mehr» is a list of rows; the photo sits in the opened folds
  await openMore(page);
  await expect(page.getByText(/test_data_gtp_ Seeufer/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('no trip today: the suggestion is a row of Up now; no photo; Continue for another trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  // a trip that ended yesterday waits for its debrief (the card asks about it), the next one is far
  data.tables.trips = [
    trip('Albula', cal(-2), { days: 2, entries: entries(4, 4) }),
    trip('Fern', cal(20)),
    ...data.tables.trips.filter((x) => x.status === 'done'),
  ];
  data.tables.photos = [];
  const T = await openHome(page, context, info, { data, hour: 9 });

  await expect(page.locator('#next-h')).toHaveText(T('How was {trip}?', { trip: 'test_data_gtp_ Albula' }));
  await expect(page.locator('[data-row="continue"]')).toContainText('test_data_gtp_ Fern');
  await expect(page.locator('[data-photo]')).toHaveCount(0);
  // «Heute neu» A (changed on purpose): the suggestion is one row of «Up now» with «Quick start», the greeting is one sentence
  await expect(page.locator('[data-suggestion]')).toHaveCount(0);
  const idea = page.locator('[data-section="today"] li[data-row="idea"]');
  await expect(idea).toHaveCount(1);
  await expect(idea.getByRole('button', { name: T('Quick start'), exact: true })).toBeVisible();
  await expect(page.locator('#hello-h br')).toHaveCount(0);
  await shot(page, info, 'heute-ohne-tour');
  expect(errors).toEqual([]);
});
