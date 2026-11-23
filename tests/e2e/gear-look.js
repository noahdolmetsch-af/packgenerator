// Impeccable runde 2 (18.10.2026, Material 3): «List | Cards» and «Compact | With bag» sit in one line above the
// list on a computer; on a phone they live in «Sort and filter» under «Display». These helpers find them in either place.
import { expect } from '@playwright/test';

const isPhone = (page) => page.evaluate(() => matchMedia('(max-width: 719px)').matches);

/** Open «Sort and filter» on a phone (no-op on a computer); returns where the toggles are. */
export async function lookArea(page) {
  if (!(await isPhone(page))) return page;
  const sheet = page.locator('dialog.fsheet');
  if (!(await sheet.isVisible())) await page.locator('.toolbar .fbtn').click();
  await expect(sheet).toBeVisible();
  return sheet;
}

/** Close «Sort and filter» again if it is open. */
export async function closeLook(page) {
  const sheet = page.locator('dialog.fsheet');
  if (await sheet.isVisible()) {
    await sheet.locator('.x').click();
    await expect(sheet).toBeHidden();
  }
}

/** The button `button` of the toggle `group` («Zeigen als», «Tasche zeigen»), wherever it is. */
export async function lookButton(page, group, button) {
  return (await lookArea(page)).getByRole('group', { name: group }).getByRole('button', { name: button });
}

/** Tap that button and close the sheet afterwards (phone). */
export async function pickLook(page, group, button) {
  await (await lookButton(page, group, button)).click();
  await closeLook(page);
}
