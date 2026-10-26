// Velo-Ideen 71–76 (996 Ideen, Noah 25.10.2026), the small ones in the browser, German UI:
//   72 «Fehlende Kilometer nachtragen»: a new reading far above the ledger asks first; rides outside the app.
//   73 «Setup zurückbauen»: a log entry keeps the measures; «Zurück zu diesen Massen» writes them back.
//   74 «Auffälliges Ereignis»: a noise marks the chain «prüfen»; «Geprüft, alles gut» takes it off.
//   71 «Quittung aufteilen»: lines get a part (one suggested from its word), one line is split in two.
//   75 «Foto mit Vorlage»: the camera in the app (Chromium's fake camera) with the old photo on top.
//   76 «Werkstatt-Runden»: a suggestion becomes a round; a run writes the ticked jobs into the parts.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// calendar days in Europe/Zurich
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const rep = (date, km) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '' });
Object.assign(BIKE, {
  km: 2600,
  kmDate: day(-5),
  fit: { seatHeight: 742, pressureF: 2.4, pressureR: 2.6 },
  parts: [
    { key: 'chain', model: 'Test chain', history: [rep(day(-30), 2400)] },
    { key: 'cassette', model: '', history: [rep(day(-200), 0)] },
  ],
});

// a 1×1 PNG as the old wear photo and the receipt page (fictional)
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
base.tables.visits = [{ id: 'test_data_gtp_v1', bikeId: BIKE.id, date: day(-10), shop: 'test_data_gtp_ Velo Muster', km: 2500, photos: [PNG], parts: [{ what: 'Kette Test X11', chf: 42 }, { what: 'Service Antrieb', chf: 89 }, { what: 'Kleinmaterial', chf: 6, part: 'other', action: 'replace' }] }];
base.tables.photos = [{ id: 'test_data_gtp_ph1', bikeId: BIKE.id, name: 'Chain', tripId: null, main: false, wear: 'chain', date: day(-40), km: 2300, data: PNG, addedAt: `${day(-40)}T08:00:00.000Z` }];

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const bikeNow = async (page) => (await table(page, 'bikes')).find((b) => b.id === BIKE.id);
const putBike = (page, bike) =>
  page.evaluate((b) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('bikes', 'readwrite');
      tx.objectStore('bikes').put(b);
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), bike);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('velo-ideen.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('72 km jump: rides outside the app, a smaller number is a typo first', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await page.locator('.wall [data-fn="km"]').click();
  const km = page.getByRole('dialog', { name: T('km for a bike') });
  const pick = km.locator('select').first();
  if (await pick.count()) await pick.selectOption(BIKE.id);
  await km.getByLabel(T('km on the counter')).fill('2800');
  await km.getByRole('button', { name: T('Save km') }).click();
  const gap = page.getByTestId('km-gap');
  await expect(gap).toBeVisible();
  await expect(gap.getByRole('heading')).toHaveText(T('{km} km more than the app knows', { km: '200' }));
  await expect(gap.locator('[data-km-gap="rides"]')).toBeChecked();
  await gap.locator('[data-km-gap-date]').fill(day(-2));
  expect(await noSideways(page)).toBe(0);
  await gap.locator('[data-km-gap-ok]').click();
  await expect(gap).toBeHidden();
  await expect.poll(async () => (await table(page, 'kmBook')).filter((e) => e.bikeId === BIKE.id && e.kind === 'ride').map((e) => [e.km, e.date, e.name])).toEqual([[200, day(-2), T('Rides outside the app')]]);
  await expect.poll(async () => (await bikeNow(page)).km).toBe(2800);

  // fewer km: «Tippfehler» is chosen first, nothing is saved, the km window stays open to type again
  await expect(km).toBeHidden();
  await page.locator('.wall [data-fn="km"]').click();
  if (await pick.count()) await pick.selectOption(BIKE.id);
  await km.getByLabel(T('km on the counter')).fill('280');
  await km.getByRole('button', { name: T('Save km') }).click();
  await expect(gap.locator('[data-km-gap="again"]')).toBeChecked();
  await gap.locator('[data-km-gap-ok]').click();
  await expect(km.getByText(T('Nothing saved. Type the km again.'))).toBeVisible();
  expect((await bikeNow(page)).km).toBe(2800);
  expect(errors).toEqual([]);
});

test('73 setup log keeps the measures and brings them back', async ({ page }) => {
  await page.goto(`./#/bikes?tab=rig&view=log&bike=${BIKE.id}`);
  await page.getByRole('button', { name: T('Write down a change') }).first().click();
  const dlg = page.getByRole('dialog', { name: T('Write down a change') });
  await dlg.getByLabel(T('What changed')).fill('test_data_gtp_ Sattel 8 mm hoeher');
  const keep = dlg.locator('[data-riglog-keep] input[type=checkbox]');
  await expect(keep).toBeChecked();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await bikeNow(page)).setupLog?.[0]?.saved?.fit?.seatHeight).toBe(742);

  // the saddle goes up 8 mm, the pressure front changes
  const b = await bikeNow(page);
  await putBike(page, { ...b, fit: { ...b.fit, seatHeight: 750, pressureF: 2.2 } });
  await page.reload(); // a write beside the app: the page reads it fresh
  const saved = page.locator('[data-riglog-saved]').first();
  await saved.locator('summary').click();
  await expect(saved.locator('.sdiff li')).toHaveCount(2);
  await saved.locator('[data-riglog-restore]').click();
  await expect.poll(async () => (await bikeNow(page)).fit).toEqual({ seatHeight: 742, pressureF: 2.4, pressureR: 2.6 });
  await expect(saved.getByText(T('The bike has these measures now.'))).toBeVisible();
  expect(await noSideways(page)).toBe(0);
});

test('74 a noise marks the chain check until it is checked', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const chain = page.locator('[data-wear="chain"]');
  await expect(chain).toHaveAttribute('data-wear-state', 'ok');
  await chain.locator('[data-wear-flag]').click();
  const form = chain.locator('[data-wear-flag-form]');
  await form.getByLabel(T('Noise')).check();
  await form.locator('[data-wear-flag-note]').fill('test_data_gtp_ knackt bergauf');
  await form.locator('[data-wear-flag-save]').click();
  await expect(chain).toHaveAttribute('data-wear-state', 'soon');
  await expect(chain.locator('.badge')).toHaveText(T('check|wear'));
  await expect(chain.locator('[data-wear-flagged="noise"]')).toContainText('knackt bergauf');
  expect((await bikeNow(page)).parts.find((p) => p.key === 'chain').flag).toMatchObject({ why: 'noise', date: today() });
  expect(await noSideways(page)).toBe(0);
  await chain.locator('[data-wear-unflag]').click();
  await expect(chain).toHaveAttribute('data-wear-state', 'ok');
  await expect.poll(async () => 'flag' in (await bikeNow(page)).parts.find((p) => p.key === 'chain')).toBe(false);
});

test('71 split the receipt: a suggested part, a split line, saved', async ({ page }) => {
  await page.goto(`./#/bikes?tab=shop&bike=${BIKE.id}&visit=test_data_gtp_v1`);
  await page.locator('[data-visit-split]').click();
  const w = page.locator('[data-receipt-split]');
  await expect(w).toBeVisible();
  await expect(w.locator('[data-split-count]')).toHaveText(T('{n} of {all} assigned', { n: 2, all: 3 }));
  await expect(w.locator('[data-split-line="0"] [data-split-part]')).toHaveValue('chain');
  await w.locator('[data-split-line="1"] [data-split-split]').click();
  await expect(w.locator('[data-split-line]')).toHaveCount(4);
  await expect(w.locator('[data-split-line="2"] [data-split-chf]')).toHaveValue('44.5');
  await w.locator('[data-split-line="1"] [data-split-part]').selectOption('cassette');
  await w.locator('[data-split-line="1"] [data-split-job]').selectOption('service');
  await w.locator('[data-split-line="2"] [data-split-part]').selectOption('shifting');
  await expect(w.locator('[data-split-count]')).toHaveText(T('{n} of {all} assigned', { n: 4, all: 4 }));
  await expect(w.locator('[data-split-after]')).toContainText(T('Cost per part'));
  expect(await noSideways(page)).toBe(0);
  await w.locator('[data-split-save]').click();
  await expect(w).toBeHidden();
  await expect.poll(async () => (await table(page, 'visits'))[0].parts.map((l) => [l.part, l.action, l.chf])).toEqual([
    ['chain', 'replace', 42],
    ['cassette', 'service', 44.5],
    ['shifting', 'replace', 44.5],
    ['other', 'replace', 6],
  ]);
});

test.describe('75 camera', () => {
  test('75 photo with template: the old photo over the camera, a new photo saved', async ({ page }) => {
    // a camera made of a canvas (no real camera in the test browser): a grey picture with a moving stripe
    await page.addInitScript(() => {
      const fake = async () => {
        const c = Object.assign(document.createElement('canvas'), { width: 320, height: 240 });
        const g = c.getContext('2d');
        let x = 0;
        setInterval(() => {
          g.fillStyle = '#777';
          g.fillRect(0, 0, 320, 240);
          g.fillStyle = '#ddd';
          g.fillRect((x += 4) % 320, 0, 20, 240);
        }, 50);
        return c.captureStream(20);
      };
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: fake }, configurable: true });
    });
    await page.reload();
    await page.goto(`./#/bikes?tab=care&view=photos&bike=${BIKE.id}`);
    await page.locator('[data-shot-ghost="chain"]').click();
    const cam = page.locator('dialog.ghostcam');
    await expect(cam).toHaveAttribute('data-ghost-camera', 'live');
    await expect(cam.locator('[data-ghost-img]')).toHaveCSS('opacity', '0.4');
    await cam.locator('[data-ghost-fade]').fill('70');
    await expect(cam.locator('[data-ghost-img]')).toHaveCSS('opacity', '0.7');
    await cam.locator('[data-ghost-toggle]').click();
    await expect(cam.locator('[data-ghost-img]')).toHaveCount(0);
    expect(await noSideways(page)).toBe(0);
    await cam.locator('[data-ghost-shoot]').click();
    await expect(cam).toBeHidden();
    await expect.poll(async () => (await table(page, 'photos')).filter((p) => p.wear === 'chain').length).toBe(2);
  });
});

test('76 workshop round: from a suggestion, a run writes the ticked jobs', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=rounds&bike=${BIKE.id}`);
  await page.locator('[data-round-idea="autumn"]').click();
  await expect(page.getByRole('heading', { level: 2, name: T('Autumn service') })).toBeVisible();
  // an own job at the end, then one place up
  await page.locator('[data-round-step-new]').fill('test_data_gtp_ Sattelklemme pruefen');
  await page.locator('[data-round-step-add]').click();
  const steps = page.locator('[data-round-step]');
  await expect(steps).toHaveCount(6);
  await steps.nth(5).getByRole('button', { name: T('Move {name} up', { name: 'test_data_gtp_ Sattelklemme pruefen' }) }).click();
  await expect(steps.nth(4)).toContainText('Sattelklemme');
  expect(await noSideways(page)).toBe(0);
  await page.locator('[data-round-start]').click();
  await steps.nth(0).locator('[data-round-tick]').check();
  await steps.nth(2).locator('[data-round-tick]').check();
  await page.locator('[data-round-finish]').click();
  await expect.poll(async () => (await bikeNow(page)).parts.find((p) => p.key === 'chain').history.at(-1)).toMatchObject({ action: 'service', by: 'self', date: today() });
  expect((await bikeNow(page)).parts.find((p) => p.key === 'padsF').history.at(-1)).toMatchObject({ action: 'check', result: 'ok', by: 'self' });
  const rounds = (await table(page, 'settings')).find((x) => x.key === 'werkstatt.rounds').value;
  expect(rounds[0].last[BIKE.id]).toBe(today());
  await expect(page.locator(`[data-round="${rounds[0].id}"]`)).toContainText(T('last {date}', { date: '' }).trim());
});
