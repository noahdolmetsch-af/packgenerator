// «Suche findet mehr» und «Treffer lesbarer» (Warteliste 1, Noah 22.11.2026 «1a 4a 5a»): rides, learnings and bike care
// are found, the words found are marked, buttons narrow the hits to one kind and «Alle zeigen» shows all of it,
// «Meintest du» for a typo. Fictional data only (home0460 fixture, test_data_sm_).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

function fixture() {
  const data = homeFixture();
  const T = data.tables;
  T.activities = Array.from({ length: 6 }, (_, i) => ({ id: `90${i}`, day: day(-i - 1), time: '09:00', name: `test_data_sm_ Hausrunde ${i + 1}`, type: 'Ride', kind: 'bike', km: 30 + i, movingS: 5000, hm: 400 }));
  T.learnings = [{ id: 'test_data_sm_l1', topic: 'Regen', rule: 'test_data_sm_ Hausrunde nur ohne Regen', action: '', itemIds: [] }];
  T.visits = [{ id: 'test_data_sm_v1', bikeId: 'bike-test', date: day(-30), shop: 'test_data_sm_ Hausrunde Werkstatt', parts: [{ part: 'chain', action: 'replace' }] }];
  return data;
}

async function openSearch(page) {
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:search', { detail: '' })));
  return page.getByRole('searchbox');
}

test('Search finds rides, learnings and bike care, marks the words, narrows to one kind and shows all of it', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: fixture() });
  const f = await openSearch(page);
  await f.fill('test_data_sm_ hausrunde');
  const res = page.getByRole('region', { name: T('Search results') });
  await expect(res).toContainText(T('Rides'));
  await expect(res).toContainText(T('Learnings'));
  await expect(res).toContainText(T('Bike care'));
  // the words found are marked; the text stays whole
  await expect(res.locator('mark').first()).toBeVisible();
  // «Klügere Suche» (Noah 24.11.2026 «1-5a», «1-4a»): the buttons under the field show the number of hits (the rides stand under «Trips»);
  // the rides are cut at first, «Show all» shows every one
  const kinds = res.locator('[data-search-filters]');
  await expect(kinds).toBeVisible();
  await expect(kinds.locator('[data-search-filter="trips"] .cnt')).toContainText('6');
  await expect(res.locator('[data-show-all="ride"]')).toBeVisible();
  await res.locator('[data-show-all="ride"]').click();
  await expect(res.locator('.gh')).toHaveCount(1);
  await expect(res.getByRole('button', { name: /Hausrunde \d/ })).toHaveCount(6);
  // «All» brings the other kinds back; typing again starts over
  await kinds.locator('[data-search-filter="all"]').click();
  await expect(res).toContainText(T('Learnings'));
  // a typo: the app searches the close word and asks «Do you mean …?»; a tap puts the word in the field
  await f.fill('herbstrunbe');
  const mean = res.locator('[data-ks-mean]');
  await expect(mean).toBeVisible();
  await mean.click();
  await expect(f).toHaveValue('herbstrunde');
});

test('Search: a word that is not there finds nothing and offers nothing more', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: fixture() });
  const f = await openSearch(page);
  await f.fill('test_data_sm_ zzzqqq');
  await expect(page.getByRole('region', { name: T('Search results') })).toContainText(T('Nothing found for "{q}".', { q: 'test_data_sm_ zzzqqq' }));
});
