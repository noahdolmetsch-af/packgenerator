// v0.97.0 «Skitouren» (mockups A–E, Noah 11.10.2026): Touren › Skitouren, the Rucksack-Check in the five
// groups, the Start-Check with the turnaround time, «Nach der Tour» with a Strava ski tour and its learnings
// in the check, the Saison-Pflege with «Erledigt» and Undo. German UI, fictional data (test_data_gtp_,
// Piz Beispiel, Muster-Gipfel, Sam); the clock stands on Saturday 12 December 2026, 09:00 (in season).
// SKI_SHOTS=<folder> also saves the five pages as screenshots there (phone 390, computer 1440).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { SKI_GROUPS, START_CHECKS, CARE_TASKS } from '../../src/lib/ski.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const D0 = '2026-12-12';
// calendar days from D0 (noon UTC keeps the day in Zurich)
const day = (n) => new Date(Date.parse(`${D0}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const NEXT = 'test_data_gtp_ski_next';
const PAST = 'test_data_gtp_ski_past';
const SHOTS = process.env.SKI_SHOTS || '';

const ITEMS = [
  ['SK01', 'tools', 'Touring skis with skins', 'Tourenski mit Fellen'],
  ['SK02', 'elec', 'Avalanche transceiver', 'LVS-Gerät'],
  ['SK03', 'tools', 'Avalanche shovel', 'Lawinenschaufel'],
  ['SK04', 'rain', 'Hardshell jacket', 'Hardshell-Jacke'],
  ['SK05', 'onbike', 'Warm gloves', 'Handschuhe warm'],
  ['SK06', 'hyg', 'Ski goggles', 'Skibrille'],
  ['SK07', 'food', 'Thermos flask', 'Thermosflasche'],
].map(([id, category, name, nameDe]) => ({ id, name, nameDe, category, weightG: 500, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['ski'] }));
const entries = (packed) => ITEMS.map((i, k) => ({ itemId: i.id, slot: i.id === 'SK02' ? 'body' : 'pack', qty: 1, packed: k < packed }));
const packs = [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }];

function fixture(path) {
  const data = structuredClone(base);
  data.tables.items = [...data.tables.items, ...ITEMS];
  data.tables.trips = [
    // made before this release: its own ready list (the Start-Check adds the missing checks)
    { id: NEXT, domain: 'ski', title: 'test_data_gtp_ Piz Beispiel', startDate: day(1), days: 1, bikeId: null, bike: null, setup: {}, packs, entries: entries(3), ready: [{ id: 'lvs', label: 'Avalanche transceiver on and tested', done: false }, { id: 'bulletin', label: 'Avalanche bulletin read', done: false }, { id: 'skins', label: 'Skins, crampons, poles', done: true }], status: 'planned' },
    { id: PAST, domain: 'ski', title: 'test_data_gtp_ Muster-Gipfel', startDate: day(-6), days: 1, bikeId: null, bike: null, setup: {}, packs, entries: entries(7), ready: [], status: 'planned' },
  ];
  data.tables.debriefs = [];
  data.tables.settings = [
    ...(data.tables.settings ?? []),
    { key: 'ski.strava', value: [{ date: day(-6), time: `${day(-6)}T07:12:33Z`, type: 'Backcountry Ski', name: 'test_data_gtp_ Morning Backcountry Ski', hm: 1180, activeMin: 220, elapsedMin: 315, stravaId: 'test_data_gtp_101' }] },
    { key: 'ski.care', value: [{ id: 'test_data_gtp_c1', task: 'lvs', day: '2026-11-03', hm: 0, season: '2026/27' }] },
  ];
  writeFileSync(path, JSON.stringify(data));
}

async function open(page, context, info, hash = '#/ski') {
  page.on('dialog', (d) => d.accept());
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+01:00`));
  const file = info.outputPath('ski-fixture.json');
  fixture(file);
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto(`./${hash}`);
  await expect(page.locator('h1')).toHaveCount(1);
}

const table = (page, name) =>
  page.evaluate(async (n) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const tx = db.transaction(n).objectStore(n).getAll();
    const all = await new Promise((r) => (tx.onsuccess = () => r(tx.result)));
    db.close();
    return all;
  }, name);
const trip = async (page, id) => (await table(page, 'trips')).find((x) => x.id === id);
const setting = async (page, key) => (await table(page, 'settings')).find((x) => x.key === key)?.value;
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function shot(page, info, name) {
  if (!SHOTS) return;
  // the whole page in one picture: the window as tall as the page, so the bars sit at its ends
  const size = page.viewportSize();
  await page.evaluate(() => window.scrollTo(0, 0));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, height) });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await page.setViewportSize(size);
}

test('Skitouren page: the tab, the next tour with its check, three rows, more', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Ski tours'));
  await expect(page.locator('.ptabs a[aria-current="page"]')).toHaveText(T('Ski tours'));
  const card = page.getByRole('region', { name: T('Next ski tour') });
  await expect(card).toContainText('test_data_gtp_ Piz Beispiel');
  await expect(card.locator('.chk')).toContainText(T('{n} of {m}', { n: 3, m: 7 }));
  await expect(card.getByRole('link', { name: T('Open the backpack check') })).toHaveClass(/btn hi/);
  await expect(page.locator('main .btn.hi:visible')).toHaveCount(1);
  // the rows: Start-Check, Saison-Pflege with what is due (5 start tasks, the transceiver is done), Nach der Tour
  await expect(page.locator('[data-row="start"]')).toContainText(T('Start check at the car park'));
  await expect(page.locator('[data-row="care"] .pill')).toHaveText(T('{n} due', { n: 5 }));
  await expect(page.locator('[data-row="after"]')).toContainText(T('Last tour: {name}, not noted yet', { name: 'test_data_gtp_ Muster-Gipfel' }));
  // «Mehr» folded: the season and the building blocks
  await page.locator('details.more > summary').click();
  await expect(page.locator('.more-in')).toContainText(T('Season {id}', { id: '2026/27' }));
  await expect(page.locator('.more-in [data-to="blocks"]')).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  await page.locator('details.more > summary').click();
  await shot(page, info, 'A-Skitouren');
  // in season: the row in Aktiv › Heute leads here
  await page.goto('./#/flow');
  await page.locator('[data-to="ski"]').click();
  await expect(page).toHaveURL(/#\/ski$/);
  expect(errors).toEqual([]);
});

test('Rucksack-Check: the five groups in order, a tap packs, n of m counts', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.getByRole('link', { name: T('Open the backpack check') }).click();
  await expect(page).toHaveURL(new RegExp(`#/ski/check/${NEXT}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Backpack check'));
  const order = await page.locator('[data-group]').evaluateAll((els) => els.map((e) => e.dataset.group));
  expect(order.sort()).toEqual(SKI_GROUPS.map((g) => g.key).sort());
  // the order a phone shows them in (top to bottom) is Noah's order
  if (info.project.name === 'phone') {
    const tops = await page.locator('[data-group]').evaluateAll((els) => els.map((e) => [e.dataset.group, e.getBoundingClientRect().top]).sort((a, b) => a[1] - b[1]).map((x) => x[0]));
    expect(tops).toEqual(SKI_GROUPS.map((g) => g.key));
  } else {
    // three columns on a computer
    const xs = await page.locator('[data-group]').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().left))).size);
    expect(xs).toBe(3);
  }
  await expect(page.locator('[data-group="safety"]')).toContainText('LVS-Gerät');
  await expect(page.locator('[data-group="safety"]')).toContainText('Lawinenschaufel');
  await expect(page.locator('[data-count]')).toHaveText(T('{n} of {m}', { n: 3, m: 7 }));
  const goggles = page.locator('[data-item="SK06"]');
  await expect(goggles).toHaveAttribute('aria-checked', 'false');
  await goggles.click();
  await expect(goggles).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-count]')).toHaveText(T('{n} of {m}', { n: 4, m: 7 }));
  await expect.poll(async () => (await trip(page, NEXT)).entries.find((e) => e.itemId === 'SK06').packed).toBe(true);
  expect(await noSideScroll(page)).toBe(true);
  await shot(page, info, 'B-Rucksack-Check');
  await goggles.click();
  await expect.poll(async () => (await trip(page, NEXT)).entries.find((e) => e.itemId === 'SK06').packed).toBe(false);
});

test('Start-Check: five checks, the missing ones added, the turnaround time and its notice on the day', async ({ page, context }, info) => {
  await open(page, context, info, `#/ski/start/${NEXT}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Start check'));
  await expect(page.locator('[data-check]')).toHaveCount(5);
  // the trip keeps its own list and gets the missing checks (none taken away)
  await expect.poll(async () => (await trip(page, NEXT)).ready.map((r) => r.id)).toEqual(['lvs', 'bulletin', 'skins', ...START_CHECKS.map((c) => c.id).filter((id) => !['lvs', 'bulletin'].includes(id))]);
  const lvs = page.locator('[data-check="lvs"] [role="checkbox"]');
  await lvs.click();
  await expect(lvs).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-check="bulletin"] a')).toHaveAttribute('href', 'https://www.slf.ch');
  await page.getByRole('group', { name: T('Turnaround time') }).getByRole('button', { name: '13:00' }).click();
  await expect(page.locator('[data-check="turn"] [role="checkbox"]')).toHaveAttribute('aria-checked', 'true');
  const go = page.locator('main .btn.hi');
  await expect(go).toHaveText(T("Let's go · turn around at {time}", { time: '13:00' }));
  await expect.poll(async () => (await trip(page, NEXT)).ski?.turnAt).toBe('13:00');
  expect(await noSideScroll(page)).toBe(true);
  await shot(page, info, 'C-Start-Check');
  await go.click();
  await expect(page).toHaveURL(/#\/ski$/);
  await expect(page.locator('[data-ski-turn]')).toHaveCount(0);
  // on the tour's day at 14:00 the turnaround time shows as a notice in the app, until «OK»
  await page.clock.setFixedTime(new Date(`${day(1)}T14:00:00+01:00`));
  await page.reload();
  const notice = page.locator('[data-ski-turn]');
  await expect(notice).toContainText('13:00');
  await notice.getByRole('button').click();
  await expect(notice).toHaveCount(0);
});

test('Nach der Tour: Strava fills it in, «Speichern» makes learnings that show in the check', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.locator('[data-row="after"]').click();
  await expect(page).toHaveURL(new RegExp(`#/ski/after/${PAST}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('After the tour'));
  await expect(page.locator('[data-strava]')).toHaveText(T('taken from Strava · everything changeable'));
  await expect(page.getByLabel(T('Metres climbed'))).toHaveValue('1180');
  await expect(page.getByLabel(T('Time moving'))).toHaveValue('3:40');
  await expect(page.getByLabel(T('Time elapsed'))).toHaveValue('5:15');
  await page.getByLabel(T('Peak')).fill('Muster-Gipfel');
  await page.getByLabel(T('Place / start')).fill('Beispieltal');
  await page.getByLabel(T('Ski and skins')).selectOption('SK01');
  await page.getByRole('button', { name: T('Person') }).click();
  await page.getByLabel(T('Name'), { exact: true }).fill('Sam');
  await page.getByLabel(T('Name'), { exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'Sam' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: T('too warm on the way up') }).click();
  await page.getByLabel(T('Learning and notable things')).fill('Harscheisen ab 2200 m nötig');
  expect(await noSideScroll(page)).toBe(true);
  await shot(page, info, 'E-Nach-der-Tour');
  await page.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(page).toHaveURL(/#\/ski$/);
  await expect.poll(async () => (await trip(page, PAST)).ski).toMatchObject({ peak: 'Muster-Gipfel', place: 'Beispieltal', hm: 1180, skiItemId: 'SK01', activeMin: 220, elapsedMin: 315, with: ['Sam'], changeTags: ['too warm on the way up'] });
  const ls = (await table(page, 'learnings')).filter((l) => l.area === 'ski');
  expect(ls.map((l) => [l.rule, l.skiGroup])).toEqual([[T('too warm on the way up'), 'clothing'], ['Harscheisen ab 2200 m nötig', 'hardware']]);
  // the season counts it; the learnings stand in the check under their group
  await expect(page.locator('.sk-sub')).toContainText('1’180');
  await page.goto(`./#/ski/check/${NEXT}`);
  await expect(page.locator('[data-group="clothing"] [data-tip]')).toHaveText(T('too warm on the way up'));
  await expect(page.locator('[data-group="hardware"] [data-tip]')).toHaveText('Harscheisen ab 2200 m nötig');
});

test('Saison-Pflege: three phases, «Erledigt» keeps day and metres, Undo takes it back', async ({ page, context }, info) => {
  await open(page, context, info, '#/ski/care');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Season care'));
  await expect(page.locator('[data-phase]')).toHaveCount(3);
  await expect(page.locator('[data-task]')).toHaveCount(CARE_TASKS.length);
  await expect(page.locator('[data-task="lvs"] [role="checkbox"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-task="skins"] .pill')).toHaveText(T('due|care'));
  expect(await noSideScroll(page)).toBe(true);
  await shot(page, info, 'D-Saison-Pflege');
  await page.locator('[data-task="skins"] [role="checkbox"]').click();
  await expect(page.locator('[data-task="skins"] [role="checkbox"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-task="skins"] .pill')).toHaveCount(0);
  await expect.poll(async () => (await setting(page, 'ski.care')).filter((e) => e.task === 'skins').map((e) => [e.day, e.hm, e.season])).toEqual([[D0, 0, '2026/27']]);
  await page.locator('.sk-notice button').click();
  await expect.poll(async () => (await setting(page, 'ski.care')).filter((e) => e.task === 'skins').length).toBe(0);
  await expect(page.locator('[data-task="skins"] [role="checkbox"]')).toHaveAttribute('aria-checked', 'false');
});
