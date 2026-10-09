// v0.63.0 «Material-Detail ruhig» (Noah 1a-3a): the item window shows the name, the weight with its
// status and one summary line; every other part is a row that folds away, one open at a time (the
// building blocks folded too). Lighter alternatives: linked first, then suggestions with «Passt
// nicht» and Undo. An empty «Nie gebraucht» says its rule and shows «Auf dem Weg dahin».
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, base } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

/** The material fixture plus a heavy pot: two lighter cooking items become suggestions. */
function fixture() {
  const data = materialFixture();
  data.tables.items.push({ id: 'CO03', name: 'Steel pot', category: 'cook', weightG: 160, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: 'standard', sets: ['standard'], kits: [], domains: ['bikepacking'], coldBelow: 10 });
  return data;
}
const openFolds = (dlg) => dlg.locator('details.fold[open]');
const fold = (dlg, key) => dlg.locator(`details.fold[data-fold="${key}"]`);

test('the top: name, weight with status, one summary line; the rest folded, one row open at a time', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/gear?item=CO03');
  const dlg = page.locator('dialog[open]');
  await expect(dlg.getByRole('heading', { name: 'Steel pot' })).toBeVisible();
  await expect(dlg.getByLabel('Gewicht pro Stück (g)')).toHaveValue('160');
  await expect(dlg.locator('.wst')).toHaveText('gewogen');
  await expect(dlg.getByTestId('comes-line')).toHaveText('Kommt mit: Standard · unter 10 °C · Satteltasche / Tailfin');
  // every part is a row with a short summary, all folded at the start (building blocks too)
  await expect(openFolds(dlg)).toHaveCount(0);
  await expect(fold(dlg, 'blocks').locator(':scope > summary')).toContainText('Standard');
  await expect(dlg.getByRole('group', { name: 'Kommt mit · Bausteine' })).toBeHidden();
  for (const key of ['where', 'blocks', 'rules', 'details', 'templates', 'life']) await expect(fold(dlg, key)).toHaveCount(1);
  // one open at a time
  await fold(dlg, 'where').locator(':scope > summary').click();
  await expect(openFolds(dlg)).toHaveCount(1);
  await fold(dlg, 'blocks').locator(':scope > summary').click();
  await expect(openFolds(dlg)).toHaveCount(1);
  await expect(fold(dlg, 'blocks')).toHaveJSProperty('open', true);
  await expect(dlg.getByRole('group', { name: 'Kommt mit · Bausteine' }).getByRole('button', { name: /^Standard/ })).toHaveAttribute('aria-pressed', 'true');
  // the last row opened stays open for the session
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.goto('./#/gear?item=RA01');
  await expect(fold(page.locator('dialog[open]'), 'blocks')).toHaveJSProperty('open', true);
  await expect(openFolds(page.locator('dialog[open]'))).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test('lighter alternatives: the linked one first, suggestions with Passt nicht and Undo', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/gear?item=RA01');
  let dlg = page.locator('dialog[open]');
  await fold(dlg, 'life').locator(':scope > summary').click();
  await expect(dlg).toContainText('Leichteste Alternative: Wind vest, 112 g weniger · von dir verknüpft');
  await page.keyboard.press('Escape');

  await page.goto('./#/gear?item=CO03');
  dlg = page.locator('dialog[open]');
  await expect(fold(dlg, 'life').locator(':scope > summary')).toContainText('2 leichtere Alternativen');
  const life = fold(dlg, 'life');
  if (!(await life.evaluate((d) => d.open))) await life.locator(':scope > summary').click();
  const sugg = dlg.getByRole('list', { name: 'Vorgeschlagene leichtere Alternativen' });
  await expect(sugg.getByRole('listitem')).toHaveCount(2);
  await expect(sugg.getByRole('listitem').first()).toContainText('Vorschlag');
  await expect(sugg.getByRole('listitem').first()).toContainText('Titanium pot');
  await expect(sugg.getByRole('listitem').last()).toContainText('Gas stove');
  // «Passt nicht»: gone for this item, kept in the setting, and Undo brings it back
  await sugg.getByRole('button', { name: 'Passt nicht: Titanium pot' }).click();
  await expect(sugg.getByRole('listitem')).toHaveCount(1);
  await expect(dlg.getByRole('status').filter({ hasText: 'Titanium pot' })).toContainText('wird für dieses Teil nicht mehr vorgeschlagen');
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'altDismissed')?.value).toEqual({ CO03: ['CO02'] });
  await dlg.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(sugg.getByRole('listitem')).toHaveCount(2);
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'altDismissed')?.value).toEqual({});
  // nothing was chosen for the item
  expect((await table(page, 'items')).find((i) => i.id === 'CO03').altFor ?? null).toBe(null);
});

test('an empty Nie gebraucht says its rule and shows Auf dem Weg dahin', async ({ page, context }, info) => {
  const data = homeFixture();
  // two reviewed trips; the first packed item was along on both and never used
  const first = base.tables.items[3].id;
  data.tables.debriefs = data.tables.debriefs.slice(0, 2).map((d) => ({ ...d, items: { [first]: 'unused' } }));
  await openHome(page, context, info, { data });
  await page.goto('./#/gear?view=never');
  const none = page.locator('.never0');
  await expect(none).toContainText('Hier landet, was du 3 Mal oder öfter dabei hattest und nie gebraucht hast.');
  await expect(none).toContainText('Bisher hast du 2 Touren ausgewertet.');
  const way = none.getByRole('region', { name: /Auf dem Weg dahin/ });
  await expect(way.getByRole('heading')).toHaveText('Auf dem Weg dahin 1');
  await expect(way.getByRole('button')).toContainText('2 Mal mitgenommen, nie gebraucht');
  await way.getByRole('button').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
});

test('without any trip review Nie gebraucht says it fills after the first reviews', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.debriefs = [];
  await openHome(page, context, info, { data });
  await page.goto('./#/gear?view=never');
  await expect(page.locator('.never0')).toContainText('Diese Ansicht füllt sich nach deinen ersten Tour-Auswertungen');
  await expect(page.locator('.never0 .onway')).toHaveCount(0);
});
