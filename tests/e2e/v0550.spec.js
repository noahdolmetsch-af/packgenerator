// v0.66.0 «Bausteine neu + Bausteine prüfen» (Noah 4a–10b); fictional data only (test_data_gtp_).
// 1. Old data (the pf fixture: Base, Sleep, Warm, Light, Lodging) is updated once on import: Biwak,
//    Zelt, Hotel/Hütte, Licht, the ride blocks Reparatur and Laden; Warm becomes a temperature rule.
//    Nothing is lost, the old keys stay on the items.
// 2. «Bausteine prüfen» (from Bausteine and from Material): one block after the other, Raus,
//    Woanders, a temperature, Add from «Fehlt wahrscheinlich hier», each with Undo.
// 3. A new trip with nights: Biwak / Biwak + Zelt / Hotel/Hütte; Reparatur and Laden pressed, Licht
//    only when the ride goes into the dark, Rennen only on an event, Komfort only as unticked offers.
// Screenshots (V0550_SHOTS=dir): 390 and 1440, light and dark.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.V0550_SHOTS;

function fixtureFile(info) {
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const item = (id, name, f) => ({ id: `${P}${id}`, name: `${P} ${name}`, weightG: 80, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, kits: [], domains: ['bikepacking'], ...f });
  // a comfort item and a race item, as a user would have put them into the new blocks
  data.tables.items.push(item('LX01', 'Kissen', { category: 'lux', sets: ['comfort'] }), item('RC01', 'Startnummer', { category: 'docs', sets: ['race'] }));
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/v0550-fixture-${info.testId}.json`;
  writeFileSync(path, JSON.stringify(data));
  return { path, count: data.tables.items.length };
}

async function start(page, context, info) {
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
  const file = fixtureFile(info);
  await data.getByLabel('Backup importieren').setInputFiles(file.path);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return { errors, count: file.count };
}

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const itemOf = async (page, id) => (await table(page, 'items')).find((i) => i.id === `${P}${id}`);
const setsOf = async (page, id) => (await itemOf(page, id))?.sets ?? [];

const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.screenshot({ path: join(SHOTS, `${name}-${info.project.name}-${scheme}.png`), fullPage: true });
  }
  await page.emulateMedia({ colorScheme: 'light' });
}

/** The heading of the current step of «Bausteine prüfen». */
const stepHead = (page) => page.locator('#step-h');
async function goToStep(page, info, name) {
  for (let n = 0; n < 20; n++) {
    if ((await stepHead(page).textContent())?.trim().startsWith(name)) return;
    await tap(page.getByRole('navigation', { name: T('Steps') }).getByRole('button', { name: /^Weiter/ }), info);
  }
  throw new Error(`no step ${name}`);
}

test('old blocks are updated once; «Bausteine prüfen» keeps, takes out, moves and adds, each with Undo', async ({ page, context }, info) => {
  const { errors, count } = await start(page, context, info);

  // 1. The update: nothing lost, the new blocks, Warm as a temperature rule, the old keys stay.
  const items = await table(page, 'items');
  expect(items).toHaveLength(count);
  expect(await setsOf(page, 'SL03')).toEqual(['sleep', 'bivy']); // sleeping bag → Biwak
  expect(await setsOf(page, 'SL01')).toEqual(['sleep', 'tent']); // tent → Zelt
  expect(await setsOf(page, 'LI03')).toEqual(['light', 'lights']); // head torch → Licht
  expect(await setsOf(page, 'OF01')).toEqual(['lodging', 'hotel']); // flip-flops → Hotel/Hütte
  expect(await setsOf(page, 'WZ04')).toEqual(['repair']); // tools → Reparatur (suggested)
  expect(await setsOf(page, 'EL02')).toEqual(['charge']); // power bank → Laden (suggested)
  expect((await itemOf(page, 'SL04')).coldBelow).toBe(10); // the down jacket: Warm → below 10 °C
  expect((await itemOf(page, 'KL10')).coldBelow).toBe(8); // its own rule stays
  expect(await setsOf(page, 'LX01')).toEqual(['comfort']);

  // 2. The Bausteine page: the night blocks, «Auf der Fahrt», no Warm; the check is waiting.
  await page.goto('./#/blocks');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: T('On the ride') })).toBeVisible();
  for (const name of ['Biwak', 'Zelt', 'Hotel/Hütte', 'Reparatur', 'Laden', 'Licht']) await expect(main).toContainText(name);
  await expect(main).not.toContainText('Nacht: Warm');
  const check = main.getByRole('link', { name: new RegExp(T('Check building blocks')) });
  await expect(check).toContainText(T('to check|blocks'));
  expect(await wide(page)).toBe(0);
  await shot(page, info, 'blocks');

  // 3. «Bausteine prüfen»: v0.72.0 (Noah 4a) first the overview of the changes 5–10, each row with
  // a button to its step; then the items still to assign (from the old Lodging).
  await tap(check, info);
  await expect(page.getByRole('heading', { level: 1, name: T('Check building blocks') })).toBeVisible();
  await expect(stepHead(page)).toContainText(T('What has changed'));
  await expect(page.locator('.progress')).toContainText(`${T('Overview')}`);
  await expect(page.getByRole('progressbar', { name: T('Progress') })).toHaveAttribute('aria-valuenow', '1');
  const rows = page.locator('.ovr');
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(0)).toContainText('Nacht: Basis');
  await expect(rows.nth(0)).toContainText('Biwak');
  await expect(rows.nth(5)).toContainText('Klein · Tagestour');
  const review = (await table(page, 'settings')).find((s) => s.key === 'blockReview')?.value;
  await expect(rows.nth(3)).toContainText(String(review.unassigned.length));
  expect(await wide(page)).toBe(0);
  await shot(page, info, 'check-overview');
  await tap(rows.nth(3).getByRole('button', { name: /Zuordnen/ }), info);
  await expect(stepHead(page)).toContainText(T('Still to assign'));
  await expect(page.getByRole('progressbar', { name: T('Progress') })).toHaveAttribute('aria-valuenow', '2');
  await shot(page, info, 'check-assign');
  const gel = page.getByRole('group', { name: /Duschgel|Shower gel/ });
  await tap(gel.getByRole('button', { name: /nehmen$/ }), info);
  await expect.poll(() => setsOf(page, 'HY04')).not.toContain('hotel');
  expect(await setsOf(page, 'HY04')).toContain('lodging'); // the old key stays (older versions)
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect.poll(() => setsOf(page, 'HY04')).toContain('hotel');

  // 4. The temperature rules from the old Warm.
  await goToStep(page, info, T('Temperature rules'));
  const temp = page.getByLabel(/Kommt mit unter \(°C\): .*(Daunenjacke|Down jacket)/);
  await expect(temp).toHaveValue('10');
  await temp.fill('5');
  await tap(temp.locator('xpath=ancestor::form').getByRole('button', { name: 'OK' }), info);
  await expect.poll(async () => (await itemOf(page, 'SL04')).coldBelow).toBe(5);
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect.poll(async () => (await itemOf(page, 'SL04')).coldBelow).toBe(10);

  // 5. Biwak: weight and total; the towel (from Base, suggested) goes elsewhere.
  await goToStep(page, info, 'Biwak');
  const step = page.locator('section.step');
  await expect(step).toContainText(/\d+ Teile/);
  await expect(step).toContainText(T('suggested|blocks'));
  await shot(page, info, 'check-bivy');
  const towel = page.getByRole('group', { name: /Badetuch|Towel/ });
  await towel.locator('select').selectOption({ label: 'Hotel/Hütte' });
  await expect.poll(() => setsOf(page, 'HY02')).toContain('hotel');
  expect(await setsOf(page, 'HY02')).not.toContain('bivy');
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect.poll(() => setsOf(page, 'HY02')).toContain('bivy');
  expect(await setsOf(page, 'HY02')).not.toContain('hotel');

  // 6. Licht: the rear light is probably missing here; one tap adds it, Undo takes it back.
  await goToStep(page, info, 'Licht');
  await expect(step.getByRole('heading', { name: T('Probably missing here') })).toBeVisible();
  await tap(step.getByRole('button', { name: /Rücklicht|Rear light/ }).filter({ hasText: T('Add') }), info);
  await expect.poll(() => setsOf(page, 'LI02')).toContain('lights');
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect.poll(() => setsOf(page, 'LI02')).not.toContain('lights');
  expect(await wide(page)).toBe(0);
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await wide(page)).toBe(0);

  // 7. Also reachable from Material (•••).
  await page.goto('./#/gear');
  await expect(page.locator(`a[href="#/blocks/check"]`).first()).toBeAttached();
  expect(await table(page, 'items')).toHaveLength(count); // nothing lost on the way
  expect(errors).toEqual([]);
});

test('a new trip: Biwak + Zelt by default, Reparatur and Laden pressed, Licht in the dark, Rennen on an event, Komfort only offered', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  await tap(page.getByRole('button', { name: 'Neu', exact: true }).filter({ visible: true }), info);
  await tap(page.getByRole('dialog', { name: 'Neu' }).getByRole('button', { name: 'Tour planen' }), info);
  const dlg = page.getByRole('dialog', { name: 'Neue Tour' });
  await expect(dlg).toBeVisible();
  const title = `${P} Jura`;
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(day(3));
  await tap(dlg.getByRole('button', { name: T('More'), exact: true }), info);
  await dlg.getByLabel(T('Days')).first().fill('2');
  await dlg.getByLabel(T('Riding hours per day')).fill('4');

  // The night: three choices, Biwak + Zelt chosen.
  for (const name of ['Biwak', 'Biwak + Zelt', 'Hotel/Hütte']) await expect(dlg.getByRole('button', { name, exact: true })).toBeVisible();
  await expect(dlg.getByRole('button', { name: 'Biwak + Zelt', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const box = dlg.getByRole('region', { name: 'So wird deine Packliste' });
  await expect(box).toContainText(/Übernachtung \(Biwak \+ Zelt\): Biwak \d+, Zelt \d+/);

  // The ride: Reparatur and Laden pressed; 4 h from 08:00 in daylight: no Licht.
  const ride = dlg.getByRole('group', { name: T('Suggested for this ride') });
  await expect(ride.getByRole('button', { name: /^Reparatur/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(ride.getByRole('button', { name: /^Laden/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(ride.getByRole('button', { name: /^Licht/ })).toHaveCount(0);
  await expect(ride.getByRole('button', { name: /^Rennen/ })).toHaveCount(0);
  // 14 h a day goes into the dark: Licht comes by itself.
  await dlg.getByLabel(T('Riding hours per day')).fill('14');
  await expect(ride.getByRole('button', { name: /^Licht/ })).toHaveAttribute('aria-pressed', 'true');
  // An event brings Rennen.
  await dlg.getByLabel(T('Event (race or organised ride)')).check();
  await expect(ride.getByRole('button', { name: /^Rennen/ })).toHaveAttribute('aria-pressed', 'true');
  // Komfort: only an unticked offer, never an add-block chip.
  const comfort = dlg.getByRole('group', { name: T('Comfort, if you like') });
  await expect(comfort.getByRole('button', { name: /Kissen/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(dlg.getByRole('group', { name: T('Add building blocks') })).not.toContainText('Komfort');
  // Laden off for this trip.
  await tap(ride.getByRole('button', { name: /^Laden/ }), info);
  await expect(ride.getByRole('button', { name: /^Laden/ })).toHaveAttribute('aria-pressed', 'false');
  expect(await wide(page)).toBe(0);
  await shot(page, info, 'new-trip');
  await tap(dlg.getByRole('button', { name: T('Create trip') }), info);
  await expect(dlg).toBeHidden();

  const trip = (await table(page, 'trips')).find((t) => t.title === title);
  expect(trip).toMatchObject({ overnight: 'outdoor', tent: true, dark: true, event: true });
  expect(trip.sets?.charge).toBe(false);
  const on = trip.entries.map((e) => e.itemId.replace(P, ''));
  expect(on).toEqual(expect.arrayContaining(['SL01', 'SL02', 'SL03', 'LI03', 'WZ04', 'RC01'])); // tent, mat, bag, light, repair, race
  expect(on).not.toContain('EL02'); // Laden taken off
  expect(on).not.toContain('LX01'); // Komfort not ticked
  expect(on).not.toContain('OF01'); // hotel-only
  expect(errors).toEqual([]);
});
