// v0.47.2 «Material-Ansichten»: before/after screenshots of #/gear and one item for the design audit.
// Runs only with MAT_SHOTS=<folder> (and MAT_MODES=light,dark); a normal run skips it.
import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { openHome } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

const dir = process.env.MAT_SHOTS;
const modes = (process.env.MAT_MODES ?? 'light').split(',');

for (const mode of modes) {
  test(`gear and one item, ${mode}`, async ({ page, context }, info) => {
    test.skip(!dir, 'only with MAT_SHOTS');
    mkdirSync(dir, { recursive: true });
    const name = (s) => `${dir}/${s}-${info.project.name === 'phone' ? 'phone390' : 'desktop1440'}-${mode}.png`;
    await openHome(page, context, info, { data: materialFixture(), mode: mode === 'dark' ? 'dark' : 'light' });
    await page.goto('./#/gear');
    await page.locator('main h1').waitFor();
    await page.waitForTimeout(600);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: name('gear'), fullPage: true });
    // the desktop detail column: one card chosen (only in the new page)
    const card = page.locator('.mcard[data-id="RA01"] .mopen');
    if (info.project.name === 'desktop' && (await card.count())) {
      await card.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: name('gear-detail'), fullPage: true });
    }
    await page.goto('./#/gear?item=RA01');
    await page.locator('dialog[open]').waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: name('item'), fullPage: false });
    // the whole dialog, scrolled through
    const tall = await page.locator('dialog[open]').evaluate((d) => d.scrollHeight);
    if (tall > (page.viewportSize()?.height ?? 900)) {
      await page.setViewportSize({ width: page.viewportSize().width, height: Math.min(tall + 60, 4000) });
      await page.waitForTimeout(200);
      await page.screenshot({ path: name('item-full'), fullPage: false });
    }
  });
}
