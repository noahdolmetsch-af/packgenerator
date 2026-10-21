// «Meditation» (mockups ME2 and ME3, Noah 13.10.2026 «1a 2a 3a 4b 5b», approved «ME1-ME3 und Z1-Z5
// freigeben»), on a phone and a computer, in German, with a fixed clock (page.clock):
// 1. Aktiv: «Meditation» is the second tab, after Heute (Noah 15.10.2026 «1a»); the page shows the timer (the
//    durations change the start) and the Rückblick (days in a row, the last 7 days, the last sessions with
//    their notes); «Uhr» opens the faces for the meditation; the name «Kissenzeit» is gone.
// 2. Rückblick (ME3): week, month and year, earlier periods, the calendar, minutes per week with the goal
//    line, «Was dir hilft» (observation only), the notes, the filter by kind.
// No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { PLACE_TABS } from '../../src/lib/nav.js';
import { TABS } from './placetab.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-13'; // a Tuesday; the browser runs in Europe/Zurich
const D0 = `${TODAY}T09:00:00+02:00`;
/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const at = (day, hm) => new Date(`${day}T${hm}:00+02:00`).toISOString();

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}
/** Five fictional sessions: three mornings (deep), two evenings; one with the bowl in between. */
function history() {
  const S = [
    [0, '07:10', 20, 4, 'test_data_gtp_ ruhig', { mode: 'none' }],
    [-1, '06:45', 30, 5, '', { mode: 'every', every: 10 }],
    [-2, '21:30', 20, 2, 'test_data_gtp_ unruhig', { mode: 'none' }],
    [-3, '07:00', 20, 4, '', { mode: 'none' }],
    [-4, '18:20', 45, 3, '', { mode: 'random', count: 3 }],
  ];
  const flowLog = [];
  const flowSessions = [];
  for (const [d, hm, min, depth, note, bowl] of S) {
    const day = addDays(TODAY, d);
    const id = `fl-s-test-${day}`;
    flowLog.push({ id, actId: 'meditation', day, at: at(day, hm), min });
    flowSessions.push({ id, actId: 'meditation', day, at: at(day, hm), min, target: min, depth, note, bowl, art: null, tplId: null });
  }
  return { flowLog, flowSessions };
}

test('Aktiv: the tab Meditation, timer and Rückblick on one page, «Uhr» opens the faces', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  // Aktiv opens at Heute; Meditation is the second tab (ME2; Noah 15.10.2026 «1a»)
  const tabs = page.locator(TABS).locator('a');
  await expect(tabs.nth(1)).toHaveText('Meditation');
  expect(PLACE_TABS.active.map((x) => x.key).slice(0, 2)).toEqual(['today', 'meditation']);
  await put(page, history());
  await page.reload(); // the app reads the rows written straight into IndexedDB
  await tabs.nth(1).click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);
  await expect(main.getByRole('heading', { level: 1, name: 'Meditation' })).toBeVisible();
  await expect(page.locator(TABS).getByRole('link', { name: 'Meditation', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(main.locator('.sub')).toContainText(T('done today'));

  // the timer: «Wie letztes Mal · 20 Min»; a duration changes the start
  await expect(main.locator('[data-start="last"]')).toContainText(T('Like last time · {n} min', { n: 20 }));
  await main.locator('[data-dur="30"]').click();
  await expect(main.locator('[data-dur="30"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('[data-start="last"]')).toContainText(T('Start · {n} min', { n: 30 }));

  // the Rückblick: 5 days in a row, 5 of the last 7 days, the last three sessions with their notes
  const review = main.locator('section[aria-labelledby="m-review"]');
  await expect(review.locator('.stats > div').first()).toContainText('5');
  await expect(review.locator('.stats')).toContainText('5/7');
  await expect(review.locator('.wk .wd.on')).toHaveCount(5);
  await expect(review.locator('[data-row="log"] li')).toHaveCount(3);
  await expect(review.locator('[data-row="log"]')).toContainText('test_data_gtp_ ruhig');
  await fits(page, 'ME2 Meditation');
  // «Meditation» everywhere: «Kissenzeit» is gone (Noah 3a)
  await expect(page.getByText('Kissenzeit')).toHaveCount(0);

  // «Uhr» opens the faces for the meditation
  await main.locator('[data-opt="clock"]').click();
  await expect(page).toHaveURL(/#\/timer\/faces\?scope=meditation$/);
  await expect(main.locator('[data-scope="meditation"]')).toHaveAttribute('aria-checked', 'true');
  await page.goBack();
  await main.locator('[data-to="review"]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/rueckblick$/);
  await expect(page.locator(TABS).getByRole('link', { name: 'Meditation', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

test('Rückblick: week, month and year, the calendar, the goal line, what helps, the notes', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/act/meditation');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Meditation' })).toBeVisible(); // seeded
  await put(page, history());
  await page.goto('./#/flow/act/meditation/rueckblick');
  await page.reload(); // the app reads the rows written straight into IndexedDB
  await expect(main.getByRole('heading', { level: 1, name: T('Look back|page') })).toBeVisible();

  // the month: 5 of 13 days, 135 minutes, the longest 45
  await expect(main.locator('[data-range="month"]')).toHaveAttribute('aria-checked', 'true');
  await expect(main.locator('[data-period]')).toHaveAttribute('data-period', '2026-10');
  const stats = main.locator('[data-stats]');
  await expect(stats).toContainText('5/13');
  await expect(stats).toContainText(T('{h} h {m}', { h: 2, m: '15' }));
  await expect(stats).toContainText('45′');
  await expect(main.locator('[data-cal] i[data-day]')).toHaveCount(31);
  await expect(main.locator(`[data-cal] i[data-day="${TODAY}"]`)).toHaveClass(/l2/);
  // the goal line: daily × 20 min = 140 min a week
  await expect(main.locator('.goal')).toContainText(T('Goal {n} min', { n: 140 }));
  // what helps, observation only: deeper in the morning, longer with the bowl
  await expect(main.locator('[data-help="morning"]')).toContainText(T('Deeper in the morning'));
  await expect(main.locator('[data-help="gong"]')).toContainText(T('Longer with the singing bowl'));
  await expect(main.locator('section[aria-labelledby="rv-notes"] li')).toHaveCount(2);
  await fits(page, 'ME3 Monat');

  // the week and an earlier one; the year by month
  await main.locator('[data-range="week"]').click();
  await expect(stats).toContainText('2/2');
  await main.locator('[data-back]').click();
  await expect(main.locator('[data-period]')).toHaveAttribute('data-period', addDays(TODAY, -8));
  await expect(stats).toContainText('3/7');
  await main.locator('[data-range="year"]').click();
  await expect(main.locator('.mb .mcol')).toHaveCount(12);
  await fits(page, 'ME3 Jahr');

  // a filter that nothing has: all numbers go to 0
  await main.locator('[data-range="month"]').click();
  await main.locator('[data-filter="art"]').selectOption({ index: 1 });
  await expect(stats).toContainText('0/13');
  expect(errors).toEqual([]);
});
