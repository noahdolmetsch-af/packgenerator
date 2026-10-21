// «Sporttasche» (mockup AK3, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»): the evening
// before a fixed date Heute reminds «Morgen Yoga 07:00: Tasche packen», the tap opens the bag; tick a
// thing, «Alles drin», add and remove a thing, a thing left out twice is «oft vergessen», the reminder
// switched off, on a phone and a computer, in German. No sideways scroll, no page errors. Fictional data.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TABS } from './placetab.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-14'; // a Wednesday; the browser runs in Europe/Zurich
const D0 = `${TODAY}T20:00:00+02:00`; // the evening before Thursday's yoga
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

test('Sporttasche: the reminder on Heute, pack the bag, often forgotten, switch off', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/bags');
  const main = page.locator('main');
  await expect(main.locator('[data-bag]')).toHaveCount(5); // the start bags
  // a fixed date (yoga every Thursday 07:00); the towel was forgotten once and stayed out yesterday too
  await put(page, {
    settings: [
      { key: 'flow.fixed', value: [{ id: 'fx-test', actId: 'yoga', wd: 4, time: '07:00', minutes: 75 }] },
      { key: 'flow.bagPack', value: { 'bag-yoga': { day: addDays(TODAY, -1), ids: ['mat', 'bottle', 'shirt', 'keys'] } } },
    ],
  });
  await page.goto('./#/');
  await page.reload();

  // Heute: the reminder the evening before
  const rem = page.locator('[data-bag-reminder="bag-yoga"]');
  await expect(rem).toContainText(T('Tomorrow {name} {time}: pack the bag', { name: 'Yoga', time: '07:00' }));
  await rem.click();
  await expect(page).toHaveURL(/#\/flow\/bags\?b=bag-yoga$/);
  await expect(page.locator(TABS).getByRole('link', { name: T('Today|active'), exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(main.locator('[data-more="bags"]')).toHaveAttribute('aria-current', 'page');
  const bag = main.locator('[data-open-bag="bag-yoga"]');
  await expect(bag.getByRole('heading', { level: 2 })).toContainText('07:00');
  await expect(main.locator('[data-bag="bag-yoga"]')).toContainText(T('tomorrow {when}', { when: '' }).trim());

  // yesterday's pack counted the towel as forgotten once more: now «oft vergessen» only after twice
  await expect(bag.locator('[data-item="towel"]')).not.toContainText(T('often forgotten'));

  // tick one, then all
  await bag.locator('[data-item="mat"] [role="checkbox"]').click();
  await expect(bag.locator('[data-item="mat"] [role="checkbox"]')).toHaveAttribute('aria-checked', 'true');
  await expect(bag.locator('[data-count]')).toHaveText(T('{n} of {m} in', { n: 1, m: 5 }));
  await bag.locator('[data-all]').click();
  await expect(bag.locator('[data-count]')).toHaveText(T('{n} of {m} in', { n: 5, m: 5 }));

  // add a thing, then remove it again
  await bag.locator('[data-add-thing]').click();
  await bag.getByLabel(T('New thing')).fill('Haargummi');
  await bag.getByRole('button', { name: T('Add') }).click();
  await expect(bag.locator('[data-item]')).toHaveCount(6);
  await bag.locator('[data-prune]').click();
  await bag.getByRole('button', { name: T('Remove {name}', { name: 'Haargummi' }) }).click();
  await expect(bag.locator('[data-item]')).toHaveCount(5);
  await bag.locator('[data-prune]').click();

  // the reminder off: Heute stays quiet
  await main.locator('[data-remind-toggle]').click();
  await expect(main.locator('[data-remind]')).toContainText(T('is off.'));
  await fits(page, 'Sporttasche');
  await page.screenshot({ path: `qa/sporttasche-${test.info().project.name}.png`, fullPage: true });
  await page.goto('./#/');
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(page.locator('[data-bag-reminder]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Sporttasche: a thing left out twice is «oft vergessen»', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/bags');
  await expect(page.locator('main [data-bag]')).toHaveCount(5);
  const yoga = { id: 'bag-yoga', actId: 'yoga', name: 'Yoga', icon: 'yoga', items: [{ id: 'mat', name: 'Yoga mat', nameDe: 'Yogamatte', forgot: 0 }, { id: 'towel', name: 'Towel', nameDe: 'Handtuch', forgot: 1 }] };
  await put(page, { settings: [{ key: 'flow.bags', value: [yoga] }, { key: 'flow.bagPack', value: { 'bag-yoga': { day: addDays(TODAY, -2), ids: ['mat'] } } }] });
  await page.reload();
  const towel = page.locator('main [data-item="towel"]');
  await expect(towel).toContainText(T('often forgotten'));
  await expect(towel).toContainText(T('{n}× forgotten', { n: 2 }));
  expect(errors).toEqual([]);
});
