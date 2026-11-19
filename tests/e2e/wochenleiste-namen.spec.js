// UI-Test Flow, Fund 8 (Noah «c»): the names in «Diese Woche» are no longer cut with «…»; a long name
// wraps over two lines. Fictional data only; the clock stands on Friday 9 October 2026 (aktiv-fixture.js).
// SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

async function shot(page, info, name, loc) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(300);
  await loc.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('names in the week strip are shown whole, over up to two lines', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());
  await page.goto('./#/flow');
  await page.reload();
  await ready(page);
  const card = page.locator('main [data-week-glance]');
  await expect(card).toBeVisible();
  const names = card.locator('.nm');
  expect(await names.count()).toBeGreaterThan(2);
  // never a «…»: the text is not wider than its box and fits in at most two lines
  const cut = await names.evaluateAll((els) =>
    els.map((el) => ({ text: el.textContent, wide: el.scrollWidth > el.clientWidth + 1, lines: Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight)) })).filter((x) => x.wide || x.lines > 2),
  );
  expect(cut).toEqual([]);
  await shot(page, info, 'wochenleiste', card);
  expect(errors).toEqual([]);
});
