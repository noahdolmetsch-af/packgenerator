// «Bereiche anpassen» (Noah 27.10.2026 «1a 2a»): under «Customise the start page» the areas of Heute move with the
// arrows (1a), get an own name and can be hidden, with Undo (2a). Hiding asks where the tiles go: «Without area» is
// chosen first; the tiles stay on Heute. Fictional data only (test_data_gtp_); SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const areas = (page) => page.locator('.wall [data-home-sec]').evaluateAll((els) => els.map((e) => e.dataset.homeSec));

/** One screen: with `at` scrolled to that part (the window of a dialog stays where it is). */
async function shot(page, info, name, at = null) {
  if (!process.env.SHOTS) return;
  if (at) await at.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('the areas of Today: move, rename and hide with Undo; the tiles stay', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const T = await openHome(page, context, info);
  await expect.poll(async () => (await areas(page)).slice(0, 2)).toEqual(['now', 'body']);
  const tilesBefore = await page.locator('.wall [data-tile]').count();

  await page.getByRole('button', { name: T('Customise the start page') }).click();
  const box = page.locator('[data-home-areas]');
  await expect(box.getByRole('heading', { name: T('Areas of Today') })).toBeVisible();
  const rows = () => box.locator('[data-area-row]').evaluateAll((els) => els.map((e) => e.dataset.areaRow));
  expect((await rows()).slice(0, 2)).toEqual(['now', 'body']);

  // 1a: «Dein Körper» one up
  await box.locator('[data-area-row="body"]').getByRole('button', { name: T('Move {name} up', { name: T('Your body|home') }) }).click();
  await expect.poll(rows).toEqual(expect.arrayContaining(['body', 'now']));
  expect((await rows()).slice(0, 2)).toEqual(['body', 'now']);

  // 2a: rename «Jetzt»
  await box.locator('[data-area-row="now"] [data-area-rename]').click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('textbox').fill('test_data_gtp_ Mein Morgen');
  await sheet.getByRole('textbox').press('Enter');
  await expect(box.locator('[data-area-row="now"]')).toContainText('test_data_gtp_ Mein Morgen');

  // 2a: hide «Deine Woche»: «Without area» is chosen first
  await box.locator('[data-area-row="week"] [data-area-hide]').click();
  const ask = page.getByRole('dialog');
  await expect(ask.getByRole('heading')).toHaveText(T('Hide area "{name}"?', { name: T('Your week|home') }));
  await expect(ask.getByRole('radio', { name: T('Without area') })).toBeChecked();
  await shot(page, info, 'bereich-ausblenden');
  await ask.getByRole('button', { name: T('Hide|area') }).click();
  await expect(box.locator('[data-area-hidden="week"]')).toBeVisible();
  await shot(page, info, 'bereiche-anpassen', box);

  // back on Today: the new order, the own name, no «Deine Woche», its tiles under «Ohne Bereich»
  await page.getByRole('button', { name: T('Done|customise') }).first().click();
  await expect.poll(() => areas(page)).not.toContain('week');
  const now = await areas(page);
  expect(now.slice(0, 2)).toEqual(['body', 'now']);
  expect(now.at(-1)).toBe('none');
  await expect(page.locator('[data-home-sec="now"] h2')).toHaveText('test_data_gtp_ Mein Morgen');
  await expect(page.locator('[data-home-sec="none"] h2')).toHaveText(T('Without area'));
  expect(await page.locator('.wall [data-tile]').count()).toBe(tilesBefore);
  await shot(page, info, 'heute-eigene-bereiche', page.locator('[data-home-sec="now"]'));
  await shot(page, info, 'heute-ohne-bereich', page.locator('[data-home-sec="none"]'));

  // Undo brings the area back, «Show again» too
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  await box.locator('[data-area-hidden="week"] [data-area-show]').click();
  await expect(box.locator('[data-area-row="week"]')).toBeVisible();
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(box.locator('[data-area-hidden="week"]')).toBeVisible();
  expect(errors).toEqual([]);
});
