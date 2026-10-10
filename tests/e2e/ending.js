// v0.67.0 «Übergänge 1»: how a person ends a trip and gets to its debrief, for the specs that walk
// the whole loop. On the way (or, without a bike, the packing day) the trip ends with its one main
// button («Letzten Tag abschliessen», «Tour abschliessen»), or before its last day with the quiet link
// «Tour beenden …». Ending asks first while the riding is still ahead by the plan (U004: the specs
// without a fixed clock run at any hour, so the question may or may not come), then the interstitial
// «Tour beendet» (#/trip/<id>/ended) leads to the debrief: «Weiter zum Rückblick», or for a day trip
// «Rückblick ausführlich» (its main button «Alles gut» is the short debrief, Ü5a).
import { expect } from '@playwright/test';

export async function endToDebrief(page, T) {
  const band = page.locator('.trip-band');
  await expect(band.locator('h1')).toBeVisible();
  const main = band.locator('.mainbar .go');
  const link = page.locator('.endlink');
  await expect(main.or(link)).toBeVisible();
  if (await main.isVisible()) await main.click();
  else await link.click();
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
