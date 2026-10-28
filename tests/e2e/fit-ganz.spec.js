// «FIT-Dateien ganz lesen» (Noah 27.10.2026 «2a», thread «Geraete und Datenquellen»): a FIT file uploaded in
// Fahrten becomes a ride with its sensor values and a «Vom Gerät» part. Fictional file from tests/fixtures/fit.js.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { fitActivity } from '../fixtures/fit.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};

test('a FIT file is a ride with the values of the unit', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const p = info.outputPath('Testrunde.fit');
  writeFileSync(p, fitActivity({ n: 240 }));
  await page.goto('./#/debrief/ride');
  await ready(page);
  const main = page.locator('main');
  await main.locator('.pickbtn input[type=file]').setInputFiles(p);
  await main.getByRole('button', { name: T('Save ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
  await expect(main.getByRole('heading', { level: 1 })).toContainText('Testrunde');
  await expect(main.locator('[data-file-hr]')).toContainText('/ 149');
  await expect(main.locator('[data-file-cad]')).toContainText('85');
  const dev = main.locator('[data-fit-device]');
  await expect(main.getByRole('heading', { name: T('From the unit') })).toBeVisible();
  await expect(dev.locator('[data-fit-np]')).toContainText('205 W');
  await expect(dev.locator('[data-fit-te]')).toContainText(/3[.,]1 \/ 1[.,]2/);
  await expect(dev.locator('[data-fit-lr]')).toContainText('49 / 51 %');
  await expect(dev.locator('[data-fit-laps]')).toContainText('2');
  await expect(dev.locator('[data-fit-gears]')).toContainText('3');
  await expect(main.locator('[data-fit-battery]')).toContainText(`${T('Power meter')} ${T('low|battery')}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await shot(page, info, 'FIT1-fahrt');
  expect(errors).toEqual([]);
});

test('an indoor FIT file says why it is not a ride', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const p = info.outputPath('Rolle.fit');
  writeFileSync(p, fitActivity({ noPos: true }));
  await page.goto('./#/debrief/ride');
  await ready(page);
  const main = page.locator('main');
  await main.locator('.pickbtn input[type=file]').setInputFiles(p);
  await expect(main.locator('.warnmsg')).toContainText(T('This FIT file has no positions (an indoor ride?). Upload a ride recorded outside.'));
});
