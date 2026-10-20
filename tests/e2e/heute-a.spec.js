// «Heute neu» A «Ein Blick» (Noah 20.10.2026 10:14 «1A 2 Morgen-Check mit nur 3 Fragen … 3a 4a 5b»), German UI,
// phone 390 and desktop 1440, fictional data (home0460-fixture.js; Friday 9 October 2026, 09:00):
// HA1 the wall: «Jetzt dran» and the trip on top, «Du heute», the week, the bikes, 8 shortcuts, «Alle Bereiche»;
//     no Strava card, no news banner, no «Tipp der Woche» on Heute (5b: under Ich › Was ist neu);
// HA2 the Morgen-Check shows 3 questions, «weitere Fragen einblenden» shows the rest, saving keeps the folded ones away.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { QUESTIONS, ON_AT_START } from '../../src/lib/abfragen.js';
import { READY } from '../../src/lib/home/tiles.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test.describe('HA Heute neu A', () => {
  test('HA1: one look, the ready wall', async ({ page, context }, info) => {
    const T = await openHome(page, context, info);
    // the dialog of the morning check may open on its own; close it to see the page
    const ab = page.locator('[data-section="abfragen"]');
    if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
    await expect(page.locator('[data-say]')).toBeVisible();
    const today = page.locator('[data-section="today"]');
    await expect(today.getByRole('heading', { name: new RegExp(T('Up now')) })).toBeVisible();
    await expect(page.locator('[data-section="du"]')).toBeVisible();
    await expect(page.locator('[data-section="du"]').getByRole('heading', { name: T('You today') })).toBeVisible();
    await expect(page.locator('[data-section="trip"]').first()).toBeVisible();
    // the order of the wall: «Up now» before the trip, «You today» after both
    const order = await page.evaluate(() => [...document.querySelectorAll('[data-section="today"], [data-section="trip"], [data-section="du"], [data-section="bikes"]')].map((x) => x.dataset.section));
    expect(order.indexOf('today')).toBeLessThan(order.indexOf('du'));
    expect(order.indexOf('trip')).toBeLessThan(order.indexOf('du'));
    expect(order.indexOf('du')).toBeLessThan(order.indexOf('bikes'));
    // 4a: 8 shortcuts from the ready wall
    expect(READY.filter((x) => x.size === 's').length).toBe(8);
    // at most 4 rows in «Jetzt dran»
    expect(await today.locator('.row').count()).toBeLessThanOrEqual(4);
    // the ride idea with «Schnellstart» in the first screen (release analysis F2: it was at 74 % of the page)
    const idea = today.locator('li[data-row="idea"]');
    await expect(idea.getByRole('button', { name: T('Quick start'), exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    const top = await idea.evaluate((el) => el.getBoundingClientRect().top);
    expect(top, 'the idea in the first screen').toBeLessThan(page.viewportSize().height);
    // 3a: the rest one tap away
    await expect(page.locator('[data-all-areas]')).toBeVisible();
    await expect(page.locator('[data-all-areas]')).toHaveText(T('All areas|home'));
    // 5b: the hints only under Ich
    await expect(page.locator('[data-tile-tipweek]')).toHaveCount(0);
    await expect(page.locator('[data-section="strava-connect"]')).toHaveCount(0);
    await expect(page.locator('[data-news-banner]')).toHaveCount(0);
    await noSideways(page);
    await page.locator('[data-all-areas]').click();
    await expect(page).toHaveURL(/#\/features/);
    await page.goto('./#/me/news');
    await expect(page.locator('[data-tipweek-me]')).toBeVisible();
  });

  test('HA2: the morning check with 3 questions, the rest on demand', async ({ page, context }, info) => {
    const d = homeFixture();
    d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q: {}, own: [] } });
    const T = await openHome(page, context, info, { data: d });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveJSProperty('open', true);
    await expect(card.locator('[data-q]')).toHaveCount(3);
    const more = card.locator('[data-ab-more]');
    await expect(more).toBeVisible();
    const hidden = Number((await more.textContent()).match(/\d+/)[0]);
    expect(hidden).toBeGreaterThan(0);
    expect(QUESTIONS.filter((x) => ON_AT_START.has(x.id)).length).toBeGreaterThanOrEqual(3 + hidden);
    await noSideways(page);
    await more.click();
    await expect(card.locator('[data-q]')).toHaveCount(3 + hidden);
    await expect(more).toHaveCount(0);
    expect(T('Show {n} more questions', { n: 2 })).toMatch(/Fragen/);
  });
});
