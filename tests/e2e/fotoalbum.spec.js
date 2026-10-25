// Paket P8 «Fotoalbum» (Noah 21.10.2026 «7a», mockups design/fotoalbum): Ich › Fotoalbum with all photos of the app
// by month and by place, chips Album / Velo / Tour, several photos added at once, the photo window (place, date, «Auf Heute
// zeigen», delete with Undo), a bike photo opens its bike. German UI, fictional data (test_data_gtp_), clock Fri 9.10.2026.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const D = `data:image/png;base64,${PNG.toString('base64')}`;

function withPhotos() {
  const data = homeFixture();
  data.tables.photos = [{ id: 'test_data_gtp_ph1', bikeId: 'bike-test', tripId: null, name: 'test_data_gtp_ Setup', data: D, day: '2026-09-12', addedAt: '2026-09-12T08:00:00.000Z' }];
  return data;
}

test('Fotoalbum: add photos, give one a place, by place, off on Today, delete with Undo; a bike photo opens its bike', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: withPhotos() });
  await page.goto('./#/me');
  await page.locator('a[data-row="album"]').click();
  const root = page.locator('[data-page="album"]');
  await expect(root.locator('h1')).toHaveText(T('Photo album'));
  await expect(root.locator('[data-album-photo="bike"]')).toHaveCount(1);
  // two photos at once
  await root.locator('[data-album-file]').setInputFiles([
    { name: 'test_data_gtp_a.png', mimeType: 'image/png', buffer: PNG },
    { name: 'test_data_gtp_b.png', mimeType: 'image/png', buffer: PNG },
  ]);
  await expect(root.locator('[data-album-photo="album"]')).toHaveCount(2);
  await expect(root.locator('[data-album-kind="album"]')).toContainText('2');
  // the first album photo: a place, not on Today
  await root.locator('[data-album-photo="album"]').first().click();
  const sheet = page.locator('[data-photo-sheet]');
  await sheet.locator('[data-photo-place]').fill('test_data_gtp_ Seeufer');
  await sheet.locator('[data-photo-greet]').uncheck();
  await sheet.locator('[data-photo-save]').click();
  await expect(sheet).toHaveCount(0);
  await expect(root.locator('[data-album-photo="album"]').first()).toContainText(T('not on Today'));
  // by place: the place is a group of its own
  await root.locator('[data-album-view="place"]').click();
  await expect(root.locator('[data-album-group="test_data_gtp_ Seeufer"]')).toBeVisible();
  // only the album
  await root.locator('[data-album-kind="album"]').click();
  await expect(root.locator('[data-album-photo="bike"]')).toHaveCount(0);
  // delete one, Undo brings it back
  await root.locator('[data-album-photo="album"]').last().click();
  await sheet.locator('[data-photo-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(root.locator('[data-album-photo="album"]')).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(root.locator('[data-album-photo="album"]')).toHaveCount(2);
  expect(await noSideScroll(page)).toBe(true);
  // a bike photo comes by itself: it opens its bike
  await root.locator('[data-album-kind="bike"]').click();
  await root.locator('[data-album-photo="bike"]').click();
  await expect(sheet.locator('[data-photo-delete]')).toHaveCount(0);
  await sheet.locator('[data-photo-open]').click();
  await expect(page).toHaveURL(/#\/bikes\?bike=bike-test/);
  expect(errors).toEqual([]);
});
