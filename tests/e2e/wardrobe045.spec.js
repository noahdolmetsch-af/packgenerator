// v0.45.0 "Kleiderschrank 2", German UI, phone and desktop: warm to cold within a zone, a gap row
// with "Auf die Wunschliste" (and Undo), the learned offset in the header with "Zurücksetzen" (and
// Undo), Alltag-only clothes only under Alltag, a photo per piece, "Als Kit speichern …" from today's
// suggestion, and "Was ziehe ich heute an?" on Today (with and without a home place).
// Fictional data only (fixture.json + test_data_gtp_ clothes made here); every outside request is
// blocked, the home forecast is written into the app's database. Service workers are blocked
// (playwright.config.js). V045_SHOTS=<folder> saves the screenshots of the new screens there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const P = 'test_data_gtp_';
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const PLACE = { name: `${P}Testdorf, Testland`, lat: 46.5, lon: 7.5 };
const SHOTS = process.env.V045_SHOTS;
// A 2 × 2 px PNG, made up here.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGNwaDgARAwQCgAoDgYBQzpj2gAAAABJRU5ErkJggg==', 'base64');

const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('KL41', 'Kurzarmtrikot', { layer: 'base', zone: 'torso', tempMin: 15, tempMax: 30 }),
  cloth('KL42', 'Merino Langarm', { layer: 'base', zone: 'torso', tempMin: 0, tempMax: 15 }),
  cloth('KL43', 'Netzunterhemd', { layer: 'base', zone: 'torso' }),
  cloth('KL44', 'Thermotrikot', { layer: 'mid', zone: 'torso', tempMin: -5, tempMax: 10 }),
  cloth('KL45', 'Winterjacke', { layer: 'outer', zone: 'torso', tempMin: -10, tempMax: 8, rain: 'rain' }),
  cloth('KL46', 'Traegerhose kurz', { layer: 'base', zone: 'legs', tempMin: 12, tempMax: 30 }),
  cloth('KL47', 'Winterhose', { layer: 'mid', zone: 'legs', tempMin: -5, tempMax: 10 }),
  cloth('KL48', 'Langfingerhandschuhe', { layer: 'accessory', zone: 'hands', tempMin: 4, tempMax: 14 }),
  cloth('KL49', 'Wintermuetze', { layer: 'accessory', zone: 'head', tempMin: -5, tempMax: 10 }),
  cloth('KL50', 'Ueberschuhe', { layer: 'accessory', zone: 'feet', tempMin: -5, tempMax: 8 }),
  cloth('KL51', 'Buerohemd', { layer: 'base', zone: 'torso', tempMin: 10, tempMax: 25, domains: ['everyday'] }),
];

function fixture({ home = true } = {}) {
  const data = structuredClone(base);
  data.tables.items.push(...CLOTHES);
  data.tables.settings.push(MARK, { key: 'clothing.offset', value: 2, at: '2026-10-01T08:00:00.000Z' }, ...(home ? [{ key: 'homePlace', value: PLACE }] : []));
  return data;
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

/** The home forecast as the app saves it (meta "homeForecast"): today and tomorrow, 6 °C all day. */
const writeForecast = (page) =>
  page.evaluate((place) => new Promise((ok) => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
    const hourly = { t: Array(24).fill(6), p: Array(24).fill(10) };
    const rec = { key: 'homeForecast', fetchedAt: new Date().toISOString(), place, days: [0, 1].map((n) => ({ date: day(n), min: 6, max: 6, rainMm: 0, rainPct: 10, hourly })) };
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('meta', 'readwrite');
      tx.objectStore('meta').put(rec);
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), PLACE);

async function start(page, context, info, opts) {
  const file = info.outputPath('test_data_gtp_base.json');
  writeFileSync(file, JSON.stringify(fixture(opts)));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  return errors;
}

async function noSideScroll(page) {
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  await page.setViewportSize(size);
}

async function shot(page, info, name, loc = null) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const size = page.viewportSize();
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(() => document.fonts.ready);
  const file = `${SHOTS}/${name}-${info.project.name === 'desktop' ? 'desktop-1366' : 'phone-390'}.png`;
  if (loc) {
    await loc.scrollIntoViewIfNeeded();
    await page.screenshot({ path: file });
  } else await page.screenshot({ path: file, fullPage: true });
  await page.setViewportSize(size);
}

const wardrobeUrl = async (page) => {
  await page.goto('./#/wardrobe');
  await expect(page.getByRole('heading', { level: 1, name: T('Wardrobe') })).toBeVisible();
};
const layer = (page, name) => page.locator('section.layer', { has: page.locator('h2', { hasText: T(name) }) });

test('Kleiderschrank 2: order, gap to wishlist, offset reset, Alltag only, photo, kit, what to wear today', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await writeForecast(page);

  // 9. Today: "Was ziehe ich heute an?" with one owned piece per row and one button.
  // v0.46.0: the card opens from the button "What do I wear?" of "What do you want to do?".
  await page.goto('./');
  await page.reload();
  await page.locator('.actions .grid [data-fn="wear"]').click();
  const card = page.locator('[data-wear-card]');
  await expect(card.getByRole('heading')).toHaveText(new RegExp(`${T('What do I wear today?')}|${T('What do I wear tomorrow?')}`));
  // 6 °C, felt 4 °C (you run cold: +2 °C)
  await expect(card.locator('.meta')).toContainText(T('feels {c} °C', { c: 4 }));
  for (const name of ['Merino Langarm', 'Thermotrikot', 'Winterjacke', 'Winterhose', 'Langfingerhandschuhe', 'Wintermuetze', 'Ueberschuhe']) await expect(card).toContainText(`${P}${name}`);
  await expect(card).not.toContainText('Buerohemd');
  await expect(card.getByRole('link')).toHaveCount(1);
  await expect(card.getByRole('button')).toHaveCount(0);
  await shot(page, info, 'heute-anziehen', card);
  await noSideScroll(page);
  await card.getByRole('link', { name: T('Open the wardrobe') }).click();
  await expect(page).toHaveURL(/#\/wardrobe$/);

  // 8. The offset in the header, Reset and Undo.
  const off = page.locator('p.offset');
  await expect(off).toContainText(T('You run cold: {n} °C', { n: '+2' }));
  await off.getByRole('button', { name: T('Reset|offset') }).click();
  await expect(off).toHaveCount(0);
  expect((await table(page, 'settings')).find((s) => s.key === 'clothing.offset')).toMatchObject({ value: 0 });
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(off).toContainText('+2');

  // 1. Warm to cold within a zone; no range last.
  const upper = layer(page, 'Base|layer').locator('h3.zh', { hasText: T('Upper body') }).locator('xpath=following-sibling::ul[1]');
  await expect(upper.locator('.nm')).toHaveText([`${P}Kurzarmtrikot`, `${P}Merino Langarm`, `${P}Netzunterhemd`]);

  // 10. Everyday-only clothes only under Alltag.
  await expect(page.getByText(`${P}Buerohemd`)).toHaveCount(0);
  const uses = page.getByRole('group', { name: T('Use|wardrobe') });
  await uses.getByRole('button', { name: T('All|use') }).click();
  await expect(page.getByText(`${P}Buerohemd`)).toHaveCount(0);
  await uses.getByRole('button', { name: T('Everyday|use') }).click();
  await expect(page.getByText(`${P}Buerohemd`)).toBeVisible();
  await expect(page.locator('p.gaprow')).toHaveCount(0); // no gaps under Alltag
  await uses.getByRole('button', { name: T('Cycling|use') }).click();

  // 2. One gap: hands (gloves from 4 °C, the wardrobe should cover −2 °C felt). Wishlist + Undo.
  const gaps = page.locator('p.gaprow');
  await expect(gaps).toHaveCount(1);
  const gap = gaps.first();
  await expect(gap).toContainText(T('No gloves below {n} °C', { n: 4 }));
  await shot(page, info, 'kleiderschrank');
  await gap.getByRole('button', { name: T('Add to wishlist') }).click();
  await expect(gap).toContainText(T('On the wishlist: {name}', { name: T('Warm gloves') }));
  const wish = (await table(page, 'items')).find((i) => i.from === 'wardrobe');
  expect(wish).toMatchObject({ name: T('Warm gloves'), ownership: 'wishlist', layer: 'accessory', zone: 'hands', note: T('No gloves below {n} °C', { n: 4 }) });
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(gap.getByRole('button', { name: T('Add to wishlist') })).toBeVisible();
  await expect.poll(async () => (await table(page, 'items')).some((i) => i.from === 'wardrobe')).toBe(false);

  // 6. A photo for a piece: in the item dialog, small in the wardrobe, removable.
  const row = page.locator('li', { hasText: `${P}Thermotrikot` });
  await row.getByRole('button', { name: T('Layer, zone or edit: {name}', { name: `${P}Thermotrikot` }) }).click();
  await row.getByRole('button', { name: T('Edit item') }).click();
  const dlg = page.getByRole('dialog');
  // v0.63.0: the photo sits in the row «Name, brand, note», which folds away
  await dlg.locator('details.fold[data-fold="details"] > summary').click();
  await dlg.locator('.iphoto input[type=file]').setInputFiles({ name: 'test_data_gtp_photo.png', mimeType: 'image/png', buffer: PNG });
  await expect(dlg.locator('.iphoto img')).toBeVisible();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  await expect(row.locator('img.thumb')).toBeVisible();
  expect((await table(page, 'items')).find((i) => i.id === 'KL44').photo).toMatch(/^data:image\/jpeg;base64,/);
  await row.getByRole('button', { name: T('Layer, zone or edit: {name}', { name: `${P}Thermotrikot` }) }).click();
  await row.getByRole('button', { name: T('Edit item') }).click();
  await dlg.getByRole('button', { name: T('Remove photo') }).click();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  await expect(row.locator('img.thumb')).toHaveCount(0);

  // 5. Today's suggestion as a temperature kit (a building block with minC / maxC), with Undo.
  // v0.47.0: the today card in the side column has its own "Save as kit …"; this is the one in the bar
  await page.locator('.wmain .bar').getByRole('button', { name: T('Save as kit …') }).click();
  const form = page.getByRole('form', { name: T('Save as kit') });
  await form.getByRole('button', { name: T("Today's suggestion ({c} °C)", { c: 4 }) }).click();
  await expect(page.locator('.selbar b.num')).toHaveText(T('{n} selected', { n: 7 }));
  await form.getByLabel(T('Name')).fill(`${P}Kuehler Morgen`);
  await expect(form.getByLabel(T('from °C'))).toHaveValue('1');
  await expect(form.getByLabel(T('to °C'))).toHaveValue('7');
  await noSideScroll(page);
  await form.getByRole('button', { name: T('Save kit') }).click();
  await expect(page.getByRole('status')).toContainText(T('Kit {name} ({range}) saved. Pack suggests it.', { name: `${P}Kuehler Morgen`, range: '1–7 °C' }));
  const sets = (await table(page, 'settings')).find((s) => s.key === 'sets').value;
  const kit = sets.find((s) => s.name === `${P}Kuehler Morgen`);
  expect(kit).toMatchObject({ minC: 1, maxC: 7 });
  const members = (await table(page, 'items')).filter((i) => i.sets?.includes(kit.key)).map((i) => i.id).sort();
  expect(members).toEqual(['KL42', 'KL44', 'KL45', 'KL47', 'KL48', 'KL49', 'KL50']);
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => ((await table(page, 'settings')).find((s) => s.key === 'sets')?.value ?? []).some((s) => s.key === kit.key)).toBe(false);
  expect((await table(page, 'items')).some((i) => i.sets?.includes(kit.key))).toBe(false);

  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('Today without a home place: a short hint with the place search', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { home: false });
  await page.goto('./');
  await page.reload();
  await page.locator('.actions .grid [data-fn="wear"]').click();
  const card = page.locator('[data-wear-card]');
  await expect(card).toContainText(T('Set your home place: then Today says what to wear for a ride.'));
  await expect(card.locator('li')).toHaveCount(0);
  await card.getByRole('button', { name: T('Set home place') }).click();
  await expect(card.getByLabel(T('Your home place'))).toBeVisible();
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
