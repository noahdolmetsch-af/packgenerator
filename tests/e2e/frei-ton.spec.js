// Paket T «Freie Zeit» (Noah 19.10.2026 «4b wenn nicht zu gross»): a recording of up to 30 s at a favourite
// place, with the browser's fake microphone; the switch «Recordings in the backup». Fictional data only.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

test.use({
  permissions: ['microphone'],
  launchOptions: { ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}

test('record, stop, save: the place plays it; the backup switch is there', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/sammlung/places');
  await expect(page.locator('[data-sounds-backup]')).toBeChecked();
  await page.locator('[data-new-entry]').click();
  await page.locator('[data-field="title"]').fill('test_data_frei_Bach');
  await page.locator('[data-sound-start]').click();
  await expect(page.locator('[data-sound-stop]')).toBeVisible();
  await page.waitForTimeout(1500); // a real second of fake sound
  await page.locator('[data-sound-stop]').click();
  await expect(page.locator('[data-sound-remove]')).toBeVisible();
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-entry] audio')).toHaveCount(1);
  expect(errors).toEqual([]);
});
