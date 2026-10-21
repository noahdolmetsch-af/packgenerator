// Paket P2 «Skitour» (Noah 21.10.2026 «1a 2b 3a 4a 5b»): Tour planen with the danger level and «Dein Morgen»,
// «Gipfel erreicht» on the way, Plan und echt after the tour, the season page (goal, wish tours with rename,
// arrows and delete with Undo, LVS practice, courses with «Auffrischen», metres per ski).
// German UI, fictional data (test_data_gtp_, Piz Beispiel, Muster-Gipfel); the clock stands on Saturday
// 12 December 2026, 09:00 (in season).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { DANGER_LEVELS, MORNING } from '../../src/lib/skiplan.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const D0 = '2026-12-12';
const day = (n) => new Date(Date.parse(`${D0}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const NEXT = 'test_data_gtp_skp_next';
const PAST = 'test_data_gtp_skp_past';
const SKI = { id: 'SKP1', name: 'Touring skis with skins', nameDe: 'Tourenski mit Fellen', category: 'tools', weightG: 3000, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['ski'] };
const packs = [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }];

function fixture(path) {
  const data = structuredClone(base);
  data.tables.items = [...data.tables.items, SKI];
  const entries = [{ itemId: SKI.id, slot: 'pack', qty: 1, packed: false }];
  data.tables.trips = [
    { id: NEXT, domain: 'ski', title: 'test_data_gtp_ Piz Beispiel', startDate: day(1), days: 1, bikeId: null, bike: null, setup: {}, packs, entries, ready: [], status: 'planned' },
    { id: PAST, domain: 'ski', title: 'test_data_gtp_ Muster-Gipfel', startDate: day(-6), days: 1, bikeId: null, bike: null, setup: {}, packs, entries, ready: [], status: 'planned', ski: { hm: 1100, skiItemId: SKI.id, savedAt: `${day(-6)}T18:00:00Z` } },
  ];
  data.tables.debriefs = [];
  data.tables.settings = [...(data.tables.settings ?? []), { key: 'ski.courses', value: [{ id: 'test_data_gtp_c1', name: 'test_data_gtp_ Lawinenkurs', day: '2024-01-10' }] }];
  writeFileSync(path, JSON.stringify(data));
}

async function open(page, context, info, hash = '#/ski') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+01:00`));
  const file = info.outputPath('skp-fixture.json');
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
const patchTrip = (page, id, patch) =>
  page.evaluate(
    async ([tid, p]) => {
      const req = indexedDB.open('pack-generator');
      const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
      const store = db.transaction('trips', 'readwrite').objectStore('trips');
      const cur = await new Promise((r) => (store.get(tid).onsuccess = (e) => r(e.target.result)));
      await new Promise((r) => (store.put({ ...cur, ...p, ski: { ...(cur.ski ?? {}), ...(p.ski ?? {}) } }).onsuccess = r));
      db.close();
    },
    [id, patch],
  );
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Tour planen: danger level with sub-level, the morning, the plan in numbers; the card shows it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.locator('[data-to="plan"]').click();
  await expect(page).toHaveURL(new RegExp(`#/ski/plan/${NEXT}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Plan the tour'));
  // five levels in the words of the bulletin; the app never picks one
  await expect(page.locator('[data-level]')).toHaveCount(DANGER_LEVELS.length);
  await expect(page.locator('[data-level][aria-pressed="true"]')).toHaveCount(0);
  await page.locator('[data-level="3"]').click();
  await expect(page.locator('[data-level-text]')).toHaveText(T(DANGER_LEVELS[2].text));
  await page.locator('[data-sub="+"]').click();
  await expect(page.locator('[data-sub="+"]')).toHaveAttribute('aria-pressed', 'true');
  // the morning: every field of MORNING, turnaround and last train shared with the start check
  await expect(page.locator('[data-time]')).toHaveCount(MORNING.length);
  for (const [key, time] of [['wakeAt', '05:40'], ['ascentAt', '08:00'], ['turnAt', '12:30']]) {
    await page.locator(`[data-time="${key}"]`).fill(time);
    await page.locator(`[data-time="${key}"]`).blur();
  }
  await page.locator('[data-f="hm"]').fill('1200');
  await page.locator('[data-f="hm"]').blur();
  await page.locator('[data-f="wind"]').fill('Nordwest');
  await page.locator('[data-f="wind"]').blur();
  await expect.poll(async () => (await trip(page, NEXT)).ski?.plan?.hm).toBe(1200);
  const ski = (await trip(page, NEXT)).ski;
  expect(ski.plan).toMatchObject({ level: 3, sub: '+', wakeAt: '05:40', ascentAt: '08:00', wind: 'Nordwest' });
  expect(ski.turnAt).toBe('12:30');
  expect(await noSideScroll(page)).toBe(true);
  // the next-tour card: the level and the first times of the morning
  await page.locator('[data-plan-done]').click();
  await expect(page).toHaveURL(/#\/ski$/);
  await expect(page.locator('[data-level-pill="3+"]')).toContainText(T('Danger {level}', { level: '3+' }));
  await expect(page.locator('[data-plan-line]')).toContainText(`${T('Get up')} 05:40`);
  // a tap on the chosen level again takes it away
  await page.goto(`./#/ski/plan/${NEXT}`);
  await page.locator('[data-level="3"]').click();
  await expect.poll(async () => (await trip(page, NEXT)).ski.plan.level).toBeNull();
  expect(errors).toEqual([]);
});

test('Gipfel erreicht on the way, then plan and reality after the tour', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await patchTrip(page, NEXT, { startDate: D0, ski: { startedAt: `${D0}T07:00:00Z`, turnAt: '13:00', plan: { peakPlanAt: '08:30', hm: 1200 } } });
  await page.reload();
  const way = page.locator('[data-under-way]');
  await way.locator('[data-peak]').click();
  await expect(way.locator('[data-peak-at]')).toContainText('09:00');
  expect((await trip(page, NEXT)).ski.peakAt).toBe('09:00');
  await page.goto(`./#/ski/after/${NEXT}`);
  await expect(page.locator('[data-pv="peak"]')).toContainText(T('plan {plan}, real {real}', { plan: '08:30', real: '09:00' }));
  await expect(page.locator('[data-pv="peak"]')).toContainText('+0:30');
  await page.getByLabel(T('Metres climbed'), { exact: true }).fill('1250');
  await expect(page.locator('[data-pv="hm"]')).toContainText('+50 m');
  await expect(page.locator('[data-after-gear]')).toContainText('Tourenski mit Fellen');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Saison: goal, wish tours (add, rename, arrows, tick, delete with Undo), practice, courses, metres per ski', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.locator('[data-row="season"]').click();
  await expect(page).toHaveURL(/#\/ski\/season$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Season {id}', { id: '2026/27' }));
  // the goal
  await page.locator('[data-goal="tours"]').fill('10');
  await page.locator('[data-goal="tours"]').blur();
  await expect(page.locator('[data-progress="tours"]')).toHaveText(T('{n} of {m}', { n: 1, m: 10 }));
  // wish tours
  const add = page.locator('[data-wish-new]');
  for (const name of ['Piz Probe', 'Muster-Gipfel']) {
    await add.fill(name);
    await add.press('Enter');
  }
  const wishes = page.locator('[data-wish]');
  await expect(wishes).toHaveCount(2);
  await page.getByRole('button', { name: T('Move {name} up', { name: 'Muster-Gipfel' }) }).click();
  await expect.poll(async () => (await setting(page, 'ski.wishes')).map((w) => w.name)).toEqual(['Muster-Gipfel', 'Piz Probe']);
  await page.getByRole('button', { name: T('Rename {name}', { name: 'Piz Probe' }) }).click();
  await page.locator('[data-wish="Piz Probe"] input').fill('Piz Neu');
  await page.locator('[data-wish="Piz Probe"] input').press('Enter');
  await expect(page.locator('[data-wish="Piz Neu"]')).toBeVisible();
  await page.locator('[data-wish="Piz Neu"]').getByRole('checkbox').click();
  await expect(page.locator('[data-wish="Piz Neu"]').getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: T('Delete {name}', { name: 'Muster-Gipfel' }) }).click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(wishes).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(wishes).toHaveCount(2);
  // transceiver practice and the course due for a refresh
  await page.locator('[data-lvs-note]').fill('zwei Verschüttete');
  await page.locator('[data-lvs-note]').press('Enter');
  await expect(page.locator(`[data-lvs="${D0}"]`)).toContainText('zwei Verschüttete');
  await expect(page.locator('[data-course="test_data_gtp_ Lawinenkurs"] [data-refresh]')).toHaveText(T('Refresh|course'));
  // the ski of the past tour with its metres; eight weeks of ski days
  await expect(page.locator(`[data-ski-hm="${SKI.id}"]`)).toContainText('Tourenski mit Fellen');
  await expect(page.locator(`[data-ski-hm="${SKI.id}"]`)).toContainText(/1.?100/);
  await expect(page.locator('.weeks .wk')).toHaveCount(8);
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});
