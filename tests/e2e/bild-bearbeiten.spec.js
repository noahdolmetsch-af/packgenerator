// «Bild bearbeiten» (Noah 28.10.2026 «1a 2a 3a 4a 5a»): Werkzeugkasten › Bild bearbeiten with two made-up
// screenshots (a fictional shop order): choose, turn, draw, remove with Undo, order, one PDF and single pictures.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

/** For the review page (SHOTS=dir): a green frame with «Neu» around what is new, then a full-page picture. */
const shot = async (page, info, name, mark) => {
  if (!process.env.SHOTS) return;
  if (mark) {
    await page
      .locator(mark)
      .first()
      .evaluate((el) => {
        el.style.outline = '3px solid #18a957';
        el.style.outlineOffset = '3px';
        el.style.position ||= 'relative';
        const tag = document.createElement('span');
        tag.textContent = 'Neu';
        tag.dataset.shotTag = '1';
        Object.assign(tag.style, {
          position: 'absolute',
          top: '-12px',
          right: '-6px',
          background: '#18a957',
          color: '#fff',
          font: '700 11px Inter, sans-serif',
          padding: '1px 6px',
          borderRadius: '5px',
          zIndex: 5,
        });
        el.append(tag);
      });
  }
  const size = page.viewportSize();
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({
    width: size.width,
    height: Math.max(size.height, tall),
  });
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`,
  });
  await page.setViewportSize(size);
  if (mark)
    await page
      .locator(mark)
      .first()
      .evaluate((el) => (el.querySelector('[data-shot-tag]')?.remove(), (el.style.outline = '')));
};

/** A made-up screenshot of a shop order (fictional data) as PNG bytes. */
const screenshot = async (page, title) =>
  Buffer.from(
    await page.evaluate((title) => {
      const c = document.createElement('canvas');
      c.width = 540;
      c.height = 960;
      const g = c.getContext('2d');
      g.fillStyle = '#fafafa';
      g.fillRect(0, 0, 540, 960);
      g.fillStyle = '#4a7360';
      g.fillRect(0, 0, 540, 90);
      g.fillStyle = '#fff';
      g.font = 'bold 30px sans-serif';
      g.fillText(title, 24, 58);
      g.fillStyle = '#1d2a24';
      g.font = '26px sans-serif';
      [
        ['2 × Schlauch 29"', 'CHF 24.00'],
        ['Kettenöl', 'CHF 12.50'],
        ['Total', 'CHF 36.50'],
      ].forEach(([a, b], i) => {
        g.fillText(a, 24, 170 + i * 56);
        g.fillText(b, 360, 170 + i * 56);
      });
      return c.toDataURL('image/png').split(',')[1];
    }, title),
    'base64',
  );

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
});

test('Bild bearbeiten: choose, turn, draw, remove with Undo, order, one PDF', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('#/me/tools');
  await ready(page);
  const tile = page.locator('a[data-tool="markup"]');
  await expect(tile).toContainText(T('Edit a picture'));
  await shot(page, info, 'B1-werkzeugkasten', 'a[data-tool="markup"]');
  await tile.click();
  await expect(page).toHaveURL(/#\/me\/tools\/markup$/);
  const tool = page.locator('[data-markup]');
  await expect(tool).toContainText(T('Take the screenshot on your phone as always. Then choose it here, cut it, draw and write on it, and make one PDF of all pages. Everything stays on this device.'));

  await tool.locator('[data-markup-pick]').setInputFiles([
    {
      name: 'bestellung.png',
      mimeType: 'image/png',
      buffer: await screenshot(page, 'Velo-Laden Muster'),
    },
    {
      name: 'versand.png',
      mimeType: 'image/png',
      buffer: await screenshot(page, 'Versand Muster'),
    },
  ]);
  const rows = tool.locator('.mk-pages > li');
  await expect(rows).toHaveCount(2);

  // turn: the page lies across afterwards
  const first = rows.nth(0).locator('img.mk-th');
  const before = await first.getAttribute('src');
  await rows.nth(0).locator('[data-turn]').click();
  await expect(first).not.toHaveAttribute('src', before);
  const [w, h] = await first.evaluate((img) => new Promise((res) => (img.complete ? res([img.naturalWidth, img.naturalHeight]) : (img.onload = () => res([img.naturalWidth, img.naturalHeight])))));
  expect(w).toBeGreaterThan(h);

  // draw a line on page 2: its picture changes
  const second = rows.nth(1).locator('img.mk-th');
  const plain = await second.getAttribute('src');
  await rows.nth(1).locator('[data-draw]').click();
  const dw = page.locator('dialog[data-draw]');
  const cv = dw.locator('[data-draw-canvas]');
  await expect(cv).toBeVisible();
  await dw.locator('[data-tool="pen"]').click();
  const b = await cv.boundingBox();
  await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.6, {
    steps: 6,
  });
  await page.mouse.up();
  await dw.locator('[data-draw-save]').click();
  await expect(dw).toHaveCount(0);
  await expect(second).not.toHaveAttribute('src', plain);

  // the order: page 2 up
  const drawn = await second.getAttribute('src');
  await rows
    .nth(1)
    .getByRole('button', {
      name: T('Move {name} up').replace('{name}', T('Page {n}').replace('{n}', '2')),
      exact: true,
    })
    .click();
  await expect(rows.nth(0).locator('img.mk-th')).toHaveAttribute('src', drawn);
  await shot(page, info, 'B2-seiten', '[data-markup]');

  // remove page 1 and bring it back
  await rows.nth(0).locator('[data-remove]').click();
  await expect(rows).toHaveCount(1);
  await page
    .locator('.rtoast')
    .getByRole('button', { name: T('Undo') })
    .click();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('img.mk-th')).toHaveAttribute('src', drawn);

  // one PDF of both pages
  const down = page.waitForEvent('download');
  await tool.locator('[data-markup-save]').click();
  const file = await down;
  expect(file.suggestedFilename()).toMatch(/^bild-\d{4}-\d{2}-\d{2}\.pdf$/);
  await expect(tool.locator('[data-markup-done]')).toContainText(T('One PDF, {n} pages, {size}.').split('{n}')[0]);
  await expect(tool.locator('[data-markup-done]')).toContainText('2');

  // single pictures
  await tool.getByRole('button', { name: T('Single pictures') }).click();
  const two = [];
  page.on('download', (d) => two.push(d.suggestedFilename()));
  await tool.locator('[data-markup-save]').click();
  await expect(tool.locator('[data-markup-done]')).toContainText(T('{n} pictures ready.').replace('{n}', '2'));
  await expect.poll(() => two.length).toBe(2);
  expect(two.sort()).toEqual([expect.stringMatching(/-1\.jpg$/), expect.stringMatching(/-2\.jpg$/)]);

  await expect(tool.getByRole('link', { name: T('Photograph a document') })).toHaveAttribute('href', '#/me/docs/scan');
  expect(errors).toEqual([]);
});
