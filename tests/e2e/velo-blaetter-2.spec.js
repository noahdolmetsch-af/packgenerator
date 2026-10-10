// (test titles stay ASCII: a title with an umlaut broke the backup file path of setInputFiles)
// v0.70.0 «Velo-Blätter Teil 2» (Noah W1–W7 a): the four more sheets of a bike's folder. The Break-in
// plan comes by itself on a new bike (W1 a), its ticks go into care with Undo (W2 a), a due step reminds
// on Today with «später» (W3 a); the Repair kit per kind of ride (W4 a) with «hinzufügen» and «Auf die
// Packliste …» (W5 a); Warranty & receipts with the years per part, the calendar file (W6 a); the Theft
// sheet with the frame number in the copied text (W7 a) and a photo per tile. Fictional data only.
import { test, expect } from '@playwright/test';
import { vb2File, XC, XC_TRIP, TRAIL, P, PIXEL_B64 } from './velo-blaetter-2-fixture.js';
import { readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';

// the sheets in the folder's order, read from the app source (sheets.js imports the Svelte i18n, so it is read as text)
const SRC = readFileSync(new URL('../../src/lib/sheets.js', import.meta.url), 'utf8');
const SHEETS = [...SRC.slice(SRC.indexOf('export const SHEETS'), SRC.indexOf('];', SRC.indexOf('export const SHEETS'))).matchAll(/\{ key: '(\w+)', name: '([^']+)'(?:[^}]*since: '([\d.]+)')?/g)].map((m) => ({ key: m[1], name: m[2], since: m[3] ?? null }));
const SRC2 = readFileSync(new URL('../../src/lib/sheets2.js', import.meta.url), 'utf8');
const RIDE_TYPES = [...SRC2.slice(SRC2.indexOf('export const RIDE_TYPES'), SRC2.indexOf('];', SRC2.indexOf('export const RIDE_TYPES'))).matchAll(/\{ key: '(\w+)', name: '([^']+)' \}/g)].map((m) => ({ key: m[1], name: m[2] }));

const SHOTS = process.env.VB_SHOTS;
const shot = async (page, info, name) => {
  if (SHOTS) await page.evaluate(() => window.scrollTo(0, 0));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const stored = (page, name, key) =>
  page.evaluate(
    ([name, key]) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction(name).objectStore(name);
          const get = key == null ? tx.getAll() : tx.get(key);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
    [name, key],
  );

async function start(page, context, info) {
  const file = vb2File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    window.__copied = [];
    window.__printed = 0;
    Object.defineProperty(Navigator.prototype, 'clipboard', { value: { writeText: async (s) => window.__copied.push(s) }, configurable: true });
    window.print = () => (window.__printed += 1);
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
const copied = async (page) => {
  await page.getByRole('button', { name: 'Text kopieren' }).click();
  await expect(page.getByText('Kopiert.', { exact: false })).toBeVisible();
  return (await page.evaluate(() => window.__copied)).at(-1);
};

test('the folder: eight sheets on a new bike, the Break-in plan first and marked «neu»; an old bike has seven (W1 a)', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${XC}`);
  const folder = page.locator('section.folder');
  await expect(folder.getByRole('heading', { name: `${SHEETS.length} Blätter zu diesem Velo` })).toBeVisible();
  await expect(folder.locator('a.sheet .nm')).toHaveText(SHEETS.map((s) => DE[s.name]));
  await expect(folder.locator('a.sheet .nm').first()).toHaveText(DE['Break-in plan']);
  for (const s of SHEETS) await expect(folder.locator(`a[data-sheet="${s.key}"] .new`)).toHaveCount(s.since ? 1 : 0);
  await expect(folder.locator('[data-sheet="breakin"] .st')).toHaveText('Schritt 1 fällig');
  await expect(folder.locator('[data-sheet="warranty"] .st')).toHaveText(/^Rahmen bis \d{4}$/);
  await expect(folder.locator('[data-sheet="theft"] .st')).toHaveText('Rahmennummer fehlt');
  await expect(folder.getByText('erscheint bei einem neuen Velo von selbst', { exact: false })).toBeVisible();
  await shot(page, info, 'mappe-teil2');
  await noSideways(page);

  // «Blätter wählen» covers all eight: the Theft sheet off, then on again
  await folder.getByRole('button', { name: 'Blätter wählen' }).click();
  await expect(folder.locator('fieldset.pick input[type="checkbox"]')).toHaveCount(SHEETS.length);
  await folder.getByRole('checkbox', { name: 'Diebstahl-Blatt' }).uncheck();
  await expect(folder.locator('a.sheet')).toHaveCount(SHEETS.length - 1);
  expect((await stored(page, 'bikes', XC)).sheets.hidden).toEqual(['theft']);
  await shot(page, info, 'mappe-waehlen');
  await folder.getByRole('checkbox', { name: 'Diebstahl-Blatt' }).check();
  await expect(folder.locator('a.sheet')).toHaveCount(SHEETS.length);

  // opened once, a new sheet is no longer «neu»
  await folder.locator('a[data-sheet="kit"]').click();
  await expect(page.locator('article.paper[data-sheet="kit"]')).toBeVisible();
  await page.getByRole('link', { name: 'Mappe Demo XC' }).click();
  await expect(folder.locator('a[data-sheet="kit"] .new')).toHaveCount(0);

  // an old bike: no Break-in plan, but «Blätter wählen» can switch it on
  await page.goto(`./#/bikes?bike=${TRAIL}`);
  await expect(folder.locator('a.sheet')).toHaveCount(SHEETS.length - 1);
  await expect(folder.locator('a[data-sheet="breakin"]')).toHaveCount(0);
  await expect(folder.getByText('Kein Einfahr-Plan: dieses Velo hat schon', { exact: false })).toBeVisible();
  await shot(page, info, 'mappe-altes-velo');
  await folder.getByRole('button', { name: 'Blätter wählen' }).click();
  await folder.getByRole('checkbox', { name: 'Einfahr-Plan' }).check();
  await expect(folder.locator('a[data-sheet="breakin"]')).toHaveCount(1);
  expect((await stored(page, 'bikes', TRAIL)).sheets.shown).toEqual(['breakin']);
  expect(errors).toEqual([]);
});

test('the Break-in plan: ticks with km, taken into care with Undo, a due step on Today put off for a week (W2 a, W3 a)', async ({ page, context }, info) => {
  const errors = await start(page, context, info);

  // Today reminds of the due step
  await page.goto('./#/');
  const remind = page.locator('[data-section="today"] li[data-row="sheet"]').filter({ hasText: 'Einfahr-Plan Demo XC' });
  const all = page.locator('[data-section="today"]').getByRole('button', { name: /^Alle \d+ zeigen$/ });
  const showAll = async () => {
    await expect(page.locator('[data-section="today"] li.row').first()).toBeVisible();
    await expect(async () => {
      if (await all.count()) await all.click();
      expect(await all.count()).toBe(0); // «Weniger zeigen» now
    }).toPass();
  };
  await showAll();
  await expect(remind).toContainText('Schritt 1 ist fällig');
  await remind.getByRole('link', { name: 'Blatt öffnen' }).click();

  const paper = page.locator('article.paper[data-sheet="breakin"]');
  await expect(paper.getByRole('heading', { name: 'Einfahr-Plan' })).toBeVisible();
  await expect(paper.getByRole('heading', { name: /^1 · Nach der ersten Ausfahrt/ })).toContainText('jetzt fällig');
  await expect(paper.getByRole('heading', { name: /^3 · Nach 100–150 km/ })).toContainText('in ca. 40 km');
  const sag = paper.locator('.checks li').filter({ hasText: 'Sag vorne und hinten messen' });
  await expect(sag.locator('.cv')).toHaveText('85 / 190 psi');
  await expect(paper.locator('.checks li').filter({ hasText: 'Erstinspektion beim Velomech' }).getByRole('link', { name: 'Werkstatt-Auftrag' })).toBeVisible();
  const take = paper.getByRole('button', { name: 'Abgehakte in die Pflege übernehmen' });
  await expect(take).toBeDisabled();

  // tick step 1: stored with the day and the km
  for (const li of await paper.locator('section').first().locator('.checks li').all()) await li.getByRole('checkbox').check();
  await expect.poll(async () => Object.keys((await stored(page, 'bikes', XC)).sheets?.breakin?.ticks ?? {}).length).toBe(4);
  expect((await stored(page, 'bikes', XC)).sheets.breakin.ticks['s1:bolts'].km).toBe(64);
  await expect(paper.getByRole('heading', { name: /^1 · / })).toContainText('erledigt');
  await shot(page, info, 'einfahr-plan');
  await noSideways(page);

  const before = (await stored(page, 'bikes', XC)).parts.find((p) => p.key === 'shifting')?.history?.length ?? 0;
  await take.click();
  await expect(page.locator('p.notice')).toContainText('4 Haken in die Pflege übernommen');
  const shifting = (await stored(page, 'bikes', XC)).parts.find((p) => p.key === 'shifting');
  expect(shifting.history).toHaveLength(before + 1);
  expect(shifting.history.at(-1)).toMatchObject({ km: 64, action: 'check', result: 'ok', by: 'self' });
  await expect(take).toBeDisabled();
  await page.locator('p.notice').getByRole('button', { name: 'Rückgängig' }).click();
  await expect.poll(async () => (await stored(page, 'bikes', XC)).parts.find((p) => p.key === 'shifting')?.history?.length ?? 0).toBe(before);
  await expect(take).toBeEnabled();

  const text = await copied(page);
  expect(text).toContain('Einfahr-Plan');
  expect(text).toContain('[x] Vorbau, Lenker und Sattelklemme nachziehen');

  // Today: now step 2 is due; «später» puts it off for a week
  await page.goto('./#/');
  await showAll();
  await expect(remind).toContainText('Schritt 2 ist fällig');
  await remind.getByRole('button', { name: 'später' }).click();
  await expect(remind).toHaveCount(0);
  expect(Object.keys((await stored(page, 'bikes', XC)).sheets.snooze)).toEqual(['breakin:s2']);
  expect(errors).toEqual([]);
});

test('the Repair kit: per kind of ride, sizes from the parts, a missing item added with Undo, on the packing list (W4 a, W5 a)', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${XC}&sheet=kit`);
  const paper = page.locator('article.paper[data-sheet="kit"]');
  await expect(paper.getByRole('heading', { name: 'Repair-Kit' })).toBeVisible();
  const seg = paper.getByRole('group', { name: 'Art der Fahrt' });
  await expect(seg.getByRole('button')).toHaveText(RIDE_TYPES.map((r) => DE[r.name]));
  await expect(seg.getByRole('button', { name: 'Tagestour' })).toHaveAttribute('aria-pressed', 'true'); // the next trip is one day
  const row = (key) => paper.locator(`li[data-row="${key}"]`);
  await expect(row('tube')).toContainText('Ersatzschlauch 29 × 2.4');
  await expect(row('link')).toContainText('Kettenschloss (12-fach)');
  await expect(row('link')).toContainText('aus Material:');
  await expect(row('hanger')).toContainText('Ersatz-Schaltauge (UDH)');
  await expect(row('hanger')).toContainText('fehlt im Material');

  // «eingepackt» per kind of ride
  await row('multitool').getByRole('checkbox').check();
  await expect.poll(async () => (await stored(page, 'bikes', XC)).sheets?.kit?.ticks?.day?.multitool).toBe(true);
  await expect(paper.locator('p.total')).toContainText(/\d+ g/);

  // «hinzufügen»: the missing hanger becomes an item of the gear list; Undo takes it out again
  const count = (await stored(page, 'items')).length;
  await row('hanger').getByRole('button', { name: 'hinzufügen' }).click();
  await expect(page.locator('p.notice')).toContainText('Ins Material aufgenommen');
  await expect(row('hanger')).not.toContainText('fehlt im Material');
  expect((await stored(page, 'items')).length).toBe(count + 1);
  await page.locator('p.notice').getByRole('button', { name: 'Rückgängig' }).click();
  await expect(row('hanger')).toContainText('fehlt im Material');
  await shot(page, info, 'repair-kit');
  await noSideways(page);

  // multi-day: the shock pump comes in; the choice is stored
  await seg.getByRole('button', { name: 'Mehrtägig' }).click();
  await expect(row('shockpump')).toBeVisible();
  await expect.poll(async () => (await stored(page, 'bikes', XC)).sheets?.kit?.type).toBe('multi');
  await seg.getByRole('button', { name: 'Tagestour' }).click();

  // W5 a: on the packing list of the next trip, each item can be deselected
  const before = (await stored(page, 'trips', XC_TRIP)).entries.length;
  await paper.getByRole('button', { name: /^Auf die Packliste «.*Demo-Tour Jura» …$/ }).click();
  const choose = paper.locator('fieldset.choose');
  const boxes = choose.getByRole('checkbox');
  const n = await boxes.count();
  expect(n).toBeGreaterThan(1);
  await boxes.first().uncheck();
  await choose.getByRole('button', { name: `${n - 1} Teile auf die Packliste` }).click();
  await expect(page.locator('p.notice')).toContainText(`${n - 1} Teile auf die Packliste`);
  const trip = await stored(page, 'trips', XC_TRIP);
  expect(trip.entries).toHaveLength(before + n - 1);
  expect(trip.entries.at(-1)).toMatchObject({ packed: false, qty: 1 });
  await page.locator('p.notice').getByRole('button', { name: 'Rückgängig' }).click();
  await expect.poll(async () => (await stored(page, 'trips', XC_TRIP)).entries.length).toBe(before);

  const text = await copied(page);
  expect(text).toContain('Repair-Kit');
  expect(text).toContain('[x] Multitool');
  expect(errors).toEqual([]);
});

test('Warranty & receipts: years per part changeable, receipts from Workshop & receipts, calendar file (W6 a)', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${XC}&sheet=warranty`);
  const paper = page.locator('article.paper[data-sheet="warranty"]');
  await expect(paper.getByRole('heading', { name: 'Garantie & Belege' })).toBeVisible();
  const part = (name) => paper.locator('tbody tr').filter({ has: page.locator('th', { hasText: new RegExp(`^${name}$`) }) });
  await expect(part('Rahmen')).toContainText('5 Jahre');
  await expect(part('Antrieb, Bremsen, übrige Teile')).toContainText('2 Jahre (Gesetz)');
  await expect(paper.getByText('Bedingung:', { exact: false })).toBeVisible(); // the first inspection is still open
  await expect(paper.locator('ul.recs li').filter({ hasText: 'Kaufbeleg Demo XC' })).toContainText('mit Foto');

  // «Werte ändern»: the fork gets 3 years, the shop and the price
  await page.getByRole('button', { name: 'Werte ändern' }).click();
  await paper.getByLabel('Garantie Gabel in Jahren').fill('3');
  await paper.getByLabel('Gekauft bei').fill(`${P} Velo Werkstatt Nord`);
  await paper.getByLabel('Kaufpreis in CHF').fill('4290');
  await paper.getByRole('button', { name: 'Speichern' }).click();
  await expect(part('Gabel')).toContainText('3 Jahre');
  const w = (await stored(page, 'bikes', XC)).sheets.warranty;
  expect(w).toMatchObject({ price: 4290, years: { fork: 3, frame: 5 } });
  await expect(paper.locator('.facts')).toContainText(`CHF ${(4290).toLocaleString('de-CH')}`);

  // the calendar only when switched on
  await expect(paper.getByRole('button', { name: 'Kalender-Datei' })).toHaveCount(0);
  await paper.getByRole('checkbox', { name: /Auch im Kalender/ }).check();
  const download = page.waitForEvent('download');
  await paper.getByRole('button', { name: 'Kalender-Datei' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.ics$/);
  expect(readFileSync(await file.path(), 'utf8')).toContain('BEGIN:VEVENT');
  await shot(page, info, 'garantie-belege');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('the Theft sheet: «eintragen» opens the form, the frame number is in the copied text (W7 a), a photo per tile', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${XC}&sheet=theft`);
  const paper = page.locator('article.paper[data-sheet="theft"]');
  await expect(paper.getByRole('heading', { name: 'Diebstahl-Blatt' })).toBeVisible();
  const row = (label) => paper.locator('.vr').filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd');
  await expect(row('Marke und Modell')).toHaveText('Demo XC · Fully');
  await expect(row('Rahmengrösse · Räder')).toHaveText('M · 29 Zoll');
  await row('Rahmennummer').getByRole('button', { name: 'eintragen' }).click();
  await expect(paper.getByRole('textbox', { name: 'Rahmennummer' })).toBeFocused();
  await paper.getByRole('textbox', { name: 'Rahmennummer' }).fill('DEMO 0000 XC');
  await paper.getByLabel('Wo versichert').fill('Demo Hausrat · Zusatz Velo');
  await paper.getByRole('button', { name: 'Speichern' }).click();
  await expect(row('Rahmennummer')).toHaveText('DEMO 0000 XC');
  expect((await stored(page, 'bikes', XC)).sheets.theft).toMatchObject({ frameNo: 'DEMO 0000 XC', insurer: 'Demo Hausrat · Zusatz Velo' });

  // a photo for the tile «Merkmal»: it goes into the bike's photos
  await paper.locator('ul.tiles li').filter({ hasText: 'Merkmal' }).locator('input[type="file"]').setInputFiles({ name: 'merkmal.png', mimeType: 'image/png', buffer: Buffer.from(PIXEL_B64, 'base64') });
  await expect(paper.locator('ul.tiles li').filter({ hasText: 'Merkmal' }).locator('img')).toBeVisible();
  const photos = (await stored(page, 'photos')).filter((p) => p.bikeId === XC);
  expect(photos.map((p) => p.theft)).toEqual(['mark']);
  await shot(page, info, 'diebstahl');
  await noSideways(page);

  const text = await copied(page);
  expect(text).toContain('Rahmennummer: DEMO 0000 XC');
  expect(text).toContain('1. Polizei: Anzeige machen');
  await page.getByRole('button', { name: 'Als PDF teilen' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  expect(errors).toEqual([]);
});
