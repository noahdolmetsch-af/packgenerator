// «Cardio-Belastung» (Noah 07.11.2026 «1a», thread «UI-Test Analyse-Seite»): five faults of the page of a value.
// 1 trip names never lie on top of each other and never leave the screen, 2 the weekday bars show the real
// differences (they were squeezed to one height), 3 a card is only as high as its content, 4 an empty
// «day before» says «nichts abgehakt» instead of «–», 5 «+ Wert» is a small chip, not a full line.
// German, phone + desktop; fictional Fitbit zones for 90 days and 14 fictional trips written straight into
// IndexedDB; the clock stands on Friday 9 October 2026 (aktiv-fixture.js).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const P = 'test_data_cb_';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 90; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({
      date,
      hrZones: { light: 220 + [10, 60, 20, 40, 15, 70, 30][i % 7], mod: [30, 55, 38, 60, 35, 62, 48][i % 7], vig: [8, 22, 12, 24, 10, 26, 16][i % 7], peak: [2, 7, 3, 8, 2, 9, 4][i % 7] },
      src: 'google', at: `${date}T08:00:00Z`,
    });
  }
  const names = ['Alpenrunde Nord', 'Jura Wochenende', 'Seetal Schleife', 'Emmental Bikepacking', 'Napf Abendrunde', 'Rigi Tour', 'Gotthard Pass', 'Bodensee Umrundung'];
  const trips = [...names, ...names].slice(0, 14).map((title, k) => ({ id: `${P}trip${k}`, title: `${P}${title}`, name: `${P}${title}`, domain: 'bikepacking', status: 'done', startDate: addDays(TODAY, -85 + k * 6), days: 1 + (k % 3) }));
  // one ticked activity only on some days, so «day before» is empty on the others
  const flowLog = [3, 4, 9, 10, 11].map((i) => ({ id: `${P}sauna${i}`, actId: 'sauna', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, min: 30 }));
  return { healthDays, trips, flowLog };
}

test('Cardio-Belastung: names, weekday bars, cards, day before and «+ Wert» are readable', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto('./#/auswerten/analyse/cardioLoad');
  await page.reload();
  await ready(page);
  const wv = page.locator('[data-detail="cardioLoad"]');
  await expect(wv.getByRole('heading', { level: 1 })).toHaveText(T('Cardio load'));
  await expect(wv.locator('svg rect.band').first()).toBeVisible();

  // 1 trip names: some, never over each other, never past the chart; the legend counts the trips
  const names = wv.locator('.bn');
  expect(await names.count()).toBeGreaterThan(0);
  const boxes = await names.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.right]));
  for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) expect(boxes[a][1] <= boxes[b][0] || boxes[b][1] <= boxes[a][0], `names ${a} and ${b}`).toBe(true);
  const plot = await wv.locator('.plot').evaluate((e) => e.getBoundingClientRect().right);
  for (const [, right] of boxes) expect(right).toBeLessThanOrEqual(plot + 1);
  await expect(wv.locator('.legend')).toContainText(T('{n} trips, names only where there is room|analyse').replace('{n}', '14'));
  // the page is not wider than the phone
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // 2 weekday bars: at least four different heights, every bar has its number
  const heights = await wv.locator('.wdc i').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  expect(heights).toHaveLength(7);
  expect(new Set(heights).size).toBeGreaterThanOrEqual(4);
  await expect(wv.locator('.wdc .wvl')).toHaveCount(7);
  for (const x of await wv.locator('.wdc .wvl').allTextContents()) expect(x.trim()).not.toBe('');

  // 3 the weekday card is as high as its content, not stretched to the table next to it (desktop: side by side)
  const [wd, days] = await Promise.all([wv.locator('.card.wd').boundingBox(), wv.locator('.card.days').boundingBox()]);
  if (Math.abs(wd.y - days.y) < 4) expect(wd.height).toBeLessThan(days.height - 20);

  // 4 «day before»: a header that says what it is, and words instead of a dash
  await expect(wv.locator('.card.days th').last()).toHaveText(T('Done the day before|analyse'));
  await wv.locator('[data-all-days]').click();
  const cells = await wv.locator('.card.days td.sm').allTextContents();
  expect(cells).toContain(T('nothing ticked|analyse'));
  expect(cells).not.toContain('–');

  // 5 «+ Wert» is a chip, not a full line
  const sel = await wv.locator('label.chip.sel').boundingBox();
  const row = await wv.locator('.chips').boundingBox();
  expect(sel.width).toBeLessThan(Math.min(row.width * 0.6, 260));
  expect(errors).toEqual([]);
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/cardio-${info.project.name}.png`, fullPage: true });
});
