// «Tour planen mit GPX» (Noah 20.10.2026 «3a und b»): on Plan of a trip, a GPX route brings the fine profile
// coloured by gradient (the one of the race page) and every climb: a tap opens the climb with its gradient
// per 100 m and zooms the profile to it; a note per climb with Undo. Fictional fixture and GPX
// (test_data_gtp_), German, phone + desktop, no sideways scroll, no page errors.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { testGpx } from '../fixtures/zweihuegel-gpx.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('Tour planen: GPX gives the fine profile and every climb; a tap zooms, notes with Undo', async ({ page, context }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_trip27'));
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();

  // the route card: no route yet, then the GPX file (read on the device)
  const card = page.locator('section.rc').filter({ has: page.getByRole('heading', { level: 2, name: T('Route|map'), exact: true }) });
  await card.locator('input[type=file]').setInputFiles({ name: 'zwei.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(testGpx()) });
  const climbs = card.locator('[data-route-climbs]');
  await expect(climbs).toBeVisible();

  // the fine profile, coloured by gradient, without the map sentences
  const strip = climbs.locator('[data-profile]');
  await expect(strip).toHaveAttribute('data-profile-fine', '');
  expect(await strip.locator('path.ps-fill').count()).toBeGreaterThan(2);
  await expect(strip.locator('[data-profile-read]')).toContainText(T('Tap or drag on the profile: you see the height and the gradient there.'));

  // two climbs of 50 m or more; 200 m leaves one (Ab wie viel Höhe, folded)
  await expect(climbs.locator('[data-route-climb]')).toHaveCount(2);
  await expect(climbs.locator('[data-route-climbs-count]')).toContainText(T('{n} climbs of {m} m or more', { n: 2, m: 50 }));
  await climbs.locator('details.rcl-ctl > summary').click();
  await climbs.locator('[data-route-climbs-min="200"]').click();
  await expect(climbs.locator('[data-route-climb]')).toHaveCount(1);
  await climbs.locator('[data-route-climbs-min="50"]').click();
  await expect(climbs.locator('[data-route-climb]')).toHaveCount(2);

  // a tap opens climb 1: bars every 100 m, and the profile zooms to it
  await climbs.locator('[data-route-climb-open="1"]').click();
  const c1 = climbs.locator('[data-route-climb-card="1"]');
  await expect(c1).toBeVisible();
  expect(await c1.locator('[data-route-climb-bar]').count()).toBeGreaterThan(40);
  await expect(strip.locator('[data-profile-whole]')).toBeEnabled();
  const range = strip.locator('[data-profile-range]');
  expect(Number(await range.getAttribute('data-to'))).toBeLessThan(10);
  await strip.locator('[data-profile-whole]').click();
  await c1.locator('[data-route-climb-zoom="1"]').click();
  await expect(strip.locator('[data-profile-whole]')).toBeEnabled();

  // a note: saved on the trip, deleted in the app's own window with Undo
  await c1.locator('[data-route-climb-note="1"]').fill('test_data_gtp_ kleiner Gang ab der Brücke');
  await c1.locator('[data-route-climb-note-save="1"]').click();
  await expect(climbs.locator('[data-route-climb="1"]')).toContainText(T('with note'));
  await c1.locator('[data-route-climb-note-del="1"]').click();
  await page.getByRole('dialog').getByRole('button', { name: T('Delete') }).click();
  await expect(climbs.locator('[data-route-climb="1"]')).not.toContainText(T('with note'));
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(climbs.locator('[data-route-climb="1"]')).toContainText(T('with note'));

  expect(await wide(page)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
