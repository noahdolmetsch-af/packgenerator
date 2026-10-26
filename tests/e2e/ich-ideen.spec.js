// Einzelideen «Ich» (996 Ideen, Noah 25.10.2026): 30 a tour ended early goes on at its step; 31 a shortcut tip
// after a few mouse clicks in the sidebar; 36 suggestions off by kind (Ich › Darstellung). Empty app, German UI.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TOURS, stepCount } from '../../src/lib/tour.js';
import { SUGGEST_KINDS } from '../../src/lib/clear/suggest.js';
import { HINT_AT } from '../../src/lib/nav/keyhint.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('30: a tour ended at step 3 offers «Weiter bei Schritt 3» and goes on there', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-tourline]').getByRole('button', { name: T('Start ›|tour') }).click();
  await page.getByRole('dialog', { name: T('Tour of the app') }).locator('[data-choice="own"]').click();
  for (let i = 1; i <= 2; i++) {
    await page.locator('.tcard .btn.hi').click();
    await expect(page.locator('.tour')).toHaveAttribute('data-step', String(i));
  }
  await page.getByRole('button', { name: T('End tour') }).click();
  await expect(page.locator('.tour')).toHaveCount(0);
  await page.goto('./#/');
  await page.locator('[data-tourline]').getByRole('button', { name: T('Start ›|tour') }).click();
  const ask = page.getByRole('dialog', { name: T('Tour of the app') });
  const resume = ask.locator('[data-choice="resume"]');
  await expect(resume).toContainText(T('Go on at step {n}', { n: 3 }));
  await resume.click();
  await expect(page.locator('.tour')).toHaveAttribute('data-step', '2');
  await expect(page.locator('#tour-h')).toHaveText(T(TOURS.app[2].title));
  await expect(page.locator('.tcard')).toContainText(T('Step {n} of {of}', { n: 3, of: stepCount('app') }));
});

test('31: after a few mouse clicks on a place the sidebar shows its shortcut once', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the sidebar and shortcuts are for a computer');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./#/');
  const trips = page.locator('nav.places li[data-place="trips"] > a');
  const home = page.locator('nav.places li[data-place="today"] > a');
  for (let i = 0; i < HINT_AT; i++) {
    await trips.click();
    await expect(page).toHaveURL(/#\/trips/);
    if (i < HINT_AT - 1) await home.click();
  }
  const hint = page.locator('[data-key-hint="t"]');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(T('Faster with the keyboard:'));
  await hint.getByRole('button', { name: T('No more shortcut tips') }).click();
  await expect(page.locator('[data-key-hint]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('keys.hint')).off)).toBe(true);
});

test('36: the kinds of suggestions stand under Ich › Darstellung and switch off', async ({ page }) => {
  await page.goto('./#/me/look');
  const box = page.locator('[data-suggest-areas]');
  for (const a of SUGGEST_KINDS) await expect(box).toContainText(T(a.label));
  const sw = box.locator('[data-suggest="impulse"]');
  await expect(sw).toBeChecked();
  await sw.uncheck();
  await page.reload();
  await expect(page.locator('[data-suggest-areas] [data-suggest="impulse"]')).not.toBeChecked();
});
