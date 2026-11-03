// «Wegweiser statt Katalog» PR 8 (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): the everyday tools at the place of
// need: Inbox, Documents, Week, phone reminders (rows «Fits here») and Remember (a link). Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, tr } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// passthier.js needs Svelte (through features.js), so its lists are read as text
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/passthier.js', import.meta.url)), 'utf8');
const count = (place) => SRC.match(new RegExp(`\\b${place}: \\[([^\\]]*)\\]`))[1].match(/'f\.[a-z]+'/g).length;

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Alltag: each place shows Fits here, a tap opens the tool', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  for (const [hash, place] of [['#/inbox', 'inbox'], ['#/me/docs', 'docs'], ['#/week', 'woche'], ['#/me/push', 'push']]) {
    await page.goto('./' + hash);
    const row = page.locator(`[data-passt-hier="${place}"]`);
    await expect(row, place).toContainText(T('Fits here'));
    await expect(row.locator('[data-passt-item]')).toHaveCount(count(place));
    expect(await noScroll(page), place).toBe(0);
  }
  await page.goto('./#/inbox');
  await tap(page.locator('[data-passt-hier="inbox"] [data-passt-item="f.markup"]'), info);
  await expect(page).toHaveURL(/#\/me\/tools\/markup/);
  expect(errors).toEqual([]);
});

test('Remember: the top line leads to people not seen for a while', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/calendar');
  const link = page.locator('[data-merken-people]');
  await expect(link).toHaveText(T('Not seen for a while'));
  expect(await noScroll(page)).toBe(0);
  await tap(link, info);
  await expect(page).toHaveURL(/#\/me\/alltag\/menschen/);
  expect(errors).toEqual([]);
});
