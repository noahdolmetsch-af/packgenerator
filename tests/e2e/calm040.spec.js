// v0.40.0 "Ruhige Nebenseiten" (design check 9.10.2026, Noah's answers 1a-10a): the side pages as
// calm rows. Inbox with one light button and •••, one list of past trips, segments in the debrief,
// Building blocks and "What the app can do" as rows, the New trip window folded, and a chain worn to
// its limit going on the wishlist (Today and Bike care, with Undo). Phone and desktop.
// Fictional data only (test_data_gtp_ names, tests/e2e/v038-fixture.js).
// V040_SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { newButton } from './newbutton.js';
import { P, SPARK, v038Start } from './v038-fixture.js';
import { openRow } from './debrief-rows.js';

// SN3+ «Bausteine je nach Lage» (answer «aufklappbar b»): only «Je nach Lage» is open on Bausteine; open the other groups
const openGroups = async (page) => {
  // Tempo (19.10.2026): the page loads on its first visit; wait until its groups are there
  await page.locator('main section.sfold').first().waitFor();
  const shut = page.locator('main section.sfold > details:not([open]) > summary');
  while (await shut.count()) await shut.first().click();
};


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

// v0.48.0: the Inbox is the «Eingang»: one light button per entry, since Impeccable (18.10.2026) named by
// the app's suggestion; «File elsewhere …» and Delete behind •••; the targets are in the sheet (tests/e2e/v048.spec.js).
test('Inbox: one light button per note, the rest behind •••, the suggestion under the text', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/inbox');
  await expect(page.getByRole('heading', { name: T('Inbox'), level: 1 })).toBeVisible();
  // Design-Refresh P9 (I3): the count sits on the view chip «To file · n», no longer in the line under the title
  await expect(page.getByRole('group', { name: T('Show') }).getByRole('button', { name: new RegExp(T('To file')) })).toHaveText(`${T('To file')} · 2`);
  const note = page.locator('li[data-note-id]').filter({ hasText: `${P} Bell rattles` });
  await expect(note.locator('.acts > .btn')).toHaveCount(1);
  // Impeccable (18.10.2026, changed on purpose): the button names the app's suggestion
  await expect(note.locator('.acts > .btn')).toHaveText(T('File as bike problem'));
  await expect(note.locator('.btn.hi')).toHaveCount(0);
  // v0.117.0 «Knöpfe neu» (N2, changed on purpose): «…» lists its actions with an explanation each
  await note.getByLabel(T('More for this note')).click();
  await expect(page.getByRole('menuitem', { name: new RegExp(`^${T('File elsewhere …')}`) })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'inbox');
  expect(errors).toEqual([]);
});

// v0.49.0 R1 (Noah 1b): Past trips became one table; the debrief state is a badge in the name cell.
test('Past trips: one table with the debrief state and the km; Debrief links to it', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/pack/past');
  await expect(page.getByRole('heading', { name: T('Past trips'), level: 1 })).toBeVisible();
  // the fixture's trips are older than 12 months on some machines' clocks: show all years
  await page.getByRole('group', { name: T('Period') }).getByRole('button', { name: T('All|period') }).click();
  const rows = page.locator('table.tt tbody tr');
  const herbst = rows.filter({ hasText: `${P} Herbstrunde` });
  const sommer = rows.filter({ hasText: `${P} Sommertour` });
  await expect(herbst).toContainText('140');
  await expect(sommer).toContainText('210');
  // done rows have no badge; a row opens the debrief
  await expect(sommer.locator('td.go .btn')).toHaveCount(0); // SN4: no «Bewerten» in the row
  await expect(sommer.getByRole('link').first()).toHaveAttribute('href', `#/debrief/${P}sommer`);
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
  await openRow(page, 'how-fold'); // v0.92.0: weather, km, ride and notes are under «Wie war's?»
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
  await openGroups(page);
  const help = page.getByRole('button', { name: new RegExp(`^${esc(T('Explain: {what}', { what: '' }))}`) }).first();
  await expect(help).toHaveAttribute('aria-expanded', 'false');
  await help.click();
  await expect(page.getByRole('note')).toBeVisible();
  // a row per block, the whole row opens it; no "Edit · Built-in" footer
  const rows = page.locator('details.edit > summary.srow') // SN3 «Seiten neu»: the rows of the new sections;
  expect(await rows.count()).toBeGreaterThanOrEqual(5);
  await expect(page.getByText(T('Comes with an Outdoor overnight stay'), { exact: true })).toBeHidden();
  await noSideways(page);
  await shot(page, info, 'bausteine', true);

  // v0.96.0 «F1 Alles finden»: 6 groups by situation, 4 rows each (Noah «2 mit 4 zeilen») and «All n», the news folded
  await page.goto('./#/features');
  await expect(page.locator('section[data-group]')).toHaveCount(6);
  await expect(page.locator('details.newsfold')).not.toHaveAttribute('open', '');
  for (const g of await page.locator('section[data-group]').all()) expect(await g.locator('[data-feature]').count()).toBeLessThanOrEqual(4);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await noSideways(page);
  await shot(page, info, 'features', true);
  expect(errors).toEqual([]);
});

test('New trip: the sport chips with Fahrrad pressed, the days field with "More", the templates folded with Standard chosen', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/');
  await (await newButton(page, T('New'))).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  // v0.102.0 Design-Refresh P4 (T2): the areas as chips in sight (no fold). v0.114.0 (2a): «Sportart», Fahrrad pressed.
  await expect(dlg.getByRole('group', { name: T('Sport') }).getByRole('button', { name: T('Cycling|sport'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.getByRole('spinbutton', { name: T('Days') })).toHaveCount(0);
  await dlg.getByRole('button', { name: T('More'), exact: true }).click();
  await expect(dlg.getByRole('spinbutton', { name: T('Days') })).toBeFocused();
  await expect(dlg.getByRole('spinbutton', { name: T('Days') })).toHaveValue('3');
  // v0.114.0 «Rahmenbedingungen» (1a, B2): «Vorlage wählen» folded before the packing list; open, Standard first and chosen.
  const order = await dlg.evaluate((d) => {
    const tpl = d.querySelector('.tplbox');
    const list = d.querySelector('.plist');
    return tpl && list ? !!(tpl.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) : null;
  });
  expect(order).toBe(true);
  await dlg.getByRole('button', { name: new RegExp(T('Choose a template')) }).click();
  const starts = dlg.getByRole('group', { name: T('Your templates') }).getByRole('button');
  await expect(starts.first()).toContainText(T('Standard'));
  await expect(starts.first()).toHaveAttribute('aria-pressed', 'true');
  await noSideways(page);
  await shot(page, info, 'neue-tour', true);
  await dlg.getByRole('button', { name: T('Discard') }).click();
  expect(errors).toEqual([]);
});

// v0.46.0 (Noah 24a, 25a): Today has no quick buttons per bike any more (the bike cards open Bike
// care); measuring the chain wear at the limit is covered in Bike care below.

test('Chain wear at the limit in Bike care: work needed, on the wishlist, Undo in the notice', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
  const spark = page.locator(`#care-${SPARK}`);
  // v0.48.0: a row of the part table opens the part.
  // Gesamttest 20.10.2026 C11 (changed on purpose): on a phone the part table shows five rows, then «Noch n zeigen»
  await spark.locator('.ptable').waitFor();
  if (await spark.locator('[data-parts-more]').count()) await spark.locator('[data-parts-more]').click();
  await spark.locator('button.prow').filter({ has: page.locator('.nm').getByText(T('Chain'), { exact: true }) }).click();
  const dlg = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Kette' }) });
  // SN7 «Seiten neu»: measuring sits in the fold «Messen und Modell»; choose what you did, then «Eintragen».
  await dlg.locator('details[data-fold="measure"] > summary').click();
  await dlg.getByLabel(new RegExp(`^${esc(T('Measured'))}`)).fill('0.6');
  await dlg.locator('[data-did="ok"]').click();
  await dlg.getByRole('button', { name: T('Enter|part'), exact: true }).click();
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
