// v0.76.0 «Fünf Orte» 1 (Noah: «Weicht aus»): the round + opens «New». v0.94.0 «Kachel-Wand»: Today has
// no row of 8 buttons any more, so the + no longer steps aside there; it is simply there everywhere.
// A + that steps aside (class «away») is scrolled past, like a person would.
import { expect } from '@playwright/test';

export async function newButton(page, name) {
  const fab = page.locator('button.fab');
  if ((await fab.count()) && (await fab.evaluate((b) => b.classList.contains('away')))) {
    await page.evaluate(() => window.scrollBy(0, innerHeight));
    await expect(fab).not.toHaveClass(/away/);
  }
  return page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
}
