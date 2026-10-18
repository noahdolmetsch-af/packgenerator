// UC3 Velos › Setup (Noah 14.10.2026 «1-5a», «UC3-1-UC3-3 freigeben»): one page per bike with photos,
// total weight, bag plan, setup log, «Dein Velo im Vergleich», races and your own race-rig links.
// Fictional v048 fixture plus a trip on the Gravel with bags, own links and one log entry.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { v048Data, P, GRAVEL, day } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = process.env.RIG_SHOTS;
const shot = async (page, info, name) => SHOTS && (await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true }));
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

function data() {
  const fix = v048Data();
  const T = fix.tables;
  const gravel = T.bikes.find((b) => b.id === GRAVEL);
  Object.assign(gravel, { weightG: 9400, slots: ['seat', 'frame', 'top', 'bar', 'fork'], setup: { seat: `${P}b-seat`, frame: `${P}b-frame`, top: `${P}b-top`, bar: `${P}b-bar` } });
  gravel.setupLog = [{ id: `${P}log1`, date: day(-40), kind: 'drive', title: `${P} Kettenblatt 40 → 38 Z.`, before: '40 Z.', after: '38 Z.', why: `${P} Steile Anstiege`, deltaG: 0, source: { type: 'own', id: null, label: '' }, part: null, backAsked: false, at: `${day(-40)}T08:00:00.000Z` }];
  T.containers = [
    ...(T.containers ?? []),
    { id: `${P}b-seat`, name: `${P} Satteltasche`, slot: 'seat', volumeL: 13, weightG: 400 },
    { id: `${P}b-frame`, name: `${P} Rahmentasche`, slot: 'frame', volumeL: 5, weightG: 200 },
    { id: `${P}b-top`, name: `${P} Oberrohrtasche`, slot: 'top', volumeL: 1.5, weightG: 120 },
    { id: `${P}b-bar`, name: `${P} Lenkerrolle`, slot: 'bar', volumeL: 14, weightG: 300 },
  ];
  const item = (id, name, category, weightG, volumeL) => ({ id: `${P}${id}`, name: `${P} ${name}`, category, weightG, volumeL, ownership: 'owned', domains: ['bikepacking'] });
  T.items.push(item('zelt', 'Zelt', 'sleep', 1050, 6), item('kocher', 'Kocher', 'cook', 420, 1), item('regen', 'Regenjacke', 'rain', 250, 1.5), item('quilt', 'Quilt', 'sleep', 600, 7), item('lampe', 'Stirnlampe', 'light', 90, 0.2));
  const e = (id, slot) => ({ itemId: `${P}${id}`, slot, qty: 1, packed: false });
  T.trips.push({ id: `${P}jura`, domain: 'bikepacking', title: `${P} Jura Wochenende`, startDate: day(3), days: 2, bikeId: GRAVEL, bike: gravel.name, setup: { ...gravel.setup }, entries: [e('zelt', 'seat'), e('kocher', 'seat'), e('regen', 'seat'), e('quilt', 'bar'), e('lampe', 'fork')], ready: [], status: 'planned', createdAt: `${day(-1)}T08:00:00.000Z` });
  T.visits.push({ id: `${P}v-kette`, bikeId: GRAVEL, date: day(-10), km: 2100, shop: `${P} Velo shop`, parts: [{ part: 'chain', action: 'replace', model: `${P} Kette 12`, chf: 49 }] });
  const link = (id, extra) => ({ id: `${P}${id}`, kind: 'rig', notes: [], packKg: null, raceDate: null, raceEnd: null, raceId: null, star: false, addedAt: `${day(-5)}T08:00:00.000Z`, ...extra });
  T.settings.push({
    key: 'rigLinks',
    value: [
      link('race', { kind: 'race', url: 'https://example.org/race-alpen-2027', title: `${P} Rennen Alpen 2027`, year: 2027, raceDate: '2027-08-14', raceEnd: '2027-08-22' }),
      link('doom', { url: 'https://example.org/bikes/rigs-of-doom-2025/', title: `${P} Rigs of Doom 2025`, year: 2025, notes: [`${P} Über 90 Rigs`], packKg: 6, raceId: `${P}race` }),
    ],
  });
  return fix;
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const file = info.outputPath('setup-rig.json');
  writeFileSync(file, JSON.stringify(data()));
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

test('Setup: photos, weight, bag plan, log, compare, races and own links on one page', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=rig&bike=${GRAVEL}`);
  await expect(page.locator('nav.ptabs').getByRole('link', { name: 'Setup' })).toHaveAttribute('aria-current', /page|true/);
  // Impeccable Runde 2 (Setup 1+3): its own head «Setup»; «Fotos vom Setup»; compare, races and ideas in a fold
  // «Ideen und Rennen · n Links», open because links are there.
  await expect(page.getByRole('heading', { level: 1, name: 'Setup', exact: true })).toBeVisible();
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  await expect(page.locator('.ifold details.fold')).toHaveAttribute('open', '');
  await expect(page.locator('.ifold summary')).toContainText('Ideen und Rennen');
  for (const h of ['Fotos vom Setup', 'Gesamtgewicht', 'Taschen-Plan', 'Setup-Logbuch', 'Dein Velo im Vergleich', 'Deine Rennen', 'Ideen von anderen']) await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
  // Total: bike 9.4 + luggage (bags 1.02 + gear 2.41) = 12.8 kg; the saved rig had 6 kg luggage.
  // Setup 2: the weights name their trip
  await expect(page.locator('section[aria-labelledby="rg-weight"] .bh p')).toContainText('für test_data_gtp_ Jura Wochenende');
  await expect(page.locator('.tot b').first()).toHaveText('12.8 kg');
  await expect(page.getByLabel('Deine gespeicherten Rigs')).toContainText('du leichter');
  // The newest log entry with its km line, the race with its rig.
  await expect(page.getByText(`${P} Kettenblatt 40 → 38 Z.`)).toBeVisible();
  await expect(page.getByText('1 Rig dieses Rennens')).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'uc3-1');

  // A link of your own: the title comes from the address, the picture is drawn.
  await page.getByRole('button', { name: 'Link hinzufügen' }).click();
  const dlg = page.getByRole('dialog', { name: 'Link hinzufügen' });
  await dlg.getByLabel('Link').fill('example.org/bikes/2026-colorado-trail-race-rigs/');
  await dlg.getByLabel(/Deine Stichworte/).fill(`${P} Rennen auf dem Trail`);
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  const card = page.locator('article.rc', { has: page.getByRole('heading', { name: '2026 Colorado Trail Race Rigs' }) });
  await expect(card).toContainText(`${P} Rennen auf dem Trail`);
  await expect(card.getByRole('link', { name: /Fotos auf example\.org ansehen/ })).toHaveAttribute('href', 'https://example.org/bikes/2026-colorado-trail-race-rigs/');
  await card.getByRole('button', { name: /merken$/ }).click();
  await page.getByRole('button', { name: 'Gemerkt' }).click();
  await expect(page.locator('article.rc')).toHaveCount(1);
  await page.getByRole('button', { name: '2025' }).click();
  await expect(page.locator('article.rc h3')).toHaveText(`${P} Rigs of Doom 2025`);

  // A comparison row of your own, sent to the inbox as a note.
  await page.getByRole('button', { name: 'Zeile hinzufügen' }).click();
  await page.getByLabel('Was', { exact: true }).fill('Dynamo');
  await page.getByLabel('Dein Velo', { exact: true }).fill('nein');
  await page.getByLabel('Bei Rigs gesehen', { exact: true }).fill('oft');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Du: nein')).toBeVisible();
  await page.getByRole('button', { name: '→ Notiz' }).click();
  await expect(page.getByRole('button', { name: 'Im Eingang' })).toBeDisabled();
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Taschen-Plan: numbered bags, weight split, a hint moves an item, loose items', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=rig&bike=${GRAVEL}`);
  await page.getByRole('link', { name: 'Ganzer Taschen-Plan' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Taschen-Plan' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Satteltasche' })).toBeVisible();
  await expect(page.getByText(`Noch ohne Tasche (1):`)).toBeVisible();
  await shot(page, info, 'uc3-2');
  // The tent (1.05 kg) in the seat pack: «lower and more central» into the frame bag.
  const hint = page.locator('.sug', { hasText: `${P} Zelt` });
  await hint.getByRole('button', { name: 'Warum?' }).click();
  await expect(hint).toContainText('Regel:');
  await hint.getByRole('button', { name: 'Verschieben' }).click();
  const frame = page.locator('section.bg', { has: page.getByRole('heading', { name: 'Rahmentasche' }) });
  await expect(frame).toContainText(`${P} Zelt`);
  // The rain jacket goes within reach (top tube bag); dismissing keeps it where it is.
  const rain = page.locator('.sug', { hasText: `${P} Regenjacke` });
  await rain.getByRole('button', { name: 'Hinweis ausblenden' }).click();
  await expect(rain).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Setup-Logbuch: a workshop job goes into the log, an own change is written down', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=rig&bike=${GRAVEL}&view=log`);
  await expect(page.getByRole('heading', { level: 1, name: 'Setup-Logbuch' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: `${P} Kettenblatt 40 → 38 Z.` })).toBeVisible();
  // The workshop replaced the chain: «Ins Logbuch?»
  await page.locator('.sug', { hasText: 'Ins Logbuch?' }).getByRole('button', { name: 'Ins Logbuch' }).click();
  const dlg = page.getByRole('dialog', { name: 'Änderung eintragen' });
  await expect(dlg.getByLabel('Was du geändert hast')).toHaveValue(/Kette/);
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 3, name: /Kette.*test_data_gtp_ Kette 12/ })).toBeVisible();
  await expect(page.locator('.sug', { hasText: 'Ins Logbuch?' })).toHaveCount(0);
  // An own change, then the filter by kind.
  await page.getByRole('button', { name: 'Änderung eintragen' }).click();
  const own = page.getByRole('dialog', { name: 'Änderung eintragen' });
  await own.getByLabel('Art').selectOption('tyres');
  await own.getByLabel('Vorher').fill('40 mm');
  await own.getByLabel('Nachher').fill('45 mm');
  await own.getByLabel('Gewicht-Änderung (g)').fill('+180');
  await own.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { level: 3, name: '40 mm → 45 mm' })).toBeVisible();
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: 'Laufräder und Reifen' }).click();
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: 'Alle' }).click();
  await shot(page, info, 'uc3-3');
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: 'Laufräder und Reifen' }).click();
  await expect(page.locator('article.te')).toHaveCount(1);
  await expect(page.locator('article.te')).toContainText('Gewicht +180 g');
  await noSideways(page);
  expect(errors).toEqual([]);
});
