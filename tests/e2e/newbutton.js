// v0.76.0 «Fünf Orte» 1 (Noah: «Weicht aus»): on Today on a phone the round + steps aside while the
// 8 buttons of «What do you want to do?» are on the screen. A test that opens «New» there scrolls
// them away first, like a person would; everywhere else the + is simply there.
import { expect } from '@playwright/test';

export async function newButton(page, name) {
  const fab = page.locator('button.fab');
  if (await fab.count()) {
    // The + steps aside through an IntersectionObserver, a moment after Today has drawn its 8 buttons
    // (they come with the data). Wait until that has happened, so the + does not go away after the check.
    if (/#\/?$/.test(new URL(page.url()).hash || '#/')) await page.locator('[data-section="actions"]').waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
    await expect
      .poll(() =>
        page.evaluate(() => {
          const r = document.querySelector('[data-section="actions"]')?.getBoundingClientRect();
          const seen = !!r && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
          return document.querySelector('button.fab')?.classList.contains('away') === seen;
        }),
      )
      .toBe(true);
  }
  if ((await fab.count()) && (await fab.evaluate((b) => b.classList.contains('away')))) {
    await page.locator('[data-section="actions"]').evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().bottom + 1));
    await expect(fab).not.toHaveClass(/away/);
  }
  return page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
}
