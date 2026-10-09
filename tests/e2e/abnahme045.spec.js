// v0.45.0: the acceptance follow-ups Noah approved after 0.44.1, and the two import page fixes.
// 3. Touch: small buttons ("Problem erfassen", "Bausteine →", "Auswählen") have 44 px tap areas.
// 4. Touch: the places on the bike drawing get an invisible 44 px tap area, never over each other.
// 5. Keyboard: after "Tour erstellen" the focus is on the new trip's name.
// 6. Gear category heads at 320 px: the count line under the name, the weight on the right.
// Import: after "Alle sicheren übernehmen" the line says "übernommen …"; an apply without anything
// new says "Nichts zu ergänzen: alle Teile waren schon vollständig.", Undo still works.
// Fictional fixture (pf-fixture.json, test_data_gtp_ names); nothing leaves the preview server.
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

async function load(page, context, info) {
  const file = info.outputPath('abnahme045.json');
  writeFileSync(file, fixture());
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
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'abnahme045.json' }))).toBeVisible();
  return data;
}

/** The real tap area (a stretched ::after counts): hit-tested from the centre outwards, in px (as abnahme044). */
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

test('3. touch: small buttons have 44 px tap areas', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'touch only');
  await load(page, context, info);
  await page.reload();
  const problem = page.getByRole('button', { name: T('Log a problem') }).first();
  await expect(problem).toBeVisible();
  expect((await tapArea(problem)).h).toBeGreaterThanOrEqual(44);
  await page.goto('./#/gear');
  await page.reload();
  const blocks = page.getByRole('link', { name: `${T('Building blocks')} →` });
  expect((await tapArea(blocks)).h).toBeGreaterThanOrEqual(44);
  const select = page.getByRole('button', { name: T('Select'), exact: true }).first();
  expect((await tapArea(select)).h).toBeGreaterThanOrEqual(44);
});

test('4. touch: the bike drawing places have 44 px tap areas that never overlap', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'touch only');
  await load(page, context, info);
  await page.goto(`./#/bikes?tab=setup&bike=${P}gravel`);
  await page.reload();
  const spots = page.locator('.drawing .spot');
  await expect(spots.first()).toBeVisible();
  const res = await spots.evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect();
    const a = getComputedStyle(el, '::after');
    const px = (v) => parseFloat(v) || 0;
    const bw = px(getComputedStyle(el).borderLeftWidth);
    // the ::after box in the page (its insets are measured from the padding box)
    const area = { x1: r.left + bw + px(a.left), y1: r.top + bw + px(a.top), x2: r.right - bw - px(a.right), y2: r.bottom - bw - px(a.bottom) };
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { w: r.width, h: r.height, area, self: hit === el || el.contains(hit) };
  }));
  expect(res.length).toBeGreaterThan(3);
  expect(res.every((s) => s.self), 'each place answers its own centre').toBe(true);
  // the list below the drawing stays
  await expect(page.locator('.drawing').locator('xpath=following::*[self::ul or self::ol][1]')).toHaveCount(1);
  const small = res.filter((s) => s.w < 44 || s.h < 44);
  expect(small.length, 'the drawing has small places on a phone').toBeGreaterThan(0);
  expect(small.some((s) => s.area.x2 - s.area.x1 >= 43.5 && s.area.y2 - s.area.y1 >= 43.5), 'a small place with room around it reaches 44 × 44').toBe(true);
  for (let i = 0; i < res.length; i++) {
    for (let j = i + 1; j < res.length; j++) {
      const a = res[i].area;
      const b = res[j].area;
      const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
      const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
      expect(ox > 0.5 && oy > 0.5, `tap areas ${i} and ${j} overlap`).toBe(false);
    }
  }
});

test('5. keyboard: after Create trip the focus is on the new trip name', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'keyboard on the desktop');
  await load(page, context, info);
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  const title = `${P}Fokus Runde`;
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByRole('button', { name: T('Create trip') }).focus();
  await page.keyboard.press('Enter');
  await expect(dlg).toBeHidden();
  const head = page.locator('[data-trip-title]');
  await expect(head).toContainText(title);
  await expect(head).toBeFocused();
});

test('6. gear category heads at 320 px: two lines, count under the name, weight on the right', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await load(page, context, info);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('./#/gear');
  await page.reload();
  const heads = page.locator('h2.ch button');
  await expect(heads.first()).toBeVisible();
  const n = await heads.count();
  for (let i = 0; i < n; i++) {
    const g = await heads.nth(i).evaluate((b) => {
      const box = (s) => b.querySelector(s).getBoundingClientRect();
      return { b: b.getBoundingClientRect(), title: box('.title'), k: box('.k'), m: box('.m') };
    });
    expect(g.m.top, 'count under the name').toBeGreaterThanOrEqual(g.title.bottom - 2);
    expect(Math.abs(g.k.top + g.k.height / 2 - (g.title.top + g.title.height / 2)), 'weight on the name row').toBeLessThan(14);
    expect(g.k.right, 'weight on the right').toBeGreaterThan(g.b.right - 60);
    expect(g.b.height, 'at most about two lines').toBeLessThanOrEqual(72);
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('import: the status line after an apply, and an apply that adds nothing says so', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'one is enough');
  await load(page, context, info);
  const file = info.outputPath('test_data_gtp_import045.json');
  writeFileSync(file, JSON.stringify({
    kind: 'gear-import',
    version: 1,
    created: '2026-10-09',
    items: [{ sourceId: 'GTP9001', mergedIds: [], category: 'onbike', name: `${P}Import Socken`, qty: 1, areas: ['Velo'], zone: 'feet', layer: 'accessory', tempMin: 5, tempMax: 15, tempClass: '', owned: true, optional: false, rule: '', notes: '', weightG: 50 }],
    kits: [{ id: 'K9', name: `${P}Kit Socken`, minC: 5, maxC: 15, items: ['GTP9001'], note: '' }],
  }));
  const stage = async () => {
    await page.goto('./');
    const panel = page.locator('details.data');
    await expect(async () => {
      if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
      expect(await panel.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    await panel.locator('input[type=file]').setInputFiles(file);
    await panel.getByRole('dialog', { name: T('Check import') }).getByRole('link', { name: T('Check import') }).click();
    await expect(page).toHaveURL(/#\/gear\/import$/);
  };
  await stage();
  const line = page.locator('[data-applied]');
  await expect(line).toHaveText(T('nothing applied yet'));
  await page.getByRole('button', { name: T('Apply all safe ones') }).click();
  const applied = T('applied {when}').replace('{when}', '').trim();
  await expect(line).toContainText(applied);
  await expect(line).not.toContainText(T('nothing applied yet'));
  // The same file again: everything is there already.
  await stage();
  await expect(line).toHaveText(T('nothing applied yet'));
  await page.getByRole('button', { name: T('Apply all safe ones') }).click();
  await expect(page.locator('[data-nothing]')).toHaveText(T('Nothing to add: all items were already complete.'));
  await expect(page.locator('.done')).not.toContainText(T('{enriched} completed, {added} new, {learn} learnings. A backup was made first.', { enriched: 0, added: 0, learn: 0 }));
  await expect(line).toContainText(applied);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.getByText(T('Undone: everything is as before the import. The list waits here again.'))).toBeVisible();
  await expect(line).toHaveText(T('nothing applied yet'));
});
