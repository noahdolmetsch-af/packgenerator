import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  // four runs on the days before: the next tick is the 5th (star 1 of «Mal gemacht»)
  await put(page, { flowLog: [1, 2, 3, 4].map((i) => ({ id: `test_run_${i}`, actId: 'run', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, n: 1 })) });
  return errors;
}

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('the star window has a saying, a fitting stage and the next star; the tone switch changes it', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/flow');
  await page.reload();
  await ready(page);
  await page.locator('section[aria-labelledby="tick-h"]').locator('[data-act="run"]').click();
  const win = page.locator('dialog[data-star-window]');
  await expect(win).toBeVisible();
  await expect(win.locator('[data-star-saying]')).toBeVisible(); // start tone: funny
  await expect(win.locator('[data-star-stage]')).toHaveText(T('First steps|stage run'));
  await expect(win.locator('[data-star-next]')).toContainText(T('Next star {k}: {n} to go', { k: 2, n: '' }).split(':')[0]);
  await shot(page, info, 'neuer-stern-lustig');
  await win.locator('[data-tone="off"]').click();
  await expect(win.locator('[data-star-saying]')).toHaveCount(0);
  await expect(win.locator('[data-star-stage]')).toHaveCount(0);
  await win.locator('[data-tone="calm"]').click();
  await expect(win.locator('[data-star-saying]')).toBeVisible();
  await shot(page, info, 'neuer-stern-ruhig');
  await win.getByRole('button', { name: T('OK') }).click();
  expect(errors).toEqual([]);
});

test('a sport page has the tone switch', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/flow/sport/act%3Arun');
  await page.reload();
  await ready(page);
  const box = page.locator('[data-tone-setting]');
  await expect(box).toBeVisible();
  await box.locator('[data-tone="off"]').click();
  await expect(box.locator('[data-tone="off"]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-tone-setting] [data-tone="off"]')).toHaveAttribute('aria-pressed', 'true');
  await box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, info, 'ton-sportseite');
  expect(errors).toEqual([]);
});
