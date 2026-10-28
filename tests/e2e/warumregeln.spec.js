// Paket P3 «Warum? und Regeln» (Noah 21.10.2026, mockups RG1, RG3, C): «Warum?» next to a row in Planen,
// Ich › So entscheidet die App (#/me/regeln: groups, search, a block rule off and on), «Meist vergessen» at
// the top of Packen. German UI, fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

const VEST = { id: 'CL90', name: 'test_data_gtp_ Windweste', category: 'clothing', weightG: 90, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], coldBelow: 12 };
const CREAM = { id: 'HY90', name: 'test_data_gtp_ Sonnencreme', category: 'hygiene', weightG: 50, qty: 1, weightStatus: 'measured', defaultBag: 'frame', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] };
const fixture = () => {
  const data = homeFixture();
  const T = data.tables;
  T.items.push(VEST, CREAM);
  const next = T.trips.find((x) => x.id === 'test_data_gtp_Herbstrunde');
  next.entries = [...next.entries, { itemId: VEST.id, slot: 'seat', qty: 1, packed: false, src: 'context' }];
  // two debriefs of bikepacking trips noted the sun cream missing, one a spoon
  const a = T.debriefs.find((d) => d.tripId === 'test_data_gtp_Napf');
  const b = T.debriefs.find((d) => d.tripId === 'test_data_gtp_Jura');
  a.missing = [{ id: 'm1', name: 'test_data_gtp_ Sonnencreme' }, { id: 'm2', name: 'test_data_gtp_ Löffel' }];
  b.missing = [{ id: 'm3', name: 'test_data_gtp_ Sonnencreme' }];
  return data;
};
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Warum? in Planen: the rule behind a row and the way to all rules', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: fixture() });
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_Herbstrunde'));
  await page.goto('./#/pack');
  await expect(page.locator('section.bag-group').first()).toBeVisible();
  // open the bag that holds the vest
  const why = page.locator(`[data-why="${VEST.id}"]`);
  if (!(await why.isVisible())) {
    const bag = page.locator('section.bag-group').filter({ hasText: 'test_data_gtp_ Windweste' }).first();
    await bag.locator('.bag-heading').click();
  }
  await expect(why).toHaveText(T('Why?'));
  await why.click();
  const sheet = page.locator('[data-why-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-why-line]').first()).toContainText(T('Comes along when the lowest temperature of the trip is below {c} °C.', { c: '12' }));
  await expect(sheet.getByRole('link', { name: T('Change the limit') })).toHaveAttribute('href', `#/gear?item=${VEST.id}`);
  expect(await noSideScroll(page)).toBe(true);
  await sheet.locator('[data-why-all]').click();
  await expect(page).toHaveURL(/#\/me\/regeln$/);
  await expect(page.getByRole('heading', { name: T('How the app decides') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('So entscheidet die App: groups, search, a block rule off and on again', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: fixture() });
  // «Alles finden 2» (Noah 22.10.2026, changed on purpose): the rules row moved from Ich to «Hilfe und Funktionen»
  await page.goto('./#/features');
  await page.locator('[data-help-row="rules"]').click();
  await expect(page).toHaveURL(/#\/me\/regeln$/);
  for (const g of ['blocks', 'pack', 'power', 'ski']) await expect(page.locator(`[data-rule-group="${g}"]`)).toBeVisible();
  // the next trip (6–7 °C) is cool: the stage «hands and feet» of Kälte (below 8 °C) fits now
  const blocks = page.locator('[data-rule-group="blocks"]');
  await expect(blocks).not.toHaveAttribute('open', '');
  await blocks.locator('summary').click();
  const cold = page.locator('[data-rule="b.coldHands"]');
  await expect(cold.locator('[data-rule-active]')).toHaveText(T('fits now'));
  // search
  await page.locator('[data-rule-search]').fill('Felle');
  await expect(page.locator('[data-rule]')).toHaveCount(1);
  await expect(page.locator('[data-rule="s.wax"]')).toBeVisible();
  await page.locator('[data-rule-search]').fill('');
  // off and on again
  const sw = cold.locator('[data-rule-toggle]');
  await expect(sw).toHaveAttribute('aria-pressed', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-pressed', 'false');
  await expect(cold).toContainText(T('Suggestion off'));
  await expect(cold.locator('[data-rule-active]')).toHaveCount(0);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-pressed', 'true');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Meist vergessen at the top of Packen: onto the list, pin, take out with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: fixture() });
  await page.goto('./#/pack?day');
  const card = page.locator('[data-forgot]');
  await expect(card.getByRole('heading', { name: T('Most often forgotten') })).toBeVisible();
  const rows = card.locator('[data-forgot-row]');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toHaveAttribute('data-forgot-row', 'test_data_gtp_ Sonnencreme');
  // the cream is in Gear: one tap puts it on the list
  await rows.first().locator('[data-forgot-add]').click();
  await expect(rows.first()).toContainText(T('on the list'));
  // the spoon is not in Gear: it goes into the evening-before check
  const spoon = card.locator('[data-forgot-row="test_data_gtp_ Löffel"]');
  await spoon.locator('[data-forgot-check]').click();
  await expect(spoon).toContainText(T('in the evening-before check'));
  // pin moves it on top
  await spoon.locator('[data-forgot-pin]').click();
  await expect(rows.first()).toHaveAttribute('data-forgot-row', 'test_data_gtp_ Löffel');
  // take out, then Undo
  await spoon.locator('[data-forgot-hide]').click();
  await expect(rows).toHaveCount(1);
  await card.locator('[data-forgot-undo]').click();
  await expect(rows).toHaveCount(2);
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});
