// W1 «Deine Fahrten» in «Dein Tempo» (Noah 15.10.2026 «1-5 a»), German UI, phone 390 and desktop: a compact
// row per ride (title, surface chip, one line of facts, riding time against the guess as a small bar), the
// switch «zählt mit», «Entfernen» in «…», the newest five open and «Alle n zeigen». Fictional data.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { tempoData, D0 } from './v0530-fixture.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Deine Fahrten: compact rows, switch, bar, the newest five', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync(info.project.outputDir, { recursive: true });
  const data = tempoData({ paceRides: 20 });
  const n = data.tables.settings[0].value.rides.length;
  expect(n).toBeGreaterThan(5);
  const file = `${info.project.outputDir}/w1-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T17:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/debrief/pace');

  const list = page.locator('section[aria-labelledby="rides-h"]');
  const rows = list.locator('.rides li');
  // 5a: the newest five, then «Alle n zeigen»
  await expect(rows).toHaveCount(5);
  const more = list.getByRole('button', { name: T('Show all {n}', { n }) });
  await more.click();
  await expect(rows).toHaveCount(n);
  await expect(list.getByRole('button', { name: T('Show fewer') })).toBeVisible();

  // 1a + 4a: one line of facts, the riding time against the guess with its bar
  const first = rows.first();
  const name = (await first.locator('.rv-t').innerText()).trim();
  await expect(first.locator('.rtime')).toContainText(T('guess {time} h').split(' ')[0]);
  await expect(first.locator('.rbar[role="img"]')).toHaveAttribute('aria-label', /Min\. (schneller|langsamer) als geschätzt/);
  // 2a: the surface chip beside the title
  await expect(first.locator('.rtop select')).toBeVisible();

  // 3a: the switch «zählt mit», «Entfernen» in «…»
  const sw = first.getByRole('switch', { name: T('Counts for your pace: {name}', { name }) });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(first).toHaveClass(/off/);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await first.getByRole('button', { name: T('More for {what}', { what: name }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(T('Remove')) }).click();
  await expect(rows).toHaveCount(n - 1);
  await expect(list.locator('.rv-t', { hasText: name })).toHaveCount(0);

  await noSideways(page);
  expect(errors).toEqual([]);
});
