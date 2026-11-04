// «Tourenpass mit Stempel» (Paket E, Idee 18): the Rückblick of a trip offers a stamp, the pass collects them, a stamp
// can be changed, removed with Undo, an own one added. German UI, fictional data.
import { test, expect } from './clock.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const TRIP = 'test_data_gtp_stamp1';
const TRIP2 = 'test_data_gtp_stamp2';

async function open(page, context, info, { trips = true } = {}) {
  const d = sn4plusData();
  if (trips) {
    const base = d.tables.trips[0];
    const at = `${day(-3)}T18:00:00.000Z`;
    const mk = (id, title, n, km) => ({ ...base, id, title, startDate: day(n), days: 1, status: 'done', finished: day(n), route: { name: 'x', km, gainM: 800, line: [[47, 8], [47.1, 8.1]], profile: [[0, 500], [km, 700]] } });
    d.tables.trips = [mk(TRIP, 'Test Pass Loop', -3, 84), mk(TRIP2, 'Seeland Test', -10, 61)];
    d.tables.debriefs = [TRIP, TRIP2].map((tripId) => ({ tripId, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', applied: [], km: 60, kmApplied: 0, doneAt: at, createdAt: at, updatedAt: at }));
  }
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/tourenpass-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
}

test('Idee 18: the saved Rückblick offers a stamp; stamping puts it into the pass, which can change and remove it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto(`./#/debrief/${TRIP}`);
  const offer = page.locator('[data-stamp-offer]');
  await offer.scrollIntoViewIfNeeded();
  await expect(offer).toBeVisible();
  await expect(offer.locator('[data-stamp]')).toContainText('Test Pass Loop');
  await expect(offer.locator('[data-stamp]')).toContainText('84 km');
  // change the place before stamping
  await offer.locator('[data-stamp-place]').fill('Test Pass Runde');
  await offer.locator('[data-stamp-press]').click();
  const done = page.locator('[data-stamp-done]');
  await expect(done).toContainText('Test Pass Runde');
  await expect(page.locator('[data-stamp-offer]')).toHaveCount(0);
  // the pass
  await done.getByRole('link', { name: /Tourenpass/ }).click();
  await expect(page).toHaveURL(/#\/debrief\/tourenpass$/);
  const root = page.locator('[data-tourenpass]');
  await expect(root.locator(`[data-stamp-row="s-${TRIP}"]`)).toContainText('Test Pass Runde');
  // the other trip is still offered here
  await expect(root.locator(`[data-offer="${TRIP2}"]`)).toContainText('Seeland Test');
  await root.locator(`[data-offer="${TRIP2}"] [data-stamp-take]`).click();
  await expect(root.locator('[data-stamp]')).toHaveCount(2);
  await expect(root.locator('[data-stamp-offers]')).toHaveCount(0);
  // change a stamp
  await root.locator(`[data-stamp-row="s-${TRIP2}"] [data-stamp-edit]`).click();
  await root.locator('#tp-place').fill('Seeland Runde');
  await root.locator('#tp-km').fill('65');
  await root.getByRole('button', { name: 'Speichern' }).click();
  await expect(root.locator(`[data-stamp-row="s-${TRIP2}"]`)).toContainText('Seeland Runde');
  await expect(root.locator(`[data-stamp-row="s-${TRIP2}"]`)).toContainText('65 km');
  // an own stamp
  await root.locator('[data-stamp-new]').click();
  await root.locator('#tp-place').fill('Col Test');
  await root.getByRole('button', { name: 'Speichern' }).click();
  await expect(root.locator('[data-stamp]')).toHaveCount(3);
  // remove one: asked first, Undo brings it back
  await root.locator(`[data-stamp-row="s-${TRIP}"] [data-stamp-drop]`).click();
  await page.getByRole('dialog').getByRole('button', { name: /Löschen|Entfernen/ }).last().click();
  await expect(root.locator('[data-stamp]')).toHaveCount(2);
  await page.getByRole('button', { name: /Rückgängig/ }).click();
  await expect(root.locator('[data-stamp]')).toHaveCount(3);
  // it stays after a reload
  await page.reload();
  await expect(page.locator('[data-tourenpass] [data-stamp]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('Idee 18: «No stamp» leaves the trip out of the offer, the page lists it and lets it back in', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto(`./#/debrief/${TRIP}`);
  await page.locator('[data-stamp-leave]').click();
  await expect(page.locator('[data-stamp-offer]')).toHaveCount(0);
  await page.goto('./#/debrief/tourenpass');
  const root = page.locator('[data-tourenpass]');
  await expect(root.locator(`[data-offer="${TRIP}"]`)).toHaveCount(0);
  await root.locator('[data-stamp-reset]').click();
  await expect(root.locator(`[data-offer="${TRIP}"]`)).toHaveCount(1);
});

test('Idee 18: the way in from the Rückblick, and an empty pass says why and offers a first stamp', async ({ page, context }, info) => {
  await open(page, context, info, { trips: false });
  await page.goto('./#/debrief');
  const row = page.locator('[data-m-row="tourenpass"]');
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(page).toHaveURL(/#\/debrief\/tourenpass$/);
  const root = page.locator('[data-tourenpass]');
  await expect(root.locator('[data-empty]')).toContainText('Noch kein Stempel');
  await root.locator('[data-empty]').getByRole('button', { name: 'Stempel hinzufügen' }).click();
  await expect(page.locator('#tp-place')).toBeVisible();
});
