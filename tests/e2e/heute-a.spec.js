// «Heute neu» A «Ein Blick» (Noah 20.10.2026 10:14 «1A 2 Morgen-Check mit nur 3 Fragen … 3a 4a 5b»), German UI,
// phone 390 and desktop 1440, fictional data (home0460-fixture.js; Friday 9 October 2026, 09:00):
// HA1 the wall (N2, Noah «5a»): «Dein Körper heute» with the check and the Aktiv tiles on top, the week, the ring,
//     the bikes, 8 shortcuts, «Alle Bereiche»;
//     no Strava card, no news banner, no «Tipp der Woche» on Heute (5b: under Ich › Was ist neu);
// HA2 the Morgen-Check shows 3 questions, «weitere Fragen einblenden» shows the rest, saving keeps the folded ones away.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { QUESTIONS, ON_AT_START } from '../../src/lib/abfragen.js';
import { READY, HEAD_N2 } from '../../src/lib/home/tiles.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test.describe('HA Heute neu A', () => {
  // «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): on top «Dein Körper heute» with the check, then the Aktiv tiles,
  // the week, the ring, the trip, «Jetzt dran», the bikes and the 8 shortcuts
  test('HA1: the ready wall, body and Aktiv tiles on top', async ({ page, context }, info) => {
    const d = homeFixture();
    // fictional Fitbit days: today and yesterday
    d.tables.healthDays = [
      { date: day(-1), restingHr: 52, azm: 30, sleep: { asleepMin: 420, efficiency: 91 } },
      { date: day(0), restingHr: 55, azm: 12, sleep: { asleepMin: 450, efficiency: 88 } },
    ];
    const T = await openHome(page, context, info, { data: d });
    // the dialog of the morning check may open on its own; close it to see the page
    const ab = page.locator('[data-section="abfragen"]');
    if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
    await expect(page.locator('[data-say]')).toBeVisible();
    const body = page.locator('[data-section="body"]');
    await expect(body.getByRole('heading', { name: T('Your body today') })).toBeVisible();
    await expect(body.locator('[data-body="pulse"] b')).toHaveText('55');
    await expect(body.locator('[data-body="pulse"]')).toContainText(T('yesterday {v}', { v: '52' }));
    await expect(body.locator('[data-body="sleep"] b')).toHaveText(/7[.,]5 h/);
    await expect(body.locator('[data-body="azm"] b')).toHaveText('12');
    await expect(body.locator('[data-body-check]')).toBeVisible();
    // Fitbit everywhere (Noah 20.10.2026 22:21): the balance shows the measured pulse and today's active zone minutes
    const pc = page.locator('[data-section="balance"] [data-pc="body"]');
    await expect(pc).toContainText('55');
    await expect(pc.locator('[data-body-azm]')).toContainText('12');
    await expect(pc).toContainText(T('measured with Fitbit|body'));
    // «Heute ruhiger» (Noah 26.10.2026 «2a», changed on purpose): «Körperwerte» repeated the values of «Dein Körper heute»
    // and left the ready wall (it stays in the catalog); all values are one tap away under «Details»
    await expect(page.locator('[data-section="vitals"]')).toHaveCount(0);
    await expect(body.getByRole('link', { name: new RegExp(T('Details|body')) })).toBeVisible();
    // the countdown chip to the next trip (tomorrow), with the trip's own name
    const chip = page.locator('[data-goals] [data-goal-countdown]');
    await expect(chip).toContainText('Herbstrunde');
    await expect(chip).toContainText(T('Tomorrow · {h} h to go', { h: 23 }).split('·')[0].trim());
    const acts = page.locator('[data-section="acts"]');
    await expect(acts.getByRole('heading', { name: T('Active today') })).toBeVisible();
    await expect(acts.locator('[data-act]').first()).toBeVisible();
    expect(await acts.locator('[data-act]').count()).toBeLessThanOrEqual(info.project.name === 'phone' ? 4 : 8);
    // the order of the wall
    const order = await page.evaluate(() => [...document.querySelectorAll('.wall > [data-tile]')].map((x) => x.dataset.tile));
    // 0.180.0 P6 (Noah 21.10.2026 «2b», changed on purpose): meditation and the weekly weight on top, then body, Aktiv, Körperwerte
    // «Heute ruhiger» 2a (changed on purpose): «Körperwerte» left the ready wall, the rest of the head stays on top
    const head = HEAD_N2.filter((id) => READY.some((x) => x.id === id));
    expect(order.slice(0, head.length)).toEqual(head);
    for (const id of ['week', 'balance', 'bikes']) expect(order, id).toContain(id);
    expect(order.indexOf('week')).toBeLessThan(order.indexOf('bikes'));
    expect(order.indexOf('balance')).toBeLessThan(order.indexOf('bikes'));
    // «Heute ruhiger» 1a (changed on purpose): the 8 shortcuts are one list «Schnell öffnen»
    await expect(page.locator('.wall [data-quick] [data-tile^="fn:"]')).toHaveCount(8);
    expect(READY.filter((x) => x.size === 's').length).toBe(8);
    // the top of the wall in the first screen; 0.180.0 P6 (Noah 21.10.2026 «2b», changed on purpose): that is the
    // meditation card now, the body follows under it (with the name question open it can be below the first screen)
    await page.evaluate(() => window.scrollTo(0, 0));
    const top = await page.locator('.wall > [data-tile]').first().evaluate((el) => el.getBoundingClientRect().top);
    expect(top, 'the top of the wall in the first screen').toBeLessThan(page.viewportSize().height);
    // «Jetzt dran» keeps the ride idea; the check and meditation are on top now
    const today = page.locator('[data-section="today"]');
    await expect(today.locator('li[data-row="idea"]').getByRole('button', { name: T('Quick start'), exact: true })).toBeVisible();
    await expect(today.locator('li[data-row="check"]')).toHaveCount(0);
    await expect(today.locator('li[data-row="med"]')).toHaveCount(0);
    // 3a: the rest one tap away
    await expect(page.locator('[data-all-areas]')).toHaveText(T('All areas|home'));
    // 5b: the hints only under Ich
    await expect(page.locator('[data-tile-tipweek]')).toHaveCount(0);
    await expect(page.locator('[data-section="strava-connect"]')).toHaveCount(0);
    await expect(page.locator('[data-news-banner]')).toHaveCount(0);
    await noSideways(page);
    // a tap on an activity ticks it
    const first = acts.locator('[data-act]').first();
    if ((await first.getAttribute('aria-pressed')) === 'false' && !(await first.getAttribute('data-act')).includes('med')) {
      await first.click();
      await expect(first).toHaveAttribute('aria-pressed', 'true');
    }
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
    await expect(page.locator('[data-section="body"]')).toBeVisible();
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
