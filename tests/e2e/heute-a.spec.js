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
  // 0.165.0 on a phone (Noah 20.10.2026 «Problem ist abgeschnitten»): with «Well done» above it the card of «Up now»
  // was as tall as the whole tile, so its bottom (the impulse) slid under the trip card. Every tile holds its content.
  test('HA3: no tile overlaps the next one; one quiet Well done line', async ({ page, context }, info) => {
    const d = homeFixture();
    // three congratulations at once, as on the phone of 20.10.2026: three challenges reached today (fictional)
    const ch = (id, what) => ({ id: `test_data_gtp_${id}`, area: 'today', what, times: 3, from: day(-10), until: day(10), doneOn: day(0), stopped: false });
    d.tables.settings.push({ key: 'challenges', value: [ch('c1', 'Swim'), ch('c2', 'Sauna'), ch('c3', 'Walk by the lake')] });
    await openHome(page, context, info, { data: d });
    const ab = page.locator('[data-section="abfragen"]');
    if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
    await expect(page.locator('[data-section="today"] .imp')).toBeVisible();
    await expect(page.locator('[data-section="du"]')).toBeVisible();
    await expect(page.locator('[data-cheers] li')).toHaveCount(1);
    const over = await page.locator('.wall > [data-tile]').evaluateAll((tiles) => {
      const out = [];
      const boxes = tiles.map((t) => t.getBoundingClientRect());
      tiles.forEach((t, i) => {
        const b = boxes[i];
        // nothing inside a tile reaches below the tile
        for (const el of t.querySelectorAll('.body *')) {
          const r = el.getBoundingClientRect();
          if (r.height && r.bottom > b.bottom + 1) out.push(`${t.dataset.tile}: ${el.className || el.tagName} ${Math.round(r.bottom - b.bottom)} px below`);
        }
        // and no two tiles cover each other
        boxes.forEach((o, j) => {
          if (j > i && o.top < b.bottom - 1 && o.bottom > b.top + 1 && o.left < b.right - 1 && o.right > b.left + 1) out.push(`${t.dataset.tile} covers ${tiles[j].dataset.tile}`);
        });
      });
      return [...new Set(out)];
    });
    expect(over).toEqual([]);
  });
});
