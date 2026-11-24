// «Klügere Suche» (Noah 24.11.2026 «1-5a», Stufe 1): pages and functions first, gear only where it makes sense (a folded line elsewhere),
// the buttons under the field, six topics in the empty field, no «add as new item» for a question. German UI, no network, fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File, P } from './v0770-fixture.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(v0770File(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
}

async function field(page, info, hash) {
  await page.goto(hash);
  if (info.project.name === 'phone') await page.getByRole('button', { name: T('Search everything') }).click();
  return page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
}

test('gear is one folded line on Today, open on the gear page, and a button shows it', async ({ page, context }, info) => {
  await start(page, context, info);
  const f = await field(page, info, './');
  const res = page.getByRole('region', { name: T('Search results') });
  await f.fill('regen');
  // something else fits (functions): the gear stays folded, Enter does not open a gear item
  await expect(res.locator('[data-feat]').first()).toBeVisible();
  const fold = res.locator('[data-search-gear-fold]');
  await expect(fold).toContainText(`${T('Gear')}:`);
  await expect(res.locator('button:not([data-search-gear-fold])', { hasText: `${P} Regenjacke` })).toHaveCount(0);
  await fold.click();
  await expect(res.locator('button:not([data-search-gear-fold])', { hasText: `${P} Regenjacke` })).toBeVisible();
  // the button «Material» shows only the gear and no functions
  await res.locator('[data-search-filter="gear"]').click();
  await expect(res.locator('button:not([data-search-gear-fold])', { hasText: `${P} Regenjacke` })).toBeVisible();
  await expect(res.locator('[data-feat]')).toHaveCount(0);
  await expect(fold).toHaveCount(0);
  // the choice is for this search only: an emptied field forgets it
  await f.fill('');
  await f.fill('regen');
  await expect(res.locator('[data-search-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(res.locator('[data-search-filter="pages"]')).toBeVisible();
  // on the gear page the gear stands first and open
  await field(page, info, './#/gear').then((g) => g.fill('regen'));
  const res2 = page.getByRole('region', { name: T('Search results') });
  await expect(res2.locator('button:not([data-search-gear-fold])', { hasText: `${P} Regenjacke` })).toBeVisible();
  await expect(res2.locator('[data-search-gear-fold]')).toHaveCount(0);
});

test('an empty field shows six topics, a tap shows their pages; a question offers no new item', async ({ page, context }, info) => {
  await start(page, context, info);
  const f = await field(page, info, './');
  await f.focus();
  const tiles = page.locator('[data-search-topics] [data-topic]');
  await expect(tiles).toHaveCount(6);
  await page.locator('[data-topic="packing"]').click();
  await expect(page.locator('[data-search-topic-rows] a').first()).toBeVisible();
  expect(await page.locator('[data-search-topic-rows] a').count()).toBeGreaterThan(1);
  await expect(page.locator('[data-search-wishes]')).toBeVisible(); // «Das suchen viele» stays
  await f.fill('Wo stelle ich das Backup-Passwort ein?');
  const res = page.getByRole('region', { name: T('Search results') });
  await expect(res).toBeVisible();
  await expect(res.getByRole('button', { name: /als neues Material erfassen/ })).toHaveCount(0);
  await f.fill('trikotxyz');
  await expect(res.getByRole('button', { name: /als neues Material erfassen/ })).toBeVisible(); // a plain word still can be added
});

test('a hit only in running text does not hide the gear; the folded line names the first items; the search learns what you open', async ({ page, context }, info) => {
  await start(page, context, info);
  const f = await field(page, info, './');
  const res = page.getByRole('region', { name: T('Search results') });
  // «Finger» stands only in a note (a weak hit), «Regen» in functions (strong hits): the gear folds away and its line names the first items
  await f.fill('regen');
  const fold = res.locator('[data-search-gear-fold]');
  await expect(fold).toBeVisible();
  await expect(fold.locator('small')).toContainText('Regen');
  // the buttons show the number of hits; a kind without hits has no button
  await expect(res.locator('[data-search-filter="gear"] .cnt')).toBeVisible();
  await expect(res.locator('[data-search-filter="bikes"]')).toHaveCount(0);
  // a weak hit: «Matte zu dünn» is a note about the mat, the word is no name of anything else
  await f.fill('kalt');
  await expect(res.locator('[data-search-weak]')).toBeVisible();
  await expect(res.locator('[data-search-gear-fold]')).toHaveCount(0);
  // the search learns: three opens of a gear item for «regen», the next search shows gear first, with the line that says why
  await f.fill('regen');
  for (let i = 0; i < 3; i++) {
    await res.locator('[data-search-gear-fold]').click();
    await res.locator('button:not([data-search-gear-fold])', { hasText: `${P} Regenjacke` }).click();
    const f2 = await field(page, info, './');
    await f2.fill('regen');
  }
  await expect(res.locator('[data-search-learned]')).toBeVisible();
  await expect(res.locator('[data-search-gear-fold]')).toHaveCount(0);
  await res.locator('[data-search-learned] button').click();
  await expect(res.locator('[data-search-learned]')).toHaveCount(0);
});
