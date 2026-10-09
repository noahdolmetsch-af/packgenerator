// v0.31.0 (Velopflege redesign, answers 8a and 10a, mockup v3-pflege): one bike open, the others
// one row each; per part the last work with me / bike shop; the filter at the top; the trip as one
// folded row; "Done by: me / bike shop" in the dialog instead of the page head.
// Fictional data only (test_data_gtp_ names), built from tests/e2e/pf-fixture.json.
// CARE_SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const shown = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const SPARK = `${P}spark`;
const SCALE = `${P}scale`;
const SHOP = `${P} Velo shop`;

/** The PF fixture with a Spark that has a full history: my own work, three workshop visits, due things. */
function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const spark = fix.tables.bikes.find((b) => b.id === SPARK);
  const e = (n, km, over) => ({ date: day(n), km, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...over });
  spark.tyreSetup = { front: 'tubeless', rear: 'tubeless' };
  spark.parts = [
    { key: 'chain', model: 'Shimano XT', history: [e(-30, 4700, { action: 'service', result: 'done' }), e(-9, 4950, { value: 0.4 })] },
    { key: 'padsF', model: '', history: [e(-9, 4950, { value: 55 })] },
    { key: 'padsR', model: '', history: [e(-9, 4950, { value: 70 })] },
    { key: 'rotorF', model: '', history: [e(-120, 4300, { value: 1.75 })] },
    { key: 'tyres', model: 'Maxxis Rekon', history: [e(-80, 4500, { action: 'service', result: 'done', sealantMl: 60 })] },
    { key: 'shifting', model: '', history: [e(-60, 4600, { result: 'needed', note: `${P} springt im 3. Gang` })] },
  ];
  fix.tables.visits = [
    { id: `${P}v1`, bikeId: SPARK, date: day(-200), km: 3900, shop: SHOP, totalChf: 129, parts: [{ part: 'cassette', action: 'replace', chf: 129, what: `${P} Kassette` }] },
    { id: `${P}v2`, bikeId: SPARK, date: day(-120), km: 4300, shop: SHOP, parts: [{ part: 'padsR', action: 'replace', chf: 68.5 }, { part: 'wheels', action: 'service', what: `${P} Hinterrad zentriert` }] },
    { id: `${P}v3`, bikeId: SPARK, date: day(-400), km: 2500, shop: SHOP, parts: [{ part: 'fork', action: 'service', chf: 180 }, { part: 'shock', action: 'service', chf: 150 }] },
  ];
  const path = info.outputPath('care-accordion-fixture.json');
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

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const shot = async (page, info, name, fullPage = false) => {
  if (process.env.CARE_SHOTS) await page.screenshot({ path: `${process.env.CARE_SHOTS}/${name}-${info.project.name}.png`, fullPage });
};

test('accordion: one bike open, the others one row; last work per part with me / bike shop', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
  const spark = page.locator(`#care-${SPARK}`);
  const scale = page.locator(`#care-${SCALE}`);
  const sparkBtn = spark.getByRole('button', { name: `${P} Scott Spark 960`, exact: true });
  const scaleBtn = scale.getByRole('button', { name: `${P} Scott Scale 940`, exact: true });
  await expect(sparkBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(scaleBtn).toHaveAttribute('aria-expanded', 'false');
  // The old switch at the top is gone (answer 10a).
  await expect(page.getByText('Arbeit gemacht von')).toHaveCount(0);
  // A closed bike: one row with km and a badge.
  await expect(scale).toContainText('3’200 km');
  await expect(scale.locator('.badge')).toHaveText(/fällig|keine Daten/);
  await expect(scale.locator('.parts')).toHaveCount(0);

  // v0.38.0 (Noah 5a): one list, what is due first (worst on top), with its button in the row:
  // my own job "Erledigt", the bike shop's with the shop sign.
  const row = (name) => spark.locator('li.pt').filter({ has: page.getByRole('button', { name: new RegExp(`^${name}`) }) });
  const due = spark.locator('li.pt.due');
  expect(await due.count()).toBeGreaterThan(3);
  await expect(due.first().locator('.st')).toHaveText(/Arbeit nötig|überfällig/);
  await expect(row('Gabel').locator('.act .who.mech')).toHaveText('Velomech');
  await expect(row('Kette').getByRole('button', { name: 'Erledigt' })).toBeVisible();
  // Parts that are fine are folded as "n ok" with their names (6a).
  const ok = spark.locator('.okfold');
  await expect(ok).toHaveText(/\d+ ok/);
  await expect(ok).toContainText('Kassette');
  await ok.click();

  // One row per part: what, when, km, CHF; the shop sign only on the bike shop's work; a state badge and what comes next.
  await expect(row('Kassette')).toContainText(`ersetzt ${shown(day(-200))} · CHF 129`);
  await expect(row('Kassette').locator('.kmv')).toHaveText('3’900');
  await expect(row('Kassette').locator('.who')).toHaveText('Velomech');
  await expect(row('Kassette')).toContainText('1’100 km alt');
  await expect(row('Kette')).toContainText(`gewachst ${shown(day(-30))}`);
  await expect(row('Kette')).toContainText(`gemessen 0.4 % am ${shown(day(-9))}`);
  await expect(row('Kette').locator('.who')).toHaveCount(0); // "me" is not on every row any more
  await expect(row('Kette').locator('.st')).toHaveText('fällig');
  await expect(row('Gabel').locator('.st')).toHaveText('überfällig');
  await expect(row('Schaltung').locator('.st')).toHaveText('Arbeit nötig');
  await expect(row('Bremsbeläge vorne').locator('.st')).toHaveText('bald');
  await expect(row('Bremsbeläge vorne')).toContainText('unter 50 % ersetzen');
  // Tube or tubeless as a switch per wheel inside the opened tyre row (7a).
  await expect(row('Reifen').getByRole('group', { name: 'Vorne: Schlauch oder tubeless' })).toHaveCount(0);
  await spark.getByRole('button', { name: /^Reifen/ }).click();
  await expect(row('Reifen').getByRole('group', { name: 'Vorne: Schlauch oder tubeless' }).getByRole('button', { name: 'Tubeless' })).toHaveAttribute('aria-pressed', 'true');
  // Folded: parts without data, the 1000 km check, the log.
  await expect(spark.locator('summary').filter({ hasText: 'Ohne Daten' })).toContainText('Teile');
  await expect(spark.locator('summary').filter({ hasText: '1’000-km-Check' })).toBeVisible();
  await expect(spark.locator('summary').filter({ hasText: 'Logbuch' })).toBeVisible();
  // For the bike shop and the year: one folded row "Velomech & 2026".
  await expect(spark.getByRole('button', { name: 'Werkstattauftrag senden' })).toHaveCount(0);
  await spark.locator('summary').filter({ hasText: /Velomech & \d{4}/ }).click();
  await expect(spark.getByRole('button', { name: 'Werkstattauftrag senden' })).toBeVisible();
  await expect(spark.getByRole('region', { name: /an diesem Velo/ })).toContainText('Velomech');
  await expect(spark).toContainText(SHOP);
  await noSideways(page);
  await shot(page, info, 'care-open');
  await shot(page, info, 'care-open-full', true);

  // Opening another bike closes the first.
  await scaleBtn.click();
  await expect(scaleBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(sparkBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(spark.locator('li.pt')).toHaveCount(0);
  await expect(spark.locator('.badge')).toContainText('fällig');
  // Closing it leaves all closed.
  await scaleBtn.click();
  await expect(scaleBtn).toHaveAttribute('aria-expanded', 'false');
  expect(errors).toEqual([]);
});

test('filter: all parts, only due, by me, by the bike shop; remembered', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
  const spark = page.locator(`#care-${SPARK}`);
  const chips = page.getByRole('group', { name: 'Teile zeigen' });
  const names = () => spark.locator('li.pt .part-btn').allTextContents();
  await expect(chips.getByRole('button', { name: 'Alle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await spark.locator('.okfold').click();
  const all = await names();
  expect(all.length).toBeGreaterThanOrEqual(8);

  await chips.getByRole('button', { name: 'Velomech', exact: true }).click();
  await expect.poll(names).not.toEqual(all);
  if (await spark.locator('.okfold[aria-expanded=false]').count()) await spark.locator('.okfold').click();
  const shop = await names();
  expect(shop.some((n) => n.startsWith('Kassette'))).toBe(true);
  expect(shop.some((n) => n.startsWith('Gabel'))).toBe(true);
  expect(shop.some((n) => n.startsWith('Kette'))).toBe(false);

  await chips.getByRole('button', { name: 'von mir' }).click();
  if (await spark.locator('.okfold[aria-expanded=false]').count()) await spark.locator('.okfold').click();
  await expect.poll(async () => (await names()).some((n) => n.startsWith('Kette'))).toBe(true);
  expect((await names()).some((n) => n.startsWith('Kassette'))).toBe(false);

  await chips.getByRole('button', { name: 'Fällig', exact: true }).click();
  await expect(spark.locator('.okfold')).toHaveCount(0);
  await expect.poll(async () => (await names()).length).toBeLessThan(all.length);
  for (const st of await spark.locator('li.pt .st').allTextContents()) expect(['fällig', 'überfällig', 'Arbeit nötig']).toContain(st.trim());
  await noSideways(page);
  await shot(page, info, 'care-filter-due');

  await page.reload();
  await expect(page.getByRole('group', { name: 'Teile zeigen' }).getByRole('button', { name: 'Fällig', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('group', { name: 'Teile zeigen' }).getByRole('button', { name: 'Alle', exact: true }).click();
  expect(errors).toEqual([]);
});

test('the trip is one folded row; event preparation inside', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=care');
  const trip = page.locator('details.block').filter({ hasText: `Vor ${P} Jura event` });
  await expect(trip).toBeVisible();
  await expect(trip.locator('summary .badge')).toContainText('fällig');
  await expect(trip.getByLabel(/Event \(Rennen oder organisierte Fahrt\)/)).toHaveCount(0);
  await trip.locator('summary').click();
  await expect(trip.getByLabel(/Event \(Rennen oder organisierte Fahrt\)/)).toBeChecked();
  await expect(trip).toContainText('Eventvorbereitung');
  await noSideways(page);
  // A link to the trip's preparation opens it.
  await page.goto(`./#/bikes?tab=care&trip=${P}event`);
  await expect(page.locator(`#before-${P}event`)).toHaveAttribute('open', '');
  expect(errors).toEqual([]);
});

test('"Done by: me / bike shop" is chosen in the dialog, the last choice preselected and remembered', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
  const spark = page.locator(`#care-${SPARK}`);
  // v0.38.0: a tap on the part opens its row; "Record …" opens the dialog.
  await spark.getByRole('button', { name: /^Kette/ }).first().click();
  await spark.locator('li.pt.x').getByRole('button', { name: 'Erfassen …' }).click();
  const dlg = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Kette' }) });
  const who = dlg.getByRole('group', { name: 'Gemacht von' });
  await expect(who.getByRole('button', { name: 'ich' })).toHaveAttribute('aria-pressed', 'true');
  await expect(who.getByRole('button', { name: 'Velomech' })).toHaveAttribute('aria-pressed', 'false');
  await noSideways(page);
  await shot(page, info, 'care-dialog-who');
  await who.getByRole('button', { name: 'Velomech' }).click();
  await expect(who.getByRole('button', { name: 'Velomech' })).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: 'Gewachst' }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await stored(page, SPARK)).parts.find((p) => p.key === 'chain').history.at(-1)).toMatchObject({ date: day(0), km: 5000, action: 'service', result: 'done', by: 'shop' });
  // The row says it at once: waxed today, bike shop (now fine, so in the "ok" fold).
  if (await spark.locator('.okfold[aria-expanded=false]').count()) await spark.locator('.okfold').click();
  const chain = spark.locator('li.pt').filter({ has: page.getByRole('button', { name: /^Kette/ }) });
  await expect(chain).toContainText(`gewachst ${shown(day(0))}`);
  await expect(chain.locator('.who')).toHaveText('Velomech');
  expect(await page.evaluate(() => localStorage.getItem('care.by'))).toBe('shop');

  // After a reload the next dialog starts with the last choice.
  await page.reload();
  await page.locator(`#care-${SPARK}`).getByRole('button', { name: /^Bremsbeläge vorne/ }).click();
  await page.locator(`#care-${SPARK} li.pt.x`).getByRole('button', { name: 'Erfassen …' }).click();
  const pads = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Bremsbeläge vorne' }) });
  await expect(pads.getByRole('group', { name: 'Gemacht von' }).getByRole('button', { name: 'Velomech' })).toHaveAttribute('aria-pressed', 'true');
  await pads.getByRole('group', { name: 'Gemacht von' }).getByRole('button', { name: 'ich' }).click();
  await pads.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(pads).toBeHidden();
  await expect.poll(async () => (await stored(page, SPARK)).parts.find((p) => p.key === 'padsF').history.at(-1)).toMatchObject({ action: 'check', result: 'ok', by: 'self' });
  expect(await page.evaluate(() => localStorage.getItem('care.by'))).toBe('self');
  expect(errors).toEqual([]);
});

test('no sideways scroll at 320 and 390 px with a bike open', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone widths');
  await start(page, context, info);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
    await expect(page.locator(`#care-${SPARK} li.pt`).first()).toBeVisible();
    await page.locator(`#care-${SPARK} summary`).filter({ hasText: 'Logbuch' }).click();
    await page.locator(`#care-${SPARK} summary`).filter({ hasText: 'Check' }).click();
    await page.locator('details.block summary').first().click();
    await noSideways(page);
    // Tap targets: the filter chips, the bike rows and the part names are 44 px high.
    for (const el of [page.getByRole('group', { name: 'Teile zeigen' }).getByRole('button').first(), page.locator(`#care-${SPARK} .part-btn`).first(), page.locator(`#care-${SCALE} .ah`)]) {
      expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);
    }
    if (width === 320) await shot(page, info, 'care-320', true);
  }
});
