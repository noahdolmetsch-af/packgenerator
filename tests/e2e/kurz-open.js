// 0.163.0 «Handy kurz»: on a phone Trips, Favourites and What is new start short (five rows, closed lines). The specs
// written before it open everything first with openShort(page), so they still see the whole page; on a computer
// only the trip list is cut (20 rows at a time, Tempo 19.10.2026) and it opens that. tests/e2e/handy-kurz.spec.js checks the short state itself.
import { expect } from '@playwright/test';

export async function openShort(page) {
  const hash = await page.evaluate(() => location.hash);
  if (hash.startsWith('#/trips')) {
    // the page is there once the Packmodus (open or as its line) or the empty page shows
    await expect(page.locator('[data-packmode-open], [data-packmode], main .empty, main [data-empty]').first()).toBeAttached({ timeout: 15_000 });
    if (!(await page.locator('main [data-empty]').count())) await page.locator('section[data-activities]').waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
    for (const sel of ['[data-packmode-open]', '[data-trips-extras]', '[data-act-phone-more]']) {
      const b = page.locator(sel);
      if (await b.count()) await b.first().click();
    }
    // Tempo (19.10.2026 «3a»): the trip list shows 20 rows at a time, on a computer too: open all of them
    for (let i = 0; i < 30 && (await page.locator('[data-pack-phone-more]').count()); i++) await page.locator('[data-pack-phone-more]').first().click();
  }
  if (/^#\/me\/news$/.test(hash)) {
    // the side parts are closed lines on a phone (SL groups); open them all
    await page.locator('main h1').first().waitFor();
    for (const id of ['wn-msg', 'wn-since', 'wn-never', 'wn-test-g', 'wn-plan']) {
      const head = page.locator(`[data-group="${id}"] .ls-gh[aria-expanded="false"]`);
      if (await head.count()) await head.click();
    }
  }
  if (hash.startsWith('#/favorites')) {
    await expect(page.locator('[data-fav-line], li.frow, .favs .empty, .favs [data-empty]').first()).toBeAttached({ timeout: 15_000 });
    for (const sel of ['[data-fav-line]', '[data-fav-more]']) {
      for (let i = 0; i < 30 && (await page.locator(sel).count()); i++) await page.locator(sel).first().click();
    }
  }
}
