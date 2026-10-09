// v0.46.1 (Noah tested 0.45.2 on his Samsung phone, 9.10.2026): fictional data only (test_data_gtp_).
// 1. «Problem am Velo»: one dictated line with commas / «und» becomes single problems, shown before saving.
// 2. Bike care: the newest problems on top.
// 3. The priority of a problem changes on the phone in two taps (in the row), also through •••.
// 5. The search on the phone is a clean sheet under the top bar, × closes it.
// 6. The packing lists: Touren shows them (v0.46.3: no longer as rows in «Mehr», Noah found it untidy).
// 7. «Touren» opens an overview of all trips (#/trips), not the last trip at Packen.
// SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const BIKE = `${P}scale`;
const shots = process.env.SHOTS;
const shot = (page, info, name, full = false) => (shots ? page.screenshot({ path: `${shots}/${name}-${info.project.name}.png`, fullPage: full }) : null);

function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const rep = (id, task, logDate, priority, topic) => ({ id, area: 'Bike', bikeId: BIKE, subject: 'Scale', task, category: 'Repair', source: 'Problem', logDate, leadWeeks: null, priority, status: 'open', note: '', done: false, photo: null, topic, fix: 'self', part: null, dueDate: null, beforeRide: false });
  // Made oldest first: the saddle 5 days ago, the air yesterday, the chain today.
  fix.tables.maintenance.push(rep(9201, `${P}Sattel zu tief`, day(-5), 'medium', 'saddle'), rep(9202, `${P}Zu wenig Luft`, day(-1), 'medium', 'air'), rep(9203, `${P}Kette trocken`, day(0), 'low', 'chain'));
  const path = info.outputPath('v0461-fixture.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  const file = fixtureFile(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

const repairs = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('maintenance').objectStore('maintenance').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result.filter((x) => x.source === 'Problem')); };
    };
  }));
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('1: one dictated line becomes single problems, shown before saving', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/');
  await page.getByRole('button', { name: 'Neu', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('dialog', { name: 'Neu' }).getByRole('button', { name: /Problem am Velo/ }).click();
  const dlg = page.getByRole('dialog', { name: 'Problem am Velo' });
  await dlg.getByRole('button', { name: `${P} Scott Scale 940` }).click();
  await dlg.getByLabel('Was ist los? Ein Problem pro Zeile oder mit Komma getrennt').fill('zu wenig Luft, Sattel zu tief und Schaltung vorne aufladen, Kette kaputt, ersetzen');
  const preview = dlg.locator('#pf-split');
  await expect(preview).toContainText('Wird als 4 Probleme gespeichert:');
  await expect(preview.getByRole('listitem')).toHaveText(['zu wenig Luft', 'Sattel zu tief', 'Schaltung vorne aufladen', 'Kette kaputt, ersetzen']);
  await dlg.getByRole('button', { name: 'Hoch', exact: true }).click();
  await shot(page, info, 'problem-split-after');
  expect(await noSideScroll(page)).toBe(true);
  await dlg.getByRole('button', { name: '4 Probleme speichern' }).click();
  await expect(dlg.getByText(`4 Probleme beim ${P} Scott Scale 940 gespeichert`)).toBeVisible();
  const mine = (await repairs(page)).filter((r) => r.id < 9201 || r.id > 9203);
  expect(mine.map((r) => [r.task, r.topic, r.fix])).toEqual([
    ['zu wenig Luft', 'air', 'self'],
    ['Sattel zu tief', 'saddle', 'self'],
    ['Schaltung vorne aufladen', 'battery', 'self'],
    ['Kette kaputt, ersetzen', 'chain', 'part'],
  ]);
  expect(errors).toEqual([]);
});

test('2 + 3: newest problems on top; the priority changes in two taps, also through the menu', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${BIKE}&open=1`);
  // v0.47.1 (Noah): the problems of all bikes stand in one flat list above the bikes.
  const care = page.locator('section.problems');
  const names = care.locator('li.prob .rn');
  await expect(names).toHaveText([`${P}Kette trocken`, `${P}Zu wenig Luft`, `${P}Sattel zu tief`]);
  await shot(page, info, 'care-after');

  // In the row: "Priorität: Mittel" → Hoch.
  const row = care.locator('li.prob').filter({ hasText: `${P}Zu wenig Luft` });
  await tap(row.getByRole('button', { name: 'Priorität: Mittel' }), info);
  const group = row.getByRole('group', { name: `Priorität: ${P}Zu wenig Luft` });
  await expect(group.getByRole('button', { name: 'Mittel' })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, info, 'priority-row-after');
  await tap(group.getByRole('button', { name: 'Hoch' }), info);
  await expect(row.getByRole('status')).toHaveText('✓ Priorität: Hoch');
  await expect.poll(async () => (await repairs(page)).find((r) => r.id === 9202)?.priority).toBe('high');
  await expect(row.getByRole('button', { name: 'Priorität: Hoch' })).toBeVisible();

  // Through ••• on the last problem, scrolled to just above the bottom bar: every answer can be tapped.
  const last = care.locator('li.prob').filter({ hasText: `${P}Sattel zu tief` });
  const summary = last.locator('details.more summary');
  await summary.evaluate((el) => {
    const bar = document.querySelector('nav.bottom')?.getBoundingClientRect();
    const floor = bar && bar.height ? bar.top : window.innerHeight;
    window.scrollBy(0, el.getBoundingClientRect().bottom - floor + 10);
  });
  await tap(summary, info);
  const hi = last.getByRole('button', { name: 'Priorität: Hoch' });
  await expect(hi).toBeVisible();
  await shot(page, info, 'priority-menu-after');
  for (const b of await last.locator('.more-in button').all()) {
    const free = await b.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && el.contains(hit) && r.top >= 0 && r.bottom <= window.innerHeight;
    });
    expect(free, await b.textContent()).toBe(true);
    if (info.project.name === 'phone') expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await tap(hi, info);
  await expect.poll(async () => (await repairs(page)).find((r) => r.id === 9201)?.priority).toBe('high');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('5: the search on the phone is a clean sheet under the top bar', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the sheet is the phone layout');
  const errors = await start(page, context, info);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./#/pack');
    await page.getByRole('button', { name: 'Alles durchsuchen' }).tap();
    const field = page.getByLabel('Was willst du tun? Suchen oder eine Aktion sagen');
    await expect(field).toBeFocused();
    const header = await page.locator('header.top').boundingBox();
    const box = await page.locator('.search .field').boundingBox();
    // The field sits under the top bar, never on it, and spans the width (16 px gutters).
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(box.x).toBeLessThanOrEqual(17);
    expect(box.x + box.width).toBeGreaterThanOrEqual(width - 17);
    if (width === 390) await shot(page, info, 'search-empty-after');
    await field.fill('we');
    const res = page.getByRole('region', { name: 'Suchergebnisse' });
    await expect(res).toBeVisible();
    const r = await res.boundingBox();
    expect(r.y).toBeGreaterThanOrEqual(box.y + box.height);
    if (width === 390) await shot(page, info, 'search-results-after');
    expect(await noSideScroll(page)).toBe(true);
    await page.getByRole('button', { name: 'Suche schliessen' }).tap();
    await expect(field).toBeHidden();
    await expect(page.getByRole('button', { name: 'Alles durchsuchen' })).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('6 (v0.46.3, Noah: "unschön"): More is calm again, no trip rows; the lists are under Touren', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/');
  await page.getByRole('button', { name: /^Mehr/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Mehr' });
  for (const g of ['Planen', 'Rückblick', 'Material', 'App']) await expect(sheet.getByRole('heading', { name: g, exact: true })).toBeVisible();
  await expect(sheet.getByRole('heading', { name: 'Packlisten', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: /Jura event/ })).toHaveCount(0);
  await expect(sheet.getByRole('link', { name: 'Vorlagen' })).toBeVisible();
  await expect(sheet.getByRole('link', { name: 'Vergangene Touren' })).toBeVisible();
  await shot(page, info, 'menu-calm-after');
  await sheet.getByRole('link', { name: 'Vorlagen' }).click();
  await expect(page).toHaveURL(/#\/pack\/templates/);
  // The packing list of a trip: Touren → its row.
  await page.goto('./#/trips');
  await expect(page.getByText(`${P} Jura event`).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('7: Touren opens the overview of all trips; a row opens its trip at the next step', async ({ page, context }, info) => {
  // Empty first: one sentence and «Erste Tour anlegen».
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { name: 'Touren', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Erste Tour anlegen' })).toBeVisible();
  const errors = await start(page, context, info);
  for (const width of info.project.name === 'phone' ? [320, 390] : [1440]) {
    if (info.project.name === 'phone') await page.setViewportSize({ width, height: 844 });
    await page.goto('./#/bikes');
    await tap(page.locator('nav[aria-label]').filter({ visible: true }).getByRole('link', { name: 'Touren' }), info);
    await expect(page).toHaveURL(/#\/trips$/);
    await expect(page.getByRole('heading', { name: 'Touren', level: 1 })).toBeVisible();
    await expect(page.getByText('Was jetzt?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Neue Tour' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([/In Planung/, /Rückblick offen/]);
    expect(await noSideScroll(page)).toBe(true);
    for (const b of await page.locator('.trips .go, .trips .btn.hi').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
    if (width !== 320) await shot(page, info, 'touren-after', true);
  }
  const go = page.getByRole('link', { name: `Weiter zu Packen: ${P} Jura event` });
  await tap(go, info);
  await expect(page).toHaveURL(/#\/pack\?day$/);
  await expect(page.locator('.trip-band h1')).toHaveText(`${P} Jura event`);
  expect(errors).toEqual([]);
});
