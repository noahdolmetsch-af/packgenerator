// v0.49.0 R1 «Rückblick ruhig» (Noah 1b, 2a, 3a, 4a-7a), German UI, phone and desktop:
// a) One page «Rückblick» (#/debrief): the last ride with its one main button, «Letzte 12 Monate» with
//    Vorjahr, Durchschnitt and Bestwert, «Touren im Vergleich» (7 small charts + a table, base
//    switchable), Tempo, Gelernt and Logbuch one level below; «Fahrt hochladen» is a quiet link.
// b) The old addresses #/review and #/debrief/compare lead there (no dead links).
// c) Past trips is one table (SN4: cards on a phone, a column Zustand), the page never sideways;
//    period, «Art» and a search that finds learnings.
// d) A trip's saved Rückblick tells km, Hm, time, weather, plan against real, what was not used,
//    learnings and what it means for the next trip; «Antworten ändern» still opens the answers.
// Fictional data (r1-fixture.js); every outside request is blocked. SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { r1Data, P, D0 } from './r1-fixture.js';
import { openData, settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const SHOTS = process.env.SHOTS;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/v0490-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(r1Data()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T17:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page); // the tidy-up after the import done, Today decided
  await expect(panel.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

test('a) one Rückblick page: last ride, 12 months, trips compared, one level below', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Rückblick' })).toBeVisible();
  // 1. SN2 «Seiten neu»: the trip whose debrief is missing on top, «Bewerten» the page's one main button
  const hero = main.locator('[data-open-debrief]');
  await expect(hero.getByText('Abendrunde Hügel', { exact: true })).toBeVisible();
  await expect(main.locator('.btn.hi')).toHaveCount(1);
  await expect(hero.getByRole('link', { name: 'Bewerten: Abendrunde Hügel' })).toBeVisible();
  // the last ride's numbers are folded at the end
  // 0.159.1 (UI-Regeln Teil 2): on a phone «Letzte Fahrt» is a closed line first
  if (info.project.name === 'phone') await main.locator('[data-group="rv-last"] .ls-gh').click();
  await main.getByRole('button', { name: 'Zahlen der letzten Fahrt' }).click();
  const last = main.locator('.lastride');
  await expect(last).toContainText('42');
  await expect(last).toContainText('780');
  await expect(last).toContainText('2:58');
  await expect(last).toContainText('trocken');
  await expect(last).toContainText('9–14°');
  // the German words come from the app source (0.136.0 writes «Min», not «min»)
  const faster = DE['{n} min faster'].replace('{n}', '\\d+');
  await expect(last).toContainText(new RegExp(`Geplant .* ${faster}`));
  await expect(main.locator('.btn.hi')).toHaveCount(1);
  // 2. the 12 months with Vorjahr, Durchschnitt, Bestwert (open under «Alle Kennzahlen», answer 2b); switch to Alle
  const per = main.locator('section.period');
  await expect(per.getByRole('heading', { level: 2, name: 'Letzte 12 Monate' })).toBeVisible();
  // 0.159.1 (Noah 14.10.2026 «a»): on a phone the table starts closed, one tap opens it
  if (info.project.name === 'phone') await per.getByRole('button', { name: 'Alle Kennzahlen' }).click();
  await expect(per.getByRole('button', { name: 'Alle Kennzahlen' })).toHaveAttribute('aria-expanded', 'true');
  const km = per.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Distanz' }) });
  await expect(km).toContainText('1’541');
  await expect(km).toContainText('Ø 171 km');
  await expect(km).toContainText('Sommertour drei Etappen: 498');
  await main.getByRole('group', { name: 'Zeitraum' }).getByRole('button', { name: 'Alle' }).click();
  await expect(per.getByRole('heading', { level: 2, name: 'Alle Jahre' })).toBeVisible();
  await expect(per.getByRole('columnheader', { name: 'Vorjahr' })).toHaveCount(0);
  // 3. trips compared: a table of the last 10 with their state; 7 small charts folded; «Gleiche Art» keeps the day rides
  const cmp = main.locator('#compare');
  const phone = info.project.name === 'phone';
  if (phone) await main.locator('[data-group="rv-compare"] .ls-gh').click(); // 0.159.1: a closed line on a phone
  await expect(cmp.locator('table.st tbody tr')).toHaveCount(10);
  await expect(cmp.locator('table.st tbody tr [data-state]').first()).toBeAttached();
  await cmp.getByRole('button', { name: 'Diagramme und alle Spalten' }).click();
  await expect(cmp.locator('.mini')).toHaveCount(7);
  await cmp.getByRole('button', { name: 'Gleiche Art' }).click();
  await expect(cmp.locator('table.st tbody tr')).toHaveCount(5);
  await expect(cmp).toContainText('Tagestour');
  // 4. one level below
  for (const [name, url, line] of [['Dein Tempo', /#\/debrief\/pace$/, 'rv-pace'], ['Alle Erkenntnisse', /#\/debrief\/learnings$/, 'rv-learned'], ['Logbuch', /#\/debrief\/logbook$/, null]]) {
    if (phone && line) await main.locator(`[data-group="${line}"] .ls-gh`).click();
    await main.locator('.below').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(main.locator('h1')).toBeVisible();
    await main.locator('.crumb').getByRole('link', { name: 'Rückblick' }).click();
    await expect(page).toHaveURL(/#\/debrief$/);
  }
  await main.getByRole('link', { name: 'Fahrt hochladen' }).first().click();
  await expect(page).toHaveURL(/#\/debrief\/ride$/);
  await page.goto('./#/debrief');
  await noSideways(page);
  await shot(page, info, 'rueckblick');
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 700 });
    await noSideways(page);
  }
  expect(errors).toEqual([]);
});

test('b) the old addresses lead to the Rückblick', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/compare');
  await expect(page).toHaveURL(/#\/debrief$/);
  await expect(page.locator('#compare')).toBeInViewport();
  await page.goto('./#/review');
  await expect(page).toHaveURL(/#\/debrief$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Letzte 12 Monate' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('c) Past trips: one table, the name fixed, filters and a search that finds learnings', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/pack/past');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Vergangene Touren' })).toBeVisible();
  const table = main.locator('table.tt');
  const row = (name) => table.locator('tbody tr').filter({ has: page.getByRole('rowheader', { name: new RegExp(name) }) });
  // SN4 «Seiten neu»: a column Zustand; the learning stands under the name.
  // SN4+ «SN4 plus» (answer 2, 3b): Hm, Fahrzeit, Verstrichen, Ø km/h, Ø Puls, Max. Puls, Velo (its type), Wetter, Temp., Strava-Kommentar
  if (info.project.name === 'desktop') await expect(table.getByRole('columnheader')).toHaveText(['Tour', 'Zustand', 'km', 'Hm', 'Fahrzeit', 'Verstrichen', 'Ø km/h', 'Ø Puls', 'Max. Puls', 'Velo', 'Wetter', 'Temp.', 'Strava-Kommentar', 'Öffnen']);
  await expect(row('Herbsttour Hochland')).toContainText('148');
  await expect(row('Herbsttour Hochland')).toContainText('Regen Tag 2');
  await expect(row('Herbsttour Hochland')).toContainText('4–15°');
  await expect(row('Herbsttour Hochland')).toContainText('Überschuhe ab 8 °C mitnehmen');
  await expect(row('Herbsttour Hochland')).toContainText('Bewertet');
  await expect(row('Abendrunde Hügel')).toContainText('Abgeschlossen');
  await expect(row('Abendrunde Hügel').getByRole('link', { name: 'Bewerten: Abendrunde Hügel' })).toBeVisible();
  await expect(main.getByText('Alte Seerunde')).toHaveCount(0); // older than 12 months
  // the page never scrolls sideways; on a phone every trip is a card
  await noSideways(page);
  if (info.project.name === 'phone') await expect(table.locator('thead')).toBeHidden();
  await shot(page, info, 'vergangene');
  // the search finds a learning
  await main.getByRole('searchbox', { name: 'Touren und Erkenntnisse suchen' }).fill('riegel');
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(1);
  await expect(row('Drei-Täler-Loop')).toBeVisible();
  await main.getByRole('searchbox').fill('');
  // Art: one button, a short list
  await main.getByRole('button', { name: /^Art: Alle/ }).click();
  await main.getByRole('button', { name: 'Rennen' }).click();
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(1);
  await expect(row('Passfahrt')).toBeVisible();
  await main.getByRole('button', { name: /^Art: Rennen/ }).click();
  // v0.109.0 Design-Refresh P6: «Art» stands before «Zeitraum» now, so the list's own «Alle»
  await main.getByRole('list', { name: 'Art' }).getByRole('button', { name: 'Alle', exact: true }).click();
  // period: Alle shows the older trips too
  await main.getByRole('group', { name: 'Zeitraum' }).getByRole('button', { name: 'Alle' }).click();
  await expect(row('Alte Seerunde')).toBeVisible();
  // a row opens the trip's debrief
  await row('Herbsttour Hochland').getByRole('link').first().click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${P}herbst$`));
  if (info.project.name === 'phone') {
    await page.goto('./#/pack/past');
    await page.setViewportSize({ width: 320, height: 700 });
    await noSideways(page);
  }
  expect(errors).toEqual([]);
});

test("d) a trip's saved Rückblick tells what the trip was", async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${P}herbst`);
  const main = page.locator('main');
  const ride = main.locator('section.ride');
  // v0.109.0 Design-Refresh P6: the card says «Fertig. Gute Tour!»; the trip's name is the line under it
  await expect(ride.getByRole('heading', { level: 2, name: 'Fertig. Gute Tour!' })).toBeVisible();
  await expect(ride.locator('.kick')).toContainText('Herbsttour Hochland');
  for (const v of ['148', '2’210', '11:05', '13.4', '4–15°', 'Regen Tag 2', 'Gravel Grau']) await expect(ride).toContainText(v);
  // SN2x: the days of a multi-day trip are a table under «Strecke»; the other groups fold open
  for (const v of ['Tag 1', 'Tag 2']) await expect(main.locator('[data-day-table]')).toContainText(v);
  for (const key of ['pack', 'next']) await main.locator(`section[data-group="${key}"] button.gb`).click();
  const pvr = main.locator('section:not([data-group])', { has: page.getByRole('heading', { name: 'Plan und Wirklichkeit' }) });
  await expect(pvr).toContainText('142 km');
  await expect(pvr).toContainText('zu deinen Gunsten');
  const unused = main.locator('section:not([data-group])', { has: page.getByRole('heading', { name: /Nicht gebraucht/ }) });
  await expect(unused).toContainText('kannst du sparen');
  await expect(unused).toContainText('Hoodie');
  const next = main.locator('section.nextc');
  await expect(next).toContainText('Wirkt auf die nächste Tour');
  await expect(next).toContainText('Wochenende Hochland');
  await expect(next).toContainText('Buff');
  const learned = main.locator('section:not([data-group])', { has: page.getByRole('heading', { name: /Gelernt/ }) });
  await expect(learned).toContainText('Licht-Akku reicht bei Kälte nur 2 h');
  await noSideways(page);
  await shot(page, info, 'tour-rueckblick');
  await main.getByRole('button', { name: 'Antworten ändern' }).click();
  await expect(main.getByRole('heading', { name: 'Was hast du nicht gebraucht?' })).toBeVisible();
  expect(errors).toEqual([]);
});
