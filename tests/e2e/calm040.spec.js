// v0.40.0 "Ruhige Nebenseiten" (design check 9.10.2026, Noah's answers 1a-10a): the side pages as
// calm rows. Inbox with one light button and •••, one list of past trips, segments in the debrief,
// Building blocks and "What the app can do" as rows, the New trip window folded, and a chain worn to
// its limit going on the wishlist (Today and Bike care, with Undo). Phone and desktop.
// Fictional data only (test_data_gtp_ names, tests/e2e/v038-fixture.js).
// V040_SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { P, SPARK, v038Start } from './v038-fixture.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SPARK_NAME = `${P} Scott Spark 960`;

const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => {
            req.result.close();
            resolve(all.result);
          };
          all.onerror = () => reject(all.error);
        };
      }),
    name,
  );
const chainWishes = async (page) => (await table(page, 'items')).filter((i) => i.from === 'care' && i.bikeId === SPARK && i.part === 'chain' && i.ownership !== 'gone');
const chainLast = async (page) => (await table(page, 'bikes')).find((b) => b.id === SPARK).parts.find((p) => p.key === 'chain').history.at(-1);
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const shot = async (page, info, name, fullPage = false) => {
  if (process.env.V040_SHOTS) await page.screenshot({ path: `${process.env.V040_SHOTS}/${name}-${info.project.name}.png`, fullPage });
};

test('Inbox: one light button per note, the rest behind •••, a set bike shows as a neutral badge', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/inbox');
  await expect(page.getByRole('heading', { name: T('Inbox'), level: 1 })).toBeVisible();
  await expect(page.locator('.page-sub')).toHaveText(T('{n} to sort', { n: 2 }));
  const list = page.getByRole('list', { name: T('Notes, newest first') });
  const note = list.locator('li.note').filter({ hasText: `${P} Bell rattles` });
  // No badge until a bike or trip is set; one light button, no orange.
  await expect(note.locator('.nbadge')).toHaveCount(0);
  await expect(note.locator('.row-acts > .btn')).toHaveCount(1);
  await expect(note.locator('.btn.hi')).toHaveCount(0);
  // ••• → Bike or trip → the bike → a badge "Bike: …", stored on the note.
  await note.getByLabel(T('More for this note: other places, bike or trip, delete')).click();
  await note.getByRole('button', { name: T('Bike or trip'), exact: true }).click();
  const ctx = note.getByRole('group', { name: T('Bike or trip for this note') });
  await ctx.locator('select').first().selectOption(SPARK);
  await expect(note.locator('.nbadge')).toHaveText(T('Bike: {name}', { name: SPARK_NAME }));
  await expect.poll(async () => (await table(page, 'notes')).find((n) => n.id === `${P}n1`)?.bikeId).toBe(SPARK);
  // The other note stays without a badge.
  await expect(list.locator('li.note').filter({ hasText: `${P} New bottle cage?` }).locator('.nbadge')).toHaveCount(0);
  await noSideways(page);
  await shot(page, info, 'inbox');
  expect(errors).toEqual([]);
});

test('Past trips: one list with the debrief state, km right with their sum; Debrief links to it', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/pack/past');
  await expect(page.getByRole('heading', { name: T('Past trips'), level: 1 })).toBeVisible();
  const done = page.getByRole('list', { name: new RegExp(`^${esc(T('Done|past'))}`) });
  const herbst = done.locator('li').filter({ hasText: `${P} Herbstrunde` });
  const sommer = done.locator('li').filter({ hasText: `${P} Sommertour` });
  await expect(herbst.locator('.v')).toHaveText('140 km');
  await expect(sommer.locator('.v')).toHaveText('210 km');
  await expect(sommer).toContainText(T('{n} not needed', { n: 2 }));
  // Done has no badge and no button; the head sums the km.
  await expect(done.locator('.nbadge')).toHaveCount(0);
  await expect(done.getByRole('button')).toHaveCount(0);
  await expect(page.locator('#past-done .n')).toContainText('km');
  // A row opens the debrief.
  await expect(sommer.getByRole('link')).toHaveAttribute('href', `#/debrief/${P}sommer`);
  // Compare and pace are rows to the debrief page.
  await expect(page.getByRole('link', { name: new RegExp(esc(T('Trips compared'))) })).toHaveAttribute('href', '#/debrief/compare');
  await noSideways(page);
  await shot(page, info, 'vergangen');

  await page.goto('./#/debrief');
  await expect(page.locator('a[href="#/pack/past"]').first()).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Debrief of a trip: weather, amount and bags as segments', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  // The summer ride without its saved debrief: the debrief page asks again.
  await page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('debriefs', 'readwrite');
          tx.objectStore('debriefs').delete(id);
          tx.oncomplete = () => {
            req.result.close();
            resolve();
          };
        };
      }),
    `${P}sommer`,
  );
  await page.goto(`./#/debrief/${P}sommer`);
  await page.reload();
  const wx = page.getByRole('group', { name: T('Weather') });
  await expect(wx.getByRole('button')).toHaveText([T('Colder'), T('As planned'), T('Warmer')]);
  await wx.getByRole('button', { name: T('Warmer') }).click();
  await expect(wx.getByRole('button', { name: T('Warmer') })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('group', { name: T('Amount of food and drink') }).getByRole('button')).toHaveCount(3);
  await expect(page.locator('.qa select')).toHaveCount(0); // no drop-down with 2-3 choices
  await noSideways(page);
  await shot(page, info, 'rueckblick');
  expect(errors).toEqual([]);
});

test('Building blocks and What the app can do are rows; explanations behind "?"', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/blocks');
  const help = page.getByRole('button', { name: new RegExp(`^${esc(T('Explain: {what}', { what: '' }))}`) }).first();
  await expect(help).toHaveAttribute('aria-expanded', 'false');
  await help.click();
  await expect(page.getByRole('note')).toBeVisible();
  // a row per block, the whole row opens it; no "Edit · Built-in" footer
  const rows = page.locator('details.edit > summary.lrow');
  expect(await rows.count()).toBeGreaterThanOrEqual(5);
  await expect(page.getByText(T('Comes with an Outdoor overnight stay'), { exact: true })).toBeHidden();
  await noSideways(page);
  await shot(page, info, 'bausteine', true);

  await page.goto('./#/features');
  await expect(page.getByRole('heading', { name: T('Not used yet') })).toBeVisible();
  await expect(page.locator('details.newsfold')).not.toHaveAttribute('open', '');
  await expect(page.locator('main [data-feature] .btn')).toHaveCount(0); // the row is the button
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  // the used ones by area, folded
  await expect(page.locator('details.area[open]')).toHaveCount(0);
  await noSideways(page);
  await shot(page, info, 'features', true);
  expect(errors).toEqual([]);
});

test('New trip: the area folded with the last one, the days field with "More", other starts below the standard', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/');
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg.locator('.area-fold')).not.toHaveAttribute('open', '');
  await expect(dlg.locator('.area-fold > summary')).toContainText(T('Bikepacking'));
  await expect(dlg.getByRole('spinbutton', { name: T('Days') })).toHaveCount(0);
  await dlg.getByRole('button', { name: T('More'), exact: true }).click();
  await expect(dlg.getByRole('spinbutton', { name: T('Days') })).toBeFocused();
  await expect(dlg.getByRole('spinbutton', { name: T('Days') })).toHaveValue('3');
  // The standard card comes before "Start differently".
  const order = await dlg.evaluate((d) => {
    const std = d.querySelector('.plan');
    const other = d.querySelector('details.starts');
    return std && other ? !!(std.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) : null;
  });
  expect(order).toBe(true);
  await expect(dlg.locator('details.starts')).not.toHaveAttribute('open', '');
  await noSideways(page);
  await shot(page, info, 'neue-tour', true);
  await dlg.getByRole('button', { name: T('Cancel') }).click();
  expect(errors).toEqual([]);
});

// v0.46.0 (Noah 24a, 25a): Today has no quick buttons per bike any more (the bike cards open Bike
// care); measuring the chain wear at the limit is covered in Bike care below.

test('Chain wear at the limit in Bike care: work needed, on the wishlist, Undo in the notice', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
  const spark = page.locator(`#care-${SPARK}`);
  if (await spark.locator('.okfold[aria-expanded=false]').count()) await spark.locator('.okfold').click();
  await spark.getByRole('button', { name: /^Kette/ }).first().click();
  await spark.locator('li.pt.x').getByRole('button', { name: 'Erfassen …' }).click();
  const dlg = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Kette' }) });
  await dlg.getByLabel(new RegExp(`^${esc(T('Measured'))}`)).fill('0.6');
  await dlg.getByRole('button', { name: T('OK'), exact: true }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await chainLast(page))?.result).toBe('needed');
  await expect.poll(async () => (await chainWishes(page)).length).toBe(1);
  const notice = page.getByRole('status').filter({ hasText: T('The chain is on the wishlist.') });
  await expect(notice).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'pflege-kette');
  await notice.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await chainWishes(page)).length).toBe(0);
  await expect.poll(async () => (await chainLast(page))?.value).toBe(0.3);
  expect(errors).toEqual([]);
});

test('No sideways scroll at 320 and 390 px on the calm side pages', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 760 });
    for (const hash of ['#/inbox', '#/pack/past', '#/debrief', `#/debrief/${P}sommer`, '#/blocks', '#/features', '#/favorites', `#/bikes?tab=setup&bike=${SPARK}`]) {
      await page.goto(`./${hash}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main'), hash).not.toBeEmpty();
      await page.waitForTimeout(300);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, `${hash} at ${width} px`).toBeLessThanOrEqual(width);
    }
  }
  expect(errors).toEqual([]);
});
