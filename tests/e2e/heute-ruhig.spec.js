// v0.73.0 «Ruhige Startseite + Fotoband» (Noah 10.10.2026, Heute ruhiger 1–5 a, Foto auf Heute 1–4 a):
// the photo on Today is sharp (a 140 px band over the trip card on a phone, 300 px inside the card on a
// computer), the 8 buttons stay in the first screen of a 390×844 phone, the greeting is one line, the
// suggestion is one slim row under a trip of today (big beside the greeting without one), and
// «Weitermachen» is left out for the trip the card already shows. Fictional data only (test_data_gtp_),
// the clock on Friday 9 October 2026 (Europe/Zurich), Open-Meteo mocked; SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { D0, homeFixture, openHome, trip, entries } from './home0460-fixture.js';

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

test('a trip today: sharp photo, band on a phone, the 8 buttons in the first screen, the slim suggestion, no double Continue', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const phone = info.project.name === 'phone';
  const T = await openHome(page, context, info, { data: withTripToday(), hour: 15 });

  await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Tagestour');
  // Noah 2a: «Weitermachen» would show the same trip: left out
  await expect(page.locator('[data-row="continue"]')).toHaveCount(0);

  // the photo: sharp (no pale layer), place and month
  const ph = page.locator(`[data-photo="${phone ? 'band' : 'side'}"]`);
  await expect(ph).toBeVisible();
  await expect(page.locator('[data-photo]')).toHaveCount(1);
  await expect(ph).toContainText('test_data_gtp_ Seeufer · Juli 2025');
  for (const el of [ph, ph.locator('img')]) expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  await expect(ph).toHaveAttribute('href', '#/bikes?bike=bike-test');
  const box = await ph.boundingBox();
  const card = await page.locator('section.trip').boundingBox();
  if (phone) {
    // a band of 140 px, the trip card lies over its lower edge
    expect(Math.round(box.height)).toBe(140);
    await expect(ph).toContainText(T('Album'));
    expect(card.y).toBeLessThan(box.y + box.height);
    expect(card.y).toBeGreaterThan(box.y + 80);
  } else {
    // right inside the trip card, about 300 px wide
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(280);
    expect(Math.round(box.width)).toBeLessThanOrEqual(300);
    expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width + 1);
  }

  // Noah 5a: the greeting in one line on a computer (no line break in it)
  await expect(page.locator('#hello-h br')).toHaveCount(0);
  if (!phone) expect((await page.locator('#hello-h').boundingBox()).height).toBeLessThan(60);

  // Noah 1a: the suggestion for tomorrow is one slim row under the trip card, with a light button
  const row = page.locator('[data-suggestion][data-slim]');
  await expect(row).toBeVisible();
  await expect(page.locator('[data-suggestion]')).toHaveCount(1);
  await expect(row).toContainText(T('Dry tomorrow'));
  expect((await row.boundingBox()).height).toBeLessThanOrEqual(72);
  expect((await row.boundingBox()).y).toBeGreaterThan(card.y + card.height - 1);
  await expect(row.locator('.btn.hi')).toHaveCount(0);
  await expect(row.getByRole('button', { name: phone ? T('Start|dayride') : T('Start day ride'), exact: true })).toBeVisible();

  // the rule of 0.46: greeting, trip card and the 8 (12) buttons without scrolling, on a 390×844 phone
  if (phone) await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const buttons = page.locator('[data-section="actions"] .grid > button');
  await expect(buttons).toHaveCount(phone ? 8 : 12);
  if (phone) for (const b of await buttons.all()) expect(await firstScreen(b), `${await b.textContent()} in the first screen`).toBe(true);
  expect(await firstScreen(page.locator('#hello-h'))).toBe(true);
  await shot(page, info, 'heute-mit-tour');

  // «Album ›» opens the bike's photos in Setup
  await ph.click();
  await expect(page).toHaveURL(/#\/bikes\?bike=bike-test$/);
  await expect(page.locator('details.sfold[open]').filter({ has: page.locator('.gal') })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('no trip today: the suggestion stays big beside the greeting; no photo, no band; Continue for another trip', async ({ page, context }, info) => {
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
  const sugg = page.locator('[data-suggestion]');
  await expect(sugg).toHaveCount(1);
  await expect(sugg).not.toHaveAttribute('data-slim');
  await expect(page.locator('.greet [data-suggestion]')).toContainText(T('Start day ride'));
  await expect(page.locator('#hello-h br')).toHaveCount(0);
  await shot(page, info, 'heute-ohne-tour');
  expect(errors).toEqual([]);
});
