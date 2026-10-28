// «Mail in die App» (Noah 19.10.2026, built without mockups): a mail from Ich › Mail goes into the Eingang with its
// attachment («In die App übernehmen»); a labelled mail comes by itself when the Eingang opens; the row shows the
// tip and the attachment's button; «Ablegen als …» has the new targets and an own new place; the Mac bookmark
// keeps a web page as an entry. The server and Google are answered by the test. Fictional mails only.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';
import { readFileSync } from 'node:fs';
// the targets of «Ablegen als …», read from the app source (inbox.js imports page code that needs the browser)
const TARGETS = [...readFileSync(new URL('../../src/lib/inbox.js', import.meta.url), 'utf8').split('export const TARGETS = [')[1].split('];')[0].matchAll(/\{ key: '(\w+)'/g)].map((m) => m[1]);

const P = 'test_data_mip_';
const de = (en) => DE[en] ?? en;
const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const MAILS = [
  { id: 'm1', thread: 'th1', from: 'buchung@hotel.example.test', fromName: 'Hotel Muster', to: 'noah@example.test', subject: 'Buchungsbestätigung Hotel Muster', snippet: 'Ihre Buchung ist bestätigt', date: ago(2), unread: true, starred: false, inbox: true },
  { id: 'm2', thread: 'th2', from: 'rechnung@shop.example.test', fromName: 'Shop Muster', to: 'noah@example.test', subject: 'Rechnung 2026-55', snippet: 'Zahlbar bis 30.11.2026', date: ago(5), unread: false, starred: false, inbox: true },
];
const TEXT = { m1: 'Grüezi\nIhre Buchung ist bestätigt.\nCheck-in: 24.11.2026\nBuchungsnummer: HM-4711', m2: 'Rechnung 2026-55\nBetrag: CHF 45.00\nzahlbar bis 30.11.2026\nIBAN CH93 0076 2011 6238 5295 7' };
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64');

test('Mail in die App: take a mail in, the label, the tip, the attachment, the new targets', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const log = [];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    log.push({ step, params: Object.fromEntries(url.searchParams) });
    const ok = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'status') return ok({ connected: true, mail: true });
    // the label search brings only the shop's bill; the inbox both
    if (step === 'mail-list') return ok({ mails: /label:packgenerator/.test(url.searchParams.get('q') ?? '') ? [MAILS[1]] : MAILS, next: null });
    if (step === 'mail-get') {
      const id = url.searchParams.get('id');
      return ok({ mail: { ...MAILS.find((m) => m.id === id), text: TEXT[id], files: [{ name: id === 'm1' ? 'Bestaetigung.pdf' : 'Rechnung-55.pdf', type: 'application/pdf', size: 20000, att: `a-${id}` }] } });
    }
    if (step === 'mail-file') return ok({ data: PDF, size: 60 });
    if (step === 'task-lists') return ok({ lists: [] });
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./');
  await ready(page);

  // Ich › Mail: open the hotel mail and take it into the app
  await page.goto('./#/me/mail');
  await page.getByRole('button', { name: /Hotel Muster/ }).click();
  await expect(page.getByText('Buchungsnummer: HM-4711')).toBeVisible();
  await page.getByRole('button', { name: de('Into the app') }).click();
  await expect(page.getByRole('link', { name: de('In the Inbox · open') })).toBeVisible();
  expect(log.filter((x) => x.step === 'mail-file').map((x) => x.params.att)).toEqual(['a-m1']);
  await expect(page.getByText(de('Mails into the app by themselves'))).toBeVisible();

  // the Eingang: the hotel mail with its tip and its PDF; the labelled bill came by itself
  await page.getByRole('link', { name: de('In the Inbox · open') }).click();
  const hotel = page.locator('li', { hasText: 'Buchungsbestätigung Hotel Muster' }).first();
  await expect(hotel).toBeVisible();
  await expect(hotel.getByText(de('Looks like a booking'), { exact: false })).toBeVisible();
  const bill = page.locator('li', { hasText: 'Rechnung 2026-55' }).first();
  await expect(bill).toBeVisible();
  await expect(bill.getByText(de('Looks like a bill'), { exact: false })).toBeVisible();
  await expect(bill.locator('[data-target="bill"]')).toBeVisible();

  // one attachment into Dokumente; the entry stays to sort
  await hotel.getByRole('button', { name: new RegExp(de('Into Documents')) }).click();
  await expect(hotel.getByText(`Bestaetigung.pdf · ${de('In Documents')}`)).toBeVisible();
  const docs = await page.evaluate(async () => {
    const r = indexedDB.open('pack-generator');
    await new Promise((ok) => (r.onsuccess = ok));
    const all = await new Promise((ok) => (r.result.transaction('docs').objectStore('docs').getAll().onsuccess = (e) => ok(e.target.result)));
    r.result.close();
    return all.map((d) => [d.name, d.source]);
  });
  expect(docs).toEqual([['Bestaetigung', 'mail']]);

  // the bill: its button opens the bill form, filled from the mail
  await bill.locator('[data-target="bill"]').click();
  const sheet = page.locator('dialog.fsheet');
  await expect(sheet.getByLabel(de('To whom'))).toHaveValue('Shop Muster');
  await expect(sheet.getByLabel(de('Amount CHF'))).toHaveValue('45');
  await sheet.getByRole('button', { name: de('Into «To pay»') }).click();
  await expect(page.locator('.toast')).toContainText(de('Bill to pay'));

  // «Ablegen als …» of the hotel mail: every target, and an own new place
  await hotel.getByLabel(de('More for this note')).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${de('File elsewhere …')}`) }).click();
  await expect(sheet.locator('.targets li')).toHaveCount(TARGETS.length);
  await sheet.locator('[data-target="keep"]').click();
  await sheet.getByRole('button', { name: de('New place') }).click();
  await sheet.getByLabel(de('Name of the new place')).fill('Ferien Muster');
  await sheet.getByRole('button', { name: de('Keep as note') }).click();
  await expect(page.locator('.toast')).toBeVisible();
  await page.goto('./#/notes');
  await expect(page.getByText('Ferien Muster').first()).toBeVisible();

  // the Mac bookmark: a web page straight into the Eingang
  await page.goto('./?to=inbox&title=Zeltplatz%20Muster&url=https%3A%2F%2Fexample.test%2Fzelt');
  await expect(page.locator('li', { hasText: 'Zeltplatz Muster' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
