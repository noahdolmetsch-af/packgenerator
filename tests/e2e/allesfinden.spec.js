// v0.96.0 «F1 Alles finden» (Noah «1-5 a» 11.10.2026, mockups A/B, Trello vaSqiSQb; new mockups «1-2
// freigeben» 11.10. 16:10): «Was die App kann» in 6 groups by situation or 5 by page, 4 rows each, never
// used first, «Hinbringen» and «Ausprobieren»; the search shows
// commands to try, the last searches and all functions, and finds a function («garantie»).
// Fictional data (home0460-fixture.js, test_data_gtp_), German UI, nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { FEATURE_SRC_ALL } from './featsrc.js';

// the functions a word finds, read from the app source like findFeatures() does (title, text, words, in English
// and German); features.js itself loads the language store, which needs the browser
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const FEATURE_SRC = FEATURE_SRC_ALL; // features.js and src/lib/featreg/
const featuresFinding = (word) =>
  FEATURE_SRC.split(/\{ id: '/).slice(1).filter((c) => /^f\./.test(c)).map((c) => {
    const id = c.slice(0, c.indexOf("'"));
    const title = c.match(/title: '((?:[^'\\]|\\.)*)'/)?.[1] ?? '';
    const text = c.match(/text: '((?:[^'\\]|\\.)*)'/)?.[1] ?? '';
    return { id, hay: norm([c.slice(0, c.indexOf('},')), DE[title], DE[text]].join(' ')) };
  }).filter((f) => f.hay.includes(norm(word))).map((f) => f.id);

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Was die App kann: groups by situation, chips, find, Hinbringen, Ausprobieren', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/features');
  await expect(page.getByRole('heading', { name: T('Help and functions'), level: 1 })).toBeVisible();
  const groups = page.locator('section[data-group]');
  await expect(groups).toHaveCount(6);
  await expect(groups.first().locator('h2')).toHaveText(T('Before the trip'));
  // Design-Refresh P9 (I7): the head with the path back (VeloHead), its line under the title is .vsub
  // SN6 (changed on purpose): «… · antippen bringt dich hin»
  await expect(page.locator('.vhead .vsub')).toHaveText(new RegExp(`^${T('{total} functions · you use {n}', { total: '\\d+', n: '\\d+' })} · ${T('tap to go there')}$`));
  await page.screenshot({ path: info.outputPath('f1-was-die-app-kann.png'), fullPage: true });

  // phone: every button is a 44 px target, nothing scrolls sideways
  if (info.project.name === 'phone') {
    // SN6 (changed on purpose): the switch, the rows, their «…» and «Alle n» (no chips, no row buttons any more)
    for (const b of await page.locator('main .ftop .seg button, main .fmain, main .ma .dots, main .fall').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await noSideScroll(page);
  // SN6 (changed on purpose, mockup «Seiten neu»): 3 rows per group, then «Alle N»
  await expect(groups.first().locator('[data-feature]')).toHaveCount(3);

  // switched to «Nach Seite»: the places of the app
  await page.getByRole('button', { name: T('By page'), exact: true }).click();
  await expect(groups).toHaveCount(5);
  await expect(groups.first().locator('h2')).toHaveText(T('Trips|place'));
  // «Heute als Begleiter» PR 6: the third view, by moment (9 groups, a line explains it)
  await page.getByRole('button', { name: T('By moment'), exact: true }).click();
  await expect(groups).toHaveCount(9);
  await expect(groups.first().locator('h2')).toHaveText(T('Dreaming and ideas|moment'));
  await expect(page.locator('[data-moment-hint]')).toBeVisible();
  await noSideScroll(page);
  await page.getByRole('button', { name: T('By situation'), exact: true }).click();
  await expect(groups).toHaveCount(6);
  await expect(page.locator('[data-moment-hint]')).toHaveCount(0);

  // SN6 (changed on purpose): no situation chips; «Alle n» of a card shows all its rows
  const bike = page.locator('section[data-group="bike"]');
  await bike.locator('.fall').click();
  await expect(bike.locator('.fall')).toHaveCount(0);
  expect(await bike.locator('[data-feature]').count()).toBeGreaterThan(3);

  // the field finds a function by its German word; «Hinbringen» opens the bike's sheet
  await page.getByLabel(T('Find a function')).fill('garantie');
  const row = page.locator('[data-feature="f.warranty"]');
  await expect(row).toBeVisible();
  // every function the word finds, read from the app source (0.147.0: «Dokumente als PDF» knows «garantie» too)
  const found = featuresFinding('garantie');
  expect(found).toContain('f.warranty');
  expect(await page.locator('[data-feature]').evaluateAll((els) => els.map((e) => e.dataset.feature).sort())).toEqual([...found].sort());
  await row.locator('.fmain').click(); // SN6: the row itself takes you there
  await expect(page).toHaveURL(/#\/bikes\?bike=test_data_gtp_[^&]+&sheet=warranty/);

  // «Ausprobieren» opens the playground on the day it plays (here: on the way), without starting it
  await page.goto('./#/features');
  await page.getByLabel(T('Find a function')).fill('basischeck');
  // SN6 (changed on purpose): «Ausprobieren» is in the row's «…»
  await page.locator('[data-feature="f.basecheck"] .ma .dots').click();
  await page.getByRole('menuitem', { name: new RegExp(T('Try it')) }).click();
  const sheet = page.locator('dialog.playsheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { name: T('Try it out') })).toBeVisible();
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toBeHidden();
  expect(errors).toEqual([]);
});

test('Suche: commands to try, the last searches, functions, all functions', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  const field = page.getByLabel(T('What do you want to do? Search or say an action'));
  const openSearch = async () => {
    if (info.project.name === 'phone') await page.getByRole('button', { name: T('Search everything') }).click();
    else await field.click();
  };
  await openSearch();
  const tries = page.getByRole('region', { name: T('Try a command') });
  await expect(tries.locator('[data-try]')).toHaveCount(3);
  await expect(tries.getByRole('link', { name: new RegExp(T('See all {n} functions', { n: '\\d+' })) })).toBeVisible();
  await page.screenshot({ path: info.outputPath('f1-suche.png') });
  // a command to try fills the field; the search then offers to do it
  await tries.locator('[data-try]').first().click();
  await expect(field).toHaveValue(new RegExp(`^${T('chain lubed|command')} `));
  await expect(page.locator('[data-cmd="chain"]').first()).toBeVisible();

  // a function is found by its word and opens its place
  await field.fill('garantie');
  await page.locator('[data-feat="f.warranty"]').click();
  await expect(page).toHaveURL(/sheet=warranty/);

  // the last search comes back as a chip; «Alle … Funktionen» opens «Was die App kann»
  await openSearch();
  await expect(tries.getByRole('button', { name: 'garantie', exact: true })).toBeVisible();
  await tries.getByRole('link', { name: new RegExp(T('See all {n} functions', { n: '\\d+' })) }).click();
  await expect(page).toHaveURL(/#\/features$/);
  await expect(page.getByRole('heading', { name: T('Help and functions'), level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
