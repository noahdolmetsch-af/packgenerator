// «Rennen detailliert planen» + «Rennen-Check» (Noah 27.10.2026 «1b 2b»): the coming races with their check,
// the sheets that save by themselves and answers loaded from a file. Fictional data (sample race, made-up answers).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';
import { SHEETS, DAY_BEFORE } from '../../src/lib/race/check-lib.js';

const noSideways = async (page) => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d).toBeLessThanOrEqual(1);
};

test('Race check: the races page, the sheets that keep what you write, answers from a file', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  // a race to plan: the sample race
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  // Touren › «Rennen detailliert planen»
  await page.goto('./#/trips');
  await page.getByRole('link', { name: T('Plan races in detail') }).first().click();
  await expect(page).toHaveURL(/#\/racecheck$/);
  await expect(page.locator('h1')).toHaveText(T('Plan races in detail'));
  const row = page.locator('[data-racecheck-row="race-sample"]');
  await expect(row).toContainText(T('check not started'));
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('rennen-liste.png'), fullPage: true });

  await row.click();
  await expect(page).toHaveURL(/#\/racecheck\/race-sample$/);
  await expect(page.locator('[data-check-tab]')).toHaveCount(SHEETS.length);
  await expect(page.locator('[data-check-sheet="ablauf"]')).toBeVisible();
  await page.locator('[data-check-field="ablauf.race"]').fill('Hill race 300');
  await page.locator('[data-check-field="ablauf.q.outside"]').check();
  await page.locator('[data-check-tab="liste"]').click();
  await expect(page.locator('[data-check-sheet="liste"]')).toBeVisible();
  await page.locator('[data-check-field="liste.1.v"]').fill('1 light rain jacket');
  await page.locator('[data-check-tab="ablauf"]').click();
  await expect(page.locator('[data-check-field="ablauf.race"]')).toHaveValue('Hill race 300');
  await expect(page.locator('[data-check-field="ablauf.q.outside"]')).toBeChecked();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('rennen-check-blatt1.png'), fullPage: false });

  // after a reload everything is still there (saved in the race)
  await page.reload();
  await expect(page.locator('[data-check-field="ablauf.race"]')).toHaveValue('Hill race 300');

  // answers from the fillable sheets page, as a file
  const file = { name: 'antworten.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ values: { 'ablauf.B': 'Gravel bike, made up', 'nacht.0': 'Shop at the station, open until 21:00' } })) };
  await page.locator('[data-check-file]').setInputFiles(file);
  await expect(page.locator('[data-check-field="ablauf.B"]')).toHaveValue('Gravel bike, made up');
  await page.locator('[data-check-next]').click();
  await expect(page.locator('[data-check-sheet="setup"]')).toBeVisible();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('rennen-check-blatt2.png'), fullPage: false });
  await page.locator('[data-check-tab="nacht"]').click();
  await expect(page.locator('[data-check-field="nacht.0"]')).toHaveValue('Shop at the station, open until 21:00');

  // the list counts what is filled
  await page.goto('./#/racecheck');
  await expect(row).toContainText(T('check: {n} fields filled', { n: 4 }));
});

test('Race links: handbook, rules, tracker, website and own links', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  const box = page.locator('[data-race-links]');
  await expect(box).toContainText(T('Links to the race'));
  await box.locator('[data-race-link-kind="handbook"]').click();
  await expect(box.locator('[data-race-link-kind="handbook"]')).toHaveCount(0);
  await expect(box).toContainText(T('No address yet: tap to add it'));
  await box.locator('.rc-row-main').first().click();
  await page.locator('[data-race-link-url]').fill('https://example.org/handbook.pdf');
  await page.locator('[data-sheet-save]').click();
  await expect(box.locator('[data-race-link-open]')).toHaveAttribute('href', 'https://example.org/handbook.pdf');
  // an address typed as the name becomes the link
  await box.locator('[data-race-add="links"]').fill('www.example-race.org/live');
  await box.locator('[data-race-add="links"]').press('Enter');
  await expect(box.locator('[data-race-link-open]')).toHaveCount(2);
  await expect(box).toContainText('example-race.org');
  await noSideways(page);
  await box.screenshot({ path: info.outputPath('rennen-links.png') });
});

test('Finish time riding through: three answers that follow your numbers', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  const box = page.locator('[data-race-nonstop]');
  await box.locator('[data-nonstop-edit]').click();
  await box.locator('[data-nonstop-field="km"]').fill('300');
  await box.locator('[data-nonstop-field="km"]').press('Tab');
  await box.locator('[data-nonstop-field="gainM"]').fill('6500');
  await box.locator('[data-nonstop-field="gainM"]').press('Tab');
  await box.locator('[data-nonstop-field="start"]').fill('2027-05-04T06:00');
  await box.locator('[data-nonstop-field="start"]').press('Tab');
  await expect(box.locator('[data-nonstop]')).toHaveCount(3);
  const plan = box.locator('[data-nonstop="plan"] .ns-at');
  const before = await plan.textContent();
  await box.locator('[data-nonstop-field="flatKmh"]').fill('30');
  await box.locator('[data-nonstop-field="flatKmh"]').press('Tab');
  await expect(plan).not.toHaveText(before ?? '');
  await noSideways(page);
  await box.screenshot({ path: info.outputPath('rennen-zielzeit.png') });
});

test('Take over the check of another race into the empty fields', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  await page.locator('[data-check-field="ablauf.race"]').fill('Sample race');
  await page.locator('[data-check-field="ablauf.B"]').fill('Gravel bike, made up');
  await page.locator('[data-check-field="ablauf.B"]').blur();
  // a second race
  await page.goto('./#/race');
  await page.locator('[data-race-new]').click();
  await page.locator('[data-race-title]').fill('Hill race 300');
  await page.locator('[data-sheet-save]').click();
  await expect(page).toHaveURL(/#\/race\/[^/]+$/);
  const id = decodeURIComponent(page.url().split('#/race/')[1]);
  await page.goto(`./#/racecheck/${encodeURIComponent(id)}`);
  await expect(page.locator('[data-check-from]')).toBeVisible();
  await page.locator('[data-check-copy]').click();
  await expect(page.locator('[data-check-field="ablauf.B"]')).toHaveValue('Gravel bike, made up');
  await expect(page.locator('[data-check-field="ablauf.race"]')).toHaveValue('');
  await noSideways(page);
  await page.locator('[data-check-copy]').screenshot({ path: info.outputPath('rennen-uebernehmen.png') });
});

test('Learned in earlier races: the learnings of past races on top', async ({ page, context }, info) => {
  const data = homeFixture();
  const T0 = data.tables;
  const rigi = T0.trips.find((x) => x.id === 'test_data_gtp_Rigi');
  T0.settings.push({ key: 'races', value: { races: { test_data_gtp_Rigi: { createdAt: '2026-01-01T00:00:00.000Z' } } } });
  T0.learnings = [
    { id: 'test_data_gtp_l1', rule: 'test_data_gtp_ Buy food for the night before 18:00', action: 'Look at the shop hours at noon', topic: 'food', tripId: rigi.id, itemIds: [], appliesTo: ['all'], confirmed: 0, createdAt: '2026-04-10T10:00:00.000Z' },
    { id: 'test_data_gtp_l2', rule: 'test_data_gtp_ A head torch for the bivy', action: '', topic: 'race', itemIds: [], appliesTo: ['all'], confirmed: 0, createdAt: '2026-04-11T10:00:00.000Z' },
    { id: 'test_data_gtp_l3', rule: 'test_data_gtp_ Not about races', action: '', topic: 'clothes', itemIds: [], appliesTo: ['all'], confirmed: 0, createdAt: '2026-04-12T10:00:00.000Z' },
  ];
  const T = await openHome(page, context, info, { data });
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  const box = page.locator('[data-race-learnings]');
  await expect(box).toContainText(T('Learned in earlier races'));
  await expect(box.locator('[data-race-learning]')).toHaveCount(2);
  await expect(box.locator('[data-race-learning="test_data_gtp_l1"]')).toContainText('Look at the shop hours at noon');
  await expect(box).not.toContainText('Not about races');
  await noSideways(page);
  await box.screenshot({ path: info.outputPath('rennen-learnings.png') });
});

test('Weight of the setup: the grams of sheet 2 added up against the target', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  await page.locator('[data-check-tab="setup"]').click();
  const set = async (k, v) => {
    await page.locator(`[data-check-field="${k}"]`).fill(v);
    await page.locator(`[data-check-field="${k}"]`).blur();
  };
  await set('setup.0.g', '300');
  await set('setup.0.full', '1.4 kg');
  await set('setup.1.g', '2× 100');
  await set('setup.total', '1.5 kg');
  const box = page.locator('[data-check-weight]');
  // 300 g + 1.4 kg full, 200 g → 1.6 kg packed, 0.1 kg over 1.5 kg (Swiss number format)
  await expect(box.locator('[data-check-weight-full]')).toHaveText('1.6 kg');
  await expect(box.locator('[data-check-weight-over]')).toHaveText(T('{kg} over the target', { kg: '0.1 kg' }));
  await noSideways(page);
  await box.screenshot({ path: info.outputPath('rennen-gewicht.png') });
});

test('The day before the start: sheet 6, plan and tick off', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  await page.locator('[data-check-tab="vorher"]').click();
  const sheet = page.locator('[data-check-sheet="vorher"]');
  await expect(sheet).toContainText(T('The day before the start'));
  const done = page.locator('[data-check-daybefore-done]');
  await expect(done).toHaveText(T('{done} of {of} done', { done: 0, of: DAY_BEFORE.length }));
  await page.locator('[data-check-field="vorher.3.v"]').fill('Start 06:00, alarm 04:30');
  await page.locator('[data-check-field="vorher.3.v"]').blur();
  await page.locator('[data-check-field="vorher.0.done"]').check();
  await expect(done).toHaveText(T('{done} of {of} done', { done: 1, of: DAY_BEFORE.length }));
  await page.reload();
  await expect(page.locator('[data-check-field="vorher.3.v"]')).toHaveValue('Start 06:00, alarm 04:30');
  await expect(page.locator('[data-check-field="vorher.0.done"]')).toBeChecked();
  for (let i = 1; i < DAY_BEFORE.length; i++) await page.locator(`[data-check-field="vorher.${i}.done"]`).check();
  await expect(done).toHaveText(T('All done. Sleep well!'));
  await noSideways(page);
  await sheet.screenshot({ path: info.outputPath('rennen-tag-vorher.png') });
});

test('After the race: questions under every sheet, shown on top in the next race', async ({ page, context }, info) => {
  const data = homeFixture();
  const T0 = data.tables;
  const rigi = T0.trips.find((x) => x.id === 'test_data_gtp_Rigi');
  const values = { 'liste.after.missing': 'A second pair of gloves', 'liste.after.much': 'The down jacket' };
  T0.settings.push({ key: 'races', value: { races: { [rigi.id]: { createdAt: '2026-01-01T00:00:00.000Z', check: { values, at: '2026-04-12T10:00:00.000Z' } } } } });
  const T = await openHome(page, context, info, { data });
  // the past race: «After the race» is open on every sheet
  await page.goto(`./#/racecheck/${rigi.id}`);
  await page.locator('[data-check-tab="liste"]').click();
  const after = page.locator('[data-check-after]');
  await expect(after).toHaveAttribute('open', '');
  await expect(page.locator('[data-check-field="liste.after.missing"]')).toHaveValue('A second pair of gloves');
  await page.locator('[data-check-field="liste.after.change"]').fill('Pack the gloves in the frame bag');
  await page.locator('[data-check-field="liste.after.change"]').blur();
  await noSideways(page);
  await after.screenshot({ path: info.outputPath('rennen-nachher-fragen.png') });
  // the next race: on top of the same sheet
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/racecheck/race-sample');
  await page.locator('[data-check-tab="liste"]').click();
  const box = page.locator('[data-check-earlier]');
  await expect(box).toContainText(T('From your earlier races'));
  await expect(box.locator('[data-check-earlier-row]')).toHaveCount(3);
  await expect(box.locator('[data-check-earlier-row="change"]')).toContainText('Pack the gloves in the frame bag');
  await expect(box).toContainText(rigi.title);
  // not taken over as answers here
  await expect(page.locator('[data-check-field="liste.after.missing"]')).toHaveValue('');
  // another sheet has none
  await page.locator('[data-check-tab="nacht"]').click();
  await expect(page.locator('[data-check-earlier]')).toHaveCount(0);
  await page.locator('[data-check-tab="liste"]').click();
  await noSideways(page);
  await box.screenshot({ path: info.outputPath('rennen-nachher-oben.png') });
});

