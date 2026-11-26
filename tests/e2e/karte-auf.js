// Durchklick Etappe 2, Frage 1a (Noah 05.11.2026): on a phone the cards «Belongs to …» and «All here» of Packing, Trips,
// Material and Bikes start as one line. A spec that needs the card opens it with the line first (a computer shows it open).
import { expect } from '@playwright/test';

/** Opens the card with this id ('gd:pack', 'ah:bikes') when it shows as a line; waits for the card or the line first. */
export async function openCard(page, id) {
  // «Belongs to …» is a part of the «?» window since 26.11.2026 (Noah «Ja», Touren-Seite klarer): open the window
  if (id.startsWith('gd:')) {
    await page.locator('[data-help-open]:visible').first().click();
    await expect(page.locator('dialog[data-help] [data-gehoert]').first()).toBeVisible();
    return;
  }
  const line = page.locator(`[data-card-line="${id}"]`);
  const card = page.locator(id.startsWith('ah:') ? `[data-all-here="${id.slice(3)}"]` : '[data-gehoert]').first();
  await expect(line.or(card)).toBeVisible();
  if (await line.count()) await line.click();
  await expect(card).toBeVisible();
}

/** Opens every card that shows as a line on this page (a computer shows them open already). */
export async function openCards(page) {
  const lines = page.locator('[data-card-line]');
  for (let n = await lines.count(); n > 0; n = await lines.count()) {
    await lines.first().click();
    await expect(lines).toHaveCount(n - 1);
  }
}
