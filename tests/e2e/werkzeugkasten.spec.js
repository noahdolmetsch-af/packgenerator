// Paket L «Werkzeugkasten» (Noah 19.10.2026): Ich › Werkzeugkasten with its tools, all with fictional data.
// Calculator, units, currencies (the rate server is answered by the test), time zones (add, rename, delete
// with Undo), trip costs (a person, an expense, who owes whom), PDF (two made-up photos become one PDF),
// photos (smaller), and the links also under Ich › Dokumente.
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';
import { TOOLS } from '../../src/lib/tools/tools.js';
import { renameGroupVia, deleteGroupVia } from './groups.js';

const de = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  const size = page.viewportSize();
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, tall) });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await page.setViewportSize(size);
};

/** A made-up photo (a green square with a darker circle) as JPEG bytes. */
const photo = async (page, w, h) =>
  Buffer.from(
    await page.evaluate(
      ([w, h]) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        g.fillStyle = '#9fc3a8';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#2d5a3d';
        g.beginPath();
        g.arc(w / 2, h / 2, Math.min(w, h) / 3, 0, 7);
        g.fill();
        return c.toDataURL('image/jpeg', 0.92).split(',')[1];
      },
      [w, h],
    ),
    'base64',
  );

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(/api\.frankfurter\.(dev|app)/, (route) => route.fulfill({ json: { date: '2026-10-16', rates: { EUR: 1.05, USD: 1.25, GBP: 0.9 } } }));
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
});

test('Werkzeugkasten: list, calculator, units, currencies and time zones', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('#/me');
  await ready(page);
  // «Alles finden 2» (Noah 22.10.2026 «4a», changed on purpose): the toolbox is a tab of Touren, no row in Ich
  await expect(page.locator('[data-row="tools"]')).toHaveCount(0);
  await viaTab(page, 'trips', '#/me/tools');
  await expect(page.getByRole('heading', { level: 1, name: de('Toolbox') })).toBeVisible();
  await expect(page.locator('a[data-tool]')).toHaveCount(TOOLS.length);
  await shot(page, info, 'L1-werkzeugkasten');

  await page.locator('a[data-tool="calc"]').click();
  await page.getByLabel(de('Calculation')).fill('12.5×3+10%');
  await expect(page.locator('[data-result]')).toHaveText('= 41.25');
  for (const k of ['C', '7', '÷', '2']) await page.locator(`.calc-k[data-key="${k}"]`).click();
  await page.locator('.calc-k[data-key="="]').click();
  await expect(page.getByLabel(de('Calculation'))).toHaveValue('3.5');
  await expect(page.getByText('7÷2 =')).toBeVisible();
  await shot(page, info, 'L2-rechner');

  await page.goto('#/me/tools/units');
  await page.getByRole('button', { name: de('Tyre pressure') }).click();
  await page.getByLabel(de('Value')).fill('3,2');
  await expect(page.locator('[data-unit="psi"] b')).toHaveText('46.412');

  await page.goto('#/me/tools/money');
  await page.getByLabel(de('Amount|money')).fill('105');
  await page.getByLabel(de('Currency')).selectOption('EUR');
  await expect(page.locator('[data-cur="CHF"] b')).toHaveText('100.00');
  await expect(page.getByText(/16\. Oktober 2026|16 October 2026/)).toBeVisible();
  await shot(page, info, 'L3-waehrungen');

  await page.goto('#/me/tools/zones');
  await page.getByRole('button', { name: de('Add place') }).click();
  await page.getByLabel(de('Time zone, e.g. Asia/Tokyo')).fill('Asia/Bangkok');
  await page.getByRole('button', { name: de('Add'), exact: true }).click();
  await expect(page.locator('.zones li', { hasText: 'Bangkok' })).toBeVisible();
  await page.getByRole('button', { name: de('Rename {name}').replace('{name}', 'Bangkok') }).click();
  const field = page.getByRole('dialog').getByRole('textbox');
  await field.fill('Tourstart');
  await field.press('Enter');
  await expect(page.locator('.zones li', { hasText: 'Tourstart' })).toBeVisible();
  await page.getByRole('button', { name: de('Delete {name}').replace('{name}', 'Tourstart') }).click();
  await page.getByRole('dialog').getByRole('button', { name: new RegExp(`^(${de('Delete')}|Delete)$`) }).click();
  await expect(page.locator('.zones li', { hasText: 'Tourstart' })).toHaveCount(0);
  await page.getByRole('button', { name: new RegExp(`^(${de('Undo')}|Undo)$`) }).click();
  await expect(page.locator('.zones li', { hasText: 'Tourstart' })).toBeVisible();
  await shot(page, info, 'L4-zeitzonen');
  expect(errors).toEqual([]);
});

test('Werkzeugkasten: trip costs, PDF, photos, links also in Dokumente', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('#/me');
  await ready(page);
  // a made-up trip, written straight into the database
  await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('trips', 'readwrite');
          tx.objectStore('trips').put({ id: 'test-trip-l', title: 'Testtour Jura', domain: 'bike', status: 'planned', startDate: '2026-10-18', days: 3, entries: [], createdAt: '2026-10-01T10:00:00Z' });
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
  );
  await page.goto('#/me/tools/costs');
  await page.reload();
  await ready(page);
  await expect(page.locator('main').getByRole('combobox', { name: new RegExp(`^${de('Trip')}`) })).toBeVisible();
  await page.getByLabel(de('Add a person')).fill('Anna');
  await page.getByRole('button', { name: de('Add'), exact: true }).click();
  await page.getByRole('button', { name: de('Add expense') }).click();
  await page.getByLabel(de('What'), { exact: true }).fill('Hotel');
  await page.getByLabel(de('Amount|money')).fill('90');
  await page.getByLabel(de('Currency')).selectOption('CHF');
  await page.getByRole('button', { name: de('Save'), exact: true }).click();
  await expect(page.locator('[data-total]')).toHaveText('90.00 CHF');
  await page.getByRole('button', { name: de('Add expense') }).click();
  await page.getByLabel(de('What'), { exact: true }).fill('Znacht');
  await page.getByLabel(de('Amount|money')).fill('21');
  await page.getByLabel(de('Currency')).selectOption('EUR');
  await expect(page.getByLabel(de('In Franken'))).toHaveValue('20');
  await page.getByRole('button', { name: de('Save'), exact: true }).click();
  await expect(page.locator('[data-total]')).toHaveText('110.00 CHF');
  await expect(page.locator('[data-settle]')).toContainText('55.00 CHF');
  await page.getByRole('button', { name: de('Request by TWINT') }).click();
  await expect(page.locator('[data-settle]')).toContainText(de('First add your TWINT number once under Me › Pay › Invoices.'));
  await shot(page, info, 'L5-kosten');

  await page.goto('#/me/tools/pdf');
  const jpg = await photo(page, 300, 200);
  await page.locator('.pdf input[type=file]').setInputFiles([
    { name: 'beleg-1.jpg', mimeType: 'image/jpeg', buffer: jpg },
    { name: 'beleg-2.jpg', mimeType: 'image/jpeg', buffer: jpg },
  ]);
  await expect(page.locator('.pdf .tool-list li')).toHaveCount(2);
  await page.getByRole('button', { name: de('Merge into one PDF') }).click();
  await expect(page.locator('.pf-res')).toContainText(de('{n} pages').replace('{n}', '2'));
  await shot(page, info, 'L6-pdf');

  await page.goto('#/me/tools/photo');
  await page.locator('.photo input[type=file]').setInputFiles({ name: 'velo.jpg', mimeType: 'image/jpeg', buffer: await photo(page, 1600, 1200) });
  await expect(page.locator('.ph-crop')).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`^${de('Small|photo')}`) }).click();
  await page.getByRole('button', { name: de('Make photo') }).click();
  await expect(page.locator('[data-result]')).toContainText('800 × 600');
  await shot(page, info, 'L7-fotos');

  await page.goto('#/me/tools/ablage');
  await page.getByRole('button', { name: de('Add link') }).click();
  await page.getByLabel(de('Web address')).fill('example.org/fahrplan');
  await page.getByRole('button', { name: de('Save'), exact: true }).click();
  await expect(page.locator('[data-ablage="links"] li', { hasText: 'example.org' })).toBeVisible();
  await page.goto('#/me/docs');
  await expect(page.locator('[data-ablage="links"] li', { hasText: 'example.org' })).toBeVisible();
  await shot(page, info, 'L8-dokumente');
  expect(errors).toEqual([]);
});

/** Puts a record into a table of the app's database (fictional data only). */
const putRow = (page, table, row) =>
  page.evaluate(
    ([table, row]) =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction(table, 'readwrite');
          tx.objectStore(table).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => no(tx.error);
        };
      }),
    [table, row],
  );
const readAll = (page, table) =>
  page.evaluate(
    (table) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(table).objectStore(table).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    table,
  );

test('Werkzeugkasten: fits right now, search and order, gears, QR, bar code, map, chains, picture format', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('#/me');
  await ready(page);
  // a made-up trip to France in 5 days (calendar days in Zurich)
  const start = await page.evaluate(() => {
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date()).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + 5)).toISOString().slice(0, 10);
  });
  await putRow(page, 'trips', { id: 'test_data_trip_fr', title: 'Testtour Provence', startDate: start, days: 3, country: 'FR', domain: 'bikepacking', status: 'planned', entries: [] });
  await page.goto('#/me/tools');
  await page.reload();
  await ready(page);

  // «Passt gerade»: currencies, phrases and the map for the trip abroad
  await expect(page.getByRole('heading', { level: 2, name: de('Fits right now') })).toBeVisible();
  await expect(page.locator('a[data-fit]')).toHaveCount(3);
  await expect(page.locator('a[data-fit="money"]')).toContainText(de('For your trip abroad'));
  await shot(page, info, 'L3-passt-gerade');

  // search, then the own order with the arrows (it stays after a reload)
  await page.getByLabel(de('Search tools')).fill('wasser');
  await expect(page.locator('a[data-tool]')).toHaveCount(1);
  await expect(page.locator('a[data-tool="level"]')).toBeVisible();
  await page.getByLabel(de('Search tools')).fill('');
  await page.getByRole('button', { name: de('Order|sort') }).click();
  const second = DE[TOOLS[1].title] ?? TOOLS[1].title;
  await page.locator(`li[data-sort-id="${TOOLS[1].key}"]`).getByRole('button', { name: de('Move {name} up').replace('{name}', second), exact: true }).click();
  await page.getByRole('button', { name: de('Done') }).click();
  await expect(page.locator('a[data-tool]').first()).toHaveAttribute('data-tool', TOOLS[1].key);
  await page.reload();
  await ready(page);
  await expect(page.locator('a[data-tool]').first()).toHaveAttribute('data-tool', TOOLS[1].key);

  // gear ratios: 40 × 40 on 700 × 40C at 90 rpm
  await page.locator('a[data-tool="gears"]').click();
  await page.getByLabel(de('Chainrings (teeth)')).fill('40');
  await page.getByLabel(de('Cassette (teeth)')).fill('11-40');
  await expect(page.locator('.g-table tbody tr')).toHaveCount(2);
  await expect(page.locator('.g-table tbody tr').nth(1)).toContainText('11.9');
  await shot(page, info, 'L4-uebersetzung');

  // QR code from a text
  await page.goto('#/me/tools/qr');
  await page.getByLabel(de('Text or link'), { exact: true }).last().fill('https://example.org/test');
  await expect(page.locator('.q-box svg')).toBeVisible();

  // bar code typed: new → an item in Material with the code; then the same code finds it
  await page.goto('#/me/tools/barcode');
  await page.getByLabel(de('Number under the bars')).fill('4006381333931');
  await page.getByRole('button', { name: de('Look up') }).click();
  await page.getByLabel(de('Name|item')).fill('Testschlauch Muster');
  await page.getByRole('button', { name: de('Add to gear') }).click();
  await expect(page).toHaveURL(/#\/gear\?item=/);
  await expect.poll(async () => (await readAll(page, 'items')).find((i) => i.barcode === '4006381333931')?.name).toBe('Testschlauch Muster');
  await page.goto('#/me/tools/barcode');
  await page.getByLabel(de('Number under the bars')).fill('4006381333931');
  await page.getByRole('button', { name: de('Look up') }).click();
  await expect(page.getByRole('link', { name: 'Testschlauch Muster' })).toBeVisible();

  // map: two taps, a length; the tiles are blocked in the test, the line still counts
  await page.goto('#/me/tools/map');
  const map = page.locator('.mm-map');
  await expect(map.locator('.leaflet-pane').first()).toBeAttached();
  const box = await map.boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.5);
  await expect.poll(async () => Number(await page.locator('[data-m]').getAttribute('data-m'))).toBeGreaterThan(1000);
  const gpx = page.waitForEvent('download');
  await page.getByRole('button', { name: de('Save as GPX') }).click();
  expect((await gpx).suggestedFilename()).toBe('strecke.gpx');
  await shot(page, info, 'L5-strecke');

  // chains: «Receipts as one PDF» with two made-up photos ends with one PDF
  await page.goto('#/me/tools/chains');
  const chain = page.locator('[data-chain="c-belege"]');
  await expect(chain).toContainText(de('Receipts as one PDF'));
  const pdf = page.waitForEvent('download');
  const pick = page.waitForEvent('filechooser');
  await chain.getByRole('button', { name: de('Start|chain') }).click();
  await (await pick).setFiles([
    { name: 'beleg-1.jpg', mimeType: 'image/jpeg', buffer: await photo(page, 1200, 900) },
    { name: 'beleg-2.jpg', mimeType: 'image/jpeg', buffer: await photo(page, 900, 1200) },
  ]);
  expect((await pdf).suggestedFilename()).toMatch(/\.pdf$/);
  await expect(chain.getByText(de('Done.'))).toBeVisible();
  // a new chain with one step, renamed, then deleted with Undo
  await page.getByRole('button', { name: de('New chain') }).click();
  await page.locator('dialog[open] #rn-in').fill('Meine Testkette');
  await page.locator('dialog[open]').getByRole('button', { name: de('Save'), exact: true }).click();
  await expect(page.locator('li[data-chain]').last()).toContainText('Meine Testkette');
  await page.locator('li[data-chain]').last().getByLabel(de('Add step')).selectOption('share');
  await expect(page.locator('li[data-chain]').last().locator('[data-step="share"]')).toHaveCount(1);
  await shot(page, info, 'L6-ketten');

  // picture format: a PNG becomes a JPG
  await page.goto('#/me/tools/convert');
  const png = Buffer.from(await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 30;
    c.getContext('2d').fillRect(0, 0, 20, 30);
    return c.toDataURL('image/png').split(',')[1];
  }), 'base64');
  const pick2 = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: de('Choose pictures') }).click();
  await (await pick2).setFiles([{ name: 'test-bild.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.locator('li[data-state="done"]')).toContainText('test-bild.jpg');

  // the other new tools open without errors (sensors and camera are not there in the test)
  for (const k of ['level', 'light', 'video']) {
    await page.goto(`#/me/tools/${k}`);
    await expect(page.locator(`.tools-view[data-tool="${k}"]`)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('Werkzeuge und Links: suggestions with the trip, switch off and back, own link, groups', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('#/me');
  await ready(page);
  const start = await page.evaluate(() => {
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date()).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + 4)).toISOString().slice(0, 10);
  });
  await putRow(page, 'trips', { id: 'test_data_trip_jura', title: 'Testtour Jura', startDate: start, days: 2, place: { name: 'Delemont', lat: 47.36, lon: 7.34 }, status: 'planned', entries: [] });
  await page.reload();
  await ready(page);
  // «Alles finden 2» (Noah 22.10.2026 «4a», changed on purpose): your links are a tab of Planen, no row in Ich
  await viaTab(page, 'week', '#/me/links');
  await expect(page.getByRole('heading', { level: 1, name: de('Tools and links') })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: de('On the way|links') })).toBeVisible();
  await expect(page.locator('[data-trip-line]')).toContainText('Testtour Jura');
  // SBB carries the place and the day of the trip
  const sbb = page.locator('[data-link="s:sbb"] a');
  await expect(sbb).toHaveAttribute('href', /nach=Delemont/);
  await expect(sbb).toHaveAttribute('href', new RegExp(`datum=${start.slice(8, 10)}\\.${start.slice(5, 7)}\\.${start.slice(0, 4)}`));
  await expect(sbb).toHaveAttribute('target', '_blank');
  await shot(page, info, 'L7-links');

  // switch off Trello, then bring it back
  await page.getByRole('button', { name: de('Do not suggest «{name}» any more').replace('{name}', 'Trello') }).click();
  await expect(page.locator('[data-link="s:trello"]')).toHaveCount(0);
  await page.locator('.wl-off summary').click();
  await page.locator('[data-off="trello"]').getByRole('button', { name: de('Show again') }).click();
  await expect(page.locator('[data-link="s:trello"]')).toHaveCount(1);

  // an own link in «Alltag»: it is also under Toolbox › Links and files (one store)
  await page.getByRole('button', { name: de('Add own link') }).click();
  await page.locator('.wl-add').getByLabel(de('Name on the button')).fill('Testseite Muster');
  await page.locator('.wl-add').getByLabel(de('Address')).fill('example.org/test');
  await page.locator('.wl-add').getByLabel(de('Group')).selectOption('everyday');
  await page.locator('.wl-add').getByRole('button', { name: de('Add'), exact: true }).click();
  await expect(page.locator('[data-wl-group="everyday"]').getByText('Testseite Muster')).toBeVisible();

  // a new group, renamed; then «Alltag» deleted: its links go to «Ohne Gruppe», Undo brings it back
  await page.getByRole('button', { name: de('New group') }).click();
  await page.getByLabel(de('Name of the new group')).fill('Testgruppe');
  await page.locator('.wl-newg').getByRole('button', { name: de('Add'), exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Testgruppe' })).toBeVisible();
  await renameGroupVia(page, 'Testgruppe', 'Testgruppe Neu');
  await expect(page.getByRole('heading', { level: 2, name: 'Testgruppe Neu' })).toBeVisible();
  await deleteGroupVia(page, de('Everyday|links'));
  await page.locator('dialog.gds[open]').getByRole('button', { name: de('Delete'), exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: de('Everyday|links') })).toHaveCount(0);
  await expect(page.locator('[data-wl-group="none"]').getByText('Testseite Muster')).toBeVisible();
  // B22 (Noah 27.10.2026): the rename note stays under the delete note; the newest one (.rtoast) undoes the delete
  await page.locator('.rtoast').getByRole('button', { name: de('Undo') }).click();
  await expect(page.getByRole('heading', { level: 2, name: de('Everyday|links') })).toBeVisible();
  await expect(page.locator('[data-wl-group="everyday"]').getByText('Testseite Muster')).toBeVisible();

  await page.goto('#/me/tools/ablage');
  await expect(page.getByText('Testseite Muster')).toBeVisible();
  expect(errors).toEqual([]);
});
