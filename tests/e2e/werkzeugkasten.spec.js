// Paket L «Werkzeugkasten» (Noah 19.10.2026): Ich › Werkzeugkasten with its tools, all with fictional data.
// Calculator, units, currencies (the rate server is answered by the test), time zones (add, rename, delete
// with Undo), trip costs (a person, an expense, who owes whom), PDF (two made-up photos become one PDF),
// photos (smaller), and the links also under Ich › Dokumente.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';
import { TOOLS } from '../../src/lib/tools/tools.js';

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
  await page.locator('[data-row="tools"]').click();
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
  await expect(page.getByLabel(de('Trip'))).toBeVisible();
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
