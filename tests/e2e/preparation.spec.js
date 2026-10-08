import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const fixture = fileURLToPath(new URL('./preparation-fixture.json', import.meta.url));

// This catches premature writes, a lost alternative, a lost quantity, and accidentally
// mixing packing checkboxes back into planning. It exercises IndexedDB through the app.
test('review, apply, edit and pack a tour', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await context.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  // the app opens this panel by itself on an empty start: make sure it ends up open
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(fixture);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto('./#/pack');
  await expect(page.getByRole('heading', { name: 'Packliste', exact: true })).toBeVisible();
  const list = page.locator('.calm-pack');
  // v0.29.0 (Noah 5a): the bags start folded; open them all.
  const openAll = async () => {
    const heads = list.locator('button.bag-heading[aria-expanded="false"]');
    for (let n = await heads.count(); n > 0; n--) await heads.first().click();
  };
  await expect(list.locator('.planning-rows input[type=checkbox]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Wettervorschläge prüfen' }).click();
  await expect(page.getByRole('heading', { name: 'Noch zu entscheiden' })).toBeVisible();
  await page.getByLabel('Alternative für Warme Schicht').selectOption('albion');
  await page.getByRole('button', { name: 'Zurück', exact: true }).click();
  await openAll();
  await expect(list.getByText('Midlayer Albion', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Wettervorschläge prüfen' }).click();
  await page.getByLabel('Alternative für Warme Schicht').selectOption('albion');
  await page.getByRole('button', { name: 'Auswahl übernehmen' }).click();
  await expect(page.getByRole('heading', { name: 'Packliste', exact: true })).toBeVisible();
  await openAll();
  await expect(list.getByText('Midlayer Albion', { exact: true })).toBeVisible();
  // v0.24.1 (Noah 1a): the amount sits behind a tap on the row; the row shows "× n" above 1.
  await page.getByRole('button', { name: 'Menge, verschieben oder herausnehmen: Carb-Pulver' }).click();
  await page.getByRole('button', { name: 'Carb-Pulver: eins mehr' }).click();
  const carb = list.locator('.planning-row').filter({ hasText: 'Carb-Pulver' });
  await expect(carb.locator('.amount span')).toHaveText('3');
  await expect(carb.locator('.item-qty')).toHaveText('× 3');
  await expect(carb.locator('.item-weight')).toHaveText('240 g');
  await page.reload();
  await openAll();
  await expect(page.locator('.planning-row').filter({ hasText: 'Carb-Pulver' }).locator('.item-qty')).toHaveText('× 3');
  await page.getByRole('button', { name: 'Menge, verschieben oder herausnehmen: Carb-Pulver' }).click();
  await expect(page.locator('.planning-row').filter({ hasText: 'Carb-Pulver' }).locator('.amount span')).toHaveText('3');
  // Preserve v0.22.0's honest sums and shared readiness statements after integrating main.
  await list.locator('.weight-details > summary').click();
  await expect(list.locator('.weight-grid').getByText('bekannt:', { exact: true }).first()).toBeVisible();
  await expect(list.locator('.weight-grid .miss').first()).toContainText('nicht gewogen');
  // v0.25.0 (Noah 10): a short ride (1 day, no event) shows no bike care before the trip, only the ready check.
  await expect(list.locator('.calm-extra > summary').filter({hasText:'Velopflege'})).toHaveCount(0);
  await expect(list.locator('.calm-extra > summary').filter({hasText:'Vor der Tour'})).toContainText('Startcheck');
  await list.locator('.weight-details > summary').click();
  await page.getByLabel('Packliste gruppieren').selectOption('category');
  await expect(list.getByText('Carb-Pulver', { exact: true })).toHaveCount(0); // categories start folded
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(page.viewportSize().width);
  // v0.24.1 (Noah 2a): a day ride: "Alles gepackt, los"; v0.29.0: bag by bag is the "Packen" tab in the band.
  await expect(page.locator('.trip-band .go')).toHaveText('Alles gepackt, los');
  await page.getByRole('navigation', { name: 'Schritte dieser Tour' }).getByRole('link', { name: /^Packen/ }).click();
  await expect(page.locator('.pd')).toHaveAttribute('aria-label', 'Packtag: Alpine Tagestour');
  expect(errors).toEqual([]);
});
