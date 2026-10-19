// v0.77.0 «KI-Helfer» (Noah's answers 1–8 ★a, 10.10.2026): every place of the helper with canned
// answers (page.route on /api/helper, nothing goes out): New trip, the search, the Rückblick draft,
// «Liste prüfen», the bike care, the once-a-day cache, the monthly cap (429), offline, the notice
// before the setup, and what goes to Claude (the privacy allowlist). Fictional data only.
import { test, expect } from '@playwright/test';
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
  if (task === 'debrief')
    return {
      ok: true, task, spend,
      result: {
        learnings: [
          { rule: `${P} Unter 8 °C dicke Handschuhe mitnehmen`, action: 'Winterhandschuhe einpacken', noteKey: `ride:${id('w1')}` },
          { rule: `${P} Bei Biwak unter 5 °C die dickere Matte`, action: '', noteKey: `ride:${id('w2')}` },
        ],
        summary: `${P} Zwei kalte Tage im Jura. Abends und nachts war es kälter als gedacht.`,
      },
    };
  if (task === 'checklist')
    return {
      ok: true, task, spend,
      result: {
        missing: [{ itemId: id('WZ02'), name: '', reason: 'Kein Ersatz für eine Panne' }, { itemId: '', name: `${P} Flickzeug`, reason: 'Für Tubeless' }],
        double: [{ itemIds: [id('HY01'), id('HY04')], removeId: id('HY04'), reason: 'Für eine Nacht im Hotel reicht eines' }],
        heavy: [{ itemId: id('KL05'), altId: id('KL07'), reason: 'Bei 8–16 °C trocken reicht die Windweste (90 g)' }],
      },
    };
  if (task === 'maintenance')
    return {
      ok: true, task, spend,
      result: {
        parts: [
          { key: 'chain', status: 'soon', reason: `${P} 0.3 % vor 9 Tagen, seither nass gefahren`, check: 'Kettenlehre 0,5 anlegen' },
          { key: 'tyres', status: 'check', reason: `${P} Dichtmilch über 3 Monate alt`, check: 'Milch nachfüllen, Profil prüfen' },
          { key: 'padsR', status: 'ok', reason: 'noch 70 %', check: '' },
        ],
      },
    };
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
  await page.getByLabel(T('Helper code')).fill(CODE);
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
  await expect(steps.getByLabel(T('Helper code'))).toBeVisible();
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

test('1a + 7a: the code in the settings, the check, then «Frag den Helfer» in New trip (with a question from the search) with chips, blocks and own items', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.getByRole('button', { name: T('Check the connection') }).click();
  await expect(page.getByText(T('Connected. This month: {chf}.', { chf: 'CHF 0.12' }))).toBeVisible();
  // v0.118.0 (K4, changed on purpose): this month's spend in the row «Monthly limit» of the setup
  await expect(page.getByText(T('{chf} used this month', { chf: 'CHF 0.12' }), { exact: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: new RegExp(T('Show the AI helper in the app')) })).toBeChecked();
  await noSideways(page);

  // v0.114.0: «Frag den Helfer» only comes into the window with a question from the search (proposeTrip).
  await page.evaluate(() => localStorage.setItem('pack.helperAsk', '3 Tage Jura, 5 °C, Biwak'));
  const dlg = await openNewTrip(page);
  await expect(dlg.getByText(T('The helper is not set up yet'))).toHaveCount(0);
  await expect(dlg.getByRole('textbox', { name: T('Ask the helper') })).toHaveValue('3 Tage Jura, 5 °C, Biwak');
  const card = dlg.getByRole('region', { name: T('Suggestion from the helper') });
  await expect(card).toBeVisible();
  await expect(card.getByText(T('A suggestion, you can change everything.'))).toBeVisible();
  // understood conditions as chips; a tap changes one
  const days = card.getByRole('button', { name: new RegExp(esc(T('{n} days').replace('{n}', '3'))) });
  await expect(days).toBeVisible();
  await days.click();
  await card.getByLabel(T('Days')).fill('2');
  await card.getByRole('button', { name: T('Done|edit') }).click();
  await expect(card.getByRole('button', { name: new RegExp(esc(T('{n} days').replace('{n}', '2'))) })).toBeVisible();
  // the own items, each with a reason and ×
  await expect(card.getByText(`${P} Winterhandschuhe`)).toBeVisible();
  await expect(card.getByText('Abends um 4 °C').first()).toBeVisible();
  await card.getByRole('button', { name: T('Remove {name}', { name: `${P} Buff` }) }).click();
  await expect(card.getByText(`${P} Buff`)).toHaveCount(0);
  await noSideways(page);
  await card.getByRole('button', { name: T('Take over') }).click();
  await expect(card).toBeHidden();
  const from = dlg.locator('.kh-extras');
  await expect(from.getByRole('heading', { name: T('From the helper') })).toBeVisible();
  await expect(from.getByRole('button', { name: T('Remove {name}', { name: `${P} Winterhandschuhe` }) })).toBeVisible();
  await expect(from.getByRole('button', { name: T('Remove {name}', { name: `${P} Buff` }) })).toHaveCount(0);
  const before = new Set((await table(page, 'trips')).map((x) => x.id));
  await dlg.getByRole('button', { name: new RegExp(`^${esc(T('Create trip'))}`) }).click();
  await expect(dlg).toBeHidden();
  await expect
    .poll(async () => {
      const fresh = (await table(page, 'trips')).find((x) => !before.has(x.id));
      if (!fresh) return null;
      const on = (k) => fresh.entries.filter((e) => e.itemId === id(k));
      // every kept item is on the list once (an item the blocks bring anyway is not doubled); the one removed with × is not
      return { days: fresh.days, kept: ['KL09', 'SL04', 'KL06'].map((k) => on(k).length), buff: on('KL10').some((e) => e.src === 'helper'), helper: fresh.entries.some((e) => e.src === 'helper') };
    })
    .toEqual({ days: 2, kept: [1, 1, 1], buff: false, helper: true });

  const trip = seen.find((r) => r.task === 'trip');
  expect(trip.input.question).toBe('3 Tage Jura, 5 °C, Biwak');
  expect(trip.input.items.length).toBeGreaterThan(10);
  private_(seen);
  expect(errors).toEqual([]);
});

test('2a: the search answers a question only, above the hits; «Als Packliste vorschlagen» opens New trip with it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.goto('./');
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
  await field.pressSequentially('Regen');
  await page.waitForTimeout(1200);
  expect(seen.filter((r) => r.task === 'search')).toHaveLength(0); // never on every key
  await field.fill('Was nehme ich für 2 Tage Regen mit?');
  const res = page.getByRole('region', { name: T('Search results') });
  await expect(res.getByText(T('Ask the helper'))).toBeVisible();
  await expect(res.locator('.kh-ans b').first()).toHaveText('Regenjacke');
  await expect(res.locator('.kh-ans')).toContainText('(260 g)');
  expect(seen.filter((r) => r.task === 'search')).toHaveLength(1);
  // Enter on a question-like text asks too (once per question)
  await field.fill('wie viel wiegt meine Regenjacke');
  await field.press('Enter');
  await expect.poll(() => seen.filter((r) => r.task === 'search').length).toBe(2);
  await noSideways(page);
  await res.getByRole('button', { name: T('Suggest as a packing list') }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('textbox', { name: T('Ask the helper') })).toHaveValue('wie viel wiegt meine Regenjacke');
  await expect(dlg.getByRole('region', { name: T('Suggestion from the helper') })).toBeVisible();
  expect(seen.filter((r) => r.task === 'trip')).toHaveLength(1);
  await dlg.getByRole('region', { name: T('Suggestion from the helper') }).getByRole('button', { name: T('Discard') }).click(); // P3b: the window's own button says «Verwerfen» too
  await expect(dlg.getByRole('region', { name: T('Suggestion from the helper') })).toHaveCount(0);
  private_(seen);
  expect(errors).toEqual([]);
});

test('3a: Rückblick «Entwurf holen»: learnings from the notes on the way, the summary, nothing kept without a tap', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.goto(`./#/debrief/${JURA}`);
  await openRow(page, 'how-fold'); // v0.92.0: weather, km, ride and notes are under «Wie war's?»
  await page.getByRole('button', { name: T('Get a draft') }).click();
  const draft = page.getByRole('region', { name: T('Draft from the helper') });
  await expect(draft).toBeVisible();
  await expect(draft.getByText(T('A draft, you decide what stays.'))).toBeVisible();
  await expect(draft.getByText(`${P} Unter 8 °C dicke Handschuhe mitnehmen`)).toBeVisible();
  const before = (await table(page, 'learnings')).length;
  await draft.locator('li').filter({ hasText: 'dicke Handschuhe' }).getByRole('button', { name: T('Take over') }).click();
  await expect.poll(async () => (await table(page, 'learnings')).find((l) => l.rule === `${P} Unter 8 °C dicke Handschuhe mitnehmen`)).toMatchObject({ topic: 'Debrief', from: 'helper' });
  await draft.getByRole('button', { name: T('Drop learning {rule}', { rule: `${P} Bei Biwak unter 5 °C die dickere Matte` }) }).click();
  await expect(draft.getByText('dickere Matte')).toHaveCount(0);
  expect((await table(page, 'learnings')).length).toBe(before + 1);
  // the note on the way that became the learning is answered
  await expect.poll(async () => (await table(page, 'notes')).find((n) => n.id === id('w1'))?.status).toBe('sorted');
  await draft.getByRole('button', { name: T('Take over') }).click();
  await expect.poll(async () => (await table(page, 'debriefs')).find((d) => d.tripId === JURA)?.note).toBe(`${P} Zwei kalte Tage im Jura. Abends und nachts war es kälter als gedacht.`);
  await noSideways(page);
  const sent = seen.find((r) => r.task === 'debrief');
  expect(sent.input.notes.map((n) => n.text)).toEqual([`${P} Finger kalt beim Kochen am Abend`, `${P} Matte zu dünn, nachts kalt`]);
  private_(seen);
  expect(errors).toEqual([]);
});

test('4a: «Liste prüfen» from the button and the ••• menu: missing, double, heavy, each with Ignorieren', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.evaluate((tripId) => localStorage.setItem('pack.currentTrip', tripId), EVENT);
  await page.goto('./#/pack');
  // first entry in the ••• menu
  await page.locator('details.list-menu > summary').click();
  await expect(page.locator('.list-menu-content > *').first()).toHaveText(T('Check the list'));
  await page.locator('.list-menu-content').getByRole('button', { name: T('Check the list') }).click();
  const box = page.getByRole('region', { name: T('Check the list') });
  await expect(box.getByText(T('Maybe missing'))).toBeVisible();
  await expect(box.getByText(T('Double'))).toBeVisible();
  await expect(box.getByText(T('Heavy'))).toBeVisible();
  await expect(box.getByText('Bei 8–16 °C trocken reicht die Windweste (90 g)')).toBeVisible();
  await expect(box.getByText(T('A suggestion, you can change everything.'))).toBeVisible();
  await noSideways(page);
  await box.locator('li').filter({ hasText: `${P} Ersatzschlauch` }).getByRole('button', { name: T('Add') }).click();
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === EVENT).entries.find((e) => e.itemId === id('WZ02'))?.src).toBe('helper');
  await box.locator('li').filter({ hasText: `${P} Zahnbürste` }).getByRole('button', { name: T('Remove') }).click();
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === EVENT).entries.some((e) => e.itemId === id('HY04'))).toBe(false);
  await box.locator('li').filter({ hasText: `${P} Regenjacke` }).getByRole('button', { name: T('Ignore') }).click();
  await expect(box.locator('li').filter({ hasText: `${P} Regenjacke` })).toHaveCount(0);
  expect((await table(page, 'trips')).find((x) => x.id === EVENT).entries.some((e) => e.itemId === id('KL05'))).toBe(true);
  await box.getByRole('button', { name: T('Close the check') }).click();
  await expect(box).toHaveCount(0);
  // the button next to «Weiter: Packen» asks again
  await page.getByRole('button', { name: T('Check the list') }).click();
  await expect(page.getByRole('region', { name: T('Check the list') }).getByText(T('Heavy'))).toBeVisible();
  await expect(page.getByRole('region', { name: T('Check the list') }).getByText(T('Double'))).toHaveCount(0); // the double one is gone
  expect(seen.filter((r) => r.task === 'checklist')).toHaveLength(2);
  expect(seen[seen.length - 1].input.list.some((i) => i.id === id('WZ02'))).toBe(true);
  private_(seen);
  expect(errors).toEqual([]);
});

test('5a + 6a: bike care: suggestions inside «Jetzt fällig», a concrete check, Aufgabe/Erledigt/×, asked once a day', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}&open=1`);
  const care = page.locator(`#care-${SPARK}`);
  const due = care.locator('ul.duecards');
  await expect(due.getByText('Kettenlehre 0,5 anlegen', { exact: false })).toBeVisible();
  await expect(due.getByText(T('due soon|helper')).first()).toBeVisible();
  await expect(due.getByText('Milch nachfüllen, Profil prüfen', { exact: false })).toBeVisible();
  await expect(due.getByText('noch 70 %')).toHaveCount(0); // «ok» is never shown
  await expect(care.getByText(T('A suggestion from your km and notes, not a workshop diagnosis.'))).toBeVisible();
  await noSideways(page);
  const input = seen.find((r) => r.task === 'maintenance').input;
  const chain = input.parts.find((p) => p.key === 'chain');
  expect(chain).toMatchObject({ lastService: { km: 4900 }, lastMeasure: { km: 4950, value: 0.3 } });
  expect(input.notes.some((n) => n.text.includes('Bremse hinten schleift'))).toBe(true);

  // «Als Aufgabe merken» on a helper card (or the merged line of a card due anyway): a task, source Helper
  const tyreCard = due.locator('li.kh-pt').filter({ hasText: 'Milch nachfüllen' });
  if (await tyreCard.count()) {
    // v0.117.0 «Knöpfe neu» (N2): «Merken» sits behind «…» with its explanation (changed on purpose)
    await tyreCard.locator('.btn.dots').click();
    await page.getByRole('menuitem', { name: T('Remember|task') }).click();
    await expect.poll(async () => (await table(page, 'maintenance')).find((m) => m.source === 'Helper')).toMatchObject({ bikeId: SPARK, status: 'open' });
    await expect(page.getByText(T('Remembered as a task: {part}', { part: T('Tyres') }), { exact: false })).toBeVisible();
  }
  const chainRow = due.locator('li').filter({ hasText: 'Kettenlehre 0,5' });
  const chainDone = chainRow.getByRole('button', { name: T('Done|task'), exact: true });
  if (await chainRow.locator('.kh-x').count()) await chainRow.locator('.kh-x').first().click();
  else await chainDone.click();
  await expect(due.getByText('Kettenlehre 0,5', { exact: false })).toHaveCount(0);

  // 6a: the same day and the same bike: from the cache, not asked again
  await page.reload();
  await expect(care).toBeVisible();
  await page.waitForTimeout(800);
  expect(seen.filter((r) => r.task === 'maintenance')).toHaveLength(1);
  private_(seen);
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

test('7a: the monthly cap (429) pauses the helper calmly until next month; offline says one calm line', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  let capped = false;
  const seen = await fakeHelper(page, { reply: (b) => (capped && b.task !== 'status' ? { status: 429, body: { error: 'monthly_cap', code: 'monthly_cap', message: 'cap', spend: { month: month(), chf: 2.03, cap: 2 } } } : null) });
  await setUp(page);
  // offline first: one calm line, nothing sent (v0.114.0: the helper comes into New trip with a question from the search)
  await context.setOffline(true);
  await page.evaluate(() => localStorage.setItem('pack.helperAsk', '2 Tage Emmental'));
  let dlg = await openNewTrip(page);
  await expect(dlg.getByRole('textbox', { name: T('Ask the helper') })).toHaveValue('2 Tage Emmental');
  await expect(dlg.getByText(T('Offline right now. The helper answers again once you are online.'))).toBeVisible();
  await context.setOffline(false);
  expect(seen).toHaveLength(0);

  capped = true;
  await dlg.getByRole('button', { name: T('Get a suggestion') }).click();
  const pause = dlg.getByText(new RegExp(esc(T('The helper pauses until {date}: the monthly limit of CHF {cap} is reached. Everything else works as usual.', { date: 'XX', cap: '2.00' })).replace('XX', '.+')));
  await expect(pause).toBeVisible();
  await expect.poll(async () => (await table(page, 'meta')).find((m) => m.key === 'helper.spend')?.value).toMatchObject({ month: month(), chf: 2.03 });
  // From now on nothing is asked: the field says it pauses, the settings too.
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await page.evaluate(() => localStorage.setItem('pack.helperAsk', '2 Tage Emmental'));
  dlg = await openNewTrip(page);
  await expect(dlg.locator('.kh-ask .kh-msg')).toContainText('CHF 2.00');
  await expect(dlg.getByRole('button', { name: T('Get a suggestion') })).toHaveCount(0);
  await page.goto('./#/helper');
  await expect(page.getByText(T('paused until next month'), { exact: true })).toBeVisible();
  await expect(page.getByText(T('this month: {chf}', { chf: 'CHF 2.03' }), { exact: true })).toBeVisible();
  expect(seen.filter((r) => r.task !== 'status')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('no credit (Noah 18.10 1a): the sentence once, then the helper is hidden everywhere; it comes back by itself', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  let empty = true;
  const seen = await fakeHelper(page, {
    reply: (b) => {
      if (b.task === 'status') return { status: 200, body: { ok: true, task: 'status', model: 'claude-sonnet-5-5', credit: empty ? 'empty' : 'ok', spend: { month: month(), chf: 0.12, cap: 2 } } };
      if (empty) return { status: 402, body: { code: 'no_credit', credit: 'empty', message: 'The AI credit is used up.' } };
      return null;
    },
  });
  await setUp(page);
  await page.goto('./');
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
  await field.fill('Was nehme ich für 2 Tage Regen mit?');
  await expect.poll(() => seen.filter((r) => r.task === 'search').length).toBe(1);
  const note = page.locator('[data-cn="credit"]');
  await expect(note).toHaveText(new RegExp(esc(T('The AI credit is used up. Everything else works as usual.'))));
  const res = page.getByRole('region', { name: T('Search results') });
  await expect(res.getByText(T('Ask the helper'))).toHaveCount(0);
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('kh-no-credit.png') });
  await note.getByRole('button', { name: T('OK') }).click();
  await expect(note).toHaveCount(0);
  await expect.poll(async () => (await table(page, 'meta')).find((m) => m.key === 'helper.credit')?.value).toMatchObject({ empty: true, told: true });

  // nothing more goes out, the free answers stay (Assistent), the notice does not come again
  await page.goto('./#/assistent');
  await page.getByRole('searchbox', { name: T('Your question') }).fill('Wie viele km diesen Monat?');
  await page.getByRole('button', { name: T('Ask'), exact: true }).click();
  await expect(page.locator('.aa')).toBeVisible();
  await expect(page.locator('.kh-ans')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-cn="credit"]')).toHaveCount(0);
  expect(seen.filter((r) => r.task !== 'status')).toHaveLength(1);

  // Ich › KI-Helfer says why; topped up, «Check the connection» brings everything back
  await page.goto('./#/helper');
  await expect(page.locator('[data-hp="credit"]')).toBeVisible();
  empty = false;
  await page.locator('details.hp-fold').first().locator('summary').click(); // the key fold, closed once the code is saved
  await page.getByRole('button', { name: T('Check the connection') }).click();
  await expect(page.locator('[data-hp="credit"]')).toHaveCount(0);
  await expect.poll(async () => (await table(page, 'meta')).find((m) => m.key === 'helper.credit')?.value).toMatchObject({ empty: false });
  await page.goto('./');
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  await page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).fill('Was nehme ich für 3 Tage Regen mit?');
  await expect(page.getByRole('region', { name: T('Search results') }).locator('.kh-ans b').first()).toHaveText('Regenjacke');
  expect(errors).toEqual([]);
});
