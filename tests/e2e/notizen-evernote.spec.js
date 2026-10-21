// Paket NE «Notizen wie Evernote», part 1 (Noah 20.10.2026): draw on a photo (tools, undo/redo, move,
// remove, the lines stay changeable), a drawing pad with pages and paper, and formatted writing without
// marks. In German, on a phone and a computer; no sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { deflateSync } from 'node:zlib';
import { ready } from './settle.js';

/** A fictional picture: a grey PNG of w × h pixels. */
function png(w, h) {
  const crcT = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b) => {
    let c = 0xffffffff;
    for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h, 0xb0);
  for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const PNG = png(400, 300);
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function prep(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/notes');
  await ready(page);
  return errors;
}
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

/** The stored note whose title is `title`. */
const storedNote = (page, title) =>
  page.evaluate(
    (title) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const g = r.result.transaction('notes').objectStore('notes').getAll();
          g.onsuccess = () => ok(g.result.find((n) => (n.title ?? '').includes(title)) ?? null);
          g.onerror = fail;
        };
      }),
    title,
  );

async function newNote(page, text) {
  await page.locator('form.cap textarea').fill(text);
  await page.locator('form.cap button[type="submit"]').click();
  await page.locator('li.ncard', { hasText: text.split('\n')[0].replace('test_data_gtp_ ', '') }).locator('button').first().click();
  const sheet = page.locator('dialog.nsheet');
  await expect(sheet).toBeVisible();
  return sheet;
}
async function stroke(page, cv, from, to) {
  const b = await cv.boundingBox();
  await page.mouse.move(b.x + b.width * from[0], b.y + b.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * to[0], b.y + b.height * to[1], { steps: 6 });
  await page.mouse.up();
}
async function tapAt(page, cv, at) {
  const b = await cv.boundingBox();
  await page.mouse.click(b.x + b.width * at[0], b.y + b.height * at[1]);
}

test('draw on a note photo: pen, arrow and text; undo and redo; later move and remove one line', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Bremse\nBelag prüfen');
  await sheet.locator('[data-note-adds] label:not([data-camera]) input[type="file"]').setInputFiles({ name: 'bremse.png', mimeType: 'image/png', buffer: PNG });
  await expect(sheet.locator('[data-note-photo]')).toHaveCount(1);
  const before = await sheet.locator('[data-note-photo] img').getAttribute('src');

  await sheet.locator('[data-note-draw]').click();
  const dw = page.locator('dialog[data-draw]');
  const cv = dw.locator('[data-draw-canvas]');
  await expect(cv).toBeVisible();
  await expect(dw.getByRole('heading', { name: T('Draw on the photo') })).toBeVisible();
  await noSideScroll(page);

  await dw.locator('[data-tool="pen"]').click();
  await stroke(page, cv, [0.1, 0.1], [0.4, 0.3]);
  await dw.locator('[data-tool="arrow"]').click();
  await stroke(page, cv, [0.6, 0.8], [0.8, 0.5]);
  await dw.locator('[data-tool="text"]').click();
  await tapAt(page, cv, [0.1, 0.7]);
  await dw.locator('[data-draw-text]').fill('neu');
  await dw.getByRole('button', { name: T('Place|text') }).click();
  // undo takes the text away, redo brings it back
  await dw.locator('[data-draw-undo]').click();
  await expect(dw.locator('[data-draw-redo]')).toBeEnabled();
  await dw.locator('[data-draw-redo]').click();
  await expect(dw.locator('[data-draw-redo]')).toBeDisabled();
  // pen pressure can be turned off (kept on this device)
  await dw.locator('[data-draw-pressure]').uncheck();
  await dw.locator('[data-draw-save]').click();
  await expect(dw).toHaveCount(0);
  await expect(sheet.locator('[data-note-photo] img')).not.toHaveAttribute('src', before);
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();

  await expect.poll(async () => Object.keys((await storedNote(page, 'Bremse'))?.inks ?? {}).length).toBe(1);
  let n = await storedNote(page, 'Bremse');
  const ink = Object.values(n.inks)[0].ink;
  expect(ink.pages[0].map((x) => x.t)).toEqual(['pen', 'arrow', 'text']);
  expect(ink.pages[0][2].text).toBe('neu');
  expect(ink.base).toBe(before);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('draw.prefs')).pressure)).toBe(false);

  // the lines stay changeable: open again, select the arrow and remove it
  await page.locator('li.ncard', { hasText: 'Bremse' }).locator('button').first().click();
  await sheet.locator('[data-note-draw]').click();
  await expect(cv).toBeVisible();
  await expect(dw.locator('[data-draw-pressure]')).not.toBeChecked();
  await dw.locator('[data-tool="select"]').click();
  await tapAt(page, cv, [0.7, 0.65]);
  await dw.locator('[data-draw-remove]').click();
  await dw.locator('[data-draw-save]').click();
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => Object.values((await storedNote(page, 'Bremse')).inks)[0].ink.pages[0].map((x) => x.t)).toEqual(['pen', 'text']);
  n = await storedNote(page, 'Bremse');
  expect(Object.keys(n.inks)).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('drawing pad: two pages on squared paper become two pictures; a page opens where it is', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Route\nSkizze');
  await sheet.locator('[data-add-sketch]').click();
  const dw = page.locator('dialog[data-draw]');
  const cv = dw.locator('[data-draw-canvas]');
  await expect(cv).toBeVisible();
  await dw.locator('[data-paper="squared"]').click();
  await stroke(page, cv, [0.2, 0.2], [0.6, 0.4]);
  await dw.locator('[data-draw-addpage]').click();
  await expect(dw.locator('[data-draw-page]')).toHaveText(T('Page {n} of {m}').replace('{n}', '2').replace('{m}', '2'));
  await dw.locator('[data-tool="ellipse"]').click();
  await stroke(page, cv, [0.3, 0.3], [0.7, 0.6]);
  await noSideScroll(page);
  await dw.locator('[data-draw-save]').click();
  await expect(sheet.locator('[data-note-photo]')).toHaveCount(2);
  // the second picture opens the pad on its page
  await sheet.locator('[data-note-draw]').nth(1).click();
  await expect(dw.locator('[data-draw-page]')).toHaveText(T('Page {n} of {m}').replace('{n}', '2').replace('{m}', '2'));
  await expect(dw.locator('[data-paper="squared"]')).toHaveAttribute('aria-pressed', 'true');
  await dw.getByRole('button', { name: T('Cancel') }).click();
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => Object.keys((await storedNote(page, 'Route'))?.inks ?? {}).length).toBe(2);
  const n = await storedNote(page, 'Route');
  const entries = Object.values(n.inks);
  expect(entries.map((e) => e.at).sort()).toEqual([0, 1]);
  expect(entries[0].ink.paper).toBe('squared');
  expect(entries[0].ink.pages).toHaveLength(2);
  expect(errors).toEqual([]);
});

test('formatted writing: bold, ticks and a heading without marks; the note keeps Markdown light', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Packen\nStart');
  const ed = sheet.locator('[data-rt-edit]');
  await expect(ed).toBeVisible();
  await expect(sheet.locator('[data-rt-bar] [data-rt]')).toHaveCount(9);
  await ed.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await sheet.locator('[data-rt="bold"]').click();
  await page.keyboard.type('Wichtig');
  await sheet.locator('[data-rt="bold"]').click();
  await page.keyboard.press('Enter');
  await sheet.locator('[data-rt="todo"]').click();
  await page.keyboard.type('Gas');
  await expect(ed.locator('strong, b')).toHaveText('Wichtig');
  await expect(ed.locator('li[data-todo="0"]')).toHaveText('Gas');
  // a tap on the box ticks it
  const li = ed.locator('li[data-todo]');
  const b = await li.boundingBox();
  await page.mouse.click(b.x + 8, b.y + b.height / 2);
  await expect(ed.locator('li[data-todo="1"]')).toHaveCount(1);
  await noSideScroll(page);
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => (await storedNote(page, 'Packen'))?.text ?? '').toContain('- [x] Gas');
  const n = await storedNote(page, 'Packen');
  expect(n.text).toContain('**Wichtig**');
  expect(n.text).toContain('- [x] Gas');
  expect(n.text).not.toContain('<');
  // opened again it shows formatted, not with marks
  await page.locator('li.ncard', { hasText: 'Packen' }).locator('button').first().click();
  await expect(ed.locator('strong')).toHaveText('Wichtig');
  await expect(ed).not.toContainText('**');
  expect(errors).toEqual([]);
});
