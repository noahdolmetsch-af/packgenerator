// Merken (Durchklick Etappe 4, Befund E4-002): a to-do with a very long word must not make the page wider than
// the screen, on Merken, Heute and Woche. Fictional data only (tests/fixtures/gesamttest).
import { test, expect } from './clock.js';
import { start, sideways, tr } from './gesamttest/lib.js';

const T = tr('de');
const LONG = 'Bestellnummer'.repeat(25);

test('a to-do with one very long word does not push Merken, Heute or Woche sideways', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/calendar');
  await page.reload();
  await page.getByRole('button', { name: T('Add a to-do') }).click();
  const dlg = page.getByRole('dialog').last();
  await dlg.getByRole('textbox', { name: T('What?') }).fill(LONG);
  await dlg.getByRole('button', { name: T('Today'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  for (const hash of ['#/calendar', '#/', '#/week']) {
    await page.goto(`./${hash}`);
    await page.reload();
    await page.locator('main').waitFor();
    // Woche folds its days: the text may sit in a closed day, so only Merken and Heute must show it
    if (hash !== '#/week') await expect(page.locator('main')).toContainText(LONG.slice(0, 30));
    const sw = await sideways(page);
    expect(sw.sw, `${hash}: ${sw.wide.join(' | ')}`).toBeLessThanOrEqual(sw.w + 1);
  }
  expect(errors).toEqual([]);
});
