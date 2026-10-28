// Google Mail (GM, Noah 15.10.2026 «4a»; built without mockups): Ich › Mail connects with the Google login,
// lists the inbox, opens a mail, answers it and writes a new one; «Mails dazu» under an appointment
// searches Gmail. The server (packgen-three.vercel.app/api/google) and the Google login are answered by
// the test; everything else outside the preview server is blocked. Fictional mails only.
import { test, expect } from './clock.js';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';
const de = (en) => DE[en] ?? en;
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  // The whole page in one picture: a viewport as tall as the page, so the fixed bottom bar sits at the end
  // like after scrolling down, not across the middle of the picture.
  const size = page.viewportSize();
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, tall) });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await page.setViewportSize(size);
};
const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const MAILS = [
  { id: 'm1', thread: 'th1', from: 'info@veloladen.example.test', fromName: 'Veloladen Muster', to: 'noah@example.test', subject: 'Velo-Service fertig', snippet: 'Dein Velo ist bereit, abholen ab 16 Uhr', date: ago(2), unread: true, starred: false, inbox: true },
  { id: 'm2', thread: 'th2', from: 'club@example.test', fromName: 'Tennisclub Muster', to: 'noah@example.test', subject: 'Lektion am Dienstag', snippet: 'Die Halle ist reserviert', date: ago(30), unread: false, starred: false, inbox: true },
  { id: 'm3', thread: 'th3', from: 'news@example.test', fromName: 'Bike-Magazin', to: 'noah@example.test', subject: 'Herbsttouren im Jura', snippet: 'Fünf Runden für kurze Tage', date: ago(80), unread: false, starred: false, inbox: true },
];

test('Mail: connect, read, answer, write; «Mails dazu» from an appointment', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const log = [];
  let allowed = false;
  const today = zurichToday();
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    log.push({ step, auth: req.headers().authorization ?? null, params: Object.fromEntries(url.searchParams), body });
    const ok = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'status') return ok({ connected: allowed, mail: allowed, calendar: true, tasks: false });
    if (step === 'start') return ok({ url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y' });
    if (step === 'mail-list') return ok({ mails: url.searchParams.get('q') ? [MAILS[0]] : MAILS, next: null });
    if (step === 'mail-get') return ok({ mail: { ...MAILS.find((m) => m.id === url.searchParams.get('id')), text: 'Grüezi\n\nDein Velo ist bereit. Abholen ab 16 Uhr.\n\nVeloladen Muster', files: [{ name: 'Rechnung-Muster.pdf', size: 48000 }] } });
    if (step === 'mail-send') return ok({ id: 'sent1' });
    if (step === 'cal-list') return ok({ calendars: [{ id: 'cal1', name: 'Noah Muster', primary: true, write: true }] });
    if (step === 'cal-events') return ok({ events: [{ id: 'cal1|e1', gid: 'e1', cal: 'cal1', title: 'Velo-Service Muster', where: '', note: '', allDay: false, day: today, lastDay: today, start: `${today}T16:00:00+02:00`, end: `${today}T16:30:00+02:00`, link: null, busy: true }] });
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/accounts\.google\.com\/o\/oauth2/, (route) => {
    allowed = true;
    return route.fulfill({ status: 302, headers: { location: `${baseURL}#/me/mail?google=connected` } });
  });
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./');
  await ready(page);

  await viaTab(page, 'week', '#/me/mail'); // UI-Ziele #6: Planen › Mail
  await expect(page.getByRole('heading', { level: 1, name: de('Mail') })).toBeVisible();
  await expect(page.getByRole('heading', { name: de('Connect Gmail') })).toBeVisible();
  await shot(page, info, 'M1-verbinden');
  await page.getByRole('button', { name: de('Connect with Google') }).click();

  // back: the inbox with the key of this device
  await expect(page.getByText('Velo-Service fertig')).toBeVisible();
  expect(page.url()).not.toContain('google=');
  expect(log.find((x) => x.step === 'start').body.services).toEqual(['mail']);
  expect(log.find((x) => x.step === 'mail-list').auth).toBe(`Bearer ${P}key`);

  // read one
  await page.getByRole('button', { name: /Veloladen Muster/ }).click();
  await expect(page.getByText('Abholen ab 16 Uhr.')).toBeVisible();
  await expect(page.getByText('Rechnung-Muster.pdf')).toBeVisible();
  await shot(page, info, 'M2-lesen');

  // answer: goes out only on «Senden», in its thread
  await page.getByRole('button', { name: de('Answer|verb') }).click();
  const form = page.getByRole('form', { name: de('Answer|verb') });
  await expect(form.getByLabel(de('Subject'))).toHaveValue('Re: Velo-Service fertig');
  await form.getByLabel(de('Text|mail')).press('Home');
  await form.getByLabel(de('Text|mail')).pressSequentially('Danke, ich komme um 17 Uhr.');
  expect(log.find((x) => x.step === 'mail-send')).toBeUndefined();
  await shot(page, info, 'M3-antworten');
  await form.getByRole('button', { name: de('Send') }).click();
  await expect.poll(() => log.find((x) => x.step === 'mail-send')?.body).toMatchObject({ to: 'info@veloladen.example.test', subject: 'Re: Velo-Service fertig', replyTo: 'm1' });
  expect(log.find((x) => x.step === 'mail-send').body.text).toContain('Danke, ich komme um 17 Uhr.');
  await expect(page.getByText(de('Sent to {to}.').replace('{to}', 'info@veloladen.example.test'))).toBeVisible();

  // «Mails dazu» from an appointment
  await page.evaluate(() => indexedDB.open('pack-generator'));
  await page.goto('./#/me/agenda');
  await page.evaluate(async () => {
    const r = indexedDB.open('pack-generator');
    await new Promise((ok) => (r.onsuccess = ok));
    const tx = r.result.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'agenda', value: { calendar: true, tasks: false } });
    await new Promise((ok) => (tx.oncomplete = ok));
    r.result.close();
  });
  await page.reload();
  await page.getByRole('button', { name: /Velo-Service Muster/ }).click();
  await page.getByRole('link', { name: de('Mails to it') }).click();
  await expect(page.getByRole('heading', { name: de('Mails to «{name}»').replace('{name}', 'Velo-Service Muster') })).toBeVisible();
  await expect.poll(() => log.filter((x) => x.step === 'mail-list').at(-1)?.params.q).toContain('"Velo-Service" OR "Muster"');
  await shot(page, info, 'M4-mails-dazu');

  expect(errors).toEqual([]);
});
