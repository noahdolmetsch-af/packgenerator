// «Abenteuer-Würfel» (Träume und Neuland N19, Noah 27.10.2026 «1-5 a»): on Touren › Träume «Roll» shows a rule,
// «Roll again» another one; an own rule is added, renamed and deleted (Undo brings it back); a built-in rule is
// hidden and shown again. Offline, fictional data only.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
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

test('Adventure dice: roll, roll again, own rule, hide a built-in one', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  const sec = page.locator('[data-dice]');

  // 1. roll, then roll again: another rule
  await sec.locator('[data-dice-roll]').click();
  const rule = sec.locator('[data-dice-rule]');
  await expect(rule).toBeVisible();
  const first = await rule.getAttribute('data-dice-rule');
  await expect(sec.locator('[data-dice-roll]')).toHaveText(T('Roll again'));
  await sec.locator('[data-dice-roll]').click();
  await expect(rule).not.toHaveAttribute('data-dice-rule', first);
  await noSideways(page);
  await shot(sec, info, 'AW1-wurf');

  // 2. an own rule: add, rename, delete with Undo
  await sec.locator('[data-dice-rules]').click();
  await sec.locator('[data-dice-new]').fill(`${P}Nur Brücken`);
  await sec.locator('[data-dice-add]').click();
  const own = sec.locator('[data-dice-item]').filter({ hasText: `${P}Nur Brücken` });
  await expect(own).toHaveCount(1);
  await own.locator('[data-dice-edit]').click();
  const dlg = page.getByRole('dialog', { name: T('Rename rule') });
  await dlg.getByRole('textbox').fill(`${P}Nur Holzbrücken`);
  await dlg.getByRole('button', { name: T('Save') }).click();
  const own2 = sec.locator('[data-dice-item]').filter({ hasText: `${P}Nur Holzbrücken` });
  await expect(own2).toHaveCount(1);
  await shot(sec, info, 'AW2-regeln');
  await own2.locator('[data-dice-del]').click();
  await expect(own2).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(own2).toHaveCount(1);

  // 3. hide a built-in rule, then show it again
  const n0 = await sec.locator('[data-dice-item]').count();
  await sec.locator('[data-dice-item]').first().locator('[data-dice-hide]').click();
  await expect(sec.locator('[data-dice-item]')).toHaveCount(n0 - 1);
  await sec.locator('[data-dice-hidden]').click();
  await sec.locator('[data-dice-show]').first().click();
  await expect(sec.locator('[data-dice-item]')).toHaveCount(n0);
  expect(errors).toEqual([]);
});
