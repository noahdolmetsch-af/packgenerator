// Taschen-Setups TS0–TS5 (Noah 14.10.2026 «TS0–TS5 freigegeben»): several bag setups per bike under
// Velos › «Mein Setup»: make one, change its bags and places, copy, rename, delete with 4 s undo,
// compare two and all, and choose one while planning a trip («Ins Setup übernehmen»).
// Fictional v048 fixture plus bags, a bottle and a trip on the Gravel.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { v048Data, P, GRAVEL, day } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = process.env.TS_SHOTS;
const shot = async (page, info, name) => SHOTS && (await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true }));
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

function data() {
  const fix = v048Data();
  const T = fix.tables;
  const gravel = T.bikes.find((b) => b.id === GRAVEL);
  Object.assign(gravel, { weightG: 9400, slots: ['seat', 'frame', 'top', 'bar', 'cage1'], setup: { seat: `${P}b-seat`, frame: `${P}b-frame`, bar: `${P}b-bar`, cage1: `${P}b-cage` } });
  T.containers = [
    ...(T.containers ?? []),
    { id: `${P}b-seat`, name: `${P} Satteltasche`, slot: 'seat', volumeL: 13, weightG: 400 },
    { id: `${P}b-frame`, name: `${P} Rahmentasche`, slot: 'frame', volumeL: 5, weightG: 200 },
    { id: `${P}b-top`, name: `${P} Oberrohrtasche`, slot: 'top', volumeL: 1.5, weightG: 120 },
    { id: `${P}b-bar`, name: `${P} Lenkerrolle`, slot: 'bar', volumeL: 14, weightG: 300 },
    { id: `${P}b-cage`, name: `${P} Flaschenhalter`, slot: 'cage1', volumeL: 0.75, weightG: 40 },
  ];
  const item = (id, name, category, weightG, volumeL, extra = {}) => ({ id: `${P}${id}`, name: `${P} ${name}`, category, weightG, volumeL, ownership: 'owned', domains: ['bikepacking'], ...extra });
  T.items.push(item('zelt', 'Zelt', 'sleep', 1050, 6), item('kocher', 'Kocher', 'cook', 420, 1), item('quilt', 'Quilt', 'sleep', 600, 7), item('lampe', 'Stirnlampe', 'light', 90, 0.2), item('wasser', 'Wasser 0.75 L', 'food', 750, 0.75, { waterL: 0.75 }));
  const e = (id, slot) => ({ itemId: `${P}${id}`, slot, qty: 1, packed: false });
  T.trips.push({ id: `${P}jura`, domain: 'bikepacking', title: `${P} Jura Wochenende`, startDate: day(3), days: 2, bikeId: GRAVEL, bike: gravel.name, setup: { ...gravel.setup }, entries: [e('zelt', 'seat'), e('kocher', 'seat'), e('quilt', 'bar'), e('wasser', 'cage1')], ready: [], status: 'planned', createdAt: `${day(-1)}T08:00:00.000Z` });
  return fix;
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const file = info.outputPath('taschen-setups.json');
  writeFileSync(file, JSON.stringify(data()));
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}
const card = (page, name) => page.locator('article.sc', { has: page.getByRole('heading', { level: 3, name: new RegExp(`^${name}`) }) });
const bag = (page, name) => page.locator('section.bg', { has: page.getByRole('heading', { level: 3, name }) });

test('Mein Setup: make a bag setup, change it, copy, rename and delete with undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=rig&bike=${GRAVEL}`);
  await expect(page.locator('nav.ptabs').getByRole('link', { name: 'Mein Setup' })).toHaveAttribute('aria-current', /page|true/);
  await expect(page.getByRole('heading', { level: 2, name: 'Taschen-Setups' })).toBeVisible();
  // «Standard» is the setup of the trip: last used, the fallback for old trips; 9.4 + 0.9 bags (the cage counts 0) + 2.07 contents + 0.75 water.
  const std = card(page, 'Standard');
  await expect(std).toContainText('zuletzt genutzt');
  await expect(std).toContainText('Standard · für alte Touren');
  await expect(std).toContainText('13.1 kg');
  await expect(std.getByRole('button', { name: /Mehr zu/ })).toBeVisible();

  // A new setup, a copy of «Standard»; the page of the new setup opens.
  await page.getByRole('button', { name: 'Neues Setup' }).click();
  const dlg = page.getByRole('dialog', { name: 'Neues Setup' });
  await dlg.getByLabel('Name').fill('Bikepacking 3 Tage');
  await dlg.getByRole('button', { name: 'Erstellen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Bikepacking 3 Tage' })).toBeVisible();
  await expect(bag(page, `${P} Satteltasche`)).toContainText(`${P} Zelt`);
  // The bottle cage holds its 0.75 L bottle: water apart, the cage is full and that is right.
  await expect(bag(page, `${P} Flaschenhalter`)).toContainText(`${P} Wasser 0.75 L`);
  await expect(page.locator('.sleg')).toContainText('Wasser 1 Flasche');

  // Move the tent into the frame bag, add the head torch, put a top tube bag on.
  await bag(page, `${P} Satteltasche`).getByRole('button', { name: 'verschieben' }).click();
  await page.getByLabel(`${P} Zelt verschieben nach`).selectOption({ label: `2 ${P} Rahmentasche` });
  await expect(bag(page, `${P} Rahmentasche`)).toContainText(`${P} Zelt`);
  await page.locator('label.pl', { hasText: 'Oberrohrtasche' }).getByRole('combobox').selectOption({ label: `${P} Oberrohrtasche` });
  await bag(page, `${P} Oberrohrtasche`).getByRole('button', { name: 'Material dazu' }).click();
  const pick = page.getByRole('dialog', { name: /Material in/ });
  await pick.getByLabel('Suchen').fill('Stirnlampe');
  await pick.getByRole('checkbox', { name: `${P} Stirnlampe 90 g` }).check();
  await pick.getByRole('button', { name: '1 hinzufügen' }).click();
  await expect(bag(page, `${P} Oberrohrtasche`)).toContainText(`${P} Stirnlampe`);
  // No front roll: the quilt has no bag any more.
  await page.locator('label.pl', { hasText: 'Lenkerrolle' }).getByRole('combobox').selectOption({ label: 'Keine Tasche' });
  await expect(page.locator('.loose')).toContainText(`${P} Quilt`);
  await noSideways(page);
  await shot(page, info, 'ts2');

  // Back to the list: copy, rename, delete (one question, then 4 s «Rückgängig»).
  await page.getByRole('navigation', { name: 'Pfad' }).getByRole('link', { name: 'Mein Setup' }).click();
  await expect(card(page, 'Bikepacking 3 Tage')).toContainText('noch nicht benutzt');
  await card(page, 'Bikepacking 3 Tage').getByRole('button', { name: /^Kopieren/ }).click();
  await expect(card(page, 'Bikepacking 3 Tage \\(Kopie\\)')).toBeVisible();
  await card(page, 'Bikepacking 3 Tage \\(Kopie\\)').getByRole('button', { name: /^Umbenennen/ }).click();
  const ren = page.getByRole('dialog', { name: 'Setup umbenennen' });
  await ren.getByRole('textbox').fill('Winter');
  await ren.getByRole('button', { name: /Fertig|Speichern/ }).click();
  await expect(card(page, 'Winter')).toBeVisible();
  await card(page, 'Winter').getByRole('button', { name: 'Mehr zu Winter' }).click();
  await page.getByRole('menuitem', { name: /Löschen/ }).click();
  await page.getByRole('dialog', { name: 'Setup «Winter» löschen?' }).getByRole('button', { name: 'Löschen' }).click();
  await expect(card(page, 'Winter')).toHaveCount(0);
  await expect(page.locator('.rtoast')).toContainText('«Winter» gelöscht.');
  await page.locator('.rtoast').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(card(page, 'Winter')).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'ts1');
  expect(errors).toEqual([]);
});

test('Setups vergleichen: two side by side and all as a table', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=rig&bike=${GRAVEL}`);
  await page.getByRole('button', { name: 'Neues Setup' }).click();
  const dlg = page.getByRole('dialog', { name: 'Neues Setup' });
  await dlg.getByLabel('Name').fill('Tagestour leicht');
  await dlg.getByRole('button', { name: 'Erstellen' }).click();
  await page.locator('label.pl', { hasText: 'Satteltasche' }).getByRole('combobox').selectOption({ label: 'Keine Tasche' });
  await page.getByRole('navigation', { name: 'Pfad' }).getByRole('link', { name: 'Mein Setup' }).click();

  await page.getByRole('link', { name: 'Vergleichen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Setups vergleichen' })).toBeVisible();
  // A = Standard (last used), B = Tagestour leicht: no seat pack in B, 400 g bag + 1.47 kg contents less.
  const seat = page.locator('.cmp .r', { hasText: 'Satteltasche' }).first();
  await expect(seat).toContainText('hier keine Tasche');
  await expect(seat.locator('.dpill')).toHaveText('−1.87 kg');
  await expect(page.locator('.only')).toContainText(`Nur in A (2)`);
  await page.getByRole('button', { name: 'A und B tauschen' }).click();
  await expect(page.locator('.cmp .r', { hasText: 'Satteltasche' }).first().locator('.dpill')).toHaveText('+1.87 kg');
  await noSideways(page);
  await shot(page, info, 'ts3');

  await page.getByRole('link', { name: 'Alle als Tabelle' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Alle Setups' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Tagestour leicht/ })).toBeVisible();
  await expect(page.locator('tr.sum')).toContainText('13.1 kg');
  await expect(page.getByRole('link', { name: '2 nebeneinander' })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'ts4');
  expect(errors).toEqual([]);
});

test('Tour planen: choose a setup, undo it, take a moved item into the setup', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // A second setup on the Gravel with the tent in the frame bag.
  await page.goto(`./#/bikes?tab=rig&bike=${GRAVEL}`);
  await page.getByRole('button', { name: 'Neues Setup' }).click();
  const dlg = page.getByRole('dialog', { name: 'Neues Setup' });
  await dlg.getByLabel('Name').fill('Bikepacking 3 Tage');
  await dlg.getByRole('button', { name: 'Erstellen' }).click();
  await bag(page, `${P} Satteltasche`).getByRole('button', { name: 'verschieben' }).click();
  await page.getByLabel(`${P} Zelt verschieben nach`).selectOption({ label: `2 ${P} Rahmentasche` });
  await expect(bag(page, `${P} Rahmentasche`)).toContainText(`${P} Zelt`);

  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), `${P}jura`);
  await page.goto('./#/pack');
  const chip = page.getByRole('button', { name: 'Setup: Standard' });
  await expect(chip).toBeVisible();
  // The bottle cage with its 0.75 L bottle is not «over 0.75 L».
  await expect(page.getByText('über 0.75 L')).toHaveCount(0);
  await chip.click();
  const box = page.getByRole('group', { name: /Setups von/ });
  await expect(box.getByRole('button', { name: /Bikepacking 3 Tage/ })).toContainText('1 Teil wird verschoben');
  await shot(page, info, 'ts5');
  await box.getByRole('button', { name: /Bikepacking 3 Tage/ }).click();
  await expect(page.getByRole('button', { name: 'Setup: Bikepacking 3 Tage' })).toBeVisible();
  await expect(page.locator('.rtoast')).toContainText('Setup «Bikepacking 3 Tage» für diese Tour.');
  await page.locator('.rtoast').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('button', { name: 'Setup: Standard' })).toBeVisible();

  // Back on «Bikepacking 3 Tage», the tent goes back into the seat pack for this trip only: the trip
  // differs from its setup, «Ins Setup übernehmen» saves it there.
  await page.getByRole('button', { name: 'Setup: Standard' }).click();
  await page.getByRole('group', { name: /Setups von/ }).getByRole('button', { name: /Bikepacking 3 Tage/ }).click();
  await expect(page.getByRole('button', { name: 'Setup: Bikepacking 3 Tage' })).toBeVisible();
  await page.locator('[aria-controls="calm-bag-frame"]').click();
  await page.locator('#calm-bag-frame').getByRole('button', { name: new RegExp(`${P} Zelt`) }).click();
  await page.getByLabel(`${P} Zelt verschieben nach`).selectOption({ label: 'Satteltasche' });
  await expect(page.getByText('Diese Tour weicht von ihrem Setup ab.')).toBeVisible();
  await page.getByRole('button', { name: 'Ins Setup übernehmen' }).click();
  await expect(page.getByText('Diese Tour weicht von ihrem Setup ab.')).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});
