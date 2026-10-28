// «Träume und Neuland» PR 1 (Noah 27.10.2026 «1-5 a»): Träume second under Touren, «A dream that fits now» on
// Touren › Übersicht, Neuland and Heatmap at the bottom of Träume. Fictional data only.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
// this month in Europe/Zurich
const month = () => Number(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(5, 7));
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function putDreams(page, value) {
  await page.evaluate(
    (v) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'dreams', value: v });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    value,
  );
}

test('Dreams forward: second tab, a dream that fits now, links to New ground', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips');
  await ready(page);

  // 1. Träume comes right after the overview in the tabs of Touren
  const order = await page.evaluate(() => {
    const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    return { dreams: hrefs.indexOf('#/trips/dreams'), templates: hrefs.indexOf('#/pack/templates') };
  });
  expect(order.dreams).toBeGreaterThan(-1);
  expect(order.dreams).toBeLessThan(order.templates);
  // no dream yet: no row
  await expect(page.locator('[data-dream-now]')).toHaveCount(0);

  // 2. a dream that fits this month (and one that is a trip already) → one row on the overview
  const m = month();
  await putDreams(page, {
    dreams: [
      { id: 'd1', title: 'test_data_gtp_ Jura der Länge nach', months: [m], days: 3, at: '2026-10-01T10:00:00Z' },
      { id: 'd2', title: 'test_data_gtp_ Schon geplant', months: [m], days: 1, tripId: 'x', at: '2026-10-01T10:00:00Z' },
      { id: 'd3', title: 'test_data_gtp_ Andere Saison', months: [(m % 12) + 1], days: 2, at: '2026-10-01T10:00:00Z' },
    ],
  });
  await page.reload(); // written outside the app: the page reads it fresh
  await ready(page);
  const row = page.locator('[data-dream-now]');
  await expect(row).toHaveText(T('A dream that fits now: {name}', { name: 'test_data_gtp_ Jura der Länge nach' }));
  await noSideways(page);
  await shot(page, info, 'TN1-uebersicht');

  // 3. a tap opens Träume; at the bottom «Collected» leads to New ground and the heatmap
  await row.click();
  await expect(page).toHaveURL(/#\/trips\/dreams/);
  const got = page.locator('[data-dreams-got]');
  await expect(got).toContainText(T('Collected|dreams'));
  await expect(got.locator('[data-dreams-heatmap]')).toHaveAttribute('href', '#/heatmap');
  await noSideways(page);
  await shot(page, info, 'TN2-traeume');
  await got.locator('[data-dreams-neuland]').click();
  await expect(page).toHaveURL(/#\/neuland/);
  await expect(page.locator('main').getByRole('heading', { level: 1 })).toHaveText(T('New ground'));
  expect(errors).toEqual([]);
});
