// Dokumente-PDF (Noah 15.10.2026 «1b 2a … 3 beides … 4a … 5a», «1a 2a 3 beides 4a 5 …», built «vorerst ohne
// mockup»): Ich › Dokumente, two fictional gallery photos of a sheet on a dark table become one PDF in
// «Importierte PDF», the text reading fails quietly (everything outside the preview server is blocked),
// rename and move to an own group work, and Google Drive is connected with the same Google login as
// Fitbit and gets the PDF. The server (packgen-three.vercel.app/api/google) is answered by the test.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';
const de = (en) => DE[en] ?? en;
const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

const readTable = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    name,
  );

/** A fictional photo: a bright, slightly tilted sheet with grey lines on a dark table. */
const sheetPhoto = (page, tilt) =>
  page.evaluate((tilt) => {
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 800;
    const g = c.getContext('2d');
    g.fillStyle = '#3a3530';
    g.fillRect(0, 0, 600, 800);
    g.translate(300, 400);
    g.rotate(tilt);
    g.fillStyle = '#f4f1ea';
    g.fillRect(-210, -300, 420, 600);
    g.fillStyle = '#555';
    for (let y = -250; y < 250; y += 40) g.fillRect(-170, y, y % 80 ? 300 : 200, 10);
    return c.toDataURL('image/jpeg', 0.9).split(',')[1];
  }, tilt);

test('Dokumente: two gallery photos become one PDF, rename, own group, then Google Drive gets it', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const log = [];
  let drive = false;
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    const raw = req.postDataBuffer();
    log.push({ step, auth: req.headers().authorization ?? null, type: req.headers()['content-type'] ?? null, name: url.searchParams.get('name'), root: url.searchParams.get('root'), group: url.searchParams.get('group'), head: raw ? raw.subarray(0, 5).toString('latin1') : null, json: step !== 'drive-upload' && raw ? JSON.parse(raw.toString() || '{}') : null });
    const body = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return body({ url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y' });
    if (step === 'status') return body({ connected: drive, drive });
    if (step === 'drive-upload') return body({ id: `${P}file1`, link: 'https://drive.google.com/file/d/test_data_gtp_file1/view' });
    if (step === 'drive-move' || step === 'drive-rename') return body({});
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/accounts\.google\.com\/o\/oauth2/, (route) => {
    drive = true;
    return route.fulfill({ status: 302, headers: { location: `${baseURL}#/me/docs?google=connected` } });
  });
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./');
  await ready(page);

  // Ich › Dokumente: empty, the two ways in
  await page.goto('./#/me');
  await page.getByRole('link', { name: new RegExp(de('Documents')) }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: de('Documents') })).toBeVisible();
  await expect(page.getByText(de('No documents yet'))).toBeVisible();
  await expect(page.getByRole('button', { name: de('Connect Google Drive') })).toBeVisible();
  await shot(page, info, 'D1-leer');

  // photograph: two gallery photos, the edge is found, black and white by default
  await page.getByRole('link', { name: de('Photograph document') }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: de('Photograph document') })).toBeVisible();
  const files = [
    { name: 'blatt-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(await sheetPhoto(page, 0.08), 'base64') },
    { name: 'blatt-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(await sheetPhoto(page, -0.05), 'base64') },
  ];
  await page.locator('input[type=file][multiple]').first().setInputFiles(files);
  await expect(page.getByRole('heading', { level: 1, name: de('Check and keep as PDF') })).toBeVisible();
  await expect(page.getByRole('img', { name: /2$/ })).toBeVisible();
  await expect(page.getByText(de('edge not found'))).toHaveCount(0);
  await expect(page.getByRole('radio').first()).toBeChecked();
  await shot(page, info, 'D2-pruefen');

  // the corners by hand: the editor opens and closes
  await page.getByRole('button', { name: de('Corners') }).first().click();
  await expect(page.getByRole('heading', { name: de('Move the corners') })).toBeVisible();
  await shot(page, info, 'D3-ecken');
  await page.getByRole('button', { name: de('Done') }).click();

  await page.getByLabel(de('Name|doc')).fill('Quittung Veloladen Muster');
  await page.getByRole('button', { name: de('Save as PDF') }).click();

  // the new document opens (Paket B: like «Add PDF» of P3b): one PDF with two pages, in «Importierte PDF»
  await expect(page).toHaveURL(/#\/me\/docs\/doc-/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Quittung Veloladen Muster' })).toBeVisible();
  await expect.poll(async () => (await readTable(page, 'docs')).length).toBe(1);
  const [doc] = await readTable(page, 'docs');
  expect(doc).toMatchObject({ kind: 'pdf', name: 'Quittung Veloladen Muster', pages: 2, mode: 'bw', source: 'gallery', group: '', until: null, inPack: false });
  expect(doc.data.startsWith('data:application/pdf;base64,')).toBe(true);
  expect(log.find((x) => x.step === 'drive-upload')).toBeUndefined();

  // an own group for this document (the details of P3b): «New group …», then it moves there
  await page.getByLabel(de('Group')).selectOption('+');
  await page.getByLabel(de('Name of the new group')).fill('Belege');
  await page.getByRole('button', { name: de('Add'), exact: true }).click();
  await expect.poll(async () => (await readTable(page, 'docs'))[0].group).toBe('Belege');

  // back in the list: the group «Belege» with the PDF, search finds it by its name
  await page.getByRole('link', { name: de('Documents') }).first().click();
  await expect(page.getByRole('heading', { level: 2, name: 'Belege' })).toBeVisible();
  await page.getByLabel(de('Search documents')).fill('veloladen');
  await expect(page.getByRole('heading', { level: 2, name: de('Found') })).toBeVisible();
  await expect(page.getByText('Quittung Veloladen Muster').first()).toBeVisible();
  await page.getByLabel(de('Search documents')).fill('');
  await shot(page, info, 'D4-liste');

  // Google Drive: the same login, back on Dokumente, the PDF goes up into «Belege»
  await page.getByRole('button', { name: de('Connect Google Drive') }).click();
  await expect(page.getByRole('heading', { level: 1, name: de('Documents') })).toBeVisible();
  expect(page.url()).not.toContain('google=');
  const start = log.find((x) => x.step === 'start');
  expect(start).toMatchObject({ auth: `Bearer ${P}key` });
  expect(start.json.services).toEqual(['drive']);
  await expect.poll(() => log.find((x) => x.step === 'drive-upload')).toMatchObject({ auth: `Bearer ${P}key`, type: 'application/pdf', root: 'pdf', group: 'Belege', head: '%PDF-' });
  await expect.poll(async () => (await readTable(page, 'docs'))[0].drive?.id).toBe(`${P}file1`);
  await expect(page.getByText(de('In your Google Drive'), { exact: true })).toBeVisible();
  await shot(page, info, 'D5-drive');

  expect(errors).toEqual([]);
});
