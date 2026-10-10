// v0.76.0 «Fünf Orte» 1 (Noah: «Weicht aus»): on Today on a phone the round + steps aside while the
// 8 buttons of «What do you want to do?» are on the screen. A test that opens «New» there scrolls
// them away first, like a person would; everywhere else the + is simply there.
import { expect } from '@playwright/test';

export async function newButton(page, name) {
  const fab = page.locator('button.fab');
  if ((await fab.count()) && (await fab.evaluate((b) => b.classList.contains('away')))) {
    await page.locator('[data-section="actions"]').evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().bottom + 1));
    await expect(fab).not.toHaveClass(/away/);
  }
  return page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
}
