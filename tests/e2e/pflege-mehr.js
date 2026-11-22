// «Seite umbauen» (Noah 21.11.2026, Schritt B): on a bike's care page the ride ledger, the bike sheets, the bike
// card and the care rules sit under the fold «More» (shut). A spec that needs them opens it first.
import { expect } from '@playwright/test';

/** Opens «More» on the care page (the first fold of this name, or the one inside `scope`) and waits until it shows. */
export async function openCareMore(page, scope = page) {
  const fold = scope.locator('[data-care-more]').first();
  await expect(fold).toBeVisible();
  if (!(await fold.evaluate((e) => e.open))) await fold.locator('summary').click();
  await expect(fold.locator('.hint').first()).toBeVisible();
}
