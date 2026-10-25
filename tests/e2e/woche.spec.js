// v0.130.0 «Woche» (mockup AK1, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»): the card
// «Woche» under «Mehr in Aktiv» on Aktiv › Heute, the week Monday to Sunday with what was done, a fixed
// date added once, a suggestion planned and unplanned, one hidden, the goals of the week and the calendar
// file, on a phone and a computer, in German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
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

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
/** Write rows straight into the app's IndexedDB (then reload, so the app reads them). */
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

test('Woche: from Aktiv › Heute to the week, a fixed date, plan and hide a suggestion', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  // «Aktiv neu» (Noah 22.10.2026): «Diese Woche» on Aktiv › Heute opens the week
  await expect(main.locator('[data-week-glance]')).toBeVisible();
  // a bike ride yesterday (Monday), fictional
  await put(page, {
    flowLog: [
      {
        id: 'test_wk_1',
        actId: 'bike',
        day: addDays(TODAY, -1),
        at: `${addDays(TODAY, -1)}T16:00:00.000Z`,
        n: 1,
        min: 35,
      },
    ],
  });
  await page.reload();

  // the 7 days: yesterday has its tick
  await expect(main.locator(`[data-week-day="${addDays(TODAY, -1)}"] .ticks`)).toBeVisible();
  await main.locator('[data-week-glance]').click();
  await expect(page).toHaveURL(/#\/flow\/week$/);
  await expect(page.locator(TABS).getByRole('link', { name: T('Today|active'), exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(main.getByRole('heading', { level: 1, name: T('Week') })).toBeVisible();
  await expect(main.locator('[data-more="week"]')).toHaveAttribute('aria-current', 'page');

  // Monday to Sunday; Monday shows the ride as done
  const days = main.locator('[data-day]');
  await expect(days).toHaveCount(7);
  await expect(days.first()).toHaveAttribute('data-day', addDays(TODAY, -1));
  await expect(days.first().locator('[data-done="bike"]')).toBeVisible();
  await expect(main.locator('[data-goal="bike"]')).toContainText(T('{n} of {m}', { n: 1, m: 3 }));

  // a fixed date: Yoga every Thursday 07:00
  await main.locator('[data-add-fixed]').click();
  const form = main.locator('[data-fixed-form]');
  await form.getByLabel(T('Activity')).selectOption({ label: 'Yoga' });
  await form.getByLabel(T('Weekday')).selectOption({ label: 'Donnerstag' });
  await form.getByLabel(T('Time')).fill('07:00');
  await form.getByRole('button', { name: T('Save') }).click();
  await expect(form).toHaveCount(0);
  await expect(main.locator('[data-fixed]')).toContainText('Yoga');
  const thu = main.locator(`[data-day="${addDays(TODAY, 2)}"]`);
  await expect(thu.locator('[data-fix="yoga"]')).toContainText('07:00');

  // a suggestion: tap = planned, tap again = a suggestion again; × hides it
  const sugg = main.locator('[data-sug="bike"]').first();
  const day = await sugg.locator('xpath=ancestor::*[@data-day][1]').getAttribute('data-day');
  const at = main.locator(`[data-day="${day}"]`);
  await sugg.locator('.sp').click();
  await expect(at.locator('[data-plan="bike"]')).toBeVisible();
  await expect(main.locator('[data-ics]')).toBeVisible();
  await at.locator('[data-plan="bike"]').click();
  await expect(at.locator('[data-sug="bike"]')).toBeVisible();
  const first = main.locator('[data-sug]').first();
  const hidAct = await first.getAttribute('data-sug');
  const hidDay = await first.locator('xpath=ancestor::*[@data-day][1]').getAttribute('data-day');
  await first.getByRole('button', { name: T('Hide this suggestion') }).click();
  await expect(main.locator(`[data-day="${hidDay}"] [data-sug="${hidAct}"]`)).toHaveCount(0);

  // the calendar file
  const dl = page.waitForEvent('download');
  await main.locator('[data-ics]').click();
  expect((await dl).suggestedFilename()).toBe(`aktiv-woche-${TODAY}.ics`);

  await fits(page, 'Woche');
  await page.screenshot({
    path: `qa/woche-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
