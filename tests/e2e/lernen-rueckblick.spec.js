// Paket M «Aus Touren lernen» (Noah 19.10.2026): in the debrief the Tour-Tagebuch draft (when it opens,
// «1b»), 2 fitting extra questions open («3b»), «Als To-do» with a chosen place («1 b und a»), and the
// message to your future self as a letter on the way of the next trip («2 lustig»).
// Fictional fixture (test_data_gtp_), German, phone + desktop.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const ENDED = 'test_data_gtp_trip24'; // 3 days from 8 October, debrief open, notes on the way
const NEXT = 'test_data_gtp_trip27'; // starts 14 October

test.use({ timezoneId: 'Europe/Zurich' });

async function start(page, context, when) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date(when));
  await page.goto('./');
  await importAndSettle(page, FIX);
}

test('Rückblick: Tagebuch-Entwurf, 2 Zusatzfragen, Als To-do, Nachricht an dich; unterwegs der Brief', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, '2026-10-12T10:00:00+02:00');
  await page.goto(`./#/debrief/${ENDED}`);

  // the draft is there when the debrief opens
  const tb = page.locator('[data-tagebuch]');
  await expect(tb.getByRole('heading', { name: T('Tour diary') })).toBeVisible();
  const text = tb.locator('textarea');
  await expect(text).toHaveValue(/test_data_gtp_ Running tour 3 days: 3 Tage/);
  await expect(text).toHaveValue(/Notiz: «test_data_gtp_ note 1: brake squeaks»/);
  await text.fill('Mein eigener Text');
  await page.reload();
  await expect(page.locator('[data-tagebuch] textarea')).toHaveValue('Mein eigener Text');
  await expect(page.locator('[data-tagebuch] .rv-sub')).toHaveText(T('your text'));

  // 3b: two fitting questions open (several days, a bike), the other 8 under «Mehr fragen»
  const zf = page.locator('[data-zusatzfragen]');
  await expect(zf.locator('[data-extra]')).toHaveCount(2);
  await expect(zf.locator('[data-extra="tag"]')).toContainText(T('Which day was the best, and why?'));
  await zf.getByRole('button', { name: T('Ask more ({n})', { n: 8 }) }).click();
  await expect(zf.locator('[data-extra]')).toHaveCount(10);
  // adjust: switch one off
  await zf.getByRole('button', { name: T('Adjust questions') }).click();
  await zf.getByRole('checkbox', { name: T('Ask «{name}»', { name: T('What was the most beautiful moment?') }) }).uncheck();
  await zf.getByRole('button', { name: T('Done|edit') }).click();
  await expect(zf.locator('[data-extra="moment"]')).toHaveCount(0);

  // «Als To-do»: into a new checklist of this trip in Notizen
  await expect(page.locator('[data-todo-place] select')).toHaveValue('checklist');
  await page.locator('[data-todo-btn]').first().click();
  await expect(page.locator('[data-todo-sent]').first()).toBeVisible();
  const todo = await page.evaluate(async (id) => {
    const open = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (open.onsuccess = () => r(open.result)));
    return new Promise((r) => (db.transaction('notes').objectStore('notes').get(`todo-${id}`).onsuccess = (e) => r(e.target.result)));
  }, ENDED);
  expect(todo.checklist).toHaveLength(1);

  // the message to your future self
  await page.locator('[data-zukunft] textarea').fill('Warme Handschuhe mitnehmen');

  // on the way of the next trip: a closed envelope that opens
  await page.clock.setFixedTime(new Date('2026-10-14T09:00:00+02:00'));
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), NEXT);
  await page.goto(`./#/ride?trip=${NEXT}`);
  await page.reload();
  const env = page.locator('[data-zukunft-hint]');
  await expect(env.getByText(T('Mail from you!'))).toBeVisible();
  await env.locator('[data-zukunft-open]').click();
  await expect(env).toContainText('«Warme Handschuhe mitnehmen»');
  await env.getByRole('button', { name: T('Read|message') }).click();
  await expect(env).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

// #223: on a trip day the evening review asks how the trip was today; the score goes into its debrief
test('Abend-Rückblick: heutige Tour bewerten', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, '2026-10-14T21:00:00+02:00');
  await page.goto('./#/check/evening');
  const q = page.locator('[data-abendtour]');
  await expect(q).toBeVisible();
  await q.getByRole('button', { name: '8', exact: true }).click();
  await expect(q.getByRole('button', { name: '8', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const ev = await page.evaluate(async (id) => {
    const open = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (open.onsuccess = () => r(open.result)));
    const rec = await new Promise((r) => {
      const g = db.transaction('debriefs').objectStore('debriefs').get(id);
      g.onsuccess = () => r(g.result);
    });
    return rec?.evening ?? null;
  }, NEXT);
  expect(ev).toEqual({ '2026-10-14': 8 });
  await expect(q.getByRole('link', { name: T('Whole debrief') })).toHaveAttribute('href', `#/debrief/${NEXT}`);
  expect(errors).toEqual([]);
});
