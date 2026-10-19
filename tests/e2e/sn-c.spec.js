// SN3, SN5, SN7 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): Vorlagen, Vorlage
// bearbeiten, Bausteine, Favoriten and the old windows Velo, Tasche, Teil in the new look. Fictional
// fixtures (test_data_gtp_), German, phone + desktop. SNC_SHOTS=<dir> also writes the screenshots.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { openMore } from './bike-more.js';
import { openShort } from './kurz-open.js';

// SN3+ «Bausteine je nach Lage» (answer «aufklappbar b»): only «Je nach Lage» is open on Bausteine; open the other groups
const openGroups = async (page) => {
  const shut = page.locator('main section.sfold > details:not([open]) > summary');
  while (await shut.count()) await shut.first().click();
};


const P = 'test_data_gtp_';
const TPL = fileURLToPath(new URL('./templates-fixture.json', import.meta.url));
const PF = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
// Calendar days in Europe/Zurich (never now + n × 24 h).
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const SPARK = `${P}spark`;

async function load(page, context, file, fixed = true) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // A fixed morning, so «long not used» does not drift and no tour asks «Tour beendet».
  if (fixed) await page.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert/)).toBeVisible();
  return errors;
}

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const templates = async (page) => (await table(page, 'settings')).find((s) => s.key === 'templates').value;
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
async function shot(page, info, name) {
  const dir = process.env.SNC_SHOTS;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const open = await page.locator('dialog[open]').count();
  await page.screenshot({ path: `${dir}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: !open });
}

test('SN3 Vorlagen: path, one main button, rows with «…», «From your trips»', async ({ page, context }, info) => {
  const errors = await load(page, context, TPL);
  await page.goto('./#/pack/templates');
  await expect(page.getByRole('heading', { level: 1, name: T('Templates') })).toBeVisible();
  await expect(page.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('Trips') })).toHaveAttribute('href', '#/trips');
  await expect(page.locator('main .btn.hi:visible')).toHaveCount(1);
  const rows = page.locator('li.row[data-tpl]:not(.arch)');
  await expect(rows).toHaveCount(4);
  // Every template row: «New trip» and «…» with edit, duplicate, archive, delete.
  const jura = page.locator('[data-tpl="tpl-jura"]');
  await expect(jura.getByRole('button', { name: T('New trip') })).toBeVisible();
  await jura.getByRole('button', { name: /^Mehr zu / }).click();
  for (const name of [T('Edit|template'), T('Duplicate'), T('Archive'), T('Delete')]) await expect(page.getByRole('menuitem', { name: new RegExp(`^${name}`) })).toBeVisible();
  await page.keyboard.press('Escape');
  // From your trips: each row offers «as template» or, before its debrief, the debrief.
  const src = page.getByRole('region', { name: T('From your trips') });
  await expect(src).toBeVisible();
  const srcRows = src.locator('li[data-src]');
  expect(await srcRows.count()).toBeGreaterThan(0);
  for (const r of await srcRows.all()) await expect(r.getByRole('button', { name: T('Save|template') }).or(r.getByRole('link', { name: T('Debrief') }))).toBeVisible();
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'vorlagen');
  expect(errors).toEqual([]);
});

test('SN3 Vorlage bearbeiten: blocks as option buttons, a tap adds or leaves one out', async ({ page, context }, info) => {
  const errors = await load(page, context, TPL);
  await page.goto('./#/pack/templates/tpl-jura');
  const blocks = page.getByRole('region', { name: T('Building blocks') });
  await expect(blocks.getByRole('button', { name: /^Standard/ })).toHaveAttribute('aria-pressed', 'true');
  const before = (await templates(page)).find((x) => x.id === 'tpl-jura').blocks;
  const add = blocks.locator('button[aria-pressed="false"]').first();
  const label = (await add.locator('b').textContent()).trim();
  await add.click();
  const on = blocks.locator('button[aria-pressed="true"]', { hasText: label });
  await expect(on).toHaveCount(1);
  await expect.poll(async () => (await templates(page)).find((x) => x.id === 'tpl-jura').blocks.length).toBe(before.length + 1);
  await on.click();
  await expect.poll(async () => (await templates(page)).find((x) => x.id === 'tpl-jura').blocks).toEqual(before);
  // Rare things folded; the sections of the mockup are there.
  await expect(blocks.locator('details summary', { hasText: T('Single items of the blocks') })).toBeVisible();
  for (const name of [T('Single items'), T('Frame|template')]) await expect(page.getByRole('region', { name })).toBeVisible();
  await expect(page.getByRole('button', { name: T('New trip') })).toBeVisible();
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'vorlage-bearbeiten');
  expect(errors).toEqual([]);
});

test('SN3 Bausteine: grouped sections of rows, «Prüfen» and «Neuer Baustein» in the head', async ({ page, context }, info) => {
  const errors = await load(page, context, TPL);
  await page.goto('./#/blocks');
  await openGroups(page);
  await expect(page.getByRole('heading', { level: 1, name: T('Building blocks') })).toBeVisible();
  for (const name of [T('Always with you'), T('With the night'), T('To add')]) await expect(page.getByRole('region', { name })).toBeVisible();
  expect(await page.locator('details.edit > summary.srow').count()).toBeGreaterThanOrEqual(5);
  await expect(page.getByRole('link', { name: new RegExp(`^${T('Check|blocks')}`) })).toHaveAttribute('href', '#/blocks/check');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'bausteine');
  await page.getByRole('button', { name: T('New building block') }).click();
  await expect(page.locator('#new-block-name')).toBeFocused();
  // «Bausteine prüfen»: the same path head and the step buttons.
  await page.goto('./#/blocks/check');
  await expect(page.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('Building blocks') })).toHaveAttribute('href', '#/blocks');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('SN5 Favoriten: one card per area, «…» takes the star away with Undo', async ({ page, context }, info) => {
  const errors = await load(page, context, TPL);
  await page.goto('./#/favorites');
  await openShort(page);
  await expect(page.getByRole('heading', { level: 1, name: T('Favourites') })).toBeVisible();
  const row = page.locator('li.frow', { hasText: `${P} Taschenbuch` }).first();
  await expect(row).toBeVisible();
  await shot(page, info, 'favoriten');
  await row.getByRole('button', { name: /^Mehr zu / }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Remove star')}`) }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LX01').favorite ?? null).toBe(null);
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LX01').favorite).toBe(true);
  await expect(page.locator('li.frow', { hasText: `${P} Taschenbuch` }).first()).toBeVisible();
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

/** On a phone the new windows come from below, full width. */
async function fromBelow(page, dlg, info) {
  if (info.project.name !== 'phone') return;
  const vp = page.viewportSize();
  // Bewegung (Paket D): the window slides in from below, so read its place once the slide has ended
  await expect.poll(async () => { const b = await dlg.boundingBox(); return Math.abs(b.y + b.height - vp.height); }).toBeLessThanOrEqual(1);
  const box = await dlg.boundingBox();
  expect(Math.round(box.width)).toBe(vp.width);
}

test('SN7 Velo: the kind as option buttons, the details folded, «Hinzufügen»', async ({ page, context }, info) => {
  const errors = await load(page, context, TPL);
  await page.goto('./#/bikes?bike=bike-test');
  await page.locator('section.setup-band').getByRole('button', { name: T('Add bike') }).click();
  const dlg = page.locator('dialog[aria-labelledby="bike-dlg-h"]');
  await expect(dlg).toBeVisible();
  const kinds = dlg.getByRole('group', { name: T('Kind|bike') });
  await expect(kinds.getByRole('button')).toHaveCount(5);
  await expect(kinds.locator('button[aria-pressed="true"]')).toHaveCount(0); // a suggestion, nothing chosen
  await kinds.getByRole('button', { name: 'MTB' }).click();
  await expect(kinds.getByRole('button', { name: 'MTB' })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.locator('details.foldrow', { hasText: T('More details') })).toContainText('MTB');
  await expect(dlg.locator('details.foldrow[open]')).toHaveCount(0);
  await fromBelow(page, dlg, info);
  await shot(page, info, 'velo-dialog');
  await dlg.getByRole('textbox', { name: T('Name') }).fill(`${P} Bergziege`);
  await dlg.getByRole('button', { name: T('Add|bike') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.name === `${P} Bergziege`)?.type).toBe('MTB');
  expect(errors).toEqual([]);
});

test('SN7 Tasche: the place as option buttons, link and note folded', async ({ page, context }, info) => {
  const errors = await load(page, context, TPL);
  await page.goto('./#/bikes?bike=bike-test');
  await openMore(page);
  const fold = page.locator('details', { hasText: T('Your bags') }).last();
  await fold.locator('summary').first().click();
  await fold.getByRole('button', { name: /Test seat pack/ }).first().click();
  const dlg = page.locator('dialog[aria-labelledby="bag-h"]');
  await expect(dlg).toBeVisible();
  const place = dlg.getByRole('group', { name: T('Place') });
  await expect(place.getByRole('button', { name: T('Seat pack') })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.locator('details[data-fold="link"]')).toBeVisible();
  await expect(dlg.locator('details[data-fold="note"]')).toBeVisible();
  await expect(dlg.locator("select:not(details select)")).toHaveCount(0); // no list to pick from outside the folds
  await fromBelow(page, dlg, info);
  await shot(page, info, 'taschen-dialog');
  await place.getByRole('button', { name: T('Frame bag') }).click();
  await expect(place.getByRole('button', { name: T('Frame bag') })).toHaveAttribute('aria-pressed', 'true');
  await expect(place.getByRole('button', { name: T('Seat pack') })).toHaveAttribute('aria-pressed', 'false');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'containers')).find((c) => c.id === 'bag-TA01').slot).toBe('frame');
  expect(errors).toEqual([]);
});

function pfFile(info) {
  const fix = JSON.parse(PF.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const spark = fix.tables.bikes.find((b) => b.id === SPARK);
  const e = (n, km, over) => ({ date: day(n), km, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...over });
  // Waxed 300 km ago (every 150 km): due.
  spark.parts = [{ key: 'chain', model: `${P} Kette`, history: [e(-30, 4700, { action: 'service', result: 'done' })] }, { key: 'padsF', model: '', history: [e(-9, 4950, { value: 80 })] }];
  const path = info.outputPath('sn-c-pf.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

test('SN7 Teil: the due point on top and chosen, what did you do, enter', async ({ page, context }, info) => {
  const errors = await load(page, context, pfFile(info), false);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}&open=1`);
  const care = page.locator(`#care-${SPARK}`);
  await care.locator('button.prow').filter({ has: page.locator('.nm').getByText('Kette', { exact: true }) }).click();
  const dlg = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Kette' }) });
  await expect(dlg.locator('[data-due]')).toBeVisible();
  await expect(dlg.locator('[data-did="service"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.getByRole('button', { name: T('Enter|part'), exact: true })).toBeEnabled();
  await expect(dlg.locator('details[data-fold="measure"]')).not.toHaveAttribute('open', '');
  await fromBelow(page, dlg, info);
  await shot(page, info, 'teil-dialog');
  await dlg.locator('[data-did="ok"]').click();
  await expect(dlg.locator('[data-did="service"]')).toHaveAttribute('aria-pressed', 'false');
  await dlg.getByRole('button', { name: T('Enter|part'), exact: true }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === SPARK).parts.find((p) => p.key === 'chain').history.at(-1)).toMatchObject({ date: day(0), action: 'check', result: 'ok' });

  // A part with nothing due: nothing is chosen, «Eintragen» waits for a choice.
  await care.locator('button.prow').filter({ has: page.locator('.nm').getByText('Bremsbeläge vorne', { exact: true }) }).click();
  const pads = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Bremsbeläge vorne' }) });
  await expect(pads.locator('.dids button[aria-pressed="true"]')).toHaveCount(0);
  await expect(pads.getByRole('button', { name: T('Enter|part'), exact: true })).toBeDisabled();
  await pads.getByRole('button', { name: T('Cancel') }).click();
  await expect(pads).toBeHidden();
  expect(errors).toEqual([]);
});
