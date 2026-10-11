// v0.94.0 «Kachel-Wand» (Noah 11.10.2026, Trello nLi5yNmS «1-5 a», mockups #startseite-kacheln A–D):
// Today is a wall of small tiles in four sizes, 8 columns on a computer and 4 on a phone, starting with
// the ready wall; «Customise the start page» (a long press on a phone) moves, resizes and removes tiles,
// «Reset» brings the ready wall back; «+» adds any tile from the catalog; one series over everything
// with milestones; «Data and backup» lives under Me. The tiles come from the app source (tiles.js).
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (Europe/Zurich), Open-Meteo
// mocked; SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { D0, openHome } from './home0460-fixture.js';
import { READY, TILE, TILES, isNew } from '../../src/lib/home/tiles.js';

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const ids = (page) => page.locator('.wall [data-tile]').evaluateAll((els) => els.map((e) => e.dataset.tile));
const wallStored = (page) =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('settings').objectStore('settings').get('homeWall');
          q.onsuccess = () => (r.result.close(), ok(q.result?.value ?? null));
        };
      }),
  );

test('the ready wall: every tile in its place and size, 8 columns on a computer, 4 on a phone, plus at the end', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const phone = info.project.name === 'phone';
  const T = await openHome(page, context, info);
  await expect(page.locator('#next-h')).toBeVisible();
  await shot(page, info, 'A-Kachel-Wand');

  expect(await ids(page)).toEqual(READY.map((x) => x.id));
  for (const x of READY) await expect(page.locator(`.wall [data-tile="${x.id}"]`)).toHaveAttribute('data-size', x.size);
  // the 16 functions are small buttons, the numbers where something waits
  await expect(page.locator('.wall [data-fn="care"] .bd')).toHaveText('1');
  // the columns: a small tile is an eighth (computer) or a quarter (phone) of the wall
  const wall = await page.locator('.wall').boundingBox();
  const small = await page.locator('.wall [data-tile="fn:weigh"]').boundingBox();
  const cols = phone ? 4 : 8;
  expect(Math.abs(small.width - (wall.width - (cols - 1) * (phone ? 8 : 12)) / cols)).toBeLessThan(2);
  // the last field is «+»
  await expect(page.locator('.wall .plusw')).toBeVisible();
  await expect(page.locator('.wall > div').last()).toHaveClass(/plusw/);
  // «New» on the new tiles (idea 1), Important today and Im Flow on Today, no «Your data» at the bottom
  for (const x of READY.filter((y) => TILE[y.id].since)) await expect(page.locator(`.wall [data-tile="${x.id}"] .nw`)).toHaveCount(isNew(TILE[x.id], D0) ? 1 : 0);
  await expect(page.locator('[data-section="today"] li[data-row]').first()).toBeVisible();
  await expect(page.locator('details.data')).toHaveCount(0);
  // no sideways scroll
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('customise: take away, resize, move, kept after a reload; Reset brings the ready wall back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  await expect(page.getByRole('region', { name: T('Customise the start page') })).toBeVisible();
  // the tiles' own buttons rest meanwhile
  await expect(page.locator('.wall [data-tile="fn:weigh"] .body')).toHaveAttribute('inert', '');

  // × takes the 12 months away
  await page.getByRole('button', { name: T('Take {name} off the start page', { name: T('Last 12 months') }) }).click();
  await expect(page.locator('.wall [data-tile="year"]')).toHaveCount(0);
  // a tap on «New in the app»: small, then one place earlier
  await page.getByRole('button', { name: T('{name}: move or change the size', { name: T('New in the app') }) }).click();
  const tools = page.locator('[data-tools="news"]');
  await tools.getByRole('button', { name: T('Small|tile') }).click();
  await expect(page.locator('.wall [data-tile="news"]')).toHaveAttribute('data-size', 's');
  const before = (await ids(page)).indexOf('news');
  await tools.getByRole('button', { name: T('One place earlier') }).click();
  await expect.poll(async () => (await ids(page)).indexOf('news')).toBe(before - 1);
  await shot(page, info, 'B-Anpassen');
  await page.getByRole('button', { name: T('Done|customise') }).click();
  await expect(page.getByRole('region', { name: T('Customise the start page') })).toHaveCount(0);

  // stored (it goes into every backup) and kept after a reload
  const stored = await wallStored(page);
  expect(stored.tiles.find((x) => x.id === 'news').size).toBe('s');
  expect(stored.tiles.some((x) => x.id === 'year')).toBe(false);
  await page.reload();
  await expect(page.locator('.wall [data-tile="news"]')).toHaveAttribute('data-size', 's');
  await expect(page.locator('.wall [data-tile="year"]')).toHaveCount(0);

  // Reset: the ready wall again
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  await page.getByRole('button', { name: T('Reset') }).click();
  await expect.poll(() => ids(page)).toEqual(READY.map((x) => x.id));
  expect(errors).toEqual([]);
});

test('drag a tile by its handle onto another place', async ({ page, context }, info) => {
  test.skip(info.project.name === 'phone', 'the handle is dragged with the mouse here; the phone uses the same pointer events');
  const T = await openHome(page, context, info);
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  const grip = page.getByRole('button', { name: T('Drag {name}', { name: T('Meditation') }) });
  const target = await page.locator('.wall [data-tile="series"]').boundingBox();
  const g = await grip.boundingBox();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await ids(page)).indexOf('meditation')).toBeLessThan(READY.findIndex((x) => x.id === 'series') + 1);
  await expect.poll(async () => (await wallStored(page))?.tiles.findIndex((x) => x.id === 'meditation')).toBe((await ids(page)).indexOf('meditation'));
});

test('a long press on a tile opens customising on a phone', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'a long press is a finger thing');
  const T = await openHome(page, context, info);
  const tile = page.locator('.wall [data-tile="fn:wardrobe"] .st');
  await tile.scrollIntoViewIfNeeded();
  const b = await tile.boundingBox();
  await tile.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: b.x + 10, clientY: b.y + 10, isPrimary: true, button: 0 });
  await page.waitForTimeout(800);
  await tile.dispatchEvent('pointerup', { pointerType: 'touch', clientX: b.x + 10, clientY: b.y + 10, isPrimary: true, button: 0 });
  await expect(page.getByRole('region', { name: T('Customise the start page') })).toBeVisible();
  expect(new URL(page.url()).hash).not.toBe('#/wardrobe');
});

test('plus adds any tile from the catalog by area, with a search; the tick takes it away again', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.getByRole('button', { name: T('Add a tile') }).click();
  const sheet = page.getByRole('dialog', { name: T('Add a tile') });
  await expect(sheet).toBeVisible();
  // every tile of the app is in the catalog
  await expect(sheet.locator('[data-add]')).toHaveCount(TILES.length);
  await shot(page, info, 'C-Kachel-hinzufuegen');
  await sheet.getByRole('searchbox', { name: T('Search tiles') }).fill(T(TILE.milestones.label).slice(0, 6));
  const add = sheet.locator('[data-add="milestones"]');
  await expect(add).toHaveAttribute('aria-pressed', 'false');
  await add.click();
  await expect(add).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  expect((await ids(page)).at(-1)).toBe('milestones');
  await page.locator('.wall [data-tile="milestones"] a').click();
  await expect(page).toHaveURL(/#\/flow\/milestones$/);
  await page.goBack();
  // ✓ again takes it away
  await page.getByRole('button', { name: T('Add a tile') }).click();
  await page.locator('[data-add="milestones"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.wall [data-tile="milestones"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('one series over everything with the next milestone, a rest week, all milestones on one page', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  // the fixture: trips done 3, 9 and 16 days ago (three weeks in a row, this week nothing yet)
  const tile = page.locator('.wall [data-tile="series"] section');
  await expect(tile).toHaveAttribute('data-series', '3');
  await expect(tile).toContainText(T('Next: {n} weeks (still {k})', { n: 4, k: 1 }));
  // large: the rest week button; a rest week keeps the series
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  await page.getByRole('button', { name: T('{name}: move or change the size', { name: T('Series and milestones') }) }).click();
  await page.locator('[data-tools="series"]').getByRole('button', { name: T('Large|tile') }).click();
  await page.getByRole('button', { name: T('Done|customise') }).click();
  await tile.getByRole('button', { name: T('This week: rest week') }).click();
  await expect(tile.getByRole('button', { name: T('Rest week ✓') })).toHaveAttribute('aria-pressed', 'true');
  await expect(tile).toHaveAttribute('data-series', '3');
  await shot(page, info, 'D-Serie');
  // the title opens the milestones of all areas, the series on top
  await tile.getByRole('link', { name: T('Series and milestones') }).click();
  await expect(page).toHaveURL(/#\/flow\/milestones$/);
  const top = page.locator('[data-ms-series]');
  await expect(top.locator('[data-n]')).toHaveAttribute('data-n', '3');
  await expect(page.locator('[data-ms-trips]')).toBeVisible();
  await shot(page, info, 'D-Meilensteine');
  expect(errors).toEqual([]);
});

test('Data and backup lives under Me; the playground tile opens the playground there', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.locator('.wall [data-tile="play"] button').click();
  await expect(page).toHaveURL(/#\/me$/);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  const data = page.locator('details.data');
  await data.locator('summary').click();
  await expect(data.getByText(T('Import backup'), { exact: true })).toBeVisible();
});
