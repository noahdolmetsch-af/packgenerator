// «332 sichtbar», Frage 1 (Noah 27.10.2026 «c»): a tap on a function in «What the app can do» goes to its
// spot (src/lib/know/spot.js) and lights it up, also when it sits inside a window or a fold.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';

// spot.js needs Svelte (through i18n), so its ids are read as text
const src = readFileSync(fileURLToPath(new URL('../../src/lib/know/spot.js', import.meta.url)), 'utf8');
const block = src.slice(src.indexOf('export const SPOT = {'), src.indexOf('\n};', src.indexOf('export const SPOT = {')));
const IDS = [...block.matchAll(/^ {2}'?([\w.]+)'?: \[/gm)].map((m) => m[1]);
// the catalogue shows a function under its German name: search for it (as heimat.spec.js reads the titles)
const T = tr('de');
const lib = (f) => readFileSync(fileURLToPath(new URL(`../../src/lib/${f}`, import.meta.url)), 'utf8');
const TITLE = Object.fromEntries([...(lib('tips.js') + lib('features.js')).matchAll(/\{ id: '([^']+)'[^\n]*?title: (?:'((?:[^'\\]|\\.)*)'|"([^"]*)")/g)].map((m) => [m[1], (m[2] ?? m[3]).replace(/\\'/g, "'")]));

test.setTimeout(300_000);

test('a tap in the catalogue lights up the spot of the function', async ({ page, context }, info) => {
  await start(page, context, info);
  expect(IDS.length).toBeGreaterThan(0);
  const missing = [];
  for (const id of IDS) {
    await page.goto('./#/features');
    await page.locator('main h1').first().waitFor({ timeout: 8000 }).catch(() => {});
    await settle(page);
    await page.locator('main input[type=search]').first().fill(T(TITLE[id]).replace(/[«»]/g, ''));
    await page.locator(`[data-feature="${id}"] .fmain`).first().click();
    const lit = page.locator(`[data-spot-on="${id}"]`).first();
    try {
      await lit.waitFor({ state: 'visible', timeout: 10_000 });
      const box = await lit.boundingBox();
      const vh = page.viewportSize().height;
      if (!box || box.y + box.height < 0 || box.y > vh) missing.push(`${id}: lit up but not on screen`);
    } catch {
      missing.push(`${id}: no spot lit up on ${page.url().split('#')[1]}`);
    }
    await page.keyboard.press('Escape');
  }
  expect(missing).toEqual([]);
});
