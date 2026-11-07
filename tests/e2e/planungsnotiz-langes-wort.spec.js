// «Packen: Planungs-Notiz» (Durchklick Etappe 2, Befund E2-006): eine Notiz mit einem sehr langen Wort machte die
// ganze Seite breiter als den Bildschirm (die Zeile war Teil eines Rasters). Erfundene Daten (home0460-fixture).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Planungs-Notiz: ein langes Wort bleibt in seiner Zeile', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/pack');
  const field = page.getByLabel(T('New planning note'), { exact: false }).first();
  await field.fill('Zelt ' + 'Wunderlangeswort'.repeat(8));
  await field.press('Enter');
  const row = page.locator('[data-plan-note]').first();
  await expect(row).toContainText('Wunderlangeswort');
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
  expect(m.sw, 'the page is not wider than the screen').toBeLessThanOrEqual(m.w);
  const box = await row.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(m.w);
  expect(errors).toEqual([]);
});
