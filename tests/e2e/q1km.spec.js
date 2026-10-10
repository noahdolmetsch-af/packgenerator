// v0.68.0 «Q1 Jeder km zählt»: the ride ledger per bike, «Import rides» (Strava CSV with the bike
// column, FIT files with the sensor), start points of the parts with the Q1 status, and the weekly
// card on Today. Fictional data only (q1km-fixture.js); every action is undone once.
import { test, expect } from '@playwright/test';
import { q1File, q1Data, q1ImportFiles, NEU, GRAVEL, day } from './q1km-fixture.js';

const SHOTS = process.env.Q1_SHOTS;
const shot = async (page, info, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const shown = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const num = (n) => n.toLocaleString('de-CH');
const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
    name,
  );

async function start(page, context, info) {
  const file = q1File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
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

const { appKm } = q1Data();
const bike = (page, id = NEU) => page.locator(`#care-${id}`);
const book = (page, id = NEU) => bike(page, id).locator('section.kmbook');

test('the ride ledger: the km are the sum of the rides; an unclear ride counts only after you confirm it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${NEU}&open=1`);
  const kb = book(page);
  await expect(kb.getByRole('heading', { name: 'Fahrten-Buch · km-Verlauf' })).toBeVisible();
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm)} km`);
  await expect(kb.getByText('1 Fahrt wartet auf dich')).toBeVisible();
  await expect(bike(page).locator('.ah .sub')).toContainText('aus dem Fahrten-Buch');
  // the unclear ride: red, with the reason and the bike buttons right there
  const open = kb.locator('li.row.open');
  await expect(open).toHaveCount(1);
  await expect(open).toContainText('Zählt erst nach Bestätigung.');
  await expect(open).toContainText('Widerspruch: Strava sagt Demo Neu, die Regel für MTB sagt Demo Hardtail.');
  await expect(kb.locator('li.row').filter({ hasText: 'Korrektur' }).first()).toContainText('Grund: Fahrt doppelt, beide Geräte liefen');
  await shot(page, info, 'km-buch');
  await noSideways(page);
  await open.getByRole('button', { name: 'Demo Neu', exact: true }).click();
  await expect(kb.locator('li.row.open')).toHaveCount(0);
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm + 14)} km`);
  await expect(bike(page).locator('.ah .sub')).toContainText(`${num(appKm + 14)} km`);
  // Undo puts it back as it was
  await page.locator('p.notice').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(kb.locator('li.row.open')).toHaveCount(1);
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm)} km`);

  // a ride by hand: its own entry, nothing overwritten
  await kb.getByRole('button', { name: 'km eintragen' }).click();
  await kb.locator('form.fm').getByPlaceholder('22', { exact: true }).fill('12');
  await kb.locator('form.fm').getByPlaceholder('z. B. Arbeitsweg ohne Gerät').fill('Kurzer Weg');
  await kb.locator('form.fm').getByRole('button', { name: 'Speichern' }).click();
  await expect(kb.locator('li.row').filter({ hasText: 'Kurzer Weg' })).toContainText('Hand');
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm + 12)} km`);
  // a correction needs a reason
  await kb.getByRole('button', { name: 'Korrektur', exact: true }).click();
  await kb.locator('form.fm').getByPlaceholder('-6', { exact: true }).fill('-2');
  await kb.locator('form.fm').getByRole('button', { name: 'Speichern' }).click();
  await expect(kb.getByRole('alert')).toHaveText('Sag warum: Der Grund bleibt bei der Korrektur.');
  await kb.locator('form.fm').getByPlaceholder('z. B. Fahrt doppelt, beide Geräte liefen').fill('Tacho-Test');
  await kb.locator('form.fm').getByRole('button', { name: 'Speichern' }).click();
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm + 10)} km`);
  // leave a ride out: it stays, struck through, and does not count; take it back
  const row = kb.locator('li.row').filter({ hasText: 'Kurzer Weg' });
  await row.getByRole('button', { name: /Ändern oder weglassen/ }).click();
  await row.getByRole('button', { name: 'Weglassen', exact: true }).click();
  await expect(row).toHaveClass(/gone/);
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm - 2)} km`);
  await row.getByRole('button', { name: /Ändern oder weglassen/ }).click();
  await row.getByRole('button', { name: 'Zurückholen', exact: true }).click();
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm + 10)} km`);
  // the old counter of another bike became its opening entry (migration), nothing lost
  await page.goto(`./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  await expect(book(page, GRAVEL).locator('li.row')).toHaveCount(1);
  await expect(book(page, GRAVEL).locator('li.row')).toContainText('Startwert: der bisherige Zähler');
  await expect(book(page, GRAVEL).locator('li.row')).toContainText('12’800 km');
  const gravel = (await table(page, 'kmBook')).filter((e) => e.bikeId === GRAVEL);
  expect(gravel).toMatchObject([{ kind: 'start', km: 12800, inclusive: true }]);
  expect(errors).toEqual([]);
});

test('import rides: Check first, then per bike; duplicates merged; Take over and Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${NEU}&open=1`);
  await book(page).getByRole('link', { name: 'Fahrten importieren' }).click();
  await expect(page).toHaveURL(/view=import/);
  await expect(page.getByRole('heading', { name: 'Fahrten importieren' })).toBeVisible();
  await page.locator('.kmi input[type=file]').setInputFiles(q1ImportFiles(info));
  await expect(page.getByText(/Fahrten gelesen\./)).toBeVisible();
  // «Check» on top: the ride with the profile «Rad» has no bike; it counts only after you chose one
  const check = page.locator('section.check');
  await expect(check.getByRole('heading', { name: 'Prüfen · 1' })).toBeVisible();
  await expect(check).toContainText('Kein Velo in Strava, keine Regel für das Profil «Rad».');
  await expect(check.locator('select')).toHaveValue('');
  // per bike: the new ride from two units is one ride, merged; a ride already in the ledger is marked
  const neu = page.locator('section.pb').filter({ has: page.getByRole('heading', { name: 'Demo Neu' }) });
  await expect(neu.locator('li.ir').filter({ hasText: 'Uetliberg Gravel' }).first()).toContainText('Strava-Velo');
  await expect(neu.getByText('doppelt: wird zusammengeführt')).toBeVisible();
  await expect(neu.getByText('doppelt: schon drin')).toBeVisible(); // Rundfahrt Albis is in the ledger already
  await expect(neu.locator('li.ir').filter({ hasText: 'Edge 1040' }).filter({ hasText: 'Sensor …4F2A' })).toContainText('sicher');
  // the rules sit right here and can be changed
  await expect(page.locator('ol.rules')).toContainText('Sensor …4F2A');
  await expect(page.locator('ol.rules')).toContainText('wie Strava');
  await shot(page, info, 'import');
  await noSideways(page);
  // a sensor serial no rule knows: asked once, the answer becomes a rule and decides from now on
  const ask = page.locator('ul.hints li').filter({ hasText: 'Zu welchem Velo gehört der Sensor …1234?' });
  await ask.locator('select').selectOption({ label: 'Demo Gravel' });
  await ask.getByRole('button', { name: 'Merken' }).click();
  await expect(page.locator('ol.rules')).toContainText('Sensor …1234');
  await expect(page.locator('ul.hints li').filter({ hasText: '…1234' })).toHaveCount(0);
  await expect(page.locator('section.check')).toHaveCount(0);
  const gr = page.locator('section.pb').filter({ has: page.getByRole('heading', { name: 'Demo Gravel' }) });
  await gr.getByRole('button', { name: 'zeigen' }).click();
  await expect(gr.locator('li.ir').filter({ hasText: 'Sensor …1234' })).toContainText('sicher');
  expect((await table(page, 'settings')).find((x) => x.key === 'kmRules').value.some((r) => r.kind === 'sensor' && r.value === 'BEEF1234')).toBe(true);
  // the Hardtail is folded (sure enough); «zeigen» opens it
  const ht = page.locator('section.pb').filter({ has: page.getByRole('heading', { name: 'Demo Hardtail' }) });
  await ht.getByRole('button', { name: 'zeigen' }).click();
  await expect(ht.locator('li.ir').filter({ hasText: 'Hardtail Hügel' }).locator('select')).toHaveValue(/scale/);
  await expect(page.locator('dl.sum')).toContainText('zum Prüfen, zählen noch nicht0');
  await page.getByRole('button', { name: 'Übernehmen', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`bike=${NEU}`));
  const kb = book(page);
  await expect(kb.locator('.banner')).toContainText('Eben übernommen: 4 Fahrten aus activities.csv und 3 FIT-Dateien.');
  await expect(kb.locator('li.row').filter({ hasText: 'Uetliberg Gravel' })).toContainText('FIT-Datei');
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(Math.round(appKm + 35.2 + 27.3))} km`);
  const neuBike = (await table(page, 'bikes')).find((b) => b.id === NEU);
  expect(neuBike.strava.km).toBe(76.4); // Strava's own total: every activity with this bike in the CSV
  await kb.locator('.banner').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(kb.locator('li.row').filter({ hasText: 'Uetliberg Gravel' })).toHaveCount(0);
  await expect(kb.locator('.tot .bignum').first()).toHaveText(`${num(appKm)} km`);
  expect(errors).toEqual([]);
});

test('Today: the weekly card compares with Strava; taking the value confirms the unclear ride', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./');
  const card = page.locator('section.kmc');
  await expect(card.getByRole('heading', { name: `km abgleichen: Strava sagt ${num(appKm + 14)} km, App sagt ${num(appKm)} km` })).toBeVisible();
  await expect(card).toContainText(`Vermutlich die unklare Fahrt vom ${shown(day(-7))} (14 km).`);
  await expect(card.getByText('Fahrten zuordnen')).toBeVisible();
  await expect(card.locator('ul.open li')).toContainText('Feierabendrunde');
  await shot(page, info, 'abgleich-heute');
  await noSideways(page);
  await card.getByRole('button', { name: 'Strava-Wert übernehmen' }).click();
  await expect(page.locator('p.notice')).toContainText('1 Fahrt bestätigt: Demo Neu stimmt jetzt mit Strava.');
  await expect(page.locator('section.kmc h2', { hasText: 'km abgleichen' })).toHaveCount(0);
  const open = (await table(page, 'kmBook')).filter((e) => e.state === 'open');
  expect(open).toHaveLength(0);
  await page.locator('p.notice').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.locator('section.kmc h2', { hasText: 'km abgleichen' })).toBeVisible();
  // «später»: the comparison waits until next week, the ride to assign stays
  await page.locator('section.kmc').getByRole('button', { name: 'später' }).click();
  await expect(page.locator('section.kmc h2').first()).toHaveText('1 Fahrt wartet auf ihr Velo');
  expect(errors).toEqual([]);
});

test('start points: Q1 status on top, a part without one shows without start point, set', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${NEU}&open=1`);
  const q1 = bike(page).locator('section.q1');
  await expect(q1).toContainText('Q1 Lückenlose km');
  await expect(q1).toContainText('fast erfüllt');
  await expect(q1).toContainText('2 Teile ohne Startpunkt');
  await expect(q1).toContainText('fehlt: Bremsbeläge hinten, Griffe');
  const pads = bike(page).locator('button.prow').filter({ has: page.locator('.nm').getByText('Bremsbeläge hinten', { exact: true }) });
  await expect(pads).toContainText('ohne Startpunkt');
  const chain = bike(page).locator('button.prow').filter({ has: page.locator('.nm').getByText('Kette', { exact: true }) });
  await expect(chain).toContainText(`${shown(day(-35))} · bei 0 km`);
  await expect(chain.locator('.sn')).toHaveText(`${num(appKm)} km`);
  await shot(page, info, 'teile-start');
  await noSideways(page);
  // «setzen» opens the start point; the bike km of that day come from the ledger
  await pads.locator('[data-set]').click();
  const dlg = page.getByRole('dialog', { name: 'Startpunkt: Bremsbeläge hinten' });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText(/Aus dem Fahrten-Buch: \d/)).toBeVisible();
  await dlg.getByRole('button', { name: 'Speichern und weiter' }).click();
  // next: the grips, they came from another bike with their km
  const dlg2 = page.getByRole('dialog', { name: 'Startpunkt: Griffe' });
  await expect(dlg2).toBeVisible();
  await dlg2.getByLabel('Von einem anderen Velo?').selectOption({ label: 'Demo Gravel' });
  await dlg2.getByLabel('km schon am Teil').fill('1850');
  await dlg2.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(q1).toContainText('Griffe von Demo Gravel: 1’850 km mitgebracht');
  await expect(q1).not.toContainText('fehlt:');
  await expect(q1).toContainText('alle 18 Teile');
  const grips = bike(page).locator('button.prow').filter({ has: page.locator('.nm').getByText('Griffe', { exact: true }) });
  await expect(grips).toContainText('von Demo Gravel, brachte 1’850 km mit');
  // «Hide for this bike»: a suggestion, never a must
  await q1.getByRole('button', { name: 'Für dieses Velo ausblenden' }).click();
  await expect(bike(page).locator('section.q1')).toHaveCount(0);
  await bike(page).getByRole('button', { name: 'Q1 «Lückenlose km» für dieses Velo prüfen' }).click();
  await expect(bike(page).locator('section.q1')).toBeVisible();
  expect(errors).toEqual([]);
});
