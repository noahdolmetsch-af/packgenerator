// «Neuer Schwung» Laden und leer (blocks B8 and B11, Noah 27.10.2026 «1a 2a 3a», «alle anderen Vorschläge umsetzen»):
// an empty view with an icon shows a small drawn picture that rises in; while Today reads its data, the placeholder
// cards come in one after another under a warm shimmer; nothing moves with «Bewegung reduzieren». Fictional data.
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const anim = (loc) => loc.evaluate((el) => getComputedStyle(el).animationName);

async function emptyTrips(page, context, info) {
  const data = homeFixture();
  data.tables.trips = [];
  data.tables.debriefs = [];
  const T = await openHome(page, context, info, { data });
  await page.goto('./#/trips');
  return T;
}

test('Leer: an empty view shows a drawn picture that rises in, with its sentence and the next step', async ({ page, context }, info) => {
  const T = await emptyTrips(page, context, info);
  const empty = page.locator('[data-empty]').filter({ hasText: T('No trips yet') });
  const pic = empty.locator('[data-empty-pic]');
  await expect(pic).toBeVisible();
  expect(await anim(pic)).toMatch(/em-rise$/);
  expect(await anim(pic.locator('.ring'))).toMatch(/em-pop$/);
  await expect(pic.locator('.ring svg')).toHaveCount(1);
  await expect(empty.getByRole('button', { name: T('Create a trip|first') })).toBeVisible();
  await noSideways(page);
});

test('Leer with reduce motion: the picture stands still', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await emptyTrips(page, context, info);
  const pic = page.locator('[data-empty-pic]').first();
  await expect(pic).toBeVisible();
  expect(await anim(pic)).toBe('none');
});

test('Laden: the placeholder cards come in one after another under a shimmer', async ({ page, context }, info) => {
  await openHome(page, context, info);
  // hold the database answers for a moment, like a slow phone (as in au.spec A-U2)
  await page.addInitScript(() => {
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (...a) {
      const req = open.apply(this, a);
      const set = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess').set;
      Object.defineProperty(req, 'onsuccess', { configurable: true, set(fn) { set.call(this, fn && ((e) => setTimeout(() => fn.call(this, e), 1500))); } });
      return req;
    };
  });
  await page.goto('./#/me');
  await page.reload();
  await page.goto('./#/');
  const skel = page.locator('[data-skeleton]');
  await expect(skel).toBeVisible();
  expect(await anim(skel.locator('.sk-card').first())).toMatch(/sk-in$/);
  expect(await anim(skel.locator('.sk').first())).toMatch(/sk$/);
  await expect(page.locator('.wall [data-tile]').first()).toBeVisible({ timeout: 15_000 });
});
