// v0.61.0 R2 «Tempo + Logbuch» (Noah ★a), German UI, phone 390 and desktop:
// a) «Dein Tempo»: the rule in one sentence; with 4 rides it says 1 is missing, the 5th ride switches
//    the riding-time guess to your rule by itself (visible), «Zurück zur Standardregel» undoes it
//    (stored as a setting) and «Meine Regel nutzen» takes it back.
// b) «Logbuch»: all trips and the logbook's entries, newest first; filter by year and area; a tap
//    opens the trip.
// c) «Gelernt»: every learning flat by topic, nothing folded.
// Every page: no sideways scroll on the phone, tap targets of 44 px. Fictional data (v0530-fixture.js).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tempoData, rideGpx, P, D0, day } from './v0530-fixture.js';

const SHOTS = process.env.SHOTS;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
/** Phone: every button, select, search field and row link in the page is at least 44 px high (and wide). */
async function targets(page, info) {
  if (info.project.name !== 'phone') return;
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('main button, main select, main input[type=search], main a.row, main a.lnk, main .crumb a, main label.btn, main label.pick')]
      .filter((el) => el.getBoundingClientRect().width > 1)
      .map((el) => ({ el: `${el.tagName} ${el.className} ${el.textContent.trim().slice(0, 30)}`, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.height < 43.5 || x.r.width < 43.5)
      .map((x) => `${x.el} ${Math.round(x.r.width)}×${Math.round(x.r.height)}`),
  );
  expect(small).toEqual([]);
}
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const paceSetting = async (page) => (await table(page, 'settings')).find((s) => s.key === 'pace')?.value;

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/v0530-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(tempoData({ paceRides: 4 })));
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

test('a) Dein Tempo: one sentence, your rule from the 5th ride, one tap back', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/pace');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Dein Tempo' })).toBeVisible();
  const rule = main.locator('section.rule');
  await expect(rule.getByRole('heading', { level: 2 })).toHaveText(/^Im Flachen fährst du [\d.]+ km\/h und brauchst 1 h pro [\d’']+ Hm\.$/);
  // 4 rides: still the standard, 1 is missing
  await expect(rule).toContainText('Standardregel');
  await expect(rule).toContainText(/Die Höhenmeter bekommen ihre eigene Zeit: mit den Höhenmetern fahren deine Fahrten im Schnitt [\d.]+ km\/h\./);
  await expect(rule.getByRole('status')).toContainText('Noch 1 Fahrt, dann übernimmt deine Regel die Fahrzeit.');
  await expect(main.locator('.mini')).toHaveCount(3);
  await shot(page, info, 'tempo-4');
  await noSideways(page);
  await targets(page, info);

  // the 5th ride (GPX): your rule takes over by itself, visibly
  await main.locator('section.rides-c input[type=file]').setInputFiles({ name: 'fahrt.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(rideGpx({ name: 'Testfahrt Fünf', date: day(-1) })) });
  await expect(main.getByText('1 Fahrt hinzugefügt.')).toBeVisible();
  await expect(rule).toContainText('Deine Regel · aus 5 Fahrten');
  await expect(rule.getByRole('status')).toContainText('Packen und Unterwegs schätzen die Fahrzeit jetzt mit deiner Regel');
  expect(await paceSetting(page)).toMatchObject({ n: 5 });
  await shot(page, info, 'tempo-5');
  // the Rückblick says it too
  await page.goto('./#/debrief');
  await expect(page.locator('main section.sub', { hasText: 'Dein Tempo' })).toContainText('Die Fahrzeit rechnet mit deiner Regel (aus 5 Fahrten).');

  // one tap back to the standard rule, stored; and back to your rule
  await page.goto('./#/debrief/pace');
  await rule.getByRole('button', { name: 'Zurück zur Standardregel' }).click();
  await expect(rule.getByRole('status')).toContainText('wie von dir gewählt');
  await expect.poll(async () => (await paceSetting(page)).standard).toBe(true);
  await page.reload();
  await expect(rule).toContainText('Standardregel · von dir gewählt');
  await targets(page, info);
  await rule.getByRole('button', { name: 'Meine Regel nutzen' }).click();
  await expect(rule).toContainText('Deine Regel · aus 5 Fahrten');
  await expect.poll(async () => (await paceSetting(page)).standard).toBe(false);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) Logbuch: all trips newest first, filter by year and area, a tap opens the trip', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/logbook');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Logbuch' })).toBeVisible();
  const log = main.locator('#logbook');
  const rows = log.locator('ul.log > li');
  await expect(rows).toHaveCount(15);
  await expect(rows.first()).toContainText('Abendrunde Hügel');
  await expect(rows.first()).toContainText('42 km');
  await expect(rows.first()).toContainText('780 Hm');
  await expect(rows.first()).toContainText('2:58 h');
  await expect(rows.first()).toContainText('trocken');
  await expect(rows.first()).toContainText('9–14°');
  const herbst = rows.filter({ hasText: 'Herbsttour Hochland' });
  await expect(herbst).toContainText('Regen Tag 2');
  await expect(herbst).toContainText('Überschuhe ab 8 °C mitnehmen');
  await expect(rows.last()).toContainText('aus Excel');
  await shot(page, info, 'logbuch');
  await noSideways(page);
  await targets(page, info);

  // the year
  await log.getByLabel('Jahr').selectOption('2025');
  await expect(rows).toHaveCount(3);
  await expect(log).toContainText('3 Einträge · von 15');
  await expect(log).toContainText('Brevet 300 aus der Liste');
  // the area
  await log.getByLabel('Jahr').selectOption('all');
  await log.getByRole('group', { name: 'Reiseart' }).getByRole('button', { name: 'Skitour' }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Skitour Hochgipfel');
  await expect(rows.first()).toContainText('-8–-2°');
  await shot(page, info, 'logbuch-ski');
  await log.getByRole('group', { name: 'Reiseart' }).getByRole('button', { name: 'Alle' }).click();
  await expect(rows).toHaveCount(15);

  // a tap opens the trip
  await herbst.getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${P}herbst$`));
  expect(errors).toEqual([]);
});

test('c) Gelernt: every learning flat by topic', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/learnings');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Gelernt' })).toBeVisible();
  const box = main.locator('#learnings');
  await expect(box.locator('details')).toHaveCount(0);
  await expect(box.getByRole('heading', { level: 3 })).toHaveCount(4);
  await expect(box.getByText('Überschuhe ab 8 °C mitnehmen')).toBeVisible();
  await expect(box.getByText('Licht-Akku reicht bei Kälte nur 2 h')).toBeVisible();
  await box.getByRole('searchbox').fill('flaschen');
  await expect(box.locator('li')).toHaveCount(1);
  await shot(page, info, 'gelernt');
  await noSideways(page);
  await targets(page, info);
  expect(errors).toEqual([]);
});
