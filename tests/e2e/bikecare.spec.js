// v0.30.1 (Noah's phone test of 0.29.2, D1 + D2): Bike care on the phone, in German.
// D1: "km kann nicht gespeichert werden": the km field takes "2'287", "2 287", "2.287" and
//     "2287,4", saves on Enter, on leaving the field and with a Save button, and says it saved.
// D2: a part "Ersetzt oder erledigt" (sealant every 90 days): the entry is stored with date and km,
//     the sealant is no longer due, and the screen says so.
// Fictional data only (test_data_gtp_ names), built from tests/e2e/pf-fixture.json.
// BIKECARE_SHOTS=<folder> saves a screenshot after the sealant is saved (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// v0.30.2: messages show the day as people read it ("8. Okt. 2026").
const shown = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const BIKE = `${P}scale`;
const GRAVEL = `${P}gravel`;

/** The PF fixture, plus a tubeless Scale and Gravel whose sealant was last topped up 120 days ago (overdue). */
function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  for (const bike of fix.tables.bikes.filter((b) => [BIKE, GRAVEL].includes(b.id))) {
    bike.tyreSetup = { front: 'tubeless', rear: 'tubeless' };
    bike.parts.push({ key: 'tyres', model: '', history: [{ date: day(-120), km: bike.km - 700, action: 'service', result: 'done' }] });
  }
  const path = info.outputPath('bikecare-fixture.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  const file = fixtureFile(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

/** One bike as stored in IndexedDB. */
const stored = (page, id) =>
  page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction('bikes').objectStore('bikes').get(id);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
    id,
  );

test('D1: km in Bike care save with Swiss and German separators, Enter, leaving the field and Save', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${BIKE}&open=1`);
  const care = page.locator(`#care-${BIKE}`);
  const km = care.getByLabel('km jetzt');
  await expect(km).toBeVisible();

  // Enter on the phone keyboard.
  await km.fill("3'287");
  await km.press('Enter');
  await expect(care.getByRole('status')).toContainText('gespeichert');
  await expect.poll(async () => (await stored(page, BIKE)).km).toBe(3287);
  await expect(care.locator('summary.bike-h')).toContainText('3’287 km');

  // Leaving the field (tap somewhere else).
  await km.fill('3 400');
  await care.locator('h3').first().click();
  await expect.poll(async () => (await stored(page, BIKE)).km).toBe(3400);

  // German thousands dot, then the Save button.
  await km.fill('3.512');
  await care.getByRole('button', { name: 'km speichern' }).click();
  await expect.poll(async () => (await stored(page, BIKE)).km).toBe(3512);
  await expect(care.getByRole('status')).toContainText('3’512 km');

  // A decimal comma is rounded, not multiplied by ten.
  await km.fill('3600,4');
  await km.press('Enter');
  await expect.poll(async () => (await stored(page, BIKE)).km).toBe(3600);
  await expect(km).toHaveValue('3600');
  expect((await stored(page, BIKE)).kmDate).toBe(day(0));

  // Nonsense is refused with a message, and nothing is lost.
  await km.fill('abc');
  await km.press('Enter');
  await expect(care.getByRole('alert')).toContainText('ganze Zahl');
  expect((await stored(page, BIKE)).km).toBe(3600);
  await expect(km).toHaveValue('abc');
  // An emptied field does not wipe the km: it goes back to the stored number.
  await km.fill('');
  await km.press('Enter');
  await expect(km).toHaveValue('3600');
  expect((await stored(page, BIKE)).km).toBe(3600);

  // After a reload it is still there.
  await page.goto('./#/');
  await page.goto(`./#/bikes?tab=care&bike=${BIKE}&open=1`);
  await expect(page.locator(`#care-${BIKE}`).getByLabel('km jetzt')).toHaveValue('3600');
  expect(errors).toEqual([]);
});

test('D2: sealant "Ersetzt oder erledigt" is stored with date and km and is no longer due', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${BIKE}&open=1`);
  const due = page.locator('section.due');
  await expect(due).toContainText('Dichtmilch nachfüllen');
  const care = page.locator(`#care-${BIKE}`);
  await care.getByRole('button', { name: /^Reifen \+ Dichtmilch/ }).click();
  const dlg = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Reifen + Dichtmilch' }) });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('button', { name: 'Ersetzt oder erledigt' }).click();
  await expect(dlg).toBeHidden();

  // Stored: date and km.
  await expect.poll(async () => (await stored(page, BIKE)).parts.find((p) => p.key === 'tyres').history.at(-1)).toMatchObject({ date: day(0), km: 3200, action: 'replace', result: 'done' });
  // Seen: a short confirmation, no longer due, the next date in 90 days.
  await expect(page.getByRole('status').filter({ hasText: 'Reifen + Dichtmilch' })).toContainText(`Gespeichert: Reifen + Dichtmilch, erledigt, ${shown(day(0))} · 3’200 km. Nächstes Mal ${shown(day(90))}.`);
  await expect(due.locator('li').filter({ hasText: 'Scott Scale 940: Dichtmilch nachfüllen' })).toHaveCount(0);
  const row = care.locator('.checks li').filter({ hasText: 'Dichtmilch nachfüllen' });
  await expect(row).toContainText(day(90));
  await expect(care.getByRole('button', { name: /^Reifen \+ Dichtmilch/ })).toContainText(day(0));
  if (process.env.BIKECARE_SHOTS) await page.screenshot({ path: `${process.env.BIKECARE_SHOTS}/bikecare-sealant-saved-${info.project.name}.png` });

  // The same from the "due now" list: "Erledigt" on the Gravel's sealant.
  const gravel = due.locator('li').filter({ hasText: 'Gravel Grinder: Dichtmilch nachfüllen' });
  await gravel.getByRole('button', { name: 'Erledigt' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Gespeichert' })).toContainText(`Reifen + Dichtmilch, gewartet, ${shown(day(0))} · 8’000 km. Nächstes Mal ${shown(day(90))}.`);
  await expect(gravel).toHaveCount(0);
  await expect.poll(async () => (await stored(page, GRAVEL)).parts.find((p) => p.key === 'tyres').history.at(-1)).toMatchObject({ date: day(0), km: 8000, action: 'service', result: 'done' });

  // After a reload nothing comes back.
  await page.reload();
  await expect(page.locator('section.due')).toBeVisible();
  await expect(page.locator('section.due')).not.toContainText('Dichtmilch nachfüllen');
  expect(errors).toEqual([]);
});
