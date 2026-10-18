// «Inspiration» (UC2-1, UC2-2, UC2-4; mockups 13.10.2026, Noah «3b» + «a», 4a, 5a): your own links on one
// page (computer: sidebar under the five places; phone: Ich › Inspiration), the kind recognised from the
// address, the filter, and a note that becomes a packing rule shown while packing.
// Fictional v048 fixture plus a planned trip on the Gravel and one race-rig link of Velos › Setup.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { v048Data, P, GRAVEL, day } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const TRIP = `${P}jura`;
const SHOTS = process.env.INSP_SHOTS;
const shot = async (page, info, name) => SHOTS && (await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true }));
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

function data() {
  const fix = v048Data();
  const T = fix.tables;
  const gravel = T.bikes.find((b) => b.id === GRAVEL);
  const item = (id, name, category, weightG) => ({ id: `${P}${id}`, name: `${P} ${name}`, category, weightG, ownership: 'owned', domains: ['bikepacking'] });
  T.items.push(item('zelt', 'Zelt', 'sleep', 1050), item('werkzeug', 'Werkzeug-Set', 'tools', 320));
  const e = (id, slot) => ({ itemId: `${P}${id}`, slot, qty: 1, packed: false });
  T.trips.push({ id: TRIP, domain: 'bikepacking', title: `${P} Jura Wochenende`, startDate: day(3), days: 2, bikeId: GRAVEL, bike: gravel.name, setup: { ...(gravel.setup ?? {}) }, entries: [e('zelt', 'seat'), e('werkzeug', 'seat')], ready: [], status: 'planned', createdAt: `${day(-1)}T08:00:00.000Z` });
  T.settings.push({
    key: 'rigLinks',
    value: [{ id: `${P}doom`, kind: 'rig', url: 'https://example.org/bikes/rigs-of-doom-2025/', title: `${P} Rigs of Doom 2025`, year: 2025, notes: [`${P} Über 90 Rigs`], packKg: null, raceDate: null, raceEnd: null, raceId: null, star: false, addedAt: `${day(-5)}T08:00:00.000Z` }],
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
  const file = info.outputPath('inspiration.json');
  writeFileSync(file, JSON.stringify(data()));
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

/** Paste a link on the page, check the recognised kind, give a title and key words, save. */
async function addLink(page, url, kind, title, words = '') {
  await page.locator('form.if-add').getByLabel('Link').fill(url);
  await page.locator('form.if-add').getByRole('button', { name: 'Link hinzufügen' }).click();
  const dlg = page.getByRole('dialog', { name: 'Link hinzufügen' });
  await expect(dlg.getByText(`Erkannt: ${kind}`)).toBeVisible();
  await expect(dlg.getByRole('radio', { name: kind })).toBeChecked();
  await dlg.getByLabel('Titel').fill(title);
  if (words) await dlg.getByLabel(/Deine Stichworte/).fill(words);
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(dlg).toHaveCount(0);
}

test('Inspiration: add links, kind recognised, filter, a note becomes a packing rule shown while packing', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const phone = info.project.name === 'phone';

  // Computer: the entry under the five places (with «neu»); phone: Ich › Inspiration, not in the bottom bar.
  await page.goto('./#/');
  if (phone) {
    await expect(page.locator('nav').getByRole('link', { name: 'Inspiration' })).toHaveCount(0);
    await page.goto('./#/me');
    await page.locator('main').getByRole('link', { name: /Inspiration/ }).click();
  } else {
    const entry = page.locator('aside.side').getByRole('link', { name: /Inspiration/ });
    await expect(entry).toContainText('neu');
    await entry.click();
    await expect(entry).toHaveAttribute('aria-current', 'page');
    await expect(entry).not.toContainText('neu');
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Inspiration' })).toBeVisible();
  // Impeccable Runde 2: the path «Ich › Inspiration» like the other pages under Ich, phone and computer
  await expect(page.locator('main .vhead .crumbs').getByRole('link', { name: 'Ich' })).toBeVisible();

  // The rig of Velos › Setup is already here (one list, never twice).
  await expect(page.locator('article.ic-card', { hasText: `${P} Rigs of Doom 2025` })).toContainText('Rig');

  // UC2-4: the kind from the address; you can change it.
  await addLink(page, 'https://www.komoot.com/collection/2139311', 'Route', `${P} Jura Runde`, 'St-Ursanne → Neuchâtel');
  await addLink(page, 'https://bikepacking.com/plog/complete-guide-to-bikepacking-bags/', 'Anleitung', `${P} Guide to Bikepacking Bags`, 'Schweres tief und mittig');
  const route = page.locator('article.ic-card', { hasText: `${P} Jura Runde` });
  await expect(route.locator('.ic-badge')).toHaveText('Route');
  await expect(route.getByRole('link', { name: /Auf komoot\.com öffnen/ })).toHaveAttribute('href', 'https://www.komoot.com/collection/2139311');
  await expect(route.getByRole('button', { name: '→ Tourentwurf' })).toBeVisible();
  // An unknown site: the app says so and you choose.
  await page.locator('form.if-add').getByLabel('Link').fill('https://example.org/something');
  await page.locator('form.if-add').getByRole('button', { name: 'Link hinzufügen' }).click();
  const dlg = page.getByRole('dialog', { name: 'Link hinzufügen' });
  await expect(dlg.getByText('Die App erkennt die Art an dieser Adresse nicht. Wähle sie unten.')).toBeVisible();
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(dlg.getByRole('alert')).toHaveText('Wähle die Art des Links.');
  await dlg.getByText('Hör-Tipp', { exact: true }).click();
  await dlg.getByLabel('Titel').fill(`${P} Podcast über Schlaf`);
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('article.ic-card', { hasText: `${P} Podcast über Schlaf` }).locator('.ic-badge')).toHaveText('Hör-Tipp');

  // Filter by kind and back.
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: 'Routen' }).click();
  await expect(page.locator('article.ic-card')).toHaveCount(1);
  await expect(page.locator('article.ic-card h3')).toHaveText(`${P} Jura Runde`);
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: 'Alle' }).click();
  await expect(page.locator('article.ic-card')).toHaveCount(4);
  await noSideways(page);
  await shot(page, info, 'uc2-1');

  // UC2-2: the note «Das übernehme ich» becomes a packing rule.
  const guide = page.locator('article.ic-card', { hasText: `${P} Guide to Bikepacking Bags` });
  await guide.getByLabel('Das übernehme ich').fill('Werkzeug in die Rahmentasche');
  await guide.getByRole('button', { name: '→ Packregel' }).click();
  const take = page.getByRole('dialog', { name: 'Aus der Notiz wird …' });
  await expect(take.getByRole('radio', { name: /Packregel/ })).toBeChecked();
  await expect(take.getByText('Beim Packen: Werkzeug in die Rahmentasche')).toBeVisible();
  await expect(take.getByText('So sieht es beim Packen aus')).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'uc2-2');
  await take.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(take).toHaveCount(0);
  await expect(page.getByRole('status').getByText('Packregel: Werkzeug in die Rahmentasche')).toBeVisible();
  await expect(page.locator('.if-recent')).toContainText('Packregel: Werkzeug in die Rahmentasche');

  // 5a: while packing, the rule shows as a quiet hint with its source.
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  await page.goto('./#/pack');
  const hint = page.locator('[data-inspo-hint]', { hasText: 'Werkzeug in die Rahmentasche' });
  await expect(hint).toContainText('Aus deiner Inspiration: Werkzeug in die Rahmentasche (bikepacking.com)');
  await hint.getByRole('button', { name: 'Warum?' }).click();
  await expect(hint).toContainText(`Deine Notiz zu «${P} Guide to Bikepacking Bags»`);
  await noSideways(page);
  await shot(page, info, 'uc2-pack');
  // «✕» hides it from packing; the rule stays under «Was die App gelernt hat».
  await hint.getByRole('button', { name: 'Diesen Hinweis ausblenden' }).click();
  await expect(page.locator('[data-inspo-hint]')).toHaveCount(0);
  await page.goto('./#/debrief/learnings');
  await expect(page.getByText('Werkzeug in die Rahmentasche')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Inspiration: a link shared from the browser opens «Link hinzufügen»; the Inbox stays one tap away', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./?title=${encodeURIComponent(`${P} Atlas Mountain Race 2027`)}&url=${encodeURIComponent('https://www.themountainraces.cc/atlas-mountain-race')}`);
  const dlg = page.getByRole('dialog', { name: 'Link hinzufügen' });
  await expect(dlg.getByText('Erkannt: Rennen')).toBeVisible();
  await expect(dlg.getByLabel('Titel')).toHaveValue(`${P} Atlas Mountain Race 2027`);
  await shot(page, info, 'uc2-4');
  await dlg.getByRole('button', { name: 'Lieber in den Eingang' }).click();
  await expect(page.getByRole('dialog').getByRole('textbox').first()).toHaveValue(/themountainraces\.cc/);
  expect(errors).toEqual([]);
});
