// Klick-Rundgang 2 (Noah 27.10.2026 «3 und dann 1»): the button scan found small symbol buttons and list ticks under 44 px on the
// phone. They keep their look and get an invisible 44 px tap area (src/lib/ui/touch.css); the sort arrows are
// at least 24 px high on a computer. The real tap area is hit-tested from the centre outwards.
// Fictional fixture (tests/e2e/pf-fixture.json, test_data_gtp_ names); nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const fixture = () => RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`);

async function load(page, context, info, edit = (d) => d) {
  const file = info.outputPath('tippflaechen.json');
  writeFileSync(file, JSON.stringify(edit(JSON.parse(fixture()))));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
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
    return { w: Math.max(r.width, lf + rt + 1), h: Math.max(r.height, up + dn + 1), bw: r.width, bh: r.height };
  });

test('phone: the favourite star in Material has a 44 px tap area and looks as before', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await load(page, context, info);
  await page.goto('./#/gear');
  // the wish list (tab «Einkauf») has a star on every row
  await page.getByRole('link', { name: T('Shopping|tab'), exact: true }).or(page.getByRole('tab', { name: T('Shopping|tab'), exact: true })).first().click();
  const star = page.getByRole('button', { name: T('Mark as favourite') }).first();
  await expect(star).toBeVisible();
  const a = await tapArea(star);
  expect(a.bh, 'the star keeps its size').toBeLessThan(44);
  expect(Math.min(a.w, a.h)).toBeGreaterThanOrEqual(44);
  // a tap at the edge of the area still sets the favourite
  const box = await star.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2 + 20);
  await expect(page.getByRole('button', { name: T('Remove from favourites') }).first()).toBeVisible();
});

test('computer: the sort arrows are at least 24 px high', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop only');
  await load(page, context, info);
  await page.goto('./#/me/look');
  const up = page.locator('.sort-ar').first();
  await expect(up).toBeVisible();
  const box = await up.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(24);
});

test('phone: a list row tick has a 44 px tap area, the row keeps its height', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  // two fictional items as supplies, so Material › Vorrat shows its list
  await load(page, context, info, (d) => {
    d.tables.items.slice(0, 2).forEach((i) => (i.consumable = true));
    return d;
  });
  await page.goto('./#/gear/supplies');
  const row = page.locator('.lt-row').first();
  await expect(row).toBeVisible();
  const box = page.locator('.lt-row input[type="checkbox"]').first();
  const a = await tapArea(page.locator('.lt-row .lt-cb').first());
  expect(Math.min(a.w, a.h)).toBeGreaterThanOrEqual(44);
  expect((await row.boundingBox()).height).toBeLessThan(80);
  // a tap 18 px under the tick still ticks it
  const b = await box.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2 + 18);
  await expect(box).toBeChecked();
});
