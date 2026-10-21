// UI-Ziele #6 (Noah 20.10.2026 «freigabe», 4a): pages that were rows under «Ich» are tabs of Planen and Auswerten now.
// viaTab opens such a page the way a person does: the place in the bar (sidebar on a computer), then its tab.
// Impeccable P1 (20.10.2026): a phone shows at most four tabs, the rest sit under «Mehr»; a computer lists the
// tabs only in the sidebar under the place.
import { expect } from '@playwright/test';
import { PLACES } from '../../src/lib/nav.js';

/** The visible tabs of the open place: the bar on top (phone) or the list in the sidebar (computer). */
export const TABS = 'nav.ptabs:visible, .side .tabs:visible';

export async function viaTab(page, place, href) {
  // the place itself by its address (a window over the page, e.g. the morning check, could cover the bar)
  await page.goto(`./${PLACES.find((p) => p.key === place).href}`);
  let tab = page.locator(`nav.ptabs a[href="${href}"], .side .tabs a[href="${href}"]`).filter({ visible: true }).first();
  // on a phone a tab may sit under «Mehr»
  if (!(await tab.isVisible()) && (await page.locator('nav.ptabs .pmore').isVisible())) {
    await page.locator('nav.ptabs .pmore').click();
    tab = page.locator(`dialog.ptsheet a[href="${href}"]`);
  }
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(new RegExp(`${href.replace(/[?#/]/g, (c) => `\\${c}`)}$`));
}

/** Tap a tab by its name; on a phone it may sit under «Mehr». */
export async function tapTab(page, name) {
  const tab = page.locator(TABS).getByRole('link', { name, exact: true });
  if ((await tab.count()) && (await tab.first().isVisible())) return tab.first().click();
  await page.locator('nav.ptabs .pmore').click();
  await page.locator('dialog.ptsheet').getByRole('link', { name, exact: true }).click();
}
