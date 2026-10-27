// «Ausprobieren» bei Neuigkeiten (Noah 27.10.2026 «1a 2a 3a 4a 5a»): a tap on a line of Me › What is new goes to the
// exact place (know/newsgo.js, newsRun.js): the spot glows and the line «New here: …» shows; a thing without a fixed
// place shows the line where it shows up. Every line of the news files and of know/newsgo-map.js is tapped once.
// Fictional data only (gesamttest fixture).
import { test, expect } from '@playwright/test';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';
import { NEWS, NEWS_DE } from '../../src/lib/news/index.gen.js';
import { GO } from '../../src/lib/know/newsgo-map.js';
import { WHATS_NEW } from '../../src/lib/whatsnew.js';

const T0 = tr('de');
const T = (en) => NEWS_DE[en] ?? T0(en);
const exact = (g) => g !== null && g !== undefined && (typeof g === 'string' || g.steps?.length || g.where);
// every line with an exact target: [version, text, go]
const ROWS = WHATS_NEW.flatMap((e) =>
  [...e.points, ...(e.small ?? [])]
    .map((p) => [e.version, p.text, Object.hasOwn(p, 'go') ? p.go : GO[p.text]])
    .filter(([, , g]) => exact(g)),
);
const NEWEST = WHATS_NEW[0].version;

test.setTimeout(600_000);

test('every line of What is new goes to its exact place', async ({ page, context }, info) => {
  await start(page, context, info);
  expect(ROWS.length).toBeGreaterThan(0);
  // «Try it» on the newest update goes to its place and says «New here: …»
  await page.goto('./#/me/news');
  await page.locator('[data-news-try]').first().click();
  await expect(page.locator('[data-spot-note]').first()).toContainText(T('New here: {what}').split('{')[0].trim());
  const missing = [];
  for (const [version, text, g] of ROWS) {
    await page.goto('./#/');
    await page.goto('./#/me/news');
    await page.locator('main h1').first().waitFor({ timeout: 8000 }).catch(() => {});
    await settle(page);
    let box = page.locator(`[data-newest="${version}"]`);
    if (version !== NEWEST) {
      await page.getByRole('searchbox', { name: T('Find an update') }).fill(version);
      await page.locator(`[data-row="${version}"]`).first().click();
      box = page.locator('.wn-vopen');
    }
    await box.getByRole('link', { name: T(text), exact: false }).first().click();
    // a spot that lights up, or (a thing without a fixed place, or a function without a spot) the line at the bottom
    const lit = page.locator('[data-spot-on]').first();
    const said = page.locator('[data-spot-note]').first();
    const wantLit = typeof g === 'object' && g.steps?.length && !g.where;
    try {
      if (wantLit) await lit.waitFor({ state: 'visible', timeout: 10_000 });
      else await expect(lit.or(said).first()).toBeVisible({ timeout: 10_000 });
      if (wantLit) {
        await page.waitForTimeout(1000); // a window or edit mode that just opened settles first (spot.js looks again)
        const b = await lit.boundingBox();
        if (!b || b.y + b.height < 0 || b.y > page.viewportSize().height) missing.push(`${version} «${text}»: lit but not on screen`);
        // the line «New here» never covers a small lit spot
        const n = await said.boundingBox();
        // (a spot taller than 40 % of the screen, a whole card, can't help sharing the screen with it)
        if (b && n && b.height < 0.4 * page.viewportSize().height && n.y < b.y + b.height && n.y + n.height > b.y && n.x < b.x + b.width && n.x + n.width > b.x) missing.push(`${version} «${text}»: the line covers the spot`);
      }
    } catch {
      missing.push(`${version} «${text}»: nothing lit on ${page.url().split('#')[1]}`);
    }
    await page.keyboard.press('Escape');
    // the glow ends (3 s) before the next line, so the next check sees its own spot
    await expect(page.locator('[data-spot-on]')).toHaveCount(0, { timeout: 6000 }).catch(() => {});
  }
  expect(missing).toEqual([]);
});

