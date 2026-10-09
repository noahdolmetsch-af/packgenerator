// v0.49.0 R1 «Rückblick ruhig» (Noah 1b, 2a, 3a, 4a-7a), German UI, phone and desktop:
// a) One page «Rückblick» (#/debrief): the last ride with its one main button, «Letzte 12 Monate» with
//    Vorjahr, Durchschnitt and Bestwert, «Touren im Vergleich» (7 small charts + a table, base
//    switchable), Tempo, Gelernt and Logbuch one level below; «Fahrt hochladen» is a quiet link.
// b) The old addresses #/review and #/debrief/compare lead there (no dead links).
// c) Past trips is one table, also on a phone: the trip name stays fixed, the other columns scroll
//    inside the table, the page never sideways; period, «Art» and a search that finds learnings.
// d) A trip's saved Rückblick tells km, Hm, time, weather, plan against real, what was not used,
//    learnings and what it means for the next trip; «Antworten ändern» still opens the answers.
// Fictional data (r1-fixture.js); every outside request is blocked. SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { r1Data, P, D0 } from './r1-fixture.js';

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
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(panel.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

test('a) one Rückblick page: last ride, 12 months, trips compared, one level below', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Rückblick' })).toBeVisible();
  // 1. the last ride, its debrief still open: the page's one main button
  const last = main.locator('section.lastride');
  await expect(last.getByRole('heading', { level: 2, name: 'Abendrunde Hügel' })).toBeVisible();
  await expect(last).toContainText('42');
  await expect(last).toContainText('780');
  await expect(last).toContainText('2:58');
  await expect(last).toContainText('trocken');
  await expect(last).toContainText('9–14°');
  await expect(last).toContainText(/Geplant .* min schneller/);
  await expect(main.locator('.btn.hi')).toHaveCount(1);
  await expect(last.getByRole('link', { name: 'Rückblick schreiben' })).toBeVisible();
  // 2. the 12 months with Vorjahr, Durchschnitt, Bestwert; switch to Alle
  const per = main.locator('section.period');
  await expect(per.getByRole('heading', { level: 2, name: 'Letzte 12 Monate' })).toBeVisible();
  const km = per.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Distanz' }) });
  await expect(km).toContainText('1’541');
  await expect(km).toContainText('Ø 171 km');
  await expect(km).toContainText('Sommertour drei Etappen: 498');
  await main.getByRole('group', { name: 'Zeitraum' }).getByRole('button', { name: 'Alle' }).click();
  await expect(per.getByRole('heading', { level: 2, name: 'Alle Jahre' })).toBeVisible();
  await expect(per.getByRole('columnheader', { name: 'Vorjahr' })).toHaveCount(0);
  // 3. trips compared: 7 small charts, a table of the last 10; «Gleiche Art» keeps the day rides
  const cmp = main.locator('#compare');
  await expect(cmp.locator('.mini')).toHaveCount(7);
  await expect(cmp.locator('tbody tr')).toHaveCount(10);
  await cmp.getByRole('button', { name: 'Gleiche Art' }).click();
  await expect(cmp.locator('tbody tr')).toHaveCount(5);
  await expect(cmp).toContainText('Tagestour');
  // 4. one level below
  for (const [name, url] of [['Dein Tempo', /#\/debrief\/pace$/], ['Alle Learnings', /#\/debrief\/learnings$/], ['Logbuch', /#\/debrief\/logbook$/]]) {
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
  await expect(table.getByRole('columnheader')).toHaveText(['Tour', 'km', 'Hm', 'Zeit', 'Wetter', 'Temp.', 'Velo', 'Learning · Besonderes', 'Öffnen']);
  await expect(row('Herbsttour Hochland')).toContainText('2’210');
  await expect(row('Herbsttour Hochland')).toContainText('Regen Tag 2');
  await expect(row('Herbsttour Hochland')).toContainText('4–15°');
  await expect(row('Herbsttour Hochland')).toContainText('Überschuhe ab 8 °C mitnehmen');
  await expect(row('Abendrunde Hügel')).toContainText('Rückblick offen');
  await expect(main.getByText('Alte Seerunde')).toHaveCount(0); // older than 12 months
  // the page never scrolls sideways; on a phone the table does, the name column stays
  await noSideways(page);
  if (info.project.name === 'phone') {
    const box = main.locator('.tbox');
    expect(await box.evaluate((b) => b.scrollWidth > b.clientWidth)).toBe(true);
    const before = await table.locator('tbody th.first').first().boundingBox();
    await box.evaluate((b) => (b.scrollLeft = 250));
    const after = await table.locator('tbody th.first').first().boundingBox();
    expect(Math.round(after.x)).toBe(Math.round(before.x));
    await noSideways(page);
    await shot(page, info, 'vergangene-gescrollt');
    await box.evaluate((b) => (b.scrollLeft = 0));
  }
  await shot(page, info, 'vergangene');
  // the search finds a learning
  await main.getByRole('searchbox', { name: 'Touren und Learnings suchen' }).fill('riegel');
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(1);
  await expect(row('Drei-Täler-Loop')).toBeVisible();
  await main.getByRole('searchbox').fill('');
  // Art: one button, a short list
  await main.getByRole('button', { name: /^Art: Alle/ }).click();
  await main.getByRole('button', { name: 'Rennen' }).click();
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(1);
  await expect(row('Passfahrt')).toBeVisible();
  await main.getByRole('button', { name: /^Art: Rennen/ }).click();
  await main.getByRole('button', { name: 'Alle', exact: true }).last().click();
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
  await expect(ride.getByRole('heading', { level: 2, name: 'Herbsttour Hochland' })).toBeVisible();
  for (const v of ['148', '2’210', '11:05', '13.4', '4–15°', 'Regen Tag 2', 'Gravel Grau', 'Tag 1', 'Tag 2']) await expect(ride).toContainText(v);
  const pvr = main.locator('section', { has: page.getByRole('heading', { name: 'Plan und Wirklichkeit' }) });
  await expect(pvr).toContainText('142 km');
  await expect(pvr).toContainText('zu deinen Gunsten');
  const unused = main.locator('section', { has: page.getByRole('heading', { name: /Nicht gebraucht/ }) });
  await expect(unused).toContainText('kannst du sparen');
  await expect(unused).toContainText('Hoodie');
  const next = main.locator('section.nextc');
  await expect(next).toContainText('Wirkt auf die nächste Tour');
  await expect(next).toContainText('Wochenende Hochland');
  await expect(next).toContainText('Buff');
  const learned = main.locator('section', { has: page.getByRole('heading', { name: /Gelernt/ }) });
  await expect(learned).toContainText('Licht-Akku reicht bei Kälte nur 2 h');
  await noSideways(page);
  await shot(page, info, 'tour-rueckblick');
  await main.getByRole('button', { name: 'Antworten ändern' }).click();
  await expect(main.getByRole('heading', { name: 'Was war anders?' })).toBeVisible();
  expect(errors).toEqual([]);
});
