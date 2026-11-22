// v0.77.0 «KI-Helfer» (Noah's answers 1–8 ★a, 10.10.2026): every place of the helper with canned
// answers (page.route on /api/helper, nothing goes out): New trip, the search, the Rückblick draft,
// «Liste prüfen», the bike care, the once-a-day cache, the monthly cap (429), offline, the notice
// before the setup, and what goes to Claude (the privacy allowlist). Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File, P, SPARK, JURA, EVENT, CODE } from './v0770-fixture.js';
import { openData, settle } from './settle.js';
import { openRow } from './debrief-rows.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
    name,
  );
const month = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(0, 7);
const id = (s) => `${P}${s}`;

/** What the server would answer, per task (already checked like api/_lib/helper.js validate does). */
function answers(input, task) {
  if (task === 'status') return { ok: true, task, model: 'claude-sonnet-5-5', spend: { month: month(), chf: 0.12, cap: 5 } };
  const spend = { month: month(), chf: 0.14, cap: 5 };
  const own = new Set((input.items ?? input.own ?? []).map((i) => i.id));
  if (task === 'trip')
    return {
      ok: true, task, spend,
      result: {
        conditions: { area: 'bikepacking', bikeId: SPARK, days: 3, overnight: 'outdoor', cook: true, tempMin: 4, tempMax: 12, rain: 'rain' },
        blocks: (input.blocks ?? []).slice(0, 1).map((b) => b.key),
        items: [id('KL09'), id('SL04'), id('KL10'), id('KL06')].filter((x) => own.has(x)).map((x) => ({ id: x, reason: 'Abends um 4 °C' })),
        note: '',
      },
    };
  if (task === 'search') return { ok: true, task, spend, result: { answer: [{ text: 'Für 2 Tage Regen: ', itemId: '' }, { text: 'Regenjacke', itemId: id('KL05') }, { text: ' und ', itemId: '' }, { text: 'Regenhose', itemId: id('KL06') }, { text: '.', itemId: '' }], suggestTrip: true } };
  return { ok: false, code: 'bad_request' };
}

/** The fake /api/helper: records every request (task, input, Authorization) and answers canned JSON. */
async function fakeHelper(page, { reply = null } = {}) {
  const seen = [];
  await page.route('**/api/helper', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    const body = JSON.parse(req.postData() ?? '{}');
    seen.push({ task: body.task, input: body.input, model: body.model, raw: req.postData(), auth: req.headers().authorization });
    const custom = reply?.(body);
    if (custom) return route.fulfill({ status: custom.status, contentType: 'application/json', body: JSON.stringify(custom.body) });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answers(body.input ?? {}, body.task)) });
  });
  return seen;
}

async function start(page, context, info) {
  const file = v0770File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page); // the tidy-up after the import done, Today decided
  await expect.poll(async () => (await table(page, 'bikes')).length).toBe(4);
  return errors;
}

/** Ich › KI-Helfer: type the code and save, then the one switch «Show the AI helper in the app».
 *  v0.118.0 «KI-Helfer ausblenden» (changed on purpose, Noah answer a ★): saving the code no longer
 *  switches it on; the helper is off until the switch is on. */
async function setUp(page) {
  await page.goto('./#/helper');
  await expect(page.getByRole('heading', { level: 1, name: T('AI helper') })).toBeVisible();
  await page.getByLabel(T('Helper code'), { exact: true }).fill(CODE);
  // Impeccable Runde 2: the card «Set up in 2 steps» on top saves with «Save code»
  await page.getByRole('button', { name: T('Save code'), exact: true }).click();
  await expect(page.getByText(T('Saved on this device.'), { exact: true })).toBeVisible();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'helper')?.value).toMatchObject({ code: CODE });
  const sw = page.getByRole('switch', { name: new RegExp(T('Show the AI helper in the app')) });
  await expect(sw).not.toBeChecked();
  await sw.check();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'helper')?.value).toMatchObject({ code: CODE, show: true });
}

/** v0.76.0 «Fünf Orte»: New trip opens from Touren, as a person does. v0.102.0 Design-Refresh P4 (T1):
 *  the dashed tile «Neue Tour oder aus einer Vorlage» in the planning group (the header button is gone). */
async function openNewTrip(page) {
  await page.goto('./#/trips');
  await page.locator('main').getByRole('button', { name: new RegExp(`^${esc(T('New trip'))}`) }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await expect(dlg).toBeVisible();
  return dlg;
}

/** Answer 8a: what goes to Claude never holds photos, receipts, money, shops, people or the code. */
function private_(seen) {
  for (const r of seen) {
    expect(r.auth, 'the code goes only in the header').toBe(`Bearer ${CODE}`);
    for (const bad of [CODE, 'data:image', 'totalChf', '"chf"', 'priceChf', 'photo', 'receipt', 'Velo shop', '"by"', '"shop"'])
      expect(r.raw.includes(bad), `${r.task}: "${bad}" must not go to Claude`).toBe(false);
  }
}

test('8a: before the setup, a calm notice only in the settings (v0.114.0: no longer in New trip); nothing is sent', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  // v0.114.0 «Rahmenbedingungen» (Noah: «KI helfer soll raus»): the window for a new trip has no helper notice.
  const dlg = await openNewTrip(page);
  await expect(dlg.getByText(T('The helper is not set up yet'))).toHaveCount(0);
  await expect(dlg.getByText(T('Ask the helper'))).toHaveCount(0);
  await dlg.getByRole('button', { name: T('Discard') }).click();
  await expect(dlg).toBeHidden();
  await page.goto('./#/helper');
  await expect(page.getByRole('heading', { level: 1, name: T('AI helper') })).toBeVisible();
  // Impeccable Runde 2 (on purpose): first set up, then switch on: the card «Set up in 2 steps» on top with the
  // code field; «What goes to Claude?» once, in the setup
  const steps = page.locator('[data-setup-steps]');
  await expect(steps.getByRole('heading', { name: T('Set up in 2 steps') })).toBeVisible();
  await expect(steps.getByLabel(T('Helper code'), { exact: true })).toBeVisible();
  await expect(page.getByText(T('What goes to Claude?'))).toHaveCount(1);
  await page.getByText(T('What goes to Claude?')).click();
  await expect(page.getByText(T('Only your question and the names it needs from the list and your gear, plus your notes. Never photos, receipts or health data.')).first()).toBeVisible();
  // K1a: Ich › Helfer, its own row with the state
  await page.goto('./#/me');
  // v0.118.0 (K4): the row «AI helper» says it is off and where to switch it on
  const row = page.locator('main').getByRole('link', { name: new RegExp(`^${T('AI helper')}`) });
  await expect(row).toContainText(T('off · suggestions from Claude, only if you want'));
  await row.click();
  await expect(page).toHaveURL(/#\/helper/);

  // Elsewhere the helper is simply not there.
  await page.evaluate((tripId) => localStorage.setItem('pack.currentTrip', tripId), EVENT);
  await page.goto('./#/pack');
  await expect(page.locator('.tp-list, .list-head').first()).toBeVisible();
  await expect(page.getByRole('button', { name: T('Check the list') })).toHaveCount(0);
  await page.goto(`./#/debrief/${JURA}`);
  await openRow(page, 'how-fold'); // v0.92.0: weather, km, ride and notes are under «Wie war's?»
  await expect(page.locator('.ridenotes')).toBeVisible();
  await expect(page.getByRole('button', { name: T('Get a draft') })).toHaveCount(0);
  await expect(page.getByText(T('The helper is not set up yet'))).toHaveCount(0);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}&open=1`);
  await expect(page.locator(`#care-${SPARK}`)).toBeVisible();
  await expect(page.locator('.kh-pt')).toHaveCount(0);
  await expect(page.getByText(T('The helper is not set up yet'))).toHaveCount(0);
  expect(seen).toEqual([]);
  expect(errors).toEqual([]);
});

// 15.10.2026 (Noah «1b 2a, wobei nutzer dies ändern kann im frontend»): CHF 2 by default; Sonnet 5.5 is the
// default model, Ich › KI-Helfer «Modell» switches to Haiku 5.5, and the choice goes with every request.
test('1b + 2a: limit CHF 2 by default; the model is Sonnet 5.5 until Haiku 5.5 is picked, and it is sent along', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await expect(page.getByText(T('of {chf}', { chf: 'CHF 2.00' }), { exact: false })).toBeAttached();
  await page.getByRole('button', { name: T('Check the connection') }).click();
  await expect(page.getByText(T('Connected. This month: {chf}.', { chf: 'CHF 0.12' }))).toBeVisible();
  expect(seen.at(-1).model).toBe('claude-sonnet-5-5');

  // the info text «Usage and costs» (Noah «3b»): the limit and this month's spend in it
  const costs = page.locator('[data-hp="costs"]');
  await costs.locator('summary').click();
  await expect(costs.getByText(T('At {cap} a month the helper pauses until next month. This month: about {chf}.', { cap: 'CHF 2.00', chf: 'CHF 0.12' }))).toBeVisible();
  await expect(costs.getByText(T('All amounts are estimates. The exact bill is in the Anthropic console.'))).toBeVisible();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('kh-costs.png'), fullPage: true });
  await costs.locator('summary').click();

  const fold = page.locator('[data-hp="model"]');
  await expect(fold.locator('summary')).toContainText('Claude Sonnet 5.5');
  await fold.locator('summary').click();
  await expect(fold.getByRole('radio', { name: /Claude Sonnet 5\.5/ })).toBeChecked();
  await expect(fold.getByText(T('Cheaper, about 20 times less. Simpler answers.'))).toBeVisible();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('kh-model.png'), fullPage: true });
  await fold.getByRole('radio', { name: /Claude Haiku 5\.5/ }).check();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'helper')?.value).toMatchObject({ code: CODE, show: true, model: 'claude-haiku-5-5' });
  await expect(fold.locator('summary')).toContainText('Claude Haiku 5.5');

  await page.getByRole('button', { name: T('Check the connection') }).click();
  await expect.poll(() => seen.at(-1)?.model).toBe('claude-haiku-5-5');
  await page.reload();
  await expect(page.locator('[data-hp="model"] summary')).toContainText('Claude Haiku 5.5');
  private_(seen);
  expect(errors).toEqual([]);
});
