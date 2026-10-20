// UI-Ziele #6 (Noah 20.10.2026 «freigabe», 4a): pages that were rows under «Ich» are tabs of Planen and Auswerten now.
// viaTab opens such a page the way a person does: the place in the bar (sidebar on a computer), then its tab.
import { expect } from '@playwright/test';
import { PLACES } from '../../src/lib/nav.js';

export async function viaTab(page, place, href) {
  // the place itself by its address (a window over the page, e.g. the morning check, could cover the bar)
  await page.goto(`./${PLACES.find((p) => p.key === place).href}`);
  const tab = page.locator(`nav.ptabs a[href="${href}"], .side .tabs a[href="${href}"]`).filter({ visible: true }).first();
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(new RegExp(`${href.replace(/[?#/]/g, (c) => `\\${c}`)}$`));
}
