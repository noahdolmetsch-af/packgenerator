// «Eingaben überall» (Noah 26.10.2026 «1a 2b 3 nur Ton 4b 5a aber b möglich»): the «Add» bar under a diary
// entry (template, file), the picture card from an entry, and the diary in the app search with its switch.
// German, phone 390 and desktop 1440, a fixed clock in Europe/Zurich, fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { STD_TEMPLATES } from '../../src/lib/eingabe/inputs.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;
const DAY = '2026-10-20';
const P = 'test_data_in_';
const good2 = STD_TEMPLATES.diary.find((x) => x.key === 'good2');

async function open(page, context, hash = './#/tagebuch') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T20:30:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function searchField(page) {
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  return page.locator('input[type="search"]:visible').first();
}

test('diary: a template and a file go into the entry, the picture card opens, the search finds it and can leave it out', async ({ page, context }) => {
  const errors = await open(page, context);
  await page.locator('[data-tb-new]').click();
  const ed = page.locator('[data-tb-editor]');
  await ed.locator('[data-tb-title]').fill(`${P}Seeabend`);
  await ed.locator('[data-tb-text]').fill('Kurz am Wasser.');
  const bar = ed.locator('[data-input-bar="diary"]');
  await expect(bar).toBeVisible();
  // only the tools of the diary
  await expect(bar.locator('[data-in-tool]')).toHaveCount(4);

  // a template goes under the text, in German
  await bar.locator('[data-in-tool="template"]').click();
  await bar.locator('[data-in-template="good2"]').click();
  await expect(ed.locator('[data-tb-text]')).toHaveValue(new RegExp(`Kurz am Wasser\\.[\\s\\S]*${T(good2.text.split('\n')[0]).replace(/[.?]/g, '\\$&')}`));

  // a small file
  await bar.locator('[data-in-tool="file"]').click();
  await bar.locator('[data-in-file-input]').setInputFiles({ name: 'test_data_plan.txt', mimeType: 'text/plain', buffer: Buffer.from('Route über den Pass') });
  await expect(ed.locator('[data-in-file]')).toContainText('test_data_plan.txt');
  expect(await noScroll(page)).toBe(true);
  await ed.locator('[data-tb-save]').click();
  await expect(ed).toBeHidden();

  // reading: the file is there, the picture card opens
  await page.locator('[data-tb-entry]').first().click();
  await expect(page.locator('[data-in-file]')).toContainText('test_data_plan.txt');
  await page.locator('[data-tb-card]').click();
  const card = page.locator('[data-bildkarte]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-bildkarte-text]')).not.toHaveValue('');
  await expect(card.locator('[data-bildkarte-download]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();

  // the app search finds the entry
  let field = await searchField(page);
  await field.fill('Seeabend');
  await expect(page.getByRole('region', { name: T('Search results') }).getByRole('button').filter({ hasText: `${P}Seeabend` }).first()).toBeVisible();
  await field.fill('');
  await page.keyboard.press('Escape');

  // switched off in the diary settings: the search leaves it out
  await page.goto('./#/tagebuch');
  await ready(page);
  await page.locator('[data-tb-settings-open]').click();
  const s = page.locator('[data-tb-settings]');
  await expect(s.locator('[data-tb-insearch]')).toBeChecked();
  await s.locator('[data-tb-insearch]').uncheck();
  await page.keyboard.press('Escape');
  await expect(s).toBeHidden();
  field = await searchField(page);
  await field.fill('Seeabend');
  await page.waitForTimeout(400);
  await expect(page.getByRole('region', { name: T('Search results') }).getByRole('button').filter({ hasText: `${P}Seeabend` })).toHaveCount(0);
  expect(errors).toEqual([]);
});
