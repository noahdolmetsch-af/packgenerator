// v0.102.0 Design-Refresh P3 «Material im neuen Stil» (M1–M6, Noah «M1-M6 freigegeben» 12.10.2026):
// the list first in one white card, search · «Sort and filter» · «+ Item» in one row, the views as a card
// (right column on a computer, under the list on a phone), the item window with flat rows and «More»,
// chips in «Sort and filter», «Up next» beside the weighing card. 44 px buttons, no sideways scroll.
// Fictional data only (material0472-fixture.js); screenshots go to the test's output folder.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

const desktop = (info) => info.project.name === 'desktop';
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const shot = (page, info, name) => page.screenshot({ path: info.outputPath(`${name}-${info.project.name}.png`), fullPage: true });

async function openGear(page, context, info, hash = '#/gear') {
  await openHome(page, context, info, { data: materialFixture() });
  await page.goto(`./${hash}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Material' })).toBeVisible();
}

test('M1: the list first in one card, one toolbar, the views as a card', async ({ page, context }, info) => {
  await openGear(page, context, info);
  // list first (Noah «5a»): the groups, no cards; the choice stays «List · Cards»
  await expect(page.locator('section.cat').first()).toBeVisible();
  await expect(page.locator('.cards')).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Zeigen als' }).getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
  // one white card around all groups, with the soft corner of the colour world
  const card = await page.locator('.cats').evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: parseFloat(s.borderTopLeftRadius), border: s.borderTopStyle };
  });
  expect(card.radius).toBeGreaterThan(0);
  expect(card.border).toBe('solid');
  // one row: search, «Sort and filter», «+ Item», all 44 px high
  const bar = page.locator('.toolbar');
  for (const b of [bar.getByRole('button', { name: 'Sortieren und filtern' }), bar.getByRole('button', { name: 'Teil hinzufügen' }), bar.getByRole('searchbox')]) {
    expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await expect(bar.getByRole('button', { name: 'Teil hinzufügen' })).toHaveText('Teil');
  // the views: a card with name, a short line and the count; a tap still filters
  const views = page.locator('.vcard').getByRole('group', { name: 'Ansichten' });
  await expect(views.getByRole('button', { name: /^Nie gebraucht 3$/ })).toBeVisible();
  await expect(page.locator('.vcard')).toContainText('oft dabei, nie benutzt');
  const list = await page.locator('.cats').boundingBox();
  const vc = await page.locator('.vcard').boundingBox();
  if (desktop(info)) {
    expect(vc.x, 'the views on the right of the list').toBeGreaterThan(list.x + list.width);
    // the chosen item on the right, with «Open and edit» and «Assign …»
    const panel = page.getByRole('complementary', { name: 'Bike computer' });
    await expect(panel.getByRole('button', { name: 'Öffnen' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Zuordnen …' })).toBeVisible();
    // a row of the list opens the item as before and becomes the chosen one
    await page.locator('li.gr[data-item="RA01"] button.main').click();
    await expect(page.locator('dialog[open]').getByRole('heading', { name: 'Rain jacket' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('complementary', { name: 'Rain jacket' })).toBeVisible();
    await expect(page.locator('li.gr[data-item="RA01"]')).toHaveClass(/chosen/);
  } else {
    expect(vc.y, 'the views under the list on a phone').toBeGreaterThan(list.y + list.height);
  }
  await noSideways(page);
  await shot(page, info, 'm1-material');
  await views.getByRole('button', { name: /^Nie gebraucht/ }).click();
  expect(page.url()).toContain('view=never');
});

test('M2: the item window has flat rows, More with merge and delete, Cancel and Save at the bottom right', async ({ page, context }, info) => {
  await openGear(page, context, info, '#/gear?item=RA01');
  const dlg = page.locator('dialog[open]');
  await expect(dlg.getByRole('heading', { name: 'Rain jacket' })).toBeVisible();
  await expect(dlg.getByRole('button', { name: 'Schliessen' })).toBeVisible();
  const more = dlg.locator('details.fold[data-fold="more"]');
  await more.locator('> summary').click();
  await expect(more.getByRole('button', { name: 'Zusammenlegen mit …' })).toBeVisible();
  await expect(more.getByRole('button', { name: 'Umbenennen' })).toBeVisible();
  // the main button is the last one, at the right
  const foot = dlg.locator('.foot .btn');
  await expect(foot.last()).toHaveText('Speichern');
  await noSideways(page);
  await page.screenshot({ path: info.outputPath(`m2-teil-${info.project.name}.png`) });
});

test('M3: sort and filter as chips, the chosen one filled, the line n of m match', async ({ page, context }, info) => {
  await openGear(page, context, info);
  await page.locator('.fbtn').click();
  const sheet = page.getByRole('dialog', { name: 'Sortieren und filtern' });
  await expect(sheet).toContainText('24 von 24 Teilen passen');
  const weight = sheet.getByRole('group', { name: 'Sortieren' }).getByRole('button', { name: 'Gewicht', exact: true });
  await weight.click();
  await expect(weight).toHaveAttribute('aria-pressed', 'true');
  expect((await weight.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await sheet.getByRole('group', { name: 'Kategorie' }).getByRole('button', { name: /^Werkzeug/ }).click();
  await expect(sheet).toContainText('3 von 24 Teilen passen');
  await page.screenshot({ path: info.outputPath(`m3-filter-${info.project.name}.png`) });
  await sheet.getByRole('button', { name: '3 Teile zeigen' }).click();
  await expect(sheet).toBeHidden();
});

test('M6: weighing as a card with the progress inside, Up next beside it on a computer', async ({ page, context }, info) => {
  await openGear(page, context, info, '#/gear?tab=weigh');
  const weigh = page.locator('section.weigh');
  await expect(weigh.getByRole('heading', { name: 'Gewichte erfassen' })).toBeVisible();
  const card = weigh.locator('form.wcard');
  await expect(card.getByRole('button', { name: 'Speichern & weiter' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Fertig' })).toBeVisible();
  await expect(card.locator('.pbar')).toHaveCount(1);
  if (desktop(info)) await expect(weigh.getByRole('complementary', { name: 'Als Nächstes' })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'm6-wiegen');
});
