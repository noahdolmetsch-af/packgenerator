// «Eigene Werte und alle Daten anpassbar» (Noah 21.10.2026 «1 a und b 2 a 3a 4a»): own reminders on
// Ich › Eigene Werte that show in Velos › Pflege, built-in values renamed, deleted and brought back,
// own body values from an own question, the new lists in «Listen und Typen». Fictional data, German.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/ownvalues.js', import.meta.url)), 'utf8');
const FIELD = Object.fromEntries([...SRC.matchAll(/\{ key: '(\w+)', area: '\w+', std: (-?\d+),.*?name: '([^']+)'/g)].map(([, key, std, name]) => [key, { std: Number(std), name }]));
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];

// calendar days in Europe/Zurich (never now + n * 864e5)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};

async function start(page, context, info, { settings = [], answers = [] } = {}) {
  const file = info.outputPath('alles-anpassbar.json');
  const data = structuredClone(base);
  data.tables.settings = [...(data.tables.settings ?? []), ...settings];
  if (answers.length) data.tables.abAnswers = answers;
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert/)).toBeVisible();
}
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('own reminder: made on Eigene Werte, shown in Velopflege, Erledigt with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  await page.goto('./#/me/werte');
  const sec = page.locator('main [data-own-sec="mine"]');
  await expect(sec.getByRole('heading', { name: T('Own reminders') })).toBeVisible();
  await sec.getByRole('button', { name: T('Own reminder') }).click();
  const dlg = page.getByRole('dialog', { name: T('Own reminder') });
  await dlg.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Reifendruck');
  await dlg.locator('[data-ovs-every]').fill('0');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg.getByRole('alert')).toContainText(T('A number from {lo} to {hi}.', { lo: 1, hi: 3650 }));
  await dlg.locator('[data-ovs-every]').fill('14');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toHaveCount(0);
  await expect(sec.locator('li[data-mine]')).toContainText('test_data_gtp_ Reifendruck');
  await expect(sec.locator('li[data-mine]')).toContainText(T('every {n} days', { n: 14 }));
  expect(await sideways(page)).toBeLessThanOrEqual(1);

  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  const box = page.locator('main [data-own-reminders]');
  await expect(box).toBeVisible();
  const row = box.locator('li[data-own-rem]');
  await expect(row).toContainText('test_data_gtp_ Reifendruck');
  await expect(row).toContainText(T('In {n}', { n: T('{n} days', { n: 14 }) }));
  await row.getByRole('button', { name: T('Done|task') }).click();
  await expect(page.getByText(T('«{name}» done.', { name: 'test_data_gtp_ Reifendruck' }))).toBeVisible();
  await expect(box.getByRole('link', { name: T('Change in Me › Own values') })).toHaveAttribute('href', '#/me/werte');

  // delete it again: the app's own window, then Undo
  await page.goto('./#/me/werte');
  await sec.locator('li[data-mine]').getByRole('button', { name: new RegExp(esc(T('Edit: {name}', { name: 'test_data_gtp_ Reifendruck' }))) }).click();
  await page.getByRole('dialog', { name: T('Edit reminder') }).getByRole('button', { name: T('Delete') }).click();
  await page.getByRole('dialog', { name: T('Delete «{name}»?', { name: 'test_data_gtp_ Reifendruck' }) }).getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(sec.locator('li[data-mine]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a built-in value: renamed, deleted (Standard again) and brought back', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/werte');
  const row = page.locator('main li[data-own="packDays"]');
  await row.locator('[data-own-edit="packDays"]').click();
  const dlg = page.getByRole('dialog', { name: T('Edit value') });
  await dlg.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Packen ab');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(row.locator('b').first()).toHaveText('test_data_gtp_ Packen ab');

  await row.locator('[data-own-edit="packDays"]').click();
  await page.getByRole('dialog', { name: T('Edit value') }).getByRole('button', { name: T('Delete') }).click();
  await page.getByRole('dialog', { name: T('Delete «{name}»?', { name: 'test_data_gtp_ Packen ab' }) }).getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(page.locator('main li[data-own="packDays"]')).toHaveCount(0);
  const gone = page.locator('main [data-own-gone]');
  await gone.getByText(T('Deleted values')).click();
  await gone.locator('[data-own-restore="packDays"]').click();
  await expect(page.locator('main li[data-own="packDays"]')).toBeVisible();
  // the arrows move a value inside its section
  const first = page.locator('main [data-own-sec="pack"] li[data-own]').first();
  const name = await first.locator('b').first().textContent();
  await first.getByRole('button', { name: T('Move {name} down', { name }) }).click();
  await expect(page.locator('main [data-own-sec="pack"] li[data-own]').nth(1).locator('b').first()).toHaveText(name);
});

test('own body value: an own question with a number shows under Koerperwerte, Eigene', async ({ page, context }, info) => {
  const q = { id: 'own-test1', area: 'eigene', text: 'test_data_gtp_ Rücken', form: { kind: 'number', unit: 'Punkte' }, every: { kind: 'off' } };
  await start(page, context, info, {
    settings: [{ key: 'abfragen', value: { own: [q] } }],
    answers: [
      { id: 'a1', qid: q.id, day: day(-1), at: `${day(-1)}T20:00`, value: 4 },
      { id: 'a2', qid: q.id, day: day(-1), at: `${day(-1)}T21:00`, value: 6 },
    ],
  });
  await page.goto('./#/flow/stats/hr');
  await page.locator('[data-bgroups]').getByRole('button', { name: T('Own|body group') }).click();
  const tab = page.getByRole('tab', { name: 'test_data_gtp_ Rücken' });
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-body-mean]')).toContainText('5');
  await expect(page.locator('[data-own-body-edit]')).toHaveAttribute('href', '#/me/abfragen');
});

test('Listen und Typen: an own bike kind, offered on the bike', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/lists');
  await page.locator('main').getByRole('link', { name: new RegExp(esc(T('Kinds of bike'))) }).click();
  await page.locator('main').getByRole('button', { name: T('Own kind') }).click();
  const dlg = page.locator('dialog.les[open]');
  await dlg.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Stadtvelo');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('main li[data-id]').filter({ hasText: 'test_data_gtp_ Stadtvelo' })).toBeVisible();
  expect(await sideways(page)).toBeLessThanOrEqual(1);
  // the overview names the new lists
  await page.goto('./#/me/lists');
  for (const n of ['Kinds of own map points', 'Kinds of time away', 'Questions of the day (diary)', 'Moods (diary)', 'Moods after meditating']) await expect(page.locator('main').getByRole('link', { name: new RegExp(esc(T(n))) })).toBeVisible();
  // «Back to Standard» asks in the app's window
  await page.goto('./#/me/lists?bikeKinds');
  await page.getByRole('button', { name: T('Back to Standard|list') }).click();
  await page.getByRole('dialog', { name: T('Back to Standard?|list') }).getByRole('button', { name: T('Back to Standard|list') }).click();
  await expect(page.locator('main li[data-id]').filter({ hasText: 'test_data_gtp_ Stadtvelo' })).toHaveCount(0);
});
