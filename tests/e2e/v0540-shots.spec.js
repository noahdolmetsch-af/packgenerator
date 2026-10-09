// v0.60.0 «Material-Detail ruhig»: before/after screenshots and the height of the item window.
// Runs only with SHOTS_0540=<folder> (and SHOTS_MODES=light,dark); a normal run skips it.
import { test } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { openHome, homeFixture } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

const dir = process.env.SHOTS_0540;
const modes = (process.env.SHOTS_MODES ?? 'light').split(',');

for (const mode of modes) {
  test(`item window and never used, ${mode}`, async ({ page, context }, info) => {
    test.skip(!dir, 'only with SHOTS_0540');
    mkdirSync(dir, { recursive: true });
    const dev = info.project.name === 'phone' ? 'phone390' : 'desktop1440';
    const name = (s) => `${dir}/${s}-${dev}-${mode}.png`;
    await openHome(page, context, info, { data: materialFixture(), mode: mode === 'dark' ? 'dark' : 'light' });
    await page.goto('./#/gear');
    await page.locator('main h1').waitFor();
    await page.waitForTimeout(500);
    if (info.project.name === 'desktop') {
      await page.locator('.mcard[data-id="RA01"] .mopen').click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: name('gear-detail'), fullPage: true });
    }
    await page.goto('./#/gear?item=RA01');
    const dlg = page.locator('dialog[open]');
    await dlg.waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: name('item'), fullPage: false });
    const tall = await dlg.evaluate((d) => d.scrollHeight);
    const file = `${dir}/heights.json`;
    const heights = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    heights[`${dev}-${mode}`] = tall;
    writeFileSync(file, JSON.stringify(heights, null, 2));
    if (tall > (page.viewportSize()?.height ?? 900)) {
      await page.setViewportSize({ width: page.viewportSize().width, height: Math.min(tall + 60, 6000) });
      await page.waitForTimeout(200);
      await page.screenshot({ path: name('item-full'), fullPage: false });
    }
    // «Nie gebraucht» with only a few debriefs
    await page.setViewportSize(info.project.name === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await openHome(page, context, info, { data: homeFixture(), mode: mode === 'dark' ? 'dark' : 'light' });
    await page.goto('./#/gear?view=never');
    await page.locator('main h1').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: name('never'), fullPage: true });
  });
}
