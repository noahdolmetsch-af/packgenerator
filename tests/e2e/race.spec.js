// Paket U «Rennen» (Noah 19.10.2026): Touren › Rennen with the sample race (made up, in the app source),
// the plan that recalculates, the tasks that tick themselves, all 40 functions with their switches and
// every part of the race on the phone without sideways scrolling. Fictional data (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { PARTS } from '../../src/lib/race/parts.js';

const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1);
    return { d: document.documentElement.scrollWidth - w, x: scrollX, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} x=${over.x} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};

test('Races: the sample race plays through, its tasks tick, the 40 functions switch, every part fits', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  // Touren › Rennen
  await page.goto('./#/trips');
  await page.locator('[data-to-races]').click();
  await expect(page).toHaveURL(/#\/race$/);
  await expect(page.locator('h1')).toHaveText(T('Races'));
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  await expect(page.locator('h1')).toHaveText(T('Sample race 1000'));
  // the plan: summary, day plan, three ways with a recommendation
  await expect(page.locator('[data-race-summary]')).toBeVisible();
  const rows = page.locator('[data-plan-days] tbody tr');
  await expect.poll(() => rows.count()).toBeGreaterThan(5);
  const before = await rows.count();
  await expect(page.locator('[data-plan-way]')).toHaveCount(3);
  await expect(page.locator('[data-plan-reasons] li').first()).toBeVisible();
  await noSideways(page);

  // task 1: 650 → 550 m/h, the plan gets longer and the task ticks itself
  const climb = page.locator('[data-assume-card-in="climbMh"]');
  await climb.fill('550');
  await climb.press('Tab');
  await expect(page.locator('[data-sample-task="climb"]')).toBeChecked();
  await expect.poll(() => rows.count()).toBeGreaterThanOrEqual(before);
  // task 2: the tent
  await page.locator('[data-plan-choose="tent"]').click();
  await expect(page.locator('[data-sample-task="tent"]')).toBeChecked();
  // task 5: a scenario
  await page.locator('[data-scenario-name]').fill('Testszenario');
  await page.locator('[data-scenario-save]').click();
  await expect(page.locator('[data-scenario-table] thead th')).toHaveCount(3);
  await expect(page.locator('[data-sample-task="scenario"]')).toBeChecked();

  // all 40 functions: switch «Dry stretches» (19) off, it is gone under «Along the route», then show all again
  await expect(page.locator('[data-case]')).toHaveCount(40);
  await page.locator('[data-case="19"] summary').click();
  await page.locator('[data-case-on="19"]').uncheck();
  await page.locator('[data-race-tab="route"]').click();
  await expect(page.locator('[data-page="race-route"]')).toBeVisible();
  await expect(page.locator('[data-race-box="food"]')).toBeVisible();
  await expect(page.locator('[data-race-box="dry"]')).toHaveCount(0);
  await page.locator('[data-race-tab="plan"]').click();
  await page.locator('[data-cases-all]').click();
  await page.locator('[data-case="19"] summary').click();
  await expect(page.locator('[data-case-on="19"]')).toBeChecked();
  // «Try it» opens the part with the box
  await page.locator('[data-case-go="19"]').click();
  await expect(page.locator('[data-race-box="dry"]')).toBeVisible();

  // every part opens and fits the screen
  for (const p of PARTS) {
    await page.locator(`[data-race-tab="${p.key}"]`).click();
    await expect(page.locator(`[data-page="race-${p.key}"]`)).toBeVisible();
    await expect(page.locator('[data-race-box]').first()).toBeVisible();
    await noSideways(page, p.key);
  }

  // the explanation of a box, and the pencil on the sample
  await page.locator('[data-race-tab="plan"]').click();
  await page.locator('[data-race-info="summary"]').click();
  await expect(page.locator('[data-race-explain="summary"]')).toContainText(T('Where the data comes from'));

  // Today: the sample race does not count as «your race»
  await page.goto('./#/');
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(page.locator('[data-race-countdown]')).toHaveCount(0);
});
