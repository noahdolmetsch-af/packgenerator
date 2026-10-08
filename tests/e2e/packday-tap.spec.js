// v0.30.1 (Noah's phone test of 0.29.2, B1 B3 B4 B6 B7 B10 E4): the Pack tab with real touch taps
// (the phone project has hasTouch and isMobile). Mouse clicks passed before while the phone failed:
// a double tap there is two clicks. Since v0.30.2 the rows keep their order while the bag is open.
// Fictional fixture plus test_data_gtp_ items; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const SHOTS = '/mnt/project-files/design/v0301/';

const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'other', weightG: 40, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'top', ownership: 'owned', role: 'standard', sets: [], kits: [], domains: ['bikepacking'], ...f });

async function start(page, context, info, extra = []) {
  const file = info.outputPath('packday-tap-fixture.json');
  const data = structuredClone(base);
  data.tables.items.push(...extra);
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert/)).toBeVisible();
  // A day ride in one tap (the Home button sends this event): a trip with the standard items.
  await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
  await expect(page.locator('.made-card')).toBeVisible();
}

async function packTab(page) {
  await page.locator('.trip-band nav a').filter({ hasText: T('Pack|stage') }).click();
  await expect(page.locator('.pd')).toBeVisible();
}

/** The one stored trip, straight from IndexedDB. */
const stored = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result[0]); };
    };
  }));
const packedOf = async (page, id) => (await stored(page)).entries.find((e) => e.itemId === id).packed;

const openBag = (page) => page.locator('.pd .pbag.cur');
const row = (page, name) => openBag(page).locator('button.it').filter({ hasText: name });
/** A finger on the screen at the middle of a row (it stays there while the rows move). */
async function spot(loc) {
  const b = await loc.boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
}

test.describe('Pack tab on a phone', () => {
  test.beforeEach(({}, info) => test.skip(!info.project.use.hasTouch, 'touch taps: phone project'));

  test('B4/B3: a quick double tap ticks once, a later tap unticks', async ({ page, context }, info) => {
    await start(page, context, info);
    await packTab(page);
    const [x, y] = await spot(row(page, 'Rain jacket'));
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(120);
    await page.touchscreen.tap(x, y); // the same spot: v0.30.2 rows stay put while the bag is open, so this is Rain jacket again
    await page.waitForTimeout(500);
    expect(await packedOf(page, 'RA01')).toBe(true);
    expect(await packedOf(page, 'RA02')).toBe(false);
    await expect(row(page, 'Rain jacket')).toHaveAttribute('aria-pressed', 'true');
    await expect(row(page, 'Arm warmers')).toHaveAttribute('aria-pressed', 'false');
    // B3: a deliberate tap later opens it again.
    await row(page, 'Rain jacket').tap();
    await expect.poll(() => packedOf(page, 'RA01')).toBe(false);
    await expect(row(page, 'Rain jacket')).toHaveAttribute('aria-pressed', 'false');
    // Two quick taps on two different rows both count.
    await page.waitForTimeout(450);
    await row(page, 'Arm warmers').tap();
    await page.waitForTimeout(120);
    await row(page, 'Rain jacket').tap();
    await expect.poll(async () => [await packedOf(page, 'RA01'), await packedOf(page, 'RA02')]).toEqual([true, true]);
  });

  test('B6: tick the last item and tap again at once: the bag stays open', async ({ page, context }, info) => {
    await start(page, context, info);
    await packTab(page);
    await row(page, 'Rain jacket').tap();
    await expect.poll(() => packedOf(page, 'RA01')).toBe(true);
    await page.waitForTimeout(450);
    // The last item, then the finger again on the same spot at once.
    const [x, y] = await spot(row(page, 'Arm warmers'));
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(100);
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(1200);
    await expect(openBag(page).locator('#pb-seat')).toBeVisible();
    expect(await packedOf(page, 'RA01')).toBe(true);
    expect(await packedOf(page, 'RA02')).toBe(true);

    // A touch anywhere in the bag during the wait calls the jump off too; then a later tap unticks.
    await row(page, 'Arm warmers').tap();
    await expect.poll(() => packedOf(page, 'RA02')).toBe(false);
    await page.waitForTimeout(450);
    await row(page, 'Arm warmers').tap();
    await openBag(page).locator('.packed-note').tap(); // the quiet line in the bag's foot, no button
    await page.waitForTimeout(1200);
    await expect(openBag(page).locator('#pb-seat')).toBeVisible();
    expect(await packedOf(page, 'RA02')).toBe(true);
    await row(page, 'Arm warmers').tap();
    await page.waitForTimeout(1200);
    await expect(openBag(page).locator('#pb-seat')).toBeVisible();
    expect(await packedOf(page, 'RA02')).toBe(false);
    await expect(page.locator('.pd p.sr[role=status]')).toHaveText(''); // no "packed, next" while it is not full

    // Left alone, a full bag still moves on by itself.
    await page.waitForTimeout(450);
    await row(page, 'Arm warmers').tap();
    await expect(openBag(page).locator('#pb-frame')).toBeVisible({ timeout: 3000 });
  });

  test('B7: Whole bag packed, then Undo: exactly as before', async ({ page, context }, info) => {
    await start(page, context, info);
    await packTab(page);
    await row(page, 'Rain jacket').tap();
    await expect.poll(() => packedOf(page, 'RA01')).toBe(true);
    const before = (await stored(page)).entries.map((e) => [e.itemId, !!e.packed]);
    await openBag(page).getByRole('button', { name: T('Whole bag packed') }).tap();
    // At once: the seat bag is done, the frame bag opens.
    await expect(openBag(page).locator('#pb-frame')).toBeVisible({ timeout: 300 });
    await expect(page.locator('.pd .pbag.done #pb-seat')).toBeVisible();
    expect(await packedOf(page, 'RA02')).toBe(true);

    await openBag(page).getByRole('button', { name: T('Undo') }).tap();
    await expect(openBag(page).locator('#pb-seat')).toBeVisible();
    await expect.poll(async () => (await stored(page)).entries.map((e) => [e.itemId, !!e.packed])).toEqual(before);
    await expect(row(page, 'Rain jacket')).toHaveAttribute('aria-pressed', 'true');
    await expect(row(page, 'Arm warmers')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.pd p.sr[role=status]')).toHaveText('');
    // and it stays so (no late jump)
    await page.waitForTimeout(900);
    await expect(openBag(page).locator('#pb-seat')).toBeVisible();
  });

  test('B10: all packed shows a clear card with the next step', async ({ page, context }, info) => {
    await start(page, context, info);
    await packTab(page);
    await expect(page.locator('.pd .alldone')).toHaveCount(0);
    await page.getByRole('button', { name: T('Everything is packed') }).tap();
    const card = page.locator('.pd .alldone');
    await expect(card.getByRole('heading', { name: T('Everything is in. Have a good ride!') })).toBeVisible();
    await expect(card).toBeInViewport();
    const go = card.getByRole('button', { name: T('Next: On the way') });
    await expect(go).toBeVisible();
    const box = await go.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
    try {
      mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}packday-alldone-${info.project.name}.png` });
    } catch { /* the design folder is only there on the build machine */ }
    await go.tap();
    await expect(page).toHaveURL(/#\/ride/);
  });
});

test('E4: no "not weighed" badge next to the green Day ride created card', async ({ page, context }, info) => {
  await start(page, context, info, [item('GT01', 'Riegel', { weightG: null, weightStatus: 'unknown' }), item('GT02', 'Gel', { weightG: null, weightStatus: 'unknown' })]);
  const badge = page.locator('.trip-band .badge');
  await expect(page.locator('.made-card')).toBeVisible();
  await expect(badge).toHaveCount(0);
  if (info.project.name === 'phone') {
    try {
      mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}dayride-created-phone.png` });
    } catch { /* see above */ }
  }
  // Closed, the honest weight hint is back in the band.
  await page.locator('.made-card').getByRole('button', { name: T('Close') }).click();
  await expect(badge).toHaveText(T('{n} not weighed', { n: 2 }));
});

test('B1: every item name on the Pack tab in the same face, size and weight', async ({ page, context }, info) => {
  await start(page, context, info, [
    item('GT10', 'Kettenöl', { weightG: null, weightStatus: 'unknown', note: 'eine Notiz' }),
    item('GT11', 'Riegel', { favorite: true, favNote: 'immer zwei', perHours: 1, maxQty: 4, category: 'food' }),
    item('GT12', 'Kabelbinder', { nameDe: 'test_data_gtp_ Kabelbinder Łódź' }),
  ]);
  await packTab(page);
  await page.locator('.pd .pbag:not(.cur) .bagh').filter({ hasText: T('Top tube bag') }).click();
  const rows = openBag(page).locator('button.it .nm');
  await expect(rows.filter({ hasText: 'Riegel' })).toContainText('× 2');
  const look = await rows.evaluateAll((els) => els.map((e) => {
    const c = getComputedStyle(e);
    const q = e.querySelector('.q');
    const cq = q && getComputedStyle(q);
    return { text: e.textContent, font: `${c.fontFamily} ${c.fontSize} ${c.fontWeight} ${c.fontStyle}`, q: cq ? `${cq.fontFamily} ${cq.fontSize} ${cq.fontWeight}` : null };
  }));
  expect(look.length).toBeGreaterThanOrEqual(5);
  const first = look[0].font;
  for (const r of look) {
    expect(r.font, r.text).toBe(first);
    if (r.q) expect(`${r.q} normal`, r.text).toBe(first);
  }
});
