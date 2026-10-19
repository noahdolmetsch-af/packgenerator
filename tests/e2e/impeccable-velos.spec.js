// Impeccable (18.10.2026), Gruppe 3 Velos. Fictional data only (the Gesamttest data set, test_data_gtp_).
// - Velopflege 1: a trip in the next 7 days stands on top, above «Jetzt fällig», with «Vor der Fahrt prüfen»;
// - Velopflege 2: no «Woanders» row under a due row: Park Tool and the workshop booking are in its «…»,
//   the booking link is entered once under «Mehr»;
// - Velos 1: «Werkstatt» and «Velos vergleichen» are no default tiles, they wait under «Kachel hinzufügen».
import { test, expect } from '@playwright/test';
import { start, view } from './gesamttest/lib.js';
import de from '../../src/lib/i18n/de/index.js';

const T = (k) => de[k] ?? k;

test.beforeEach(async ({ page, context }, info) => {
  await start(page, context, info);
});

test('Velopflege: the trip of the next days on top, the links in the row menu, the booking link once under More', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await view(page, '#/bikes?tab=care');
  const soon = page.locator('details.block.soon');
  await expect(soon).toHaveCount(1);
  await expect(soon.locator('summary')).toContainText(T('Check before the ride'));
  // above «Jetzt fällig»
  const [a, b] = await Promise.all([soon.boundingBox(), page.locator('#due-h').boundingBox()]);
  expect(a.y).toBeLessThan(b.y);
  await soon.locator('summary').click();
  await expect(soon).toHaveAttribute('open', '');

  // no «Woanders» row in «Jetzt fällig»; the links are in the row's «…»
  const due = page.locator('section.vsec').filter({ has: page.locator('#due-h') });
  await expect(due.locator('[data-sk-woanders]')).toHaveCount(0);
  await due.locator('li.dcard').first().locator('.btn.dots').click();
  const items = page.getByRole('menuitem');
  await expect(items.filter({ hasText: T('Guide at Park Tool ↗ (English)') })).toHaveCount(1);
  await page.keyboard.press('Escape');

  // «Mehr»: the booking link for all bikes
  const book = page.locator('.ovside [data-sk-link="x15"]');
  await expect(book).toContainText(T('your link for all bikes · enter'));
  await book.click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('textbox').first().fill('https://example.org/termin');
  await sheet.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(book).toContainText(T('your link for all bikes'));
  await expect(book).not.toContainText(T('your link for all bikes · enter'));
  // a due row with a service now offers «Werkstatt-Termin buchen ↗»
  const svc = due.locator('li.dcard.warn').first();
  if (await svc.count()) {
    await svc.locator('.btn.dots').click();
    await expect(page.getByRole('menuitem').filter({ hasText: T('Book a workshop appointment ↗') })).toHaveCount(1);
    await page.keyboard.press('Escape');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Velos: Workshop and Compare bikes wait under Add a tile', async ({ page }) => {
  await view(page, '#/bikes');
  const row = page.locator('[data-sk="bikes"]');
  await expect(row).toBeVisible();
  await expect(row.locator('[data-sk-tile="workshop"]')).toHaveCount(0);
  await expect(row.locator('[data-sk-tile="bikecompare"]')).toHaveCount(0);
  await expect(row.locator('[data-sk-extras]')).toHaveText(T('More tiles are under «Add a tile».'));
  await row.locator('[data-sk-plus]').click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText(T('Workshop|tile'));
  await expect(sheet).toContainText(T('Compare bikes'));
});
