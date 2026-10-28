// «Aktiv: Bild, Meilensteine kürzer, Nächstes Ziel» (Noah 27.10.2026 «1a 2a 3a»), German, phone + desktop,
// fictional data written into the app's IndexedDB, the clock on Friday 9 October 2026.
// 1. Every sport page has a cover: the app's suggestion (colour and symbol), a photo from the device, «Ohne Bild»
//    with Undo.
// 2. «Meine Sportarten» shows «Nächstes Ziel» in one line; a tap opens the sport.
// 3. Meilensteine on a phone: all cards and «Serien, Touren und Velos» wait folded; on a computer they stay open.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('a cover on every sport page: suggestion, photo, «Ohne Bild» with Undo', async ({ page, context }) => {
  const errors = await open(page, context);
  await page.goto(`./#/flow/sport/${encodeURIComponent('trip:hiking')}`);
  const cover = page.locator('[data-sport-cover="trip:hiking"]');
  await expect(cover.locator('[data-cover-sugg]')).toBeVisible(); // the app's suggestion: colour and symbol
  await expect(cover.getByRole('heading', { level: 2 })).toHaveText(T('Hiking'));
  await cover.locator('[data-cover-edit]').click();
  const cs = page.locator('[data-cover-sheet]');
  await expect(cs.getByRole('heading', { level: 2 })).toHaveText(T('Cover photo for {sport}', { sport: T('Hiking') }));
  await cs.locator('input[type=file]').last().setInputFiles({ name: 'test_data_ar_cover.png', mimeType: 'image/png', buffer: PNG });
  await expect(cs.locator('[data-cover-preview]')).toBeVisible();
  await cs.locator('[data-cover-save]').click();
  await expect(cover.locator('[data-cover-img]')).toBeVisible();
  await page.reload();
  await expect(cover.locator('[data-cover-img]')).toBeVisible(); // kept
  await fits(page, 'sport page with a cover');
  // «Ohne Bild», then Undo brings the photo back
  await cover.locator('[data-cover-edit]').click();
  await cs.locator('[data-cover-none]').click();
  await cs.locator('[data-cover-save]').click();
  await expect(cover.locator('[data-cover-sugg]')).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(cover.locator('[data-cover-img]')).toBeVisible();
  // another sport keeps its own: still the suggestion
  await page.goto(`./#/flow/sport/${encodeURIComponent('trip:gravel')}`);
  await expect(page.locator('[data-sport-cover="trip:gravel"] [data-cover-sugg]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('«Nächstes Ziel» on top of Meine Sportarten opens the sport', async ({ page, context }) => {
  const errors = await open(page, context);
  const flowLog = [0, 1, 2, 3, 4].map((i) => ({ id: `test_ar_med_${i}`, actId: 'meditation', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T06:00:00.000Z`, n: 1, min: 10 }));
  await put(page, { flowLog });
  await page.goto('./#/flow/sports');
  await page.reload();
  const row = page.locator('main [data-next-goal]');
  await expect(row).toBeVisible();
  await expect(row).toContainText(T('Next goal'));
  await expect(row).toContainText('Meditation');
  await fits(page, 'my sports');
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/(act|sport)\//);
  expect(errors).toEqual([]);
});

test('Meilensteine: on a phone the long parts wait folded, on a computer they stay open', async ({ page, context }) => {
  const errors = await open(page, context);
  await page.goto('./#/flow/milestones');
  await expect(page.locator('main h1')).toHaveText(T('Milestones'));
  const phone = page.viewportSize().width < 720;
  const areas = page.locator('main [data-ms-fold="areas"]');
  if (phone) {
    await expect(areas).toBeVisible();
    await expect(areas).not.toHaveAttribute('open', '');
    await areas.locator('summary').click();
    await expect(page.locator('main [data-ms-trips]')).toBeVisible();
  } else {
    await expect(page.locator('main [data-ms-fold]')).toHaveCount(0);
    await expect(page.locator('main [data-ms-trips]')).toBeVisible();
  }
  // one sport chosen: nothing folded
  await page.goto('./#/flow/milestones?act=meditation');
  await expect(page.locator('main [data-ms-fold]')).toHaveCount(0);
  await fits(page, 'milestones');
  expect(errors).toEqual([]);
});
