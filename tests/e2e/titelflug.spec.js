// «Der Titel fliegt mit» (Paket A Seitenwechsel 2, Noah 03.11.2026 «b»): tap a tour's name in Touren and the name travels to the heading
// of its page (a View Transition, only the name moves); with «Reduce motion» nothing flies. Fictional data, German UI.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sn4plusData, D0 } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/titelflug-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(sn4plusData()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
    // count the transitions the app starts, and what flew
    window.__vt = [];
    const start = Document.prototype.startViewTransition;
    if (start) {
      Document.prototype.startViewTransition = function (cb) {
        const t = start.call(this, cb);
        t.ready.then(() => window.__vt.push(document.getAnimations().filter((a) => String(a.effect?.pseudoElement ?? '').includes('pg-title')).length)).catch(() => {});
        return t;
      };
    }
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('about:blank');
  await page.goto('./#/trips');
  // on a phone the list «Mit Packliste» is one line that opens first
  const open = page.locator('[data-packmode-open]');
  await open.or(page.locator('a.rn[data-vt-title]').first()).first().waitFor();
  if (await open.isVisible()) await open.click();
  await expect(page.locator('a.rn[data-vt-title]').first()).toBeVisible();
}

test('the name of a tour flies to the heading of its page', async ({ page, context }, info) => {
  await start(page, context, info);
  const link = page.locator('a.rn[data-vt-title]').first();
  const title = (await link.textContent()).trim();
  await link.click();
  await expect(page).toHaveURL(/#\/tour\//);
  await expect(page.locator('[data-tour-page] h1')).toContainText(title);
  // the transition ran, with a moving name, and cleaned up after itself
  await expect.poll(() => page.evaluate(() => window.__vt.length)).toBe(1);
  expect(await page.evaluate(() => window.__vt[0])).toBeGreaterThan(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-vt', /.*/);
  expect(await page.evaluate(() => document.querySelector('[data-tour-page] h1').style.viewTransitionName)).toBe('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  // back to the list: nothing was left behind, and the list works as before
  await page.goBack();
  await expect(page.locator('main h1').first()).toBeVisible();
  expect(await page.evaluate(() => window.__vt.length)).toBe(1); // going back starts no transition
});

test('with «Reduce motion» nothing flies and the page opens as before', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('a.rn[data-vt-title]').first().click();
  await expect(page).toHaveURL(/#\/tour\//);
  await expect(page.locator('[data-tour-page] h1')).toBeVisible();
  expect(await page.evaluate(() => window.__vt.length)).toBe(0);
});

test('a link without the mark, or a tap with a modifier key, starts nothing', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.evaluate(() => (location.hash = '#/gear'));
  await expect(page).toHaveURL(/#\/gear/);
  expect(await page.evaluate(() => window.__vt.length)).toBe(0);
});
