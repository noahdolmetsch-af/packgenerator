// «Passt jetzt: Ideen pro Monat» (Träume und Neuland N8, Noah 27.10.2026 «1-5 a»): the ideas of this month on Träume,
// another month from «Your year», an own idea added, renamed with another month, made a dream; a built-in idea
// hidden and shown again. Fictional data only, no real network.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { MONTH_IDEAS } from '../../src/lib/dreams/monatsideen.js';
import { MONTHS } from '../../src/lib/dreams.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const long = (m) => new Date(Date.UTC(2026, m - 1, 15)).toLocaleDateString('de-CH', { month: 'long', timeZone: 'UTC' });
const now = Number(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(5, 7));
const other = now === 7 ? 1 : 7;

test('Ideas per month: this month, another month, an own idea, a dream from it, hide and show', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);

  // 1. this month's built-in ideas
  const sec = page.locator(`[data-month-ideas="${now}"]`);
  await expect(sec.getByRole('heading', { name: T('Fits now: ideas for {month}', { month: long(now) }) })).toBeVisible();
  const mine = MONTH_IDEAS.filter((x) => x.months.includes(now));
  await expect(sec.locator('[data-idea]')).toHaveCount(mine.length);
  for (const x of mine) await expect(sec).toContainText(T(x.text));
  await noSideways(page);
  await sec.scrollIntoViewIfNeeded();
  await shot(sec, info, 'IM1-ideen');

  // 2. hide one, show it again
  const first = mine[0];
  await sec.locator(`[data-idea="${first.id}"] [data-idea-hide]`).click();
  await expect(sec.locator(`[data-idea="${first.id}"]`)).toHaveCount(0);
  await sec.locator('[data-idea-hidden]').click();
  await sec.locator('[data-idea-show]').click();
  await expect(sec.locator(`[data-idea="${first.id}"]`)).toHaveCount(1);

  // 3. an own idea, renamed and moved to another month too
  await sec.locator('[data-idea-new]').fill(`${P}Fondue am See`);
  await sec.locator('[data-idea-add]').click();
  const own = sec.locator('[data-idea^="mi-"]');
  await expect(own).toContainText(`${P}Fondue am See`);
  await own.locator('[data-idea-edit]').click();
  const dlg = page.locator('dialog[open]').filter({ hasText: T('Rename idea') });
  await dlg.getByRole('textbox').fill(`${P}Fondue im Wald`);
  await dlg.getByRole('button', { name: T(MONTHS[other - 1]), exact: true }).click();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(own).toContainText(`${P}Fondue im Wald`);

  // 4. another month in «Your year» shows its ideas, the own one too
  await page.locator(`.band [data-month="${other}"]`).click();
  const sec2 = page.locator(`[data-month-ideas="${other}"]`);
  await expect(sec2.getByRole('heading', { name: T('Ideas for {month}', { month: long(other) }) })).toBeVisible();
  await expect(sec2).toContainText(`${P}Fondue im Wald`);

  // 5. «As a dream»: the dream is in the list with its months
  await sec2.locator('[data-idea^="mi-"] [data-idea-dream]').click();
  await expect(page.locator('[data-dream]').filter({ hasText: `${P}Fondue im Wald` })).toHaveCount(1);
  expect(errors).toEqual([]);
});
