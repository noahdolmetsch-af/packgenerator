// Impeccable 18.10.2026, Gruppe 1 «Heute und Touren» (Noah «alle a-d umsetzen»), with the fictional Gesamttest data:
// - Packen 1: with a block on the trip the card «Bausteine» is one line «Bausteine dabei: … · n weitere zur Wahl»
//   with «Bausteine ändern»; the bags start on the first screen of a phone.
// - Planen 1: under the step bar one core line («30 Teile in 5 Taschen · 4.5 kg mit Essen und Wasser · 7 Aufgaben
//   offen») and the jump marks Packliste, Aufgaben, Strecke, Wetter; a tap goes there.
// - Planen 2: «Bis zum Start» shows «2 überfällig» under the open box; a tap opens «Vor der Tour».
// German UI, Europe/Zurich, service workers blocked.
import { test, expect } from './clock.js';
import { settle, foldPageInfo } from './settle.js';
import { fixture, prepare, importBackup, view, tr, sideways } from './gesamttest/lib.js';

const T = tr('de');
const { summary } = fixture();
const TRIP = summary.tripIds;
const phone = (info) => info.project.name === 'phone';
// the bars at the thumb are fixed: a target is put in the middle of the screen first
const tap = async (loc, info) => {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return phone(info) ? loc.tap() : loc.click();
};

let state = null;
test.beforeAll(async ({ browser }, info) => {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport, timezoneId: 'Europe/Zurich', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await prepare(page, ctx, 'de');
  await page.goto('./');
  await importBackup(page, info, fixture().data, { lang: 'de' });
  await page.waitForTimeout(1500);
  state = info.outputPath('state.json');
  await ctx.storageState({ path: state, indexedDB: true });
  await ctx.close();
});

async function open(browser, info, trip, hash) {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, storageState: state, viewport: info.project.use.viewport, isMobile: phone(info), hasTouch: phone(info), timezoneId: 'Europe/Zurich', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = await prepare(page, ctx, 'de');
  await page.goto('./');
  await settle(page);
  await page.evaluate((t) => localStorage.setItem('pack.currentTrip', t), trip);
  await view(page, hash);
  return { ctx, page, errors };
}

test('Packen 1: the chosen blocks are one line; «Bausteine ändern» opens the card; the bags follow right after', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.tent, '#/pack?day');
  const card = page.getByRole('region', { name: T('Building blocks') });
  await expect(card).toHaveAttribute('data-blocks-folded', '');
  await expect(card.locator('.fon')).toContainText(T('Building blocks on the trip:'));
  await expect(card.locator('.fon')).toContainText(/\d+ weitere zur Wahl/);
  await expect(card.getByRole('group')).toHaveCount(0);
  // the first bag is on the first screen (above the bar at the thumb on a phone), once the card «Was hier
  // steht» and the tip of the day are folded (Paket A HT1–HT2, as in the other first-screen specs)
  await foldPageInfo(page);
  const bag = page.locator('#bags-h');
  const box = await bag.boundingBox();
  expect(box.y + box.height).toBeLessThan(info.project.use.viewport.height - (phone(info) ? 140 : 80));
  expect((await sideways(page)).wide).toEqual([]);
  // one tap opens the card unchanged
  await tap(card.getByRole('button', { name: T('Change building blocks') }), info);
  await expect(card.getByRole('group', { name: T('On the trip|blocks') })).toBeVisible();
  await expect(card.getByRole('group', { name: T('Add|blocks') })).toBeVisible();
  await expect(card.getByRole('heading', { name: T('Building blocks') })).toBeFocused();
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Planen 1 + 2: the core line with jump marks under the step bar; overdue tasks show at the top', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.event, '#/pack');
  const main = page.locator('main');
  const core = main.locator('[data-core-line]');
  await expect(core).toBeVisible();
  await expect(core).toContainText(/\d+ Teile: \d+ Tasche/); // UI-Test T7: places counted like the bike head
  await expect(core).toContainText(T('{kg} with food and water', { kg: '' }).trim());
  await expect(core).toContainText(/\d+ Aufgaben offen/);
  // right under the step bar, before the notice box
  const steps = await main.locator('.steps').first().boundingBox();
  const coreBox = await core.boundingBox();
  expect(coreBox.y).toBeGreaterThanOrEqual(steps.y + steps.height - 1);
  expect(coreBox.y - (steps.y + steps.height)).toBeLessThan(40);
  const nav = core.getByRole('navigation', { name: T('Jump to') });
  for (const k of ['Packing list|jump', 'Tasks|jump', 'Route|jump', 'Weather|jump']) await expect(nav.getByRole('button', { name: T(k), exact: true })).toBeVisible();
  expect((await sideways(page)).wide).toEqual([]);

  // «Packliste ↓» goes to the packing list
  await tap(nav.getByRole('button', { name: T('Packing list|jump'), exact: true }), info);
  await expect(main.getByRole('heading', { name: T('Packing list'), exact: true })).toBeInViewport();
  await expect(main.getByRole('heading', { name: T('Packing list'), exact: true })).toBeFocused();

  // Planen 2: «Bis zum Start» names what is overdue; a tap opens «Vor der Tour»
  await page.evaluate(() => window.scrollTo(0, 0));
  const es = main.getByRole('region', { name: T('Until the start') });
  const late = es.locator('[data-overdue]');
  await expect(late).toHaveText(/\d+ überfällig/);
  const before = main.locator('details.calm-extra', { has: page.getByText(T('Before the trip'), { exact: true }) });
  await expect(before).not.toHaveAttribute('open', '');
  await tap(es.getByRole('button', { name: /offen, \d+ überfällig: zeigen/ }), info);
  await expect(before).toHaveAttribute('open', '');
  await expect(before.locator('summary')).toBeInViewport();

  // «Aufgaben ↓» goes to the same list
  await page.evaluate(() => window.scrollTo(0, 0));
  await tap(nav.getByRole('button', { name: T('Tasks|jump'), exact: true }), info);
  await expect(before.locator('summary')).toBeInViewport();
  // «Strecke ↓» and «Wetter ↓»
  await page.evaluate(() => window.scrollTo(0, 0));
  await tap(nav.getByRole('button', { name: T('Route|jump'), exact: true }), info);
  await expect(main.locator('section.rc h2')).toBeFocused();
  await expect(main.locator('section.rc h2')).toBeInViewport();
  // the weather of the event (or, without a forecast, the trip conditions with the weather)
  await page.evaluate(() => window.scrollTo(0, 0));
  await tap(nav.getByRole('button', { name: T('Weather|jump'), exact: true }), info);
  const focused = page.locator(':focus');
  await expect(focused).toBeInViewport();
  await expect(focused).toContainText(/Wetter|Bedingungen|°C/);
  expect(errors).toEqual([]);
  await ctx.close();
});
