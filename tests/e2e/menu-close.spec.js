// v0.115.0 (Noah 12.10.2026: «erst bei zweitem Klick geht Menü wieder weg», Velopflege › Probleme):
// a ••• menu closes when a tap or click lands outside it (before, it stayed open until its own •••
// was hit again, and covered the next row's •••). Bike care problems and the packing list's •••.
// No ••• in the test titles: Playwright puts them in the output folder, and the file upload then fails.
// Fictional data only (tests/e2e/pf-fixture.json plus two test_data_gtp_ problems).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => (DE[en] ?? en).replace(/\{(\w+)\}/g, (m, k) => vars?.[k] ?? m);
const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const BIKE = `${P}scale`;
const SADDLE = `${P} Sattel zu tief`;
const AIR = `${P} Zu wenig Luft`;

async function start(page, context, info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  fix.tables.maintenance.push(
    { id: 9201, bikeId: BIKE, task: SADDLE, source: 'Problem', topic: 'saddle', fix: 'self', priority: 'medium', status: 'open', logDate: day(-1) },
    { id: 9202, bikeId: BIKE, task: AIR, source: 'Problem', topic: 'air', fix: 'self', priority: 'medium', status: 'open', logDate: day(-2) },
  );
  const file = info.outputPath('menu-close-fixture.json');
  writeFileSync(file, JSON.stringify(fix));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return errors;
}

test('Bike care problems: a tap outside closes the more menu, at once', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${BIKE}&open=1`);
  const more = (task) => page.getByLabel(T('More answers for {label}', { label: task }));
  const box = (task) => page.locator('details.more', { has: more(task) });
  const first = page.locator('.prob').first();
  await expect(first).toContainText(SADDLE); // newest first
  await more(SADDLE).scrollIntoViewIfNeeded();
  await more(SADDLE).click();
  await expect(box(SADDLE)).toHaveAttribute('open', '');
  // A tap on the row's own text, outside the menu: the menu closes at once.
  await first.locator('.rn').click();
  await expect(box(SADDLE)).not.toHaveAttribute('open', '');
  // Open again, then a tap on the next problem's name: it closes too, and the next ••• opens alone.
  await more(SADDLE).click();
  await page.locator('.prob', { hasText: AIR }).locator('.rn').click();
  await expect(box(SADDLE)).not.toHaveAttribute('open', '');
  await more(AIR).click();
  await expect(box(AIR)).toHaveAttribute('open', '');
  await expect(page.locator('details.more[open]')).toHaveCount(1);
  // Its own ••• still closes it, and an answer still works.
  await more(AIR).click();
  await expect(box(AIR)).not.toHaveAttribute('open', '');
  await more(AIR).click();
  await box(AIR).getByRole('button', { name: T('Not needed any more') }).click();
  await expect(page.locator('.prob', { hasText: AIR })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Packing list: a tap outside closes its more menu', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/pack');
  const btn = page.getByLabel(T('More: other trip, edit trip, templates, print'));
  const menu = page.locator('details.list-menu');
  await btn.click();
  await expect(menu).toHaveAttribute('open', '');
  await page.locator('main h1').first().click();
  await expect(menu).not.toHaveAttribute('open', '');
  expect(errors).toEqual([]);
});
