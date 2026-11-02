// «Karte aller Träume» (Träume und Neuland N14, Noah 27.10.2026 «1-5 a»): fictional dreams with a map on one map,
// numbered, each with what it would bring new; a tap opens the dream. Map tiles are blocked (no real network).
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}

test('All dreams on one map: numbered, most new first, a tap opens the dream', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  await expect(page.locator('[data-dreams-map]')).toHaveCount(0); // no dream with a map yet
  await put(page, 'settings', [
    {
      key: 'dreams',
      value: {
        dreams: [
          { id: `${P}kurz`, title: `${P}Kurze Runde`, kind: 'lowland', days: 1, route: { line: [[47.37, 8.54], [47.38, 8.56]], km: 3, name: '' } },
          { id: `${P}lang`, title: `${P}Quer durchs Land`, kind: 'lowland', days: 2, route: { line: [[47.37, 8.54], [47.45, 8.65], [47.5, 8.72], [47.55, 8.9]], km: 45, name: '' } },
          { id: `${P}ohne`, title: `${P}Ohne Karte`, kind: 'lowland', days: 1 },
        ],
      },
    },
  ]);
  await page.reload();
  await ready(page);

  const sec = page.locator('[data-dreams-map]');
  await expect(sec.getByRole('img', { name: T('Map of all dreams') })).toBeVisible();
  const rows = sec.locator('[data-dm-row]');
  await expect(rows).toHaveCount(2);
  // the long one brings more new and comes first
  await expect(rows.first()).toHaveAttribute('data-dm-row', `${P}lang`);
  await expect(rows.first().locator('[data-dm-news]')).toContainText(T('{n} new municipalities', { n: '' }).trim().split(' ').pop(), { timeout: 15000 });
  await expect(rows.first().locator('.no')).toHaveText('1');
  await expect(sec).not.toContainText(`${P}Ohne Karte`);
  await noSideways(page);
  await sec.scrollIntoViewIfNeeded();
  await shot(sec, info, 'KA1-karte');

  await rows.first().click();
  await expect(page.locator('dialog.dsheet[open]')).toContainText(`${P}Quer durchs Land`);
  expect(errors).toEqual([]);
});
