// «Tourenvorschläge» (Noah 05.11.2026 «1a 2a 3a»; 23.11.2026 100 Touren): the page with its tours, filters (canton, kind, fitness, skill, time),
// one tour with map, profile and «Why this suggestion?», «Not for me» with Undo. Independent of the month: snow only moves tours
// between two groups. The expected counts come from the app's own data (not from its rules: plain specs never import *.svelte.js).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import TOURS from '../../src/lib/vorschlaege/data/netz.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const hard = TOURS.filter((x) => x.cond === 'difficult');
const FIRST = [...hard].sort((a, b) => a.dz - b.dz)[0].id; // nearest hard tour from Zurich main station (no home place)

test('Tour suggestions: 200 tours, filters, one tour, hide and undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  // the way in: Touren › Träume has the button
  await page.goto('./#/trips/dreams');
  await ready(page);
  await page.locator('[data-dreams-suggest]').click();
  await page.locator('[data-vs-view="list"]').click();
  await expect(page.locator('[data-page="vorschlaege"] h1')).toHaveText(T('Tour suggestions'));
  const tours = page.locator('[data-vs-tour]');
  expect(TOURS.length).toBe(200);
  await expect(tours).toHaveCount(hard.length); // only hard for fitness at the start
  await expect(page.locator('[data-vs-filters] [data-vs-cond="difficult"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-vs-filters] [data-vs-cond="medium"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-vs-filters] [data-vs-tech="any"]')).toHaveAttribute('aria-pressed', 'true');
  // nearest first: the first card is the nearest hard tour (from Zurich main station without a home place)
  await expect(tours.first()).toHaveAttribute('data-vs-tour', FIRST);

  // canton, fitness and skill filters
  await page.locator('[data-vs-region="gr"]').click();
  await expect(tours).toHaveCount(hard.filter((x) => x.region === 'gr').length);
  await page.locator('[data-vs-region="gr"]').click();
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await expect(tours).toHaveCount(TOURS.length);
  await page.locator('[data-vs-tech="difficult"]').click();
  await expect(tours).toHaveCount(TOURS.filter((x) => x.tech === 'difficult').length);
  await page.locator('[data-vs-tech="any"]').click();
  await page.locator('[data-vs-region="zh"]').click();
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await page.locator('[data-vs-tech="difficult"]').click();
  await expect(page.getByText(T('No tour fits these filters.'))).toBeVisible(); // Zurich has no tour hard for skill
  await page.getByRole('button', { name: T('Reset filters') }).click();
  await expect(tours).toHaveCount(hard.length);

  // time and kind (all fitness levels, so that the short downhill is in)
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await page.locator('[data-vs-hours="2"]').click();
  await expect(tours).toHaveCount(1);
  await page.locator('[data-vs-hours="any"]').click();
  await page.locator('[data-vs-art="downhill"]').click();
  await expect(tours).toHaveCount(1);
  await page.locator('[data-vs-art="downhill"]').click();
  await expect(page.locator('[data-vs-start]')).toContainText(T('Set your home place and you can choose how far the start may be.'));
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await expect(tours).toHaveCount(hard.length);

  // the map: the same tours, one dot each, a tap on a dot opens the tour, a tap on a canton filters
  await page.locator('[data-vs-view="map"]').click();
  await expect(page.locator('[data-vs-karte] svg')).toBeVisible();
  await expect(page.locator('[data-vs-karte] a[href^="#/trips/vorschlaege/"]')).toHaveCount(hard.length);
  // the hover card (Noah 23.11.2026): the mouse over a dot shows title, km, time and climb; on a phone the first tap shows it and does not open the tour yet
  const near = TOURS.find((x) => x.id === FIRST);
  const dot = page.locator(`[data-vs-dot="${FIRST}"]`);
  await dot.scrollIntoViewIfNeeded();
  if (info.project.name === 'phone') {
    await dot.dispatchEvent('click');
  } else {
    await dot.hover({ force: true });
  }
  const tip = page.locator('[data-vs-tip]');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveAttribute('data-vs-tip', FIRST);
  await expect(tip).toContainText(near.title);
  await expect(tip).toContainText('km');
  await expect(tip).toContainText(`+`);
  await expect(tip.locator('a.topen')).toHaveAttribute('href', `#/trips/vorschlaege/${FIRST}`);
  expect(await page.evaluate(() => location.hash)).toBe('#/trips/vorschlaege');
  if (info.project.name !== 'phone') {
    await page.mouse.move(2, 2);
    await expect(tip).toHaveCount(0);
  }
  // «map on top»: in the map view the map stands above the filters (Noah 23.11.2026: big and well visible)
  const yMap = (await page.locator('[data-vs-karte]').boundingBox()).y;
  const yFilters = (await page.locator('[data-vs-filters]').boundingBox()).y;
  expect(yMap).toBeLessThan(yFilters);
  await page.locator('[data-vs-view="list"]').click();
  expect((await page.locator('[data-vs-filters]').boundingBox()).y).toBeLessThan((await page.locator('[data-vs-tour]').first().boundingBox()).y);
  await page.locator('[data-vs-view="map"]').click();
  await page.locator('[data-vs-kt="gr"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-vs-karte] a[href^="#/trips/vorschlaege/"]')).toHaveCount(hard.filter((x) => x.region === 'gr').length);
  await page.locator('[data-vs-kt="gr"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-vs-karte] a[href^="#/trips/vorschlaege/"]')).toHaveCount(hard.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.locator('[data-vs-view="list"]').click();

  // one tour: the hardest of the pilot, with warning, profile and the reasons
  await page.locator('[data-vs-tour="sm-332"] a.tl').click();
  await expect(page.locator('[data-page="vorschlaege"] h1')).toContainText('Davos');
  await expect(page.locator('[data-vs-map]')).toBeVisible();
  await expect(page.locator('[data-vs-warn]')).toBeVisible();
  await expect(page.locator('[data-profile] svg').first()).toBeVisible();
  await expect(page.locator('[data-vs-why]')).toContainText(T('Why this suggestion?'));
  await page.locator('[data-profile] input[type="range"]').fill('500');
  await expect(page.locator('[data-vs-facts]')).toContainText('33 km');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // choose the lines: «Snow» off, the line is gone
  await page.locator('[data-vs-lines] summary').click();
  await page.locator('[data-vs-line="snow"]').uncheck();
  await expect(page.locator('[data-vs-why] li')).toHaveCount(3); // time, difficulty and the distance from Zurich are left
  await page.locator('[data-vs-line="snow"]').check();

  // keep as a dream
  await page.locator('[data-vs-dream]').click();
  await expect(page.getByRole('status').filter({ hasText: T('Open Dreams') })).toBeVisible();

  // not for me, then undo
  await page.locator('[data-vs-hide]').click();
  await expect(page).toHaveURL(/#\/trips\/vorschlaege$/);
  await expect(tours).toHaveCount(hard.length - 1);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(tours).toHaveCount(hard.length);
  expect(errors).toEqual([]);
  void info;
});
