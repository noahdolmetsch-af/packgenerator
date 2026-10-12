// Design-Refresh P7 «Velo» (V1–V14b, Noah 12.10.2026 «v1-v4 freigabe», «v5-v10 freigabe», «v11-v14 freigegeben»):
// the bike pages in the new look. Every sub-page has a path back, exactly one title (h1) and no side scroll;
// the care overview and one bike's care page; the windows in the new window look; the folder beside the
// sheet; import, workshop, equipment and compare with their head.
// Fictional data only (tests/e2e/v048-fixture.js, test_data_gtp_ names); nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File, P, SPARK } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const NAME = `${P} Scott Spark 960`;

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(v048File(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

const path = (page) => page.getByRole('navigation', { name: T('Path') });
/** Exactly one visible h1 with this text, and nothing wider than the screen. */
async function onePage(page, title) {
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
}

test('V1: the bike page: bike chips, care and equipment, import, More as rows', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await onePage(page, T('Bikes'));
  await expect(page.locator('section.setup-band').getByRole('tab', { name: NAME })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: T('Care and equipment') })).toBeVisible();
  await expect(page.locator('a.vk-go')).toHaveText(T('Import rides'));
  const more = page.locator('#vk-more');
  for (const cls of ['vm-folder', 'vm-profile']) await expect(more.locator(`details.${cls}`)).toHaveCount(1);
  await expect(more.locator('a.cmplink')).toHaveAttribute('href', '#/bikes?tab=compare&view=all');
  expect(errors).toEqual([]);
});

test('V6 and V7: care overview, a bike opens as its own page, Pflege goes back', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=care');
  await onePage(page, T('Bike care'));
  await expect(path(page).getByRole('link', { name: T('Bike') })).toBeVisible();
  const ov = page.getByRole('region', { name: T('Care overview') });
  for (const h of [T('Due now'), T('Bikes'), T('For the bike shop'), T('Costs {year}', { year: new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(0, 4) }), T('More')]) {
    await expect(ov.getByRole('heading', { name: h, exact: true })).toBeVisible();
  }
  // The overview shows the bikes as rows only; no accordion below it.
  await expect(page.locator('section.acc')).toHaveCount(0);
  await ov.locator('.ring').filter({ hasText: NAME }).click();
  await onePage(page, NAME);
  await expect(page.locator(`#care-${SPARK} .ah-btn`)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('heading', { name: T('Other bikes') })).toBeVisible();
  await expect(page.getByRole('region', { name: T('Care overview') })).toHaveCount(0);
  await path(page).getByRole('link', { name: T('Care|tab') }).click();
  await onePage(page, T('Bike care'));
  expect(errors).toEqual([]);
});

test('V8 to V11: the care windows in the new window look', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}&open=1`);
  await onePage(page, NAME);
  await page.locator(`#care-${SPARK} button.prow`).first().click();
  const dlg = page.locator('dialog.vdlg[open]');
  await expect(dlg).toHaveCount(1);
  await expect(dlg.locator('.vd-head .vd-x')).toBeVisible();
  await expect(dlg.getByRole('group', { name: T('Done by') }).locator('.vd-chip')).toHaveCount(2);
  await dlg.locator('.vd-x').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // The workshop order (V11) from the overview.
  await page.goto('./#/bikes?tab=care');
  await page.getByRole('region', { name: T('Care overview') }).locator('.orow').first().click();
  const order = page.locator('dialog.vdlg[open]');
  await expect(order.locator('ul.jobs.vd-panel')).toBeVisible();
  await expect(order.locator('.vd-foot .btn.hi')).toHaveText(T('Send or copy'));
  expect(errors).toEqual([]);
});

test('V5: the folder: path, title, the sheet left and the sheets of the folder beside it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SPARK}&sheet=plan`);
  await onePage(page, T('Folder {bike}', { bike: NAME }));
  await expect(path(page).getByRole('link', { name: T('Folder|sheets') })).toBeVisible();
  await expect(page.locator('article.paper[data-sheet="plan"]')).toBeVisible();
  await expect(page.locator('aside a.sheet[data-sheet="plan"]')).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

test('V12 to V14b: import, workshop, equipment and compare with path and title', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&view=import&bike=${SPARK}`);
  await onePage(page, T('Import rides'));
  await expect(page.locator('ol.ksteps > li')).toHaveCount(3);
  await expect(page.locator('ol.ksteps > li').first()).toHaveAttribute('aria-current', 'step');

  await page.goto('./#/bikes?tab=shop');
  await onePage(page, T('Workshop & receipts'));
  await expect(page.getByRole('group', { name: T('Bike') }).getByRole('button', { name: T('All bikes') })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('main .btn.hi')).toHaveCount(1);

  await page.goto(`./#/bikes?tab=compare&bike=${SPARK}`);
  await onePage(page, T('Equipment {bike}', { bike: NAME }));
  await page.getByRole('link', { name: T('Compare bikes') }).click();
  await onePage(page, T('Compare bikes'));
  await path(page).getByRole('link', { name: T('Equipment|tab') }).click();
  await expect(page).toHaveURL(/tab=compare(?!&view)/);
  expect(errors).toEqual([]);
});
