// «Quick Links» (Noah 28.10.2026 «1a 2a 3a 4a 5a», Schritt 1): the place in the bar, 20 suggested pins,
// a tap goes to the function, add a pin, edit (order, note, unpin with Undo), own groups.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';

// read from the app's source as text (a spec never imports modules that reach *.svelte.js)
const src = (f) => readFileSync(new URL(`../../src/lib/${f}`, import.meta.url), 'utf8');
const STARTER = [...src('quick/quicklinks.js').matchAll(/\{ std: '([^']+)', pins: \[([^\]]+)\] \}/g)].map((m) => ({ std: m[1], pins: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) }));
const PINS = STARTER.flatMap((g) => g.pins);
const FEATURES_SRC = src('features.js');
const titleOf = (id) => FEATURES_SRC.match(new RegExp(`id: '${id.replace('.', '\\.')}', group: '[a-z]+', title: '([^']+)'`))[1];

test('Quick Links: place, suggestions, go there, add, edit, groups', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const phone = info.project.name === 'phone';

  // the place: in the bar (phone) or the sidebar (computer)
  const nav = phone ? page.locator('nav.bottom') : page.locator('aside.side nav.places');
  await nav.locator('a[href="#/quick"]').click();
  await expect(page).toHaveURL(/#\/quick$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Quick Links|place') })).toBeVisible();
  await expect(page.locator('[data-quick]')).toHaveAttribute('data-quick', phone ? 'phone' : 'computer');

  // the 20 suggestions in five groups
  await expect(page.locator('[data-quick-pin]')).toHaveCount(PINS.length);
  await expect(page.locator('[data-quick-group]')).toHaveCount(STARTER.length);
  await expect(page.locator('[data-quick-group="s1"] h2')).toHaveText(T(STARTER[0].std));

  // a tap goes to the function
  await page.locator('[data-quick-pin="f.weather"] .ql-a').click();
  await expect(page).toHaveURL(/#\/wetter/);
  await page.goto('./#/quick');

  // add a pin from the search
  await page.getByRole('button', { name: T('Add a pin') }).first().click();
  const add = page.locator('[data-quick-add]');
  await add.getByRole('searchbox').fill(T(titleOf('f.race')));
  await add.locator('[data-quick-fn="f.race"]').getByRole('button').click();
  await expect(page.locator('[data-quick-group="s1"] [data-quick-pin="f.race"]')).toBeVisible();
  await add.getByRole('button', { name: T('Close') }).click();

  // edit: move up with the arrow, a note, unpin with Undo
  await page.getByRole('button', { name: T('Edit|quick') }).click();
  const g1 = page.locator('[data-quick-group="s1"] [data-quick-pin]');
  const name = T(titleOf('f.race'));
  await page.getByRole('button', { name: T('Move {name} up', { name }) }).click();
  await expect(g1.nth(PINS.indexOf(STARTER[0].pins.at(-1)))).toHaveAttribute('data-quick-pin', 'f.race');
  await page.getByRole('button', { name: T('Change name and note of «{name}»', { name }) }).click();
  const form = page.locator('[data-quick-edit]');
  await form.locator('input[name="note"]').fill('test_data_gtp_ im Mai');
  await form.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('[data-quick-pin="f.race"] [data-quick-note]')).toHaveText('test_data_gtp_ im Mai');
  await page.getByRole('button', { name: T('Unpin «{name}»', { name }) }).click();
  await expect(page.locator('[data-quick-pin="f.race"]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-quick-pin="f.race"]')).toHaveCount(1);

  // own group: add, then delete it again (the pins stay)
  await page.getByRole('button', { name: T('New group') }).click();
  await page.getByLabel(T('Name of the new group')).fill('test_data_gtp_ Winter');
  await page.getByRole('button', { name: T('Add'), exact: true }).click();
  await expect(page.locator('[data-quick-group] h2').filter({ hasText: 'test_data_gtp_ Winter' })).toHaveCount(1);

  // it stays after a reload, on this kind of device
  await page.reload();
  await expect(page.locator('[data-quick-pin="f.race"] [data-quick-note]')).toHaveText('test_data_gtp_ im Mai');
  await expect(page.locator('[data-quick-pin]')).toHaveCount(PINS.length + 1);
});
