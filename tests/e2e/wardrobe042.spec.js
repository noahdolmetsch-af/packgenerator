// v0.42.0 "Excel Schritt 2 und Kleiderschrank", German UI, phone and desktop:
// the wardrobe (More → Gear → Wardrobe, sorting a piece with two taps, Undo), step 2 of "Import prüfen"
// (kits, building blocks with the ≥ 70 % choice, tasks, old trips; "Übernehmen" and a second import
// that changes nothing), the onion check in Pack (a gap filled with one tap, the temperature kit, Undo),
// the old trips in the Logbook with a search, and the clothing row of the debrief (the border offset).
// Fictional data only (fixture.json + test_data_gtp_ items made here); every outside request is blocked.
// V042_SHOTS=<folder> saves screenshots of the new screens there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const P = 'test_data_gtp_';
const SHOTS = process.env.V042_SHOTS;

const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const cloth = (id, sid, name, category, weightG, f = {}) => ({ id, sourceId: sid, name: `${P} ${name}`, category, weightG, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('CL01', 'M0001', 'Merino Langarm', 'onbike', 180, { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 15 }),
  cloth('CL02', 'M0002', 'Thermotrikot', 'onbike', 240, { layer: 'mid', zone: 'torso', tempMin: 4, tempMax: 12 }),
  cloth('CL03', 'M0003', 'Weste winddicht', 'rain', 95, { layer: 'outer', zone: 'torso', tempMin: 8, tempMax: 20 }),
  cloth('CL04', 'M0004', 'Regenjacke leicht', 'rain', 190, { layer: 'outer', zone: 'torso', tempClass: 'mittel' }),
  cloth('CL05', 'M0005', 'Beinlinge dünn', 'onbike', 110, { layer: 'mid', zone: 'legs', tempMin: 8, tempMax: 15 }),
  cloth('CL06', 'M0006', 'Trägerhose kurz', 'onbike', 190, { layer: 'base', zone: 'legs', tempMin: 12, tempMax: 30 }),
  cloth('CL07', 'M0007', 'Langfingerhandschuhe', 'rain', 60, { layer: 'accessory', zone: 'hands', tempMin: 4, tempMax: 14 }),
  cloth('CL08', 'M0008', 'Buff Merino', 'rain', 35, { layer: 'accessory', zone: 'neck', tempMin: 0, tempMax: 15 }),
  cloth('CL09', 'M0009', 'Stirnband', 'rain', 25, { layer: 'accessory', zone: 'head', tempMin: 4, tempMax: 12 }),
  cloth('CL10', 'M0010', 'Unterhemd ärmellos', 'onbike', 70, { domains: ['velo', 'everyday'] }),
  cloth('CL11', 'M0011', 'Windhose', 'rain', 140),
];
const entry = (itemId, slot = 'body') => ({ itemId, slot, qty: 1, packed: false });

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.items.push(...CLOTHES);
  // An own building block "Elektronik" with three of the four items of the Excel block B01 (75 %).
  for (const i of t.items) if (['EL01', 'EL02', 'EL03'].includes(i.id)) i.sets = ['u-elek'];
  t.settings.push(MARK, { key: 'sets', value: [{ key: 'u-elek', name: `${P} Elektronik` }] });
  const trip = (id, title, startDate, days, entries, wx) => ({ id, title, domain: 'bikepacking', bikeId: 'bike-test', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, status: 'planned', wx, hours: 6, ready: [], startDate, days, entries });
  t.trips = [
    trip('gtp-jura', `${P} Jura-Wochenende`, day(1), 2, ['CL01', 'CL02', 'CL03', 'CL04', 'CL07', 'CL08'].map((id) => entry(id)).concat([entry('EL01', 'top')]), { min: 6, max: 14, rain: 'showers', rainPct: 40 }),
    trip('gtp-past', `${P} Herbstrunde`, day(-3), 1, [entry('CL01'), entry('EL01', 'top')], { min: 8, max: 16, rain: 'none' }),
  ];
  return data;
}

const IMPORT = {
  kind: 'gear-import',
  version: 1,
  created: '2026-10-09',
  items: [],
  kits: [
    { id: 'K1', name: `${P} Winter`, minC: null, maxC: 4, items: ['M0001', 'M0002', 'M0007', 'M0009'], note: '' },
    { id: 'K2', name: `${P} Kühl`, minC: 4, maxC: 15, items: ['M0001', 'M0002', 'M0005', 'M0009'], note: '' },
    { id: 'K6', name: `${P} Hitze`, minC: 25, maxC: null, items: ['M0006'], note: '' },
  ],
  blocks: [
    { id: 'B01', name: `${P} Elektronik (Excel)`, items: ['EL01', 'EL02', 'EL03', 'LI01'], note: '' },
    { id: 'F17', name: `${P} Licht`, items: ['LI01', 'LI02', 'M9999'], note: '' },
  ],
  tasks: [
    { id: 'A001', text: `${P} Velo-Service buchen`, group: 'Velo' },
    { id: 'A002', text: `${P} Startnummer abholen`, group: 'Event' },
    { id: 'A003', text: `${P} Unterkunft bestätigen`, group: 'Reise' },
  ],
  oldTrips: [
    { id: 'T001', name: `${P} Gravel-Event 200 km`, date: '2022-09-10', note: 'Startnummer vergessen.\nVerpflegung alle 2 h war richtig.' },
    { id: 'T002', name: `${P} Herbstrunde Emmental`, date: null, note: 'Regen ab Mittag, Überschuhe fehlten.' },
    { id: 'T003', name: `${P} Jura-Höhenweg`, date: '2022', note: 'Nachts 3 °C, Schlafsack zu dünn.' },
  ],
};

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

async function openData(page) {
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  return data;
}

async function start(page, context, info) {
  const file = info.outputPath('base.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  await expect(panel.getByRole('dialog')).toHaveCount(0);
  return errors;
}

async function noSideScroll(page) {
  for (const w of [320, 390]) {
    const size = page.viewportSize();
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    await page.setViewportSize(size);
  }
}

async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true });
}

async function stageImport(page, info) {
  const file = info.outputPath('test_data_gtp_import.json');
  writeFileSync(file, JSON.stringify(IMPORT));
  await page.goto('./');
  const panel = await openData(page);
  await panel.locator('input[type=file]').setInputFiles(file);
  const box = panel.getByRole('dialog', { name: T('Check import') });
  await box.getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);
}

test('Kleiderschrank, Import Schritt 2, Zwiebel in Pack, Logbuch', async ({ page, context }, info) => {
  const errors = await start(page, context, info);

  // 1. The wardrobe: v0.76.0 «Fünf Orte»: Material › Kleider (sidebar), on a phone through the search.
  if (info.project.name === 'desktop') await page.locator('.side li[data-place="gear"] .tabs').getByRole('link', { name: T('Clothes|tab') }).click();
  else {
    await page.getByRole('button', { name: T('Search everything') }).click();
    await page.locator('.search input').fill(T('Wardrobe'));
    await page.getByRole('region', { name: T('Search results') }).getByRole('button', { name: new RegExp(`^${T('Wardrobe')}`) }).first().click();
  }
  await expect(page).toHaveURL(/#\/wardrobe$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Wardrobe') })).toBeVisible();
  for (const l of ['Base|layer', 'Mid|layer', 'Outer|layer', 'Accessories|layer']) await expect(page.locator('h2.lh', { hasText: T(l) })).toBeVisible();
  // The buff (neck) is under Head; °C small on the right, the class when there is no range.
  const acc = page.locator('section.layer', { has: page.locator('h2', { hasText: T('Accessories|layer') }) });
  await expect(acc.locator('h3.zh', { hasText: T('Head') })).toBeVisible();
  await expect(page.locator('li', { hasText: 'Regenjacke leicht' }).locator('.tc')).toHaveText(T('medium|temp'));
  // v0.47.0 (Noah 2b): the temperature bar plus the short text «4–15°».
  await expect(page.locator('li', { hasText: 'Merino Langarm' }).locator('.tc')).toHaveText('4–15°');

  // To sort (v0.47.0, Noah 3b): a compact list, one suggestion chip per row; "Other …" opens layer and zone.
  const sort = page.locator('section.sort');
  const n0 = Number(await sort.locator('.sort-h .r').innerText());
  if (n0 > 5) await sort.getByRole('button', { name: T('{n} more to sort', { n: n0 - 5 }) }).click();
  const row = sort.locator('li', { hasText: 'Unterhemd ärmellos' });
  await row.getByRole('button', { name: T('Other layer or zone: {name}', { name: `${P} Unterhemd ärmellos` }) }).click();
  await expect(row.locator('button.sug', { hasText: T('Base|layer') })).toBeVisible();
  await shot(page, info, 'kleiderschrank');
  await row.getByRole('button', { name: T('Base|layer'), exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: T('{name} → {where}', { name: `${P} Unterhemd ärmellos`, where: T('Base|layer') }) })).toBeVisible();
  await row.getByRole('button', { name: T('Upper body'), exact: true }).click();
  await expect(sort.locator('.sort-h .r')).toHaveText(String(n0 - 1));
  // "A to-do list empties itself": the sorted row leaves at once.
  await expect(sort.locator('li', { hasText: 'Unterhemd ärmellos' })).toHaveCount(0);
  const baseLayer = page.locator('section.layer', { has: page.locator('h2', { hasText: T('Base|layer') }) });
  await expect(baseLayer.getByText('Unterhemd ärmellos')).toBeVisible();
  // Undo puts the zone back: the row is to sort again.
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(sort.locator('.sort-h .r')).toHaveText(String(n0));
  await expect(sort.locator('li', { hasText: 'Unterhemd ärmellos' })).toHaveCount(1);
  // One tap on the chip: the first row leaves, the next one moves up and has the focus; Undo brings it back first.
  const names = () => sort.locator('.srows > li .snm').allInnerTexts();
  const before = await names();
  const first = sort.locator('.srows > li').first();
  const chip = first.locator('button.chip');
  if (await chip.count()) {
    await chip.click();
    await expect.poll(names).toEqual(before.slice(1));
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('li')?.querySelector('.snm')?.textContent ?? null)).toBe(before[1] ?? null);
    await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
    await expect.poll(names).toEqual(before);
  }
  // The filter: Alltag shows only the everyday clothing.
  await page.getByRole('group', { name: T('Use|wardrobe') }).getByRole('button', { name: T('Everyday|use') }).click();
  await expect(page.locator('.page-sub')).toContainText(T('{n} piece of clothing', { n: 1 }));
  await page.getByRole('group', { name: T('Use|wardrobe') }).getByRole('button', { name: T('Cycling|use') }).click();
  await noSideScroll(page);

  // 2. Gear → "Kleiderschrank →" leads here too.
  await page.goto('./#/gear');
  await page.getByRole('link', { name: `${T('Wardrobe')} →` }).click();
  await expect(page).toHaveURL(/#\/wardrobe$/);

  // 3. Import step 2: the second tab, the ≥ 70 % choice, Übernehmen.
  await stageImport(page, info);
  const tabs = page.getByRole('group', { name: T('Part of the import') });
  await expect(tabs.getByRole('button', { name: T('Kits, building blocks, tasks') })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('details.sec', { hasText: T('Temperature kits') }).locator('summary .n')).toHaveText('3');
  const sim = page.locator('.sim li', { hasText: 'Elektronik (Excel)' });
  await expect(sim).toContainText(T('like the building block "{name}": {both} of {of} items the same', { name: `${P} Elektronik`, both: 3, of: 4 }));
  await expect(sim.getByRole('button', { name: T('Merge|blocks') })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.nf')).toContainText('M9999');
  await shot(page, info, 'import-schritt2');
  await noSideScroll(page);
  await page.getByRole('button', { name: T('Apply|step2'), exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: T('Kits, building blocks and tasks applied {when}.', { when: '' }).replace(/\s*\.$/, '') })).toBeVisible();
  const sets = (await table(page, 'settings')).find((s) => s.key === 'sets').value;
  expect(sets.filter((s) => s.sourceId?.startsWith('K')).map((s) => s.sourceId).sort()).toEqual(['K1', 'K2', 'K6']);
  // F17 is either a new block or merged into a similar one (the app's own updates may have made one).
  expect(sets.some((s) => s.sourceId === 'F17' || s.mergedIds?.includes('F17'))).toBe(true);
  expect(sets.find((s) => s.key === 'u-elek').mergedIds).toEqual(['B01']);
  expect(sets.find((s) => s.sourceId === 'K1')).toMatchObject({ minC: null, maxC: 4 });
  expect((await table(page, 'items')).find((i) => i.id === 'LI01').sets).toContain('u-elek');
  const tasks = await table(page, 'maintenance');
  expect(tasks.map((x) => x.sourceId).sort()).toEqual(['A001', 'A002', 'A003']);
  expect((await table(page, 'events')).map((e) => e.id).sort()).toEqual(['xl-T001', 'xl-T002', 'xl-T003']);

  // A second import of the same file adds nothing (matched by K1, B01, A001, T001 …).
  await stageImport(page, info);
  await expect(page.locator('details.sec', { hasText: T('Temperature kits') }).locator('.badge').first()).toHaveText(T('already there'));
  await page.getByRole('button', { name: T('Apply|step2'), exact: true }).click();
  await expect.poll(async () => (await table(page, 'maintenance')).length).toBe(3);
  expect((await table(page, 'events')).length).toBe(3);
  expect((await table(page, 'settings')).find((s) => s.key === 'sets').value).toHaveLength(sets.length);

  // 4. Pack: the onion under the weather, one gap, filled with one tap; the kit; Undo.
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-jura'));
  await page.goto('./#/pack');
  const cond = page.getByLabel(T('Trip conditions'));
  await expect(cond).toContainText('40 %');
  const line = cond.getByRole('button', { name: T('Onion: {n} gap', { n: 1 }) });
  await expect(line).toBeVisible();
  await shot(page, info, 'zwiebel-zu');
  await line.click();
  await expect(cond.locator('.orows li')).toHaveCount(6);
  await expect(cond.locator('.orows li', { hasText: T('Legs') })).toContainText(T('{zone} below {n} °C: nothing packed', { zone: T('Legs'), n: 10 }));
  await shot(page, info, 'zwiebel-offen');
  await cond.getByRole('button', { name: T('{name} in', { name: `${P} Beinlinge dünn` }) }).click();
  await expect(cond.getByRole('button', { name: T('Onion: fits') })).toBeVisible();
  await expect(cond.locator('.orows li', { hasText: T('Legs') }).locator('.badge')).toHaveText(T('new'));
  // The kit for the coldest hour (no hourly data: the minimum 6 °C): K2 4–15 °C.
  await cond.getByRole('button', { name: T('Kit {range} in', { range: '4–15 °C' }) }).click();
  const toast = page.locator('.onion-toast');
  await expect(toast).toContainText(T('Kit {range} added: {n} item', { range: '4–15 °C', n: 1 }));
  await expect(cond.locator('.kdone')).toContainText(T('Kit {range} is in', { range: '4–15 °C' }));
  await shot(page, info, 'zwiebel-kit');
  const trip = async () => (await table(page, 'trips')).find((x) => x.id === 'gtp-jura');
  expect((await trip()).entries.map((e) => e.itemId)).toEqual(expect.arrayContaining(['CL05', 'CL09']));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await trip()).entries.some((e) => e.itemId === 'CL09')).toBe(false);
  expect((await trip()).entries.some((e) => e.itemId === 'CL05')).toBe(true);
  await noSideScroll(page);

  // 5. The old trips in the Logbook: read only, "aus Excel", a year as it is, searchable.
  await page.goto('./#/debrief/logbook');
  const log = page.locator('#logbook');
  await expect(log).toContainText('Gravel-Event 200 km');
  await expect(log.locator('li', { hasText: 'Jura-Höhenweg' }).locator('.ld')).toHaveText('2022');
  await expect(log.locator('li', { hasText: 'Gravel-Event' }).locator('.lsrc')).toHaveText(T('from Excel'));
  await shot(page, info, 'logbuch');
  // The app search finds an old trip.
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('Rueckblick (debrief): the clothing row shifts the kit borders', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/gtp-past');
  const q = page.getByRole('group', { name: T('Clothing') });
  await expect(q).toBeVisible();
  await q.getByRole('button', { name: T('Too cold') }).click();
  await expect(q.getByRole('button', { name: T('Too cold') })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, info, 'rueckblick-kleidung');
  await page.getByRole('button', { name: T('Save debrief') }).first().click();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'clothing.offset')?.value).toBe(1);
  expect((await table(page, 'debriefs')).find((d) => d.tripId === 'gtp-past').clothing).toBe('cold');
  // The wardrobe says it (v0.45.0, decision 8: in the header, with Reset).
  await page.goto('./#/wardrobe');
  await expect(page.locator('.ward p.offset')).toContainText(T('You run cold: {n} °C', { n: '+1' }));
  expect(errors).toEqual([]);
});
