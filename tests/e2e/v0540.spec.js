// v0.63.0 «Material-Detail ruhig» (Noah 1a-3a): the item window shows the name and one summary line;
// every other part is a row that folds away, one open at a time (the building blocks folded too).
// v0.72.0 «Feinschliff» (Noah 1a-3a): the summary line says weight, how it comes, place and usage;
// the weight field is the first row «Gewicht», with the lighter alternatives (bars, a card per
// suggestion, «Als Alternative merken», «Passt nicht» and Undo). An empty «Nie gebraucht» shows a
// green check, three numbers and «Auf dem Weg dahin» with dots and «Zu Hause lassen».
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

test('the top: name and one summary line; the rest folded, Gewicht first, one row open at a time', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/gear?item=CO03');
  const dlg = page.locator('dialog[open]');
  await expect(dlg.getByRole('heading', { name: 'Steel pot' })).toBeVisible();
  await expect(dlg.getByTestId('comes-line')).toHaveText('160 g · kommt mit Standard, unter 10 °C · Satteltasche / Tailfin');
  // every part is a row with a short summary, all folded at the start (building blocks too), in Noah's order
  await expect(openFolds(dlg)).toHaveCount(0);
  expect(await dlg.locator('details.fold').evaluateAll((ds) => ds.map((d) => d.dataset.fold))).toEqual(['weight', 'where', 'blocks', 'rules', 'life', 'details', 'templates']);
  await expect(fold(dlg, 'weight').locator(':scope > summary')).toContainText('160 g · gewogen');
  await expect(fold(dlg, 'weight').locator(':scope > summary')).toContainText('2 Vorschläge');
  await expect(fold(dlg, 'blocks').locator(':scope > summary')).toContainText('Standard');
  await expect(dlg.getByRole('group', { name: 'Kommt mit · Bausteine' })).toBeHidden();
  // the weight field lives in the row «Gewicht»
  await fold(dlg, 'weight').locator(':scope > summary').click();
  await expect(dlg.getByLabel('Gewicht pro Stück (g)')).toHaveValue('160');
  await expect(dlg.locator('.wst')).toHaveText('gewogen');
  // typing a new weight updates the line at once
  await dlg.getByLabel('Gewicht pro Stück (g)').fill('150');
  await expect(dlg.getByTestId('comes-line')).toContainText('150 g · kommt mit');
  await dlg.getByLabel('Gewicht pro Stück (g)').fill('160');
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
  const d2 = page.locator('dialog[open]');
  await expect(fold(d2, 'blocks')).toHaveJSProperty('open', true);
  await expect(openFolds(d2)).toHaveCount(1);
  // after reviewed trips the line says how often it was along and used
  await expect(d2.getByTestId('comes-line')).toContainText('8× dabei, 4× gebraucht');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test('lighter alternatives in the row Gewicht: linked first, suggestions with Als Alternative merken, Passt nicht and Undo', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/gear?item=RA01');
  let dlg = page.locator('dialog[open]');
  await fold(dlg, 'weight').locator(':scope > summary').click();
  await expect(fold(dlg, 'weight')).toContainText('Leichteste Alternative: Wind vest, 112 g weniger · von dir verknüpft');
  await expect(fold(dlg, 'weight').getByRole('list', { name: 'Gewicht im Vergleich' }).getByRole('listitem')).toHaveCount(2);
  await page.keyboard.press('Escape');
  // the closed dialog takes its history entry away (backclose.js, history.back() after the tap);
  // a next address before that would be undone by that late back step
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => history.state?.pgDialog ?? null)).toBeNull();

  await page.goto('./#/gear?item=CO03');
  dlg = page.locator('dialog[open]');
  await expect(dlg).toContainText('Steel pot');
  const w = fold(dlg, 'weight');
  // the row Gewicht stays open from before (remembered for the session); open it if it is not
  await expect(async () => {
    if (!(await w.evaluate((d) => d.open))) await w.locator(':scope > summary').click();
    await expect(w).toHaveJSProperty('open', true, { timeout: 1000 });
  }).toPass();
  const cards = w.getByRole('group', { name: /^Vorschlag: / });
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('Titanium pot');
  await expect(cards.first()).toContainText('58 g leichter');
  await expect(cards.first()).toContainText('Gleiche Kategorie, schon gewogen. Die App wählt nichts aus.');
  await expect(cards.last()).toContainText('Gas stove');
  // the history row does not show the same suggestions a second time
  await expect(dlg.getByRole('list', { name: 'Vorgeschlagene leichtere Alternativen' })).toHaveCount(0);
  // «Passt nicht»: gone for this item, kept in the setting, and Undo brings it back
  await w.getByRole('button', { name: 'Passt nicht: Titanium pot' }).click();
  await expect(cards).toHaveCount(1);
  await expect(w.getByRole('status')).toContainText('«Titanium pot» ausgeblendet');
  await expect(w.locator(':scope > summary')).toContainText('1 Vorschlag');
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'altDismissed')?.value).toEqual({ CO03: ['CO02'] });
  await w.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(cards).toHaveCount(2);
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'altDismissed')?.value).toEqual({});
  // nothing was chosen for the item
  expect((await table(page, 'items')).find((i) => i.id === 'CO03').altFor ?? null).toBe(null);
  // «Als Alternative merken» links them: the pot now stands in for this item, shown as linked; Undo unlinks
  await cards.first().getByRole('button', { name: 'Als Alternative merken' }).click();
  await expect(w).toContainText('Leichteste Alternative: Titanium pot, 58 g weniger · von dir verknüpft');
  await expect(cards).toHaveCount(1);
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'CO02').altFor).toBe('CO03');
  await w.getByRole('button', { name: 'Rückgängig' }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'CO02').altFor ?? null).toBe(null);
  await expect(cards).toHaveCount(2);
  // both turned down: no lighter alternative left
  await w.getByRole('button', { name: 'Passt nicht: Titanium pot' }).click();
  await w.getByRole('button', { name: 'Passt nicht: Gas stove' }).click();
  await expect(w).toContainText('Keine leichtere Alternative in deinem Material.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test('an empty Nie gebraucht: green check, three numbers, Auf dem Weg dahin with dots and Zu Hause lassen', async ({ page, context }, info) => {
  const data = homeFixture();
  // two reviewed trips; the first packed item was along on both and never used
  const first = base.tables.items[3].id;
  data.tables.debriefs = data.tables.debriefs.slice(0, 2).map((d) => ({ ...d, items: { [first]: 'unused' } }));
  await openHome(page, context, info, { data });
  await page.goto('./#/gear?view=never');
  const none = page.locator('.never0');
  await expect(none.getByRole('heading', { name: 'Zurzeit nichts, das nur mitfährt' })).toBeVisible();
  await expect(none).toContainText('Hier landet, was du 3 Mal oder öfter dabei hattest und nie gebraucht hast.');
  await expect(none).toContainText('Bisher hast du 2 Touren ausgewertet.');
  await expect(none.locator('.ntiles dd')).toHaveText(['2', '1', '0 g']);
  await expect(none.locator('.ntiles dt')).toHaveText(['Touren ausgewertet', 'auf dem Weg dahin', 'totes Gewicht']);
  const way = none.getByRole('region', { name: /Auf dem Weg dahin/ });
  await expect(way.getByRole('heading')).toHaveText('Auf dem Weg dahin 1');
  await expect(way).toContainText('1 oder 2 Mal dabei und nie gebraucht.');
  await expect(way.getByRole('img', { name: '2 von 3 · nie gebraucht' })).toBeVisible();
  await expect(way.locator('.owdots i.on')).toHaveCount(2);
  // «Zu Hause lassen» marks it as staying at home (as the debrief does), with Undo
  await way.getByRole('button', { name: /zu Hause lassen$/ }).click();
  await expect(way).toContainText('Bleibt zu Hause');
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === first).leaveHome).toBe(true);
  await page.locator('.bulk').getByRole('button', { name: 'Rückgängig' }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === first).leaveHome ?? false).toBe(false);
  await expect(way.getByRole('button', { name: /zu Hause lassen$/ })).toBeVisible();
  await way.locator('.owb').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test('without any trip review Nie gebraucht says it fills after the first reviews, with a link to the debrief', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.debriefs = [];
  await openHome(page, context, info, { data });
  await page.goto('./#/gear?view=never');
  await expect(page.locator('.never0')).toContainText('Diese Ansicht füllt sich nach deinen ersten Rückblicken. Nach jeder Tour fragt die App kurz, was du gebraucht hast.');
  await expect(page.locator('.never0').getByRole('link', { name: 'Zum Rückblick ›' })).toHaveAttribute('href', '#/debrief');
  await expect(page.locator('.never0 .onway')).toHaveCount(0);
  await expect(page.locator('.never0 .ntiles')).toHaveCount(0);
});
