// «Meine Sportarten» Vorlagen für «Neue Sportart» (Noah 02.11.2026 «5a»). Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

test('Neue Sportart: a template fills the form and can still be changed', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/new');
  await expect(page.locator('[data-templates]')).toBeVisible();
  await page.locator('[data-template="strength"]').click();
  const name = page.locator('#ed-name');
  await expect(name).toHaveValue(T('Strength training|template'));
  await expect(page.locator('[data-goal="0"] [data-count]')).toHaveText('2');
  // another template replaces an untouched name; a typed name stays
  await page.locator('[data-template="running"]').click();
  await expect(name).toHaveValue(T('Running|template'));
  await name.fill('Meine Runde');
  await page.locator('[data-template="swimming"]').click();
  await expect(name).toHaveValue('Meine Runde');
  await expect(page.locator('[data-goal="0"] [data-count]')).toHaveText('1');
  // save: the sport is in the list
  await page.getByRole('button', { name: T('Save') }).click();
  await expect(page).toHaveURL(/#\/flow\/sports/);
  await expect(page.locator('[data-my-sports]').first()).toContainText('Meine Runde');
});
