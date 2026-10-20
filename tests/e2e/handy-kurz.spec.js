// 0.163.0 «Handy kurz» (Durchklick 2, Noah 15.10.2026 «freigabe», answers 1 «wo sinnvoll» and 2b), fictional data
// (the Gesamttest set plus 47 fictional Strava activities):
// a) the guard: on a phone Trips, Favourites and What is new are at most MAX_SCREENS screens high;
// b) Trips: the trips with a packing list (was «Packmodus») and «In Zahlen · Weiter» behind one line each, one row to
//    «Fahrten»; Touren › Fahrten (Gesamttest 20.10.2026 B3): five activities with a grey value line (2b), «Show n more»;
//    the computer keeps the full rows;
// c) Favourites: every kind is one closed line, open it shows five items, then «Show n more»;
// d) What is new: the side parts are closed lines; «How to test it» opens its line;
// e) «Handy kürzer» (Noah 20.10.2026 «4b»): Woche › Noch einplanen, Velopflege › Jetzt fällig, Werkstatt › Besuche show five rows.
import { test, expect } from '@playwright/test';
import { start, fixture, day, tr } from './gesamttest/lib.js';
import { at1Acts } from './at1-acts.js';
import { PHONE_ROWS, MAX_SCREENS } from '../../src/lib/touren/kurz.js';

const T = tr('de');
const PAGES = ['#/trips', '#/trips/rides', '#/favorites', '#/me/news'];

/** The Gesamttest data plus 47 activities (seven of AT1, forty rides every three days). */
function data() {
  const d = structuredClone(fixture().data);
  const acts = at1Acts(day, 'test_hk_');
  for (let i = 0; i < 40; i++) acts.push({ ...acts[5], id: `test_hk_m${i}`, name: `test_hk_ Runde ${i}`, day: day(-21 - i * 3) });
  d.tables.activities = acts;
  return d;
}
const open = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.locator('main h1').first().waitFor();
  await page.waitForTimeout(800);
};
const height = (page) => page.evaluate(() => document.documentElement.scrollHeight);

test.describe('Handy kurz', () => {
  test('phone: every long page is at most three screens', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'the rule is for the phone');
    const errors = await start(page, context, info, { data: data() });
    const vh = page.viewportSize().height;
    for (const h of PAGES) {
      await open(page, h);
      expect.soft(await height(page), `${h} at most ${MAX_SCREENS} screens`).toBeLessThanOrEqual(MAX_SCREENS * vh);
    }
    expect(errors).toEqual([]);
  });

  // «Handy kürzer» (Brainstorming, Noah 20.10.2026 «4b»): Woche and Velos first; each long list shows five, then «Show n more»
  test('phone: Woche, Velopflege and Werkstatt show five rows, then the rest after one tap', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'the phone view');
    const errors = await start(page, context, info, { data: data() });
    for (const [hash, row, more] of [
      ['#/week', '[data-sugg]', '[data-sugg-more]'],
      ['#/bikes?tab=care', 'section[aria-labelledby="due-h"] li.dcard', '[data-due-more]'],
      ['#/bikes?tab=shop', '[data-visit-id]', '[data-visits-more]'],
    ]) {
      await open(page, hash);
      await expect(page.locator(row), hash).toHaveCount(PHONE_ROWS);
      await page.locator(more).click();
      expect(await page.locator(row).count(), hash).toBeGreaterThan(PHONE_ROWS);
      await expect(page.locator(more), hash).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test('phone: Trips with five rows, the grey line and the closed lines', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'the phone view');
    await start(page, context, info, { data: data() });
    await open(page, '#/trips');
    // Paket D (Noah 19.10.2026 «1a»): «Was hier steht ›» is one quiet line in the head, the card starts folded
    // Gesamttest 20.10.2026 «2a» (changed on purpose): the quiet line reads «So geht's»
    await expect(page.locator('main header [data-hint-line="trips"]')).toHaveText(T('How it works|help'));
    await expect(page.locator('main [data-hint="trips"]')).toHaveCount(0);
    // Gesamttest 20.10.2026 B3: no Strava list here, one row leads to «Fahrten»
    await expect(page.locator('section[data-activities]')).toHaveCount(0);
    await expect(page.locator('a[data-to-rides]')).toHaveAttribute('href', '#/trips/rides');
    // the trips with a packing list behind one line, their rows with the grey line
    await expect(page.locator('[data-packmode]')).toHaveCount(0);
    await page.locator('[data-packmode-open]').click();
    const pm = page.locator('[data-packmode]');
    await expect(pm.locator('[data-row]')).toHaveCount(PHONE_ROWS);
    await expect(pm.locator('[data-values]')).toHaveCount(0);
    await expect(pm.locator('[data-pack-line]').first()).toContainText(T('Weather'));
    await pm.locator('[data-pack-phone-more]').click();
    expect(await pm.locator('[data-row]').count()).toBeGreaterThan(PHONE_ROWS);
    // «In Zahlen · Weiter» behind one line; Paket D (Noah 19.10.2026 «1a»): the tip of the day waits there too
    await expect(page.locator('[data-in-numbers]')).toHaveCount(0);
    await expect(page.locator('main [data-tip]')).toHaveCount(0);
    await page.locator('[data-trips-extras]').click();
    await expect(page.locator('[data-in-numbers]')).toBeVisible();
    await expect(page.locator('main [data-tip]')).toHaveCount(1);
    await expect(page.locator('[data-tour-tiles=""]')).toBeVisible();
    // Touren › Fahrten: five activities with the grey line, then «Show n more»
    await open(page, '#/trips/rides');
    const acts = page.locator('section[data-activities]');
    await expect(acts.locator('[data-act-row]')).toHaveCount(PHONE_ROWS);
    await expect(acts.locator('[data-act-values], [data-act-zones]')).toHaveCount(0);
    const line = acts.locator('[data-act-row]').first().locator('[data-act-line]');
    await expect(line).toContainText(T('Duration|act'));
    await expect(line).not.toContainText('–');
    // «Show n more» opens the page of twenty
    const total = await acts.locator('[data-kind="all"] .num').innerText();
    await acts.locator('[data-act-phone-more]').click();
    await expect(acts.locator('[data-act-row]')).toHaveCount(Math.min(20, Number(total)));
  });

  test('computer: Trips keeps the full rows', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'desktop', 'the computer view');
    await start(page, context, info, { data: data() });
    await open(page, '#/trips');
    await expect(page.locator('[data-act-line], [data-pack-line], [data-trips-extras], [data-packmode-open]')).toHaveCount(0);
    await expect(page.locator('[data-packmode] [data-values]').first()).toBeVisible();
    await expect(page.locator('[data-in-numbers]')).toBeVisible();
    await open(page, '#/trips/rides');
    await expect(page.locator('section[data-activities] [data-act-values]').first()).toBeVisible();
    await expect(page.locator('[data-act-line]')).toHaveCount(0);
  });

  test('phone: Favourites as closed lines, five items when open', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'the phone view');
    await start(page, context, info, { data: data() });
    await open(page, '#/favorites');
    const lines = page.locator('[data-fav-line]');
    expect(await lines.count()).toBeGreaterThan(1);
    const big = page.locator('[data-fav-line]').first();
    const key = await big.getAttribute('data-fav-line');
    await big.click();
    // only this kind is open: its first five items, then «Show n more»
    await expect(page.locator('li.frow')).toHaveCount(PHONE_ROWS);
    await page.locator(`[data-fav-more="${key}"]`).click();
    expect(await page.locator('li.frow').count()).toBeGreaterThan(PHONE_ROWS);
  });

  test('phone: What is new, the side parts closed, How to test opens its line', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'the phone view');
    await start(page, context, info, { data: data() });
    await open(page, '#/me/news');
    await expect(page.locator('[data-group="wn-plan"] .ls-gh')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.wn-steps')).toHaveCount(0);
    await page.getByRole('button', { name: T('How to test it') }).click();
    await expect(page.locator('.wn-steps')).toBeVisible();
  });
});
