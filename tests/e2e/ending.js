// v0.67.0 «Übergänge 1»: how a person ends a trip and gets to its debrief, for the specs that walk
// the whole loop. On the way (or, without a bike, the packing day) the trip ends with its one main
// button («Letzten Tag abschliessen», «Tour abschliessen»), or before its last day with the quiet link
// «Tour beenden …». Ending asks first while the riding is still ahead by the plan (U004: the specs
// without a fixed clock run at any hour, so the question may or may not come), then the interstitial
// «Tour beendet» (#/trip/<id>/ended) leads to the debrief: «Weiter zum Rückblick», or for a day trip
// «Rückblick ausführlich» (its main button «Alles gut» is the short debrief, Ü5a).
// SN1 (Seiten neu, changed on purpose): before the last day «Tour beenden …» is an entry of the band's «…»
// («Notiz» is the main button there); endMenu opens it.
import { expect } from '@playwright/test';

export async function endToDebrief(page, T) {
  const band = page.locator('.trip-band');
  await expect(band.locator('h1')).toBeVisible();
  const main = band.locator('.mainbar .go');
  const more = band.getByRole('button', { name: T('End the trip …') });
  await expect(main.or(more).first()).toBeVisible();
  if (await main.isVisible()) await main.click();
  else await endMenu(page, T);
  await endedPage(page, T);
  const detail = page.getByRole('link', { name: T('Debrief in detail') });
  if (await detail.count()) await detail.click();
  else {
    await expect(page.locator('main .mainbar .btn.hi')).toHaveText(T('Continue to Debrief'));
    await page.locator('main .mainbar .btn.hi').click();
  }
  await expect(page).toHaveURL(/#\/debrief\//);
}

/** After a tap that ends the trip: answer the question when it comes, then «Tour beendet». */
export async function endedPage(page, T) {
  const sheet = page.locator('dialog.endsheet');
  const ended = page.getByRole('heading', { level: 1, name: T('Trip ended') });
  await expect(sheet.or(ended)).toBeVisible();
  if (await sheet.isVisible()) await sheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
  await expect(ended).toBeVisible();
  await expect(page).toHaveURL(/#\/trip\/[^/]+\/ended$/);
}

/** SN1: «Tour beenden …» before the last day on On the way. Versteckte Funktionen (Noah 22.10.2026, changed
 *  on purpose): it is a visible button in the trip band, no longer an entry of its «…». */
export async function endMenu(page, T) {
  await page.locator('.trip-band').getByRole('button', { name: T('End the trip …') }).click();
}
