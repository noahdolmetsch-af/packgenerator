// «Übliche Dauer» (Noah 21.11.2026 «2b», S1): per sport in «Meine Sportarten» (fold) and in the editor; standard 60 min.
// Fictional data only; the clock stands on Friday 9 October 2026; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0 } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';

async function open(page, context, hash) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto(hash);
  await ready(page);
  await flowSeeded(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}

test('the fold «Übliche Dauer» sets a sport in steps of 15 minutes and «Standard» takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow/sports');
  const fold = page.locator('[data-usual-list]');
  await expect(fold).toBeVisible();
  await fold.locator('summary').click();
  const row = fold.locator('[data-usual="yoga"]');
  await expect(row.locator('[data-usual-min]')).toHaveAttribute('data-usual-min', '60');
  await expect(row).toContainText(T('{n} min (standard)').replace('{n}', '60'));
  await press(row.getByRole('button', { name: T('Longer: {name}').replace('{name}', 'Yoga') }), info);
  await expect(row.locator('[data-usual-min]')).toHaveAttribute('data-usual-min', '75');
  await expect(row).not.toContainText(T('{n} min (standard)').replace('{n}', '75'));
  await shot(page, info, 'dauer-liste');
  await press(row.getByRole('button', { name: T('Standard') }), info);
  await expect(row.locator('[data-usual-min]')).toHaveAttribute('data-usual-min', '60');
  expect(errors).toEqual([]);
});

test('the editor of a sport shows the same value and saves it', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow/edit/tennis');
  await expect(page.locator('#ed-usual')).toHaveText(T('Usual duration'));
  await expect(page.locator('[data-usual-hint]')).toBeVisible();
  await shot(page, info, 'dauer-editor');
  const seg = page.locator('[aria-labelledby="ed-usual"]');
  await press(seg.getByRole('button', { name: T('{n} min').replace('{n}', '90') }), info);
  await press(page.getByRole('button', { name: T('Save') }).first(), info);
  await expect(page).toHaveURL(/#\/flow\/sports/);
  const fold = page.locator('[data-usual-list]');
  await fold.locator('summary').click();
  await expect(fold.locator('[data-usual="tennis"] [data-usual-min]')).toHaveAttribute('data-usual-min', '90');
  await page.goto('./#/flow/edit/tennis');
  await ready(page);
  await expect(page.locator('[aria-labelledby="ed-usual"] [aria-pressed="true"]')).toHaveText(T('{n} min').replace('{n}', '90'));
  expect(errors).toEqual([]);
});
