// v0.77.0 «KI-Helfer» (Noah's answers 1–8 ★a, 10.10.2026): every place of the helper with canned
// answers (page.route on /api/helper, nothing goes out): New trip, the search, the Rückblick draft,
// «Liste prüfen», the bike care, the once-a-day cache, the monthly cap (429), offline, the notice
// before the setup, and what goes to Claude (the privacy allowlist). Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File, P, SPARK, JURA, EVENT, CODE } from './v0770-fixture.js';

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
    seen.push({ task: body.task, input: body.input, raw: req.postData(), auth: req.headers().authorization });
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
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect.poll(async () => (await table(page, 'bikes')).length).toBe(4);
  return errors;
}

/** Settings › Helfer: type the code and save (on by itself). */
async function setUp(page) {
  await page.goto('./#/helper');
  await expect(page.getByRole('heading', { level: 1, name: T('Helper') })).toBeVisible();
  await page.getByLabel(T('Helper code')).fill(CODE);
  await page.getByRole('button', { name: T('Save'), exact: true }).first().click();
  await expect(page.getByText(T('Saved on this device.'), { exact: true })).toBeVisible();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'helper')?.value).toMatchObject({ code: CODE, on: true });
}

/** v0.76.0 «Fünf Orte»: New trip opens from Touren («+ Neue Tour»), as a person does. */
async function openNewTrip(page) {
  await page.goto('./#/trips');
  await page.locator('main').getByRole('button', { name: T('New trip'), exact: true }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
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

test('8a: before the setup, a calm notice only in New trip and in the settings; nothing is sent', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  const dlg = await openNewTrip(page);
  const notice = dlg.getByRole('region', { name: T('Helper') });
  await expect(notice.getByText(T('The helper is not set up yet'))).toBeVisible();
  await expect(notice.getByRole('button', { name: T('Set up') })).toBeVisible();
  await notice.getByText(T('What goes to Claude?')).click();
  await expect(notice.getByText(T('Only your question and the names it needs from the list and your gear, plus your notes. Never photos, receipts or health data.'))).toBeVisible();
  await notice.getByRole('button', { name: T('Set up') }).click();
  await expect(page).toHaveURL(/#\/helper/);
  await expect(page.getByRole('heading', { level: 1, name: T('Helper') })).toBeVisible();
  await expect(page.getByText(T('The helper is not set up yet'))).toBeVisible();
  await page.getByRole('button', { name: T('Set up') }).click();
  await expect(page.getByLabel(T('Helper code'))).toBeFocused();
  // K1a: Ich › Helfer, its own row with the state
  await page.goto('./#/me');
  const row = page.locator('main').getByRole('link', { name: new RegExp(`^${T('Helper')}`) });
  await expect(row).toContainText(T('not set up'));
  await row.click();
  await expect(page).toHaveURL(/#\/helper/);

  // Elsewhere the helper is simply not there.
  await page.evaluate((tripId) => localStorage.setItem('pack.currentTrip', tripId), EVENT);
  await page.goto('./#/pack');
  await expect(page.locator('.tp-list, .list-head').first()).toBeVisible();
  await expect(page.getByRole('button', { name: T('Check the list') })).toHaveCount(0);
  await page.goto(`./#/debrief/${JURA}`);
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

test('1a + 7a: the code in the settings, the check, then «Frag den Helfer» in New trip with chips, blocks and own items', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.getByRole('button', { name: T('Check the connection') }).click();
  await expect(page.getByText(T('Connected. This month: {chf}.', { chf: 'CHF 0.12' }))).toBeVisible();
  await expect(page.getByText(T('this month: {chf}', { chf: 'CHF 0.12' }), { exact: true })).toBeVisible();
  await expect(page.getByText(T('Helper switched on'))).toBeVisible();
  await noSideways(page);

  const dlg = await openNewTrip(page);
  await expect(dlg.getByText(T('The helper is not set up yet'))).toHaveCount(0);
  const field = dlg.getByRole('textbox', { name: T('Ask the helper') });
  await field.fill('3 Tage Jura, 5 °C, Biwak');
  await dlg.getByRole('button', { name: T('Get a suggestion') }).click();
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
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('textbox', { name: T('Ask the helper') })).toHaveValue('wie viel wiegt meine Regenjacke');
  await expect(dlg.getByRole('region', { name: T('Suggestion from the helper') })).toBeVisible();
  expect(seen.filter((r) => r.task === 'trip')).toHaveLength(1);
  await dlg.getByRole('button', { name: T('Discard') }).click();
  await expect(dlg.getByRole('region', { name: T('Suggestion from the helper') })).toHaveCount(0);
  private_(seen);
  expect(errors).toEqual([]);
});

test('3a: Rückblick «Entwurf holen»: learnings from the notes on the way, the summary, nothing kept without a tap', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const seen = await fakeHelper(page);
  await setUp(page);
  await page.goto(`./#/debrief/${JURA}`);
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
    await tyreCard.getByRole('button', { name: T('Remember as a task') }).click();
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

test('7a: the monthly cap (429) pauses the helper calmly until next month; offline says one calm line', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  let capped = false;
  const seen = await fakeHelper(page, { reply: (b) => (capped && b.task !== 'status' ? { status: 429, body: { error: 'monthly_cap', code: 'monthly_cap', message: 'cap', spend: { month: month(), chf: 5.03, cap: 5 } } } : null) });
  await setUp(page);
  // offline first: one calm line, nothing sent
  let dlg = await openNewTrip(page);
  await context.setOffline(true);
  await dlg.getByRole('textbox', { name: T('Ask the helper') }).fill('2 Tage Emmental');
  await dlg.getByRole('button', { name: T('Get a suggestion') }).click();
  await expect(dlg.getByText(T('Offline right now. The helper answers again once you are online.'))).toBeVisible();
  await context.setOffline(false);
  expect(seen).toHaveLength(0);

  capped = true;
  await dlg.getByRole('button', { name: T('Get a suggestion') }).click();
  const pause = dlg.getByText(new RegExp(esc(T('The helper pauses until {date}: the monthly limit of CHF {cap} is reached. Everything else works as usual.', { date: 'XX', cap: '5.00' })).replace('XX', '.+')));
  await expect(pause).toBeVisible();
  await expect.poll(async () => (await table(page, 'meta')).find((m) => m.key === 'helper.spend')?.value).toMatchObject({ month: month(), chf: 5.03 });
  // From now on nothing is asked: the field says it pauses, the settings too.
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  dlg = await openNewTrip(page);
  await expect(dlg.locator('.kh-ask .kh-msg')).toContainText('CHF 5.00');
  await expect(dlg.getByRole('button', { name: T('Get a suggestion') })).toHaveCount(0);
  await page.goto('./#/helper');
  await expect(page.getByText(T('paused until next month'), { exact: true })).toBeVisible();
  await expect(page.getByText(T('this month: {chf}', { chf: 'CHF 5.03' }), { exact: true })).toBeVisible();
  expect(seen.filter((r) => r.task !== 'status')).toHaveLength(1);
  expect(errors).toEqual([]);
});
