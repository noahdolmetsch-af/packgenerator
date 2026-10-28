// «Neu heute» (Träume und Neuland N11, Noah 27.10.2026 «1-5 a»): after a fictional ride today, Heute shows one quiet
// line «Neu seit gestern: …», a tap opens Neuland, × closes it and it stays closed. Fictional data only.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
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

test('New since yesterday: one line on Today after a ride, opens New ground, closes for good', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  // nothing ridden: no line
  await expect(page.locator('[data-neu-heute]')).toHaveCount(0);

  await put(page, 'trips', [{ id: `${P}see`, title: `${P}Seerunde`, domain: 'bikepacking', startDate: today(), days: 1, status: 'done', entries: [], route: { name: `${P}See`, km: 30, line: LINE } }]);
  await page.reload();
  await ready(page);
  const line = page.locator('[data-neu-heute]');
  await expect(line).toContainText(T('New since yesterday: {list}', { list: '' }).trim(), { timeout: 20000 });
  await expect(line).toContainText(T('{n} municipalities', { n: '' }).trim().split(' ').pop());
  await shot(page, info, 'NH1-heute');

  // a tap opens New ground
  await line.locator('a').click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/neuland');
  // New ground shows the same line on top (Noah 28.10.2026 «1 a und b»); a chip opens that collection
  const fresh = page.locator('[data-nl-fresh]');
  await expect(fresh).toContainText(T('New since yesterday: {list}', { list: '' }).trim(), { timeout: 20000 });
  await fresh.locator('[data-nl-fresh-c="municipalities"]').click();
  await expect(fresh.locator('[data-nl-fresh-c="municipalities"]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, info, 'NH2-neuland');
  await page.goBack();
  await ready(page);

  // × closes it, and it stays closed after a reload
  await line.locator('[data-neu-heute-close]').click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await ready(page);
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-neu-heute]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
