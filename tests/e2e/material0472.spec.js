// v0.47.2 «Material-Ansichten» (Noah 6a-9a): seven fixed views with counts, «Nie gebraucht» in one
// sentence, the desktop detail column, the item's year on tour; no sideways scroll, 44 px on the phone.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { materialFixture, COUNTS } from './material0472-fixture.js';

const NAMES = { all: 'Alle', most: 'Meist genutzt', proven: 'Bewährt', fav: 'Lieblingssachen', never: 'Nie gebraucht', unweighed: 'Ungewogen', wish: 'Wunschliste' };

async function openGear(page, context, info, hash = '#/gear') {
  await openHome(page, context, info, { data: materialFixture() });
  await page.goto(`./${hash}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Material' })).toBeVisible();
}
const views = (page) => page.getByRole('group', { name: 'Ansichten' });
const cards = (page) => page.locator('.cards .mcard');

test('the seven views: counts on the buttons, each filters the cards and stays in the address', async ({ page, context }, info) => {
  await openGear(page, context, info);
  for (const [key, name] of Object.entries(NAMES)) {
    const b = views(page).getByRole('button', { name: new RegExp(`^${name} ${COUNTS[key]}$`) });
    await expect(b).toBeVisible();
    await b.click();
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await expect(cards(page)).toHaveCount(COUNTS[key]);
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
    if (key === 'all') expect(page.url()).not.toContain('view=');
    else expect(page.url()).toContain(`view=${key}`);
  }
  // the right items in the views
  await views(page).getByRole('button', { name: /^Meist genutzt/ }).click();
  await expect(cards(page).locator('.nm')).toHaveText(['Bike computer', 'Power bank 10000 mAh', 'Rain jacket']);
  await views(page).getByRole('button', { name: /^Bewährt/ }).click();
  await expect(cards(page).locator('.nm')).toHaveText(['Bike computer', 'Power bank 10000 mAh']);
  // a reload keeps the view; the old addresses open the matching view
  await page.reload();
  await expect(views(page).getByRole('button', { name: /^Bewährt/ })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./#/gear?tab=dead');
  await expect(views(page).getByRole('button', { name: /^Nie gebraucht/ })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./#/gear?fav=1');
  await expect(views(page).getByRole('button', { name: /^Lieblingssachen/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(COUNTS.fav);
});

test('Never used says it in one plain sentence, and Leave at home works', async ({ page, context }, info) => {
  await openGear(page, context, info, '#/gear?view=never');
  await expect(page.getByText('Früher «Totes Gewicht»', { exact: false })).toBeVisible();
  const stove = page.locator('.mcard[data-id="CO01"]');
  await expect(stove).toContainText('4 Mal mitgenommen, nie gebraucht');
  await expect(page.locator('.mcard[data-id="LX01"]')).toContainText('3 Mal mitgenommen, nie gebraucht');
  await expect(page.getByText('Totes Gewicht', { exact: true })).toHaveCount(0);
  await stove.getByRole('button', { name: 'Zu Hause lassen' }).click();
  await expect(stove).toContainText('Bleibt zu Hause');
});

test('sort and filter in one sheet', async ({ page, context }, info) => {
  await openGear(page, context, info);
  await page.locator('.fbtn').click();
  const sheet = page.getByRole('dialog', { name: 'Sortieren und filtern' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Gewicht', exact: true }).click();
  await sheet.getByRole('group', { name: 'Kategorie' }).getByRole('button', { name: /^Werkzeug/ }).click();
  await sheet.getByRole('button', { name: '3 Teile zeigen' }).click();
  await expect(sheet).toBeHidden();
  await expect(cards(page).locator('.nm')).toHaveText(['Multi tool', 'Spare tube', 'Mini pump']);
});

test('the item: its year on tour, the learned rule, the last trips, the lighter alternative, age and cost', async ({ page, context }, info) => {
  await openGear(page, context, info, '#/gear?item=RA01');
  const dlg = page.locator('dialog[open]');
  // v0.60.0: the item's history is a row that folds away («Lebenslauf»); it stays open for the session
  await dlg.locator('details.fold[data-fold="life"] > summary').click();
  await expect(dlg.getByRole('heading', { name: 'Sein Jahr auf Tour' })).toBeVisible();
  await expect(dlg.getByRole('img', { name: /Letzte 12 Monate: auf 4 Touren gebraucht, auf 4 dabei/ })).toBeVisible();
  await expect(dlg).toContainText('Unter 12 °C immer gebraucht, darüber nie. Aus 8 Touren.');
  await expect(dlg.getByRole('heading', { name: /Letzte Touren/ })).toBeVisible();
  await expect(dlg).toContainText('Leichteste Alternative: Wind vest, 112 g weniger');
  await expect(dlg).toContainText('2 J. 6 M.');
  await expect(dlg).toContainText('87.25 CHF');
  // an item without price, purchase day or alternative shows none of these
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.goto('./#/gear?item=EL01');
  const d2 = page.locator('dialog[open]');
  await expect(d2.getByRole('heading', { name: 'Sein Jahr auf Tour' })).toBeVisible();
  await expect(d2.getByRole('heading', { name: 'Alter und Kosten' })).toHaveCount(0);
  await expect(d2.getByRole('heading', { name: 'Gewicht', exact: true })).toHaveCount(0);
});

test('desktop: cards with the chosen one in the detail column, Cards or List', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'the detail column is for the computer');
  await openGear(page, context, info);
  const panel = page.getByRole('complementary', { name: 'Bike computer' });
  await expect(panel).toBeVisible(); // the first card is chosen at the start
  await page.locator('.mcard[data-id="RA01"] .mopen').click();
  const rj = page.getByRole('complementary', { name: 'Rain jacket' });
  await expect(rj).toBeVisible();
  await expect(rj).toContainText('Unter 12 °C immer gebraucht');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await rj.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.locator('dialog[open]').getByRole('heading', { name: 'Rain jacket' })).toBeVisible();
  await page.keyboard.press('Escape');
  // the list shows the categories as before; the choice stays after a reload
  await page.getByRole('group', { name: 'Zeigen als' }).getByRole('button', { name: 'Liste' }).click();
  await expect(page.locator('.cards')).toHaveCount(0);
  await expect(page.locator('section.cat').first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('group', { name: 'Zeigen als' }).getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [320, 390]) {
  test(`phone ${width}: no sideways scroll, 44 px targets`, async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'phone only');
    await page.setViewportSize({ width, height: 800 });
    await openGear(page, context, info);
    for (const v of ['all', 'never', 'wish']) {
      await page.goto(`./#/gear${v === 'all' ? '' : `?view=${v}`}`);
      await expect(cards(page).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('main button, main a.btn, main summary, main input, main select')]
          // a quiet text link (.tap) has its 44 px tap area as an invisible ::after (app.css)
          .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.classList.contains('tap'))
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.height < 44 || r.width < 44)
          .map(({ el, r }) => `${el.tagName} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`),
      );
      expect(small).toEqual([]);
    }
    await page.goto('./#/gear?item=RA01');
    await expect(page.locator('dialog[open]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('desktop 1440: no sideways scroll', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop only');
  await openGear(page, context, info);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
