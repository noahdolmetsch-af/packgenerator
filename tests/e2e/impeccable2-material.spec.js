// Impeccable runde 2 (Noah 18.10.2026 21:46 «alle vorschläge aus allen dokumenten angenommen»), Gruppe 2 Material:
// - Material 2: nothing chosen at the start; the right column shows the calm card «Teil antippen»; on «Einkauf» a wish
//   there shows «Preis», «Warum auf der Liste» and «Gekauft: zu meinem Material».
// - Material 3: the numbers once (the head line; the tiles only in a filtered view); «Sortiert», «Liste | Karten»,
//   «Auswählen» and «Kompakt | Mit Tasche» in one line; on a phone the two toggles are in «Sortieren und filtern»
//   under «Darstellung»; the link says «… ohne Gewicht · jetzt wiegen».
// Fictional data only (material0472-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { materialFixture } from './material0472-fixture.js';

const desktop = (info) => info.project.name === 'desktop';
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function openGear(page, context, info, hash = '#/gear', display = 'list') {
  await openHome(page, context, info, { data: materialFixture() });
  await page.evaluate((d) => localStorage.setItem('gear.display', d), display);
  await page.goto(`./${hash}`);
  await expect(page.getByRole('heading', { level: 1, name: hash.includes('view=wish') ? 'Einkauf' : 'Material' })).toBeVisible();
}

test('Material 2: the right column waits for a tap; a wish shows price, why and Bought', async ({ page, context }, info) => {
  test.skip(!desktop(info), 'the right column is for the computer');
  await openGear(page, context, info);
  const none = page.getByRole('complementary', { name: 'Teil antippen' });
  await expect(none).toContainText('Rechts erscheint, wie oft es dabei war, sein Jahr auf Tour und leichtere Alternativen.');
  // the views card comes right under it
  const nb = await none.boundingBox();
  const vb = await page.locator('.vcard').boundingBox();
  expect(vb.y).toBeGreaterThan(nb.y + nb.height);

  // Einkauf: a tap on a wish fills the column with its price and why, and «Gekauft» moves it with Undo
  await page.goto('./#/gear?view=wish');
  await expect(page.getByRole('complementary', { name: 'Teil antippen' })).toContainText('warum es auf der Liste steht');
  const wish = page.getByRole('region', { name: 'Einkauf' });
  await wish.locator('li.fr > button:not(.btn)', { hasText: 'Ultralight tarp' }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  const panel = page.getByRole('complementary', { name: 'Ultralight tarp' });
  await expect(panel).toContainText('Preis');
  await expect(panel).toContainText('noch kein Preis');
  await expect(panel).toContainText('Warum auf der Liste');
  await expect(panel.getByRole('heading', { name: 'Sein Jahr auf Tour' })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Gekauft: zu meinem Material' }).click();
  const bar = page.getByRole('status').filter({ hasText: '«Ultralight tarp» ist jetzt in deinem Material.' });
  await expect(bar).toBeVisible();
  await bar.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(wish.getByRole('button', { name: 'Gekauft: Ultralight tarp' })).toBeVisible();
});

test('Material 3: the numbers once, the controls in one line, Display in the sheet on a phone', async ({ page, context }, info) => {
  await openGear(page, context, info);
  // «Alle»: the head line has the numbers; no tiles under the view's sentence
  await expect(page.locator('.page-sub')).toContainText('Teile');
  await expect(page.locator('.vstats')).toHaveCount(0);
  // a filtered view keeps its own numbers (on a computer)
  await page.getByRole('group', { name: 'Ansichten' }).getByRole('button', { name: /^Favoriten/ }).click();
  if (desktop(info)) await expect(page.locator('.vstats')).toBeVisible();
  await page.getByRole('group', { name: 'Ansichten' }).getByRole('button', { name: /^Alle/ }).click();
  await expect(page.getByRole('button', { name: /ohne Gewicht · jetzt wiegen$/ })).toBeVisible();

  const line = page.locator('.metaline');
  if (desktop(info)) {
    // one line: sorted, list or cards, select, compact or with bag
    for (const el of [line.getByText(/^Sortiert:/), line.getByRole('group', { name: 'Zeigen als' }), line.getByRole('button', { name: 'Auswählen' }), line.getByRole('group', { name: 'Tasche zeigen' })]) await expect(el).toBeVisible();
    const ys = await Promise.all([line.getByRole('group', { name: 'Zeigen als' }), line.getByRole('group', { name: 'Tasche zeigen' }), line.getByRole('button', { name: 'Auswählen' })].map(async (l) => { const b = await l.boundingBox(); return b.y + b.height / 2; }));
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(12);
  } else {
    // a phone: sorted and select on the line, the two toggles in the sheet
    await expect(line.getByRole('button', { name: 'Auswählen' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Zeigen als' })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Tasche zeigen' })).toHaveCount(0);
    await page.locator('.toolbar .fbtn').click();
    const sheet = page.getByRole('dialog', { name: 'Sortieren und filtern' });
    await expect(sheet.getByRole('heading', { name: 'Darstellung' })).toBeVisible();
    await sheet.getByRole('group', { name: 'Tasche zeigen' }).getByRole('button', { name: 'Mit Tasche' }).click();
    await sheet.getByRole('group', { name: 'Zeigen als' }).getByRole('button', { name: 'Karten' }).click();
    await expect(sheet.getByRole('group', { name: 'Tasche zeigen' })).toHaveCount(0); // the bag is a list thing
    await sheet.locator('.x').click();
    await expect(page.locator('.cards')).toBeVisible();
    expect(await page.evaluate(() => [localStorage.getItem('gear.display'), localStorage.getItem('gear.bagColumn')])).toEqual(['cards', '1']);
  }
  await noSideways(page);
});

test('Einkauf 2: no Woanders box and no Wishlist chip per row; the shop link through the row menu', async ({ page, context }, info) => {
  await openGear(page, context, info, '#/gear?view=wish');
  const wish = page.getByRole('region', { name: 'Einkauf' });
  await expect(wish.locator('li.fr').first()).toBeVisible();
  // no dashed «Woanders · Im Shop ansehen · eintragen» under every row, and no «Wunschliste» chip (the whole list is wishes)
  await expect(wish.locator('[data-sk-woanders]')).toHaveCount(0);
  await expect(wish.locator('.st-wishlist')).toHaveCount(0);
  const row = wish.locator('li.fr').filter({ hasText: 'Ultralight tarp' });
  await expect(row.locator('a[data-shop-link]')).toHaveCount(0);
  // «…» › «Shop-Link eintragen»: the small window; afterwards a small «Im Shop ansehen ↗» in the row
  await row.getByRole('button', { name: 'Mehr zu Ultralight tarp' }).click();
  await page.getByRole('menuitem', { name: /Shop-Link eintragen/ }).click();
  const sheet = page.locator('dialog[data-sk-own]');
  await expect(sheet).toBeVisible();
  await sheet.getByLabel('Adresse').fill('example.org/tarp');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  const link = row.locator('a[data-shop-link]');
  await expect(link).toHaveText(/Im Shop ansehen/);
  await expect(link).toHaveAttribute('href', 'https://example.org/tarp');
  await expect(link).toHaveAttribute('target', '_blank');
  // the menu now says «Shop-Link ändern»
  await row.getByRole('button', { name: 'Mehr zu Ultralight tarp' }).click();
  await expect(page.getByRole('menuitem', { name: /Shop-Link ändern/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await noSideways(page);
});

/** The material fixture plus a few fictional clothes in three layers. */
function clothesFixture() {
  const data = materialFixture();
  const P = 'test_data_gtp_ ';
  const c = (id, name, layer, zone, weightG) => ({ id, name: `${P}${name}`, category: 'onbike', weightG, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], layer, zone, tempMin: 5, tempMax: 20 });
  data.tables.items.push(c('KX01', 'Merino shirt', 'base', 'torso', 150), c('KX02', 'Fleece', 'mid', 'torso', 300), c('KX03', 'Gloves', 'accessory', 'hands', 60));
  return data;
}

test('Kleider 1 and 2: the head follows the switch, the switch explained once; a phone shows each layer as a line', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: clothesFixture() });
  await page.goto('./#/wardrobe');
  await expect(page.getByRole('heading', { level: 1, name: 'Kleider' })).toBeVisible();
  await expect(page.locator('.page-sub')).toContainText(/^\d+ Kleid(er|ungsstück) fürs Velo · /);
  // «Velo · Alltag · Alle» explained under the switch, once: × hides it for good
  const help = page.locator('[data-use-help]');
  await expect(help).toHaveText('Velo: was du auf dem Velo trägst. Alltag: alles andere. Alle: beides zusammen.');
  await page.getByRole('group', { name: 'Einsatz' }).getByRole('button', { name: /^Alle/ }).click();
  await expect(page.locator('.page-sub')).not.toContainText('fürs Velo');
  await help.getByRole('button', { name: 'Hinweis ausblenden' }).click();
  await expect(help).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Kleider' })).toBeVisible();
  await expect(page.locator('[data-use-help]')).toHaveCount(0);

  const layers = page.locator('section.layer');
  if (desktop(info)) {
    // a computer keeps the layers open side by side, «Tippen filtert» stays on the onion
    await expect(page.locator('.ltog')).toHaveCount(0);
    await expect(page.locator('#onion-h')).toContainText('Tippen filtert');
    await expect(page.getByText('Merino shirt', { exact: false })).toBeVisible();
  } else {
    // a phone: one line per layer with name, count and weight; the hint above the first one
    await expect(page.getByText('Tippe eine Schicht oder eine Körperzone, um nur diese Kleider zu sehen.')).toBeVisible();
    await expect(page.locator('#onion-h')).not.toContainText('Tippen filtert');
    const base = page.locator('section.layer[data-layer="base"]');
    const tog = base.locator('.ltog');
    await expect(tog).toHaveAttribute('aria-expanded', 'false');
    await expect(tog).toContainText('Basis');
    await expect(page.getByText('Merino shirt', { exact: false })).toHaveCount(0);
    for (const b of await layers.locator('.ltog').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await tog.click();
    await expect(tog).toHaveAttribute('aria-expanded', 'true');
    await expect(base.getByText('Merino shirt', { exact: false })).toBeVisible();
    // the other layers stay closed; a tap on a layer of the onion opens what it filters
    await expect(page.locator('[data-layer="mid"] .ltog')).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('group', { name: 'Schicht filtern' }).getByRole('button', { name: /^Mitte/ }).click();
    await expect(page.getByText('Fleece', { exact: false })).toBeVisible();
  }
  await noSideways(page);
});

test('Import prüfen 1: the empty page in plain words, choosing a gear list is the main button', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: materialFixture() });
  await page.goto('./#/gear/import');
  await expect(page.getByRole('heading', { level: 1, name: 'Import prüfen' })).toBeVisible();
  const card = page.locator('.empty.card');
  await expect(card).toContainText('zum Beispiel eine, die Claude aus deiner Excel-Liste gebaut hat (Datei mit der Endung .json)');
  await expect(card).toContainText('Nichts kommt in dein Material, bevor du es bestätigst.');
  await expect(card).not.toContainText('gear-import');
  await expect(card).not.toContainText('Ausrüstung');
  const pick = card.locator('label.btn', { hasText: 'Material-Liste wählen' });
  await expect(pick).toHaveClass(/\bhi\b/);
  expect((await pick.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(page.getByText('Noch kein Import.')).toBeVisible();
  await noSideways(page);
});
