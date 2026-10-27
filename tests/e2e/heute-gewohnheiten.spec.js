// «Deine Gewohnheiten» (Noah 27.10.2026 «1a 2a und b 3b»): the pencil on the card on top of Heute (and «Customise the
// start page») chooses up to three habits: activities of Aktiv (2a) and items of «Das tut mir gut» (2b), in their order
// (3b). Without a choice the card stays meditation. Fictional data only (test_data_gtp_); SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

async function shot(page, info, name, at = null) {
  if (!process.env.SHOTS) return;
  if (at) await at.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('habits on top of Today: meditation first, then up to three chosen ones, ticked with one tap, with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const T = await openHome(page, context, info);
  const top = page.locator('.wall [data-tile="meditation"]');

  // nothing chosen yet: the meditation card as before, now with a pencil
  await expect(top.locator('[data-med-card]')).toBeVisible();
  await expect(top.locator('[data-habit-card]')).toHaveCount(0);
  await shot(page, info, 'gewohnheit-vorher', top);

  // 1a: the pencil opens the window; 2a + 2b: one activity and one item
  await top.locator('[data-habit-pick]').click();
  const sheet = page.locator('[data-habits-sheet]');
  await expect(sheet.getByRole('heading', { name: T('Which habits on top of Today?') })).toBeVisible();
  await expect(sheet.locator('[data-habit-row]')).toHaveCount(1);
  const act = sheet.locator('[data-habit-add^="act:"]').first();
  const actKey = await act.getAttribute('data-habit-add');
  await act.click();
  const item = sheet.locator('[data-habit-add^="routine:"]').first();
  const itemKey = await item.getAttribute('data-habit-add');
  await item.click();
  await expect(sheet.locator('[data-habit-row]')).toHaveCount(3);
  // 3b: three are the most
  await expect(sheet.locator('[data-habits-full]')).toBeVisible();
  await expect(sheet.locator('[data-habit-add]').first()).toBeDisabled();
  // the order: the item one up, with the arrow
  const rows = () => sheet.locator('[data-habit-row]').evaluateAll((els) => els.map((e) => e.dataset.habitRow));
  await sheet.locator(`[data-habit-row="${itemKey}"]`).getByRole('button', { name: / nach oben$/ }).click();
  await expect.poll(rows).toEqual([expect.stringMatching(/^act:/), itemKey, actKey]);
  await sheet.evaluate((el) => el.scrollTo(0, 0));
  await shot(page, info, 'gewohnheiten-waehlen');
  await sheet.locator('[data-habits-done]').click();
  await expect(sheet).toHaveCount(0);

  // Today: three cards in that order; the new ones tick with one tap and take it back with a second
  await expect(top.locator('[data-med-card], [data-habit-card]')).toHaveCount(3);
  const cards = await top.locator('[data-med-card], [data-habit-card]').evaluateAll((els) => els.map((e) => e.dataset.habitCard ?? 'med'));
  expect(cards).toEqual(['med', itemKey, actKey]);
  for (const k of [actKey, itemKey]) {
    const b = top.locator(`[data-habit-card="${k}"] [data-habit-tick]`);
    await expect(b).toHaveAttribute('aria-pressed', 'false');
    await b.click();
    await expect(b).toHaveAttribute('aria-pressed', 'true');
  }
  await shot(page, info, 'gewohnheiten-heute', top);
  const itemTick = top.locator(`[data-habit-card="${itemKey}"] [data-habit-tick]`);
  await itemTick.click();
  await expect(itemTick).toHaveAttribute('aria-pressed', 'false');

  // the same window under «Customise the start page»; taking all away leaves a hint; Undo brings them back
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  await page.locator('[data-habits-open]').click();
  for (let i = 0; i < 3; i++) await sheet.locator('[data-habit-remove]').first().click();
  await sheet.locator('[data-habits-done]').click();
  await page.getByRole('button', { name: T('Done|customise') }).first().click();
  await expect(top.locator('[data-habits-empty]')).toBeVisible();
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(top.locator('[data-med-card], [data-habit-card]')).toHaveCount(3);
  expect(errors).toEqual([]);
});
