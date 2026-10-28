// «Weisse Flecken in der Nähe» (Träume und Neuland N1, Noah 27.10.2026 «1-5 a»): on Touren › Träume, without a
// home place a button sets it; with one, the municipalities around it, a fictional ride colours some in,
// the radius changes, a tap names a place. Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
// a fictional ride from the middle of Zürich south along the lake
const LINE = [[47.3769, 8.5417], [47.35, 8.56], [47.32, 8.58], [47.29, 8.6], [47.26, 8.63]];

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

test('White spots nearby: home place, map, radius, nearest never visited', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  const ws = page.locator('[data-white-spots]');

  // 1. no home place: a button opens «Dein Wohnort»
  await expect(ws).toContainText(T('White spots nearby'));
  await ws.locator('[data-ws-home]').click();
  await expect(page.locator('dialog.hpd[open]')).toBeVisible();
  await page.keyboard.press('Escape');

  // 2. a home place and one fictional ride
  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } }]);
  await put(page, 'trips', [{ id: `${P}see`, title: `${P}Seerunde`, domain: 'bikepacking', startDate: dayBefore(10), days: 1, status: 'done', entries: [], route: { name: `${P}See`, km: 30, line: LINE } }]);
  await page.reload();
  await ready(page);
  await expect(ws.locator('[data-ws-map]')).toBeVisible({ timeout: 15000 });
  await expect(ws.locator('[data-ws-area].been').first()).toBeAttached();
  const sum = ws.locator('[data-ws-sum]');
  await expect(sum).toContainText('25 km');
  const rows = ws.locator('[data-ws-row]');
  expect(await rows.count()).toBe(5);
  await noSideways(page);
  await shot(page, info, 'WF1-karte');

  // 3. a tap on the first «never been» names it
  const first = await rows.first().locator('span').textContent();
  await rows.first().click();
  await expect(ws.locator('[data-ws-pick]')).toContainText(`${first} · `);
  await expect(ws.locator('[data-ws-pick]')).toContainText(T('never been'));

  // 4. 10 km has fewer places than 25 km; the choice stays after a reload
  const n25 = await ws.locator('[data-ws-area]').count();
  await ws.getByRole('group', { name: T('Radius|spots') }).getByRole('button', { name: '10 km' }).click();
  await expect.poll(() => ws.locator('[data-ws-area]').count()).toBeLessThan(n25);
  await page.reload();
  await ready(page);
  await expect(ws.getByRole('group', { name: T('Radius|spots') }).getByRole('button', { name: '10 km' })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
