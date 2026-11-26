// «Neue Ordnung» V5 (Noah 21.11.2026): Velos, Material and Ausrüstung are one place, «Velos und Material», with four tabs (Velos, Pflege, Material, Sets);
// the old pages are chips under them and keep their addresses. The switch Velos | Ausrüstung | Material on a phone is gone.
// Fictional data (home0460-fixture.js), German UI, nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { TABS, TAB_LINK } from './placetab.js';

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Velos und Material: four tabs, the old pages as chips, every address still opens its page', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/bikes');
  const tabs = page.locator(TABS).first();
  await expect(tabs.locator(TAB_LINK)).toHaveCount(4); // Velos, Pflege, Material, Sets
  for (const href of ['#/bikes', '#/bikes?tab=care', '#/gear', '#/blocks']) await expect(tabs.locator(`a[href="${href}"]:not([data-side-sub])`)).toHaveCount(1);
  await expect(page.locator('[data-place-switch]')).toHaveCount(0);
  const chips = page.locator('nav.psubs');
  await expect(chips).toHaveCount(0); // Velos aufräumen (23.11.2026): no chips under «Velos»; Teile and Mein Setup are rows of the page
  await expect(page.locator('[data-my-setup-row]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('velos-material-velos.png') });

  await tabs.locator('a[href="#/gear"]').click();
  await expect(chips.locator('a')).toHaveCount(5); // Material: Alle, Kleider, Einkauf, Vorrat, Ausgeliehen
  await expect(chips.locator('a[data-sub="all"]')).toHaveAttribute('aria-current', 'page');
  await chips.locator('a[data-sub="clothes"]').click();
  await expect(page).toHaveURL(/#\/wardrobe$/);
  await expect(chips.locator('a[data-sub="clothes"]')).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: info.outputPath('velos-material-kleider.png') });
  await noSideScroll(page);

  // every old page opens at its old address and lights its tab and its chip
  for (const [hash, tab, sub] of [['#/bikes?tab=care', '#/bikes?tab=care', 'care'], ['#/care', '#/bikes?tab=care', 'care'], ['#/bikes?tab=shop', '#/bikes?tab=care', 'shop'], ['#/bikes?tab=compare', '#/bikes', null], ['#/bikes?tab=rig', '#/bikes', null], ['#/gear?view=wish', '#/gear', 'wish'], ['#/gear/supplies', '#/gear', 'supplies'], ['#/gear/lend', '#/gear', 'lend'], ['#/blocks', '#/blocks', 'blocks'], ['#/equipment', '#/blocks', 'sets']]) {
    await page.goto(`./${hash}`);
    await expect(tabs.locator(`a[href="${tab}"]:not([data-side-sub])`), hash).toHaveAttribute('aria-current', /page|true/);
    if (sub) await expect(chips.locator(`a[data-sub="${sub}"]`), hash).toHaveAttribute('aria-current', 'page');
  }
  expect(errors).toEqual([]);
});
