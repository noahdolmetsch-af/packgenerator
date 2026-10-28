// «Neueste Version» in Ich (Noah 27.10.2026 «1-5 a», questions 1 and 2): the row shows this device's version and
// the one online (version.json), and «Neueste laden» is always there. Fictional state only, German UI.
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const phone = (info) => info.project.name === 'phone';

async function openMe(page, context, live) {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.route(/version\.json/, (route) => (live ? route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: live }) }) : route.abort()));
  await page.goto('./#/me');
  const row = page.locator('[data-version-row]');
  await row.scrollIntoViewIfNeeded();
  return row;
}

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.locator('[data-version-row]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png` });
}

test('Neueste Version: a newer version online says it is loading', async ({ page, context }, info) => {
  const row = await openMe(page, context, '9.0.0');
  await expect(row).toHaveAttribute('data-version-state', 'newer');
  await expect(row).toContainText(T('Online: {v} · the new version is loading …').replace('{v}', '9.0.0'));
  await expect(row.getByRole('button', { name: T('Load newest|update') })).toBeVisible();
  await shot(page, info, 'NV1-neuer-online');
});

test('Neueste Version: the same version online says up to date', async ({ page, context }, info) => {
  const row = await openMe(page, context, '0.0.1');
  await expect(row).toHaveAttribute('data-version-state', 'current');
  await expect(row).toContainText(T('Online: {v} · this device is up to date').replace('{v}', '0.0.1'));
  await shot(page, info, 'NV2-aktuell');
});

test('Neueste Version: offline the row says the online version is not known, the button stays', async ({ page, context }) => {
  const row = await openMe(page, context, null);
  await expect(row).toHaveAttribute('data-version-state', 'unknown');
  await expect(row).toContainText(T('Online version not known right now (offline?)'));
  await expect(row.getByRole('button', { name: T('Load newest|update') })).toBeVisible();
});

test('Neueste Version: «Neueste laden» loads the page anew', async ({ page, context }) => {
  const row = await openMe(page, context, '0.0.1');
  const loaded = page.waitForEvent('load');
  await row.getByRole('button', { name: T('Load newest|update') }).click();
  await loaded;
  await expect(page.locator('[data-version-row]')).toBeVisible();
});
