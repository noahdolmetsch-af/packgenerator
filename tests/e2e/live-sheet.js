// The live panel: on the phone a tap on the handle goes peek → half → full; on the computer («Karte frei», M13b)
// the tab «Alles» opens and hides the panel at the right (peek ↔ full). Tap until it is full.
import { expect } from '@playwright/test';

export async function sheetFull(page, info) {
  const sh = page.locator('[data-live-sheet]');
  const toggle = page.locator('[data-live-sheet-toggle]');
  for (let i = 0; i < 3 && (await sh.getAttribute('data-live-sheet')) !== 'full'; i++) {
    const was = await sh.getAttribute('data-live-sheet');
    if (info.project.name === 'phone') await toggle.tap();
    else await toggle.click();
    await expect(sh).not.toHaveAttribute('data-live-sheet', was);
  }
  await expect(sh).toHaveAttribute('data-live-sheet', 'full');
}
