// v0.44.1 (AP21/AP22, acceptance report 9.10.2026): the small fixes found in the acceptance run.
// 1. Phone search: Escape closes the field and the focus goes back to the magnifier.
// 2. Plan list: Escape closes an open row and the focus stays on its button.
// 3. Touch targets on a phone: gear category heads, "PG", "All ✓ / All –" in the debrief, the bike care link in Pack.
// 4. Import preview: one or many per count ("1 Tour", "1 Learning").
// Fictional fixture (tests/e2e/pf-fixture.json, test_data_gtp_ names); Open-Meteo mocked, nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const fixture = () => RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`);

async function start(page, context, info, text = fixture(), name = 'abnahme.json') {
  const file = info.outputPath(name);
  writeFileSync(file, text);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  return data;
}
async function load(page, context, info) {
  const data = await start(page, context, info);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'abnahme.json' }))).toBeVisible();
}

/** The real tap area (a stretched ::after counts): hit-tested from the centre outwards, in px. */
const tapArea = (loc) =>
  loc.evaluate((el) => {
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const mine = (x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
    let up = 0, dn = 0, lf = 0, rt = 0;
    while (up < 40 && mine(cx, cy - up - 1)) up++;
    while (dn < 40 && mine(cx, cy + dn + 1)) dn++;
    while (lf < 60 && mine(cx - lf - 1, cy)) lf++;
    while (rt < 60 && mine(cx + rt + 1, cy)) rt++;
    return { w: Math.max(r.width, lf + rt + 1), h: Math.max(r.height, up + dn + 1) };
  });

test('phone search: Escape closes the field and gives the focus back to the magnifier', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await load(page, context, info);
  const open = page.getByRole('button', { name: T('Search everything') });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') })).toBeFocused();
  await page.keyboard.type('Multi');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') })).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('plan list: Escape closes an open row and keeps the focus on its button', async ({ page, context }, info) => {
  await load(page, context, info);
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), `${P}event`);
  await page.goto('./#/pack');
  await page.reload();
  await page.locator('.calm-pack section.bag-group').first().waitFor();
  const heads = page.locator('.calm-pack .bag-heading[aria-expanded="false"]');
  for (let n = await heads.count(); n > 0; n--) await heads.first().click();
  const row = page.locator('.calm-pack .planning-row .row-main').first();
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  // into the open row (amount buttons), then Escape
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await expect(row).toBeFocused();
});

test('phone touch targets: gear category heads, PG, debrief All buttons, bike care link at least 44 px', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await load(page, context, info);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('./#/gear');
  await page.reload();
  const cat = page.locator('h2.ch button').first();
  await expect(cat).toBeVisible();
  expect((await cat.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const brand = page.locator('header a.brand');
  const b = await brand.boundingBox();
  expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44);
  // the debrief of the past trip: "All ✓" / "All –" per bag
  await page.goto(`./#/debrief/${P}past`);
  await page.reload();
  const items = page.locator('details.items-fold'); // folded on a phone
  await items.locator('summary').click();
  const all = page.getByRole('button', { name: /^Alles gebraucht: / }).first();
  await expect(all).toBeVisible();
  const a = await tapArea(all);
  expect(Math.min(a.w, a.h)).toBeGreaterThanOrEqual(44);
  const none = page.getByRole('button', { name: /^Nichts gebraucht: / }).first();
  const n = await tapArea(none);
  expect(Math.min(n.w, n.h)).toBeGreaterThanOrEqual(44);
  // Pack, event trip: "More options in Bike care" in "Before the trip"
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), `${P}event`);
  await page.goto('./#/pack');
  await page.reload();
  const fold = page.locator('.calm-extra').filter({ has: page.locator('summary', { hasText: T('Before the trip') }) }).first();
  if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
  const link = page.getByRole('link', { name: T('More options in Bike care') });
  await expect(link).toBeVisible();
  const l = await tapArea(link);
  expect(l.h).toBeGreaterThanOrEqual(44);
});

test.describe('with the service worker', () => {
  test.use({ serviceWorkers: 'allow' });
  test('offline after a reload: the app opens with its own font and keeps a change', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'phone only');
    await load(page, context, info);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    await page.goto('./#/gear');
    await page.reload();
    await page.getByRole('searchbox', { name: T('Search gear') }).fill('Multitool');
    const font = () => page.evaluate(async () => {
      try {
        const faces = await document.fonts.load('600 16px "Fira Sans"', 'Ä');
        return faces.length > 0 && faces.every((f) => f.status === 'loaded');
      } catch {
        return false;
      }
    });
    expect(await font(), 'Fira Sans loads offline').toBe(true);
    await page.getByRole('button', { name: T('Mark as favourite') }).first().click();
    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.getByRole('searchbox', { name: T('Search gear') })).toBeVisible();
    const fav = await page.evaluate(() => new Promise((ok) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => { const q = r.result.transaction('items').objectStore('items').get('test_data_gtp_WZ01'); q.onsuccess = () => ok(q.result?.favorite); };
    }));
    expect(fav, 'the star set offline is kept after a reload').toBe(true);
    await context.setOffline(false);
  });
});

test('import preview says 1 trip and 1 learning in the singular', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'one is enough');
  const data = JSON.parse(fixture());
  data.tables.trips = data.tables.trips.slice(0, 1);
  const panel = await start(page, context, info, JSON.stringify(data), 'test_data_gtp_one.json');
  const confirm = page.getByRole('dialog', { name: T('Import backup') });
  await expect(confirm).toContainText(`enthält ${data.tables.items.length} Ausrüstungsteile, 1 Tour und 1 Learning.`);
  await confirm.getByRole('button', { name: T('Cancel') }).click();
  await expect(panel.getByRole('dialog', { name: T('Import backup') })).toHaveCount(0);
});
