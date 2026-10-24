// «Alltag fertig bauen» (Klick-Rundgang 22.10.2026, Noah «5a»): a robot plays the three everyday flows through
// before every release: Mein Tag (Assistent), Meine Woche (Aktiv ticks in the week) and Velo pflegen (a problem
// logged, done, undone). Each step: the next button is named, the click changes something, the numbers agree,
// Undo works. German, fictional v0.77.0 data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File } from './v0770-fixture.js';
import { openData, settle } from './settle.js';
import { newButton } from './newbutton.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

async function start(page, context, info) {
  const file = v0770File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return errors;
}

const rows = (page, table) =>
  page.evaluate((name) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(name).objectStore(name).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), table);

test('Mein Tag: the Assistent explains an empty field and answers the chain from your own data', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/assistent');
  const ask = page.getByRole('button', { name: T('Ask'), exact: true });
  await expect(ask).toBeVisible();
  // an empty field: a hint, never nothing (H26)
  await ask.click();
  await expect(page.locator('[data-as-empty]')).toHaveText(T('Type a question first, or tap one of the examples below.'));
  // the chain: an answer from the wear data with the way to the wear page (H25)
  await page.getByRole('button', { name: T('When do I change the chain?') }).first().click();
  await expect(page.locator('[data-as-empty]')).toHaveCount(0);
  const card = page.locator('.aa[data-aa="wear"]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: T('Open wear') })).toHaveAttribute('href', /view=wear/);
  // a question the app does not know: it says so and points to Claude or Chrome
  const box = page.getByLabel(T('Your question'));
  await box.fill('Welche Farbe hat der Himmel?');
  await ask.click();
  await expect(page.locator('.aa[data-aa="none"]')).toContainText(T('The app knows nothing about this yet.'));
  expect(errors).toEqual([]);
});

test('Meine Woche: a tick in Aktiv shows as done in the week, and the count agrees', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const day = today();
  // a tick as Aktiv saves it (flowLog), on a fictional activity
  await page.evaluate((d) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction(['flowActs', 'flowLog'], 'readwrite');
      tx.objectStore('flowActs').put({ id: 'test-ablauf-tennis', name: 'test_data_gtp_ Tennis', icon: 'tennis', ring: 'move', order: 99, perTap: 1, minMin: 0, paused: false, goals: [], season: null, counts: [] });
      tx.objectStore('flowLog').put({ id: 'test-ablauf-log', actId: 'test-ablauf-tennis', day: d, at: `${d}T08:00:00.000Z`, n: 1, min: 45 });
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), day);
  // written past Dexie, so a fresh start reads it (Dexie keeps its own copy of whole tables)
  await page.goto('./#/week');
  await page.reload();
  const entry = page.locator('[data-entry="log:' + day + ':test-ablauf-tennis"]');
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText('test_data_gtp_ Tennis');
  await expect(entry).toContainText(T('done in Aktiv'));
  await expect(entry).toHaveClass(/done/);
  // the head counts it: at least one session, and the 45 min
  await expect(page.locator('[data-week-sum]')).toContainText(/45 min/i);
  await expect(page.locator('[data-week-sum]')).not.toContainText(T('{n} sessions|week', { n: 0 }));
  expect(errors).toEqual([]);
});

test('Velo pflegen: a problem logged with the preset priority, done, and back with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/');
  await (await newButton(page, T('New'))).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(T('Problem with a bike')) }).click();
  const dlg = page.getByRole('dialog', { name: T('Problem with a bike') });
  // the priority is a suggestion: «Mittel» is chosen, saving works at once (H20)
  await expect(dlg.getByRole('button', { name: T('Medium'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByLabel(T('What is wrong? One problem per line or separated by commas')).fill('test_data_gtp_ Schaltung knackt');
  await dlg.getByRole('button', { name: T('Save problem') }).click();
  await expect.poll(async () => (await rows(page, 'maintenance')).filter((r) => r.task === 'test_data_gtp_ Schaltung knackt').map((r) => [r.status, r.priority])).toEqual([['open', 'medium']]);
  await page.keyboard.press('Escape');

  // Velos › Pflege: the problem with its «Erledigt»; the tap says what it did and offers Undo (H16)
  await page.goto('./#/bikes?tab=care');
  const row = page.locator('li.prob').filter({ hasText: 'test_data_gtp_ Schaltung knackt' }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: new RegExp(`^${T('Done|task')}`) }).first().click();
  const toast = page.locator('.rtoast');
  await expect(toast).toContainText(T('«{task}» done. Solved problems stay under «All».', { task: 'test_data_gtp_ Schaltung knackt' }));
  await expect.poll(async () => (await rows(page, 'maintenance')).find((r) => r.task === 'test_data_gtp_ Schaltung knackt')?.status).toBe('done');
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await rows(page, 'maintenance')).find((r) => r.task === 'test_data_gtp_ Schaltung knackt')?.status).toBe('open');
  await expect(page.locator('li.prob').filter({ hasText: 'test_data_gtp_ Schaltung knackt' }).first()).toBeVisible();

  // Heute: «Werkstattauftrag» leads straight to the order sheet, not the care overview
  await page.goto('./#/');
  await settle(page, { sameTrips: false });
  const order = page.locator('[data-order-link]');
  if (await order.count()) await expect(order.first()).toHaveAttribute('href', /sheet=order/);
  expect(errors).toEqual([]);
});
