// «Ganze App neu denken» Schritt 11 (Noah 18.11.2026 «1a 2a 3b 4b 5b»): Planen has three tabs, Woche, Notizen and Alltag (V4a, 21.11.2026: «Woche» has Training as its second tab, so four); the old pages
// are chips under them and keep their addresses. Fictional data (home0460-fixture.js), German UI, nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { TABS } from './placetab.js';

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Planen: three tabs, the other pages as chips, every address still opens its page', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/week');
  const tabs = page.locator(TABS).first();
  await expect(tabs.locator('a')).toHaveCount(4); // V4a: Woche, Training, Notizen, Alltag
  for (const href of ['#/week', '#/flow/training', '#/notes', '#/me/alltag']) await expect(tabs.locator(`a[href="${href}"]`)).toHaveCount(1);
  // no «Alle n» window any more: nothing is hidden behind it
  await expect(page.locator('nav.ptabs .pmore')).toHaveCount(0);
  const chips = page.locator('nav.psubs');
  await expect(chips.locator('a')).toHaveCount(2); // Woche: Woche, Termine
  await expect(chips.locator('a[data-sub="week"]')).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: info.outputPath('planen-woche.png') });

  await tabs.locator('a[href="#/notes"]').click();
  await expect(chips.locator('a')).toHaveCount(5); // Notizen: Notizen, Eingang, Merken, Tagebuch, Mail
  await expect(chips.locator('a[data-sub="notes"]')).toHaveAttribute('aria-current', 'page');
  await chips.locator('a[data-sub="inbox"]').click();
  await expect(page).toHaveURL(/#\/inbox$/);
  await expect(tabs.locator('a[href="#/notes"]')).toHaveAttribute('aria-current', /page|true/);
  await expect(chips.locator('a[data-sub="inbox"]')).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: info.outputPath('planen-notizen.png') });
  await noSideScroll(page);

  // every old page opens at its old address and lights its tab and its chip
  for (const [hash, tab, sub] of [['#/me/agenda', '#/week', 'agenda'], ['#/calendar', '#/notes', 'remember'], ['#/tagebuch', '#/notes', 'tagebuch'], ['#/me/mail', '#/notes', 'mail'], ['#/me/frei', '#/me/alltag', 'frei'], ['#/me/compass', '#/me/alltag', 'compass'], ['#/me/links', '#/me/alltag', 'links']]) {
    await page.goto(`./${hash}`);
    await expect(tabs.locator(`a[href="${tab}"]`), hash).toHaveAttribute('aria-current', /page|true/);
    await expect(chips.locator(`a[data-sub="${sub}"]`), hash).toHaveAttribute('aria-current', 'page');
  }
  void T;
  expect(errors).toEqual([]);
});
