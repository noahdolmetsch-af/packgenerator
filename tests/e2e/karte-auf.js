// Durchklick Etappe 2, Frage 1a (Noah 05.11.2026): on a phone the cards «Belongs to …» and «All here» of Packing, Trips,
// Material and Bikes start as one line. A spec that needs the card opens it with the line first (a computer shows it open).
import { expect } from '@playwright/test';

/** Opens the card with this id ('gd:pack', 'ah:bikes') when it shows as a line; waits for the card or the line first. */
export async function openCard(page, id) {
  const line = page.locator(`[data-card-line="${id}"]`);
  const card = page.locator(id.startsWith('ah:') ? `[data-all-here="${id.slice(3)}"]` : '[data-gehoert]').first();
  await expect(line.or(card)).toBeVisible();
  if (await line.count()) await line.click();
  await expect(card).toBeVisible();
}
