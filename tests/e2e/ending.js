// v0.67.0 «Übergänge 1»: how a person ends a trip and gets to its debrief, for the specs that walk
// the whole loop. On the way (or, without a bike, the packing day) the trip ends with its one main
// button («Letzten Tag abschliessen», «Tour abschliessen»), or before its last day with the quiet link
// «Tour beenden …». Ending asks first while the riding is still ahead by the plan (U004: the specs
// without a fixed clock run at any hour, so the question may or may not come), then the interstitial
// «Tour beendet» (#/trip/<id>/ended) leads to the debrief: «Weiter zum Rückblick», or for a day trip
// «Rückblick ausführlich» (its main button «Alles gut» is the short debrief, Ü5a).
// SN1 (Seiten neu, changed on purpose): before the last day «Tour beenden …» is a quiet button (in the band
// while riding, at the bottom of the page before «Losfahren», Noah 28.10.2026 «1a»); endMenu taps it.
import { expect } from '@playwright/test';

export async function endToDebrief(page, T) {
  const band = page.locator('.trip-band');
  await expect(band.locator('h1')).toBeVisible();
  const main = band.locator('.mainbar .go');
  const more = band.getByRole('button', { name: T('End the trip …') });
  await expect(main.or(more).first()).toBeVisible();
  await setOff(page, T);
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

/**
 * Klick-Rundgang 22.10.2026 H06 (changed on purpose): on On the way a riding day starts with «Losfahren»;
 * tap it when it is the main button, then the button is «Tour abschliessen» or the day's «Notiz».
 */
export async function setOff(page, T) {
  const main = page.locator('.trip-band .mainbar .go');
  if ((await main.count()) && (await main.isVisible()) && (await main.textContent()).includes(T('Start riding'))) {
    await main.click();
    await expect(main.filter({ hasText: T('Start riding') })).toHaveCount(0);
  }
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
  const band = page.locator('.trip-band');
  const btn = band.getByRole('button', { name: T('End the trip …') });
  // UI-Test T2 (G2-15) and Auffälligkeiten 28.10.2026 (Noah «1a», changed on purpose): before «Losfahren» the
  // button is at the bottom of the page (it was in the band's «…»)
  const foot = page.locator('[data-ride-end-foot]');
  await expect(btn.or(foot).first()).toBeVisible();
  if (await btn.count()) return btn.click();
  await foot.click();
}
