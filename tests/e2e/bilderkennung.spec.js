// Paket L2 «Bilderkennung» (Noah 19.10.2026): Packliste per Foto (Abhaken, Neu erfassen, «Was ist das?»)
// and the sitting position from a photo and a video, with fictional data and a made-up photo. The MediaPipe
// library is answered by a stand-in (vision-fake.js); nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { MP_URL } from '../../src/lib/vision/engine.js';
import { FAKE_VISION } from './vision-fake.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const item = (id, name) => ({ id, name, category: 'other', weightG: 300, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'top', ownership: 'owned', role: 'standard', sets: [], kits: [], domains: ['bikepacking'] });
const TRIP = {
  id: 'trip-l2',
  title: 'Jura Probetour',
  startDate: '2030-06-01',
  days: 2,
  domain: 'bikepacking',
  bikeId: 'bike-test',
  entries: [
    { itemId: 'L2B1', slot: 'top', qty: 1, packed: false },
    { itemId: 'L2S1', slot: 'top', qty: 1, packed: false },
    { itemId: 'EL02', slot: 'top', qty: 1, packed: false },
  ],
};

async function start(page, context, info) {
  const file = info.outputPath('bilderkennung-fixture.json');
  const data = structuredClone(base);
  data.tables.items.push(item('L2B1', 'Trinkflasche 750 ml'), item('L2S1', 'Schlafsack Sommer'));
  data.tables.trips.push(TRIP);
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(MP_URL, (route) => route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: FAKE_VISION }));
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert/)).toBeVisible();
}

/** A made-up photo: three coloured squares on grey (where the stand-in «sees» a bottle, a sleeping bag, a teddy). */
const photo = async (page) =>
  Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 240;
      const g = c.getContext('2d');
      g.fillStyle = '#202020';
      g.fillRect(0, 0, 640, 240);
      [['#dc1414', 20], ['#14c814', 240], ['#1414dc', 460]].forEach(([col, x]) => {
        g.fillStyle = col;
        g.fillRect(x, 40, 160, 160);
      });
      return c.toDataURL('image/png').split(',')[1];
    }),
    'base64',
  );

/** The one stored trip and all items, straight from IndexedDB. */
const stored = (page, table) =>
  page.evaluate(
    (table) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(table).objectStore(table).getAll();
          q.onsuccess = () => {
            r.result.close();
            ok(q.result);
          };
        };
      }),
    table,
  );
const packed = async (page) => Object.fromEntries((await stored(page, 'trips')).find((x) => x.id === TRIP.id).entries.map((e) => [e.itemId, e.packed]));

test('Packliste per Foto: tick off, ask what it is, remember, Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  await page.goto(`#/me/tools/packphoto?trip=${TRIP.id}`);
  await expect(page.getByRole('heading', { level: 1, name: T('Packing list by photo') })).toBeVisible();
  await expect(page.locator('[data-pp-trip]')).toHaveValue(TRIP.id);
  const img = await photo(page);
  await page.locator('[data-pp-file]').setInputFiles({ name: 'ausgelegt.png', mimeType: 'image/png', buffer: img });

  // the bottle and the sleeping bag are found by their names; the teddy is asked about
  await expect(page.locator('[data-pp-row="L2B1"]')).toBeVisible();
  await expect(page.locator('[data-pp-row="L2S1"]')).toBeVisible();
  const ask = page.locator('[data-pp-ask]');
  await expect(ask).toHaveCount(1);
  await expect(page.getByRole('heading', { name: T('What is this?') })).toBeVisible();
  await ask.locator('select').selectOption('EL02');
  await ask.locator('[data-pp-teach]').click();
  await expect(page.locator('[data-pp-row="EL02"]')).toBeVisible();
  await expect(page.locator('[data-pp-ask]')).toHaveCount(0);

  // deselect one, tick the others; Undo brings them back
  await page.locator('[data-pp-row="L2S1"] input[type=checkbox]').uncheck();
  await page.locator('[data-pp-apply]').click();
  await expect(page.getByText(T('{n} items ticked on «{trip}».', { n: 2, trip: TRIP.title }))).toBeVisible();
  expect(await packed(page)).toEqual({ L2B1: true, L2S1: false, EL02: true });
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(() => packed(page)).toEqual({ L2B1: false, L2S1: false, EL02: false });

  // the next photo: the taught thing is found again without a question
  await page.locator('[data-pp-file]').setInputFiles({ name: 'nochmals.png', mimeType: 'image/png', buffer: img });
  await expect(page.locator('[data-pp-row="EL02"]')).toBeVisible();
  await expect(page.locator('[data-pp-row="EL02"]')).toContainText(T('remembered'));
  await expect(page.locator('[data-pp-ask]')).toHaveCount(0);
  await expect(page.locator('.pp-known summary')).toContainText(T('{n} thing remembered on this device', { n: 1 }));

  // the KI-Helfer is a choice, but off: the device keeps recognising and nothing is sent
  await page.getByRole('button', { name: T('KI-Helfer (online)') }).click();
  await expect(page.getByText(T('The KI-Helfer is not switched on. Set it up under Me › KI-Helfer; until then the device recognises.'))).toBeVisible();
  await expect(page.locator('[data-pp-send]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Packliste per Foto: add new gear, a name taught by asking', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('#/me/tools/packphoto');
  await page.getByRole('button', { name: T('Add new') }).click();
  await page.locator('[data-pp-file]').setInputFiles({ name: 'neu.png', mimeType: 'image/png', buffer: await photo(page) });
  await expect(page.getByText(T('Already in your gear: {names}', { names: 'Trinkflasche 750 ml, Schlafsack Sommer' }))).toBeVisible();
  const ask = page.locator('[data-pp-ask]');
  await expect(ask).toHaveCount(1);
  await ask.getByPlaceholder(T('or type a name')).fill('Test Glücksbär');
  await ask.locator('[data-pp-teach]').click();
  await expect(page.locator('[data-pp-new="0"] .tool-input')).toHaveValue('Test Glücksbär');
  await page.locator('[data-pp-add]').click();
  await expect(page.getByText(T('{n} item added to your gear.', { n: 1 }))).toBeVisible();
  await expect.poll(async () => (await stored(page, 'items')).filter((x) => x.name === 'Test Glücksbär').length).toBe(1);
  await page.getByRole('link', { name: T('Show in gear') }).click();
  await expect(page).toHaveURL(/#\/gear\?item=/);
});

test('Sitzposition: photo and video, saved with the bike with history, delete with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  await page.goto('#/me/tools/sitpos?bike=bike-test');
  await expect(page.getByRole('heading', { level: 1, name: T('Sitting position') })).toBeVisible();
  await page.locator('[data-sp-file]').setInputFiles({ name: 'seite.png', mimeType: 'image/png', buffer: await photo(page) });
  const res = page.locator('[data-sp-result]');
  await expect(res).toBeVisible();
  await expect(res).toContainText(T('Knee at the bottom'));
  await expect(page.locator('.sp-hints li').first()).toBeVisible();
  await page.locator('[data-sp-seat]').fill('742');
  await page.locator('[data-sp-save]').click();
  await expect(page.locator('[data-sp-saved]')).toHaveText(T('Saved with the {bike} as sitting position.', { bike: 'Test gravel bike' }));
  await expect(page.locator('[data-sitpos]')).toHaveCount(1);
  await expect(page.locator('[data-sitpos]')).toContainText(T('Saddle {n} mm', { n: '742' }));

  // a short video while pedalling (made in the browser): the knee at the top comes too
  const video = Buffer.from(
    await page.evaluate(async () => {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      const g = c.getContext('2d');
      const rec = new MediaRecorder(c.captureStream(15), { mimeType: 'video/webm' });
      const parts = [];
      rec.ondataavailable = (e) => parts.push(e.data);
      rec.start();
      for (let i = 0; i < 20; i++) {
        g.fillStyle = `hsl(${i * 18} 40% 60%)`;
        g.fillRect(0, 0, 320, 240);
        await new Promise((r) => setTimeout(r, 60));
      }
      rec.stop();
      await new Promise((r) => (rec.onstop = r));
      const buf = await new Blob(parts, { type: 'video/webm' }).arrayBuffer();
      let s = '';
      new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
      return btoa(s);
    }),
    'base64',
  );
  await page.getByRole('button', { name: T('Video while pedalling') }).click();
  await page.locator('[data-sp-file]').setInputFiles({ name: 'treten.webm', mimeType: 'video/webm', buffer: video });
  await expect(res).toContainText(T('Knee at the top'), { timeout: 30_000 });
  await page.locator('[data-sp-save]').click();
  await expect(page.locator('[data-sitpos]')).toHaveCount(2);
  const bike = (await stored(page, 'bikes')).find((b) => b.id === 'bike-test');
  expect(bike.sitPos.map((r) => r.source).sort()).toEqual(['photo', 'video']);
  expect(bike.sitPos.find((r) => r.source === 'photo').seatHeight).toBe(742);

  // delete one, then Undo
  await page.locator('[data-sitpos]').first().getByRole('button').click();
  await expect(page.locator('[data-sitpos]')).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-sitpos]')).toHaveCount(2);

  // the bike's equipment page shows the card: the last measurement, the link to measure, the earlier one behind a tap
  await page.goto('#/bikes?tab=compare&bike=bike-test');
  await expect(page.locator('[data-sitpos-measure]')).toBeVisible();
  await expect(page.locator('[data-sitpos]')).toHaveCount(1);
  await page.getByRole('button', { name: T('Show {n} earlier measurement', { n: 1 }) }).click();
  await expect(page.locator('[data-sitpos]')).toHaveCount(2);
  await page.locator('[data-sitpos-measure]').click();
  await expect(page).toHaveURL(/#\/me\/tools\/sitpos\?bike=bike-test/);
  expect(errors).toEqual([]);
});
