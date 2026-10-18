// Impeccable runde 2 (18.10.2026, Noah «alle Vorschläge angenommen»), Gruppe 4: Meditation, Training, Ziele,
// Aktivität and Timer. German, a fixed clock, fictional data only (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, rows = aktivRows()) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  if (rows) await put(page, rows);
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
  await expect(page.locator('main h1')).toHaveCount(1);
}

test('Meditation: one sentence before the first session; «Ø Tiefe (1–5)» explains itself', async ({ page, context }) => {
  const errors = await open(page, context, null);
  const main = page.locator('main');
  await go(page, '#/flow/act/meditation');
  await expect(main.locator('[data-review-empty]')).toHaveText(T('No session yet. After your first meditation you see your streak here, the minutes of the week and how deep it was.'));
  await expect(main.locator('.stats')).toHaveCount(0);
  await put(page, aktivRows());
  await go(page, '#/flow/act/meditation');
  await expect(main.locator('[data-review-empty]')).toHaveCount(0);
  const dq = main.locator('[data-depth]');
  await expect(dq).toContainText(T('avg. depth (1–5)'));
  await dq.click();
  await expect(dq).toHaveAttribute('aria-expanded', 'true');
  await expect(main.locator('#m-depth-help')).toHaveText(T('Your own rating after each session, from 1 (restless) to 5 (very deep).'));
  expect(errors).toEqual([]);
});
