// «Apple-Health-Export einlesen» (Noah 27.10.2026 «4a», thread «Geraete und Datenquellen»): Ich › Verbindungen
// takes the export.xml (or its zip), shows a preview, takes the days over and Undo puts them back. Fictional data.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { appleXml } from '../fixtures/applehealth.js';

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
const daysIn = (page) =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('healthDays').objectStore('healthDays').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
  );

test('the Apple Health export becomes days, with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  // a fixed noon, so the test does not depend on the hour it runs at (tests/clock-fixture.test.js)
  await page.clock.setFixedTime(new Date('2026-06-20T10:00:00Z'));
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const p = info.outputPath('export.xml');
  writeFileSync(p, appleXml());
  await page.goto('./#/me/connections');
  await ready(page);
  const box = page.locator('[data-apple-import]');
  await box.scrollIntoViewIfNeeded();
  await expect(box.getByRole('heading', { name: T('Apple Health (iPhone)') })).toBeVisible();
  await box.locator('input[type=file]').setInputFiles(p);
  const prev = box.locator('[data-apple-preview]');
  await expect(prev).toContainText(T('{n} days with values', { n: 2 }));
  await expect(prev).toContainText(T('Resting heart rate'));
  await prev.scrollIntoViewIfNeeded();
  await shot(page, info, 'AH1-vorschau');
  await prev.getByRole('button', { name: T('Take over {n} days', { n: 2 }) }).click();
  await expect(box.locator('.ah-done')).toContainText(T('{n} days taken over from Apple Health.', { n: 2 }));
  const rows = await daysIn(page);
  expect(rows.find((r) => r.date === '2026-06-14')).toMatchObject({ restingHr: 53, steps: 7200, src: 'apple' });
  expect(rows.find((r) => r.date === '2026-06-15').sleep.asleepMin).toBe(420);
  await box.getByRole('button', { name: T('Undo') }).click();
  await expect(box.locator('.ah-done')).toContainText(T('Taken back. Every day is as it was before.'));
  expect(await daysIn(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
