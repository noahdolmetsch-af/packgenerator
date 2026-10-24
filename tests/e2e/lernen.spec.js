// Paket M «Aus Touren lernen», German UI, phone and desktop:
// - «Quiz am Vorabend» (#207): the evening before a trip «Gepackt» shows «Quiz zum Vorabend · 3 Fragen»; it opens
//   #/quiz/<trip>, three questions one at a time, «2 von 3 richtig · Serie: 1 Tour»; own questions are added,
//   ordered with the arrows, switched off and deleted (with Undo); the card can be put away; the quiz switched off.
// - «3 Beobachtungen pro Woche» (#294, #14, #247): the week review shows three observations with a chart, they
//   stay the same after a reload (frozen), a kind can be hidden and shown again, the whole thing switched off.
// Fictional data written straight into IndexedDB; nothing leaves the preview server; no sideways scroll.
// SHOTS=<dir> saves lernen-<name>-<project>.png there (never into the repo).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const P = 'test_data_gtp_';
const TODAY = '2026-10-19'; // a Monday; the browser runs in Europe/Zurich
const MON = '2026-10-12'; // the week the review shows on a Monday
const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TRIP = `${P}trip-jura`;

/* ---------- the trip of tomorrow ---------- */
const item = (id, name, weightG, bag) => ({ id: `${P}${id}`, name: `${P}${name}`, category: 'misc', weightG, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: bag, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
function tripRows() {
  const items = [item('i1', 'Tent', 1200, 'seat'), item('i2', 'Stove', 300, 'frame'), item('i3', 'Pump', 90, 'frame'), item('i4', 'Jacket', 250, 'bar'), item('i5', 'Tube', 120, 'bar'), item('i6', 'Socks', 60, 'seat')];
  const containers = [
    { id: `${P}b-seat`, name: `${P}Seat pack`, slot: 'seat', volumeL: 14, itemId: null, pieces: 1 },
    { id: `${P}b-frame`, name: `${P}Frame bag`, slot: 'frame', volumeL: 5, itemId: null, pieces: 1 },
    { id: `${P}b-bar`, name: `${P}Front roll`, slot: 'bar', volumeL: 9, itemId: null, pieces: 1 },
  ];
  const setup = { seat: `${P}b-seat`, frame: `${P}b-frame`, bar: `${P}b-bar` };
  const bikes = [{ id: `${P}bike`, name: `${P}Gravel`, weightG: 9800, slots: ['seat', 'frame', 'bar'], setup }];
  const trips = [{
    id: TRIP, domain: 'bikepacking', title: `${P}Jura`, startDate: addDays(TODAY, 1), days: 3, bikeId: `${P}bike`, bike: `${P}Gravel`, setup,
    entries: items.map((i) => ({ itemId: i.id, slot: i.defaultBag, qty: 1, packed: true })), packedAt: `${TODAY}T10:00:00.000Z`,
    route: { name: `${P}Jura`, km: 212.4, gainM: 3120, line: [], profile: [] },
    stages: { start: `${P}Biel`, days: [{ km: 60, name: `${P}Chasseral` }, { km: 150, name: `${P}Saignelegier` }, { km: null, name: `${P}Delemont` }] },
    ready: [], status: 'planned', createdAt: `${TODAY}T08:00:00.000Z`,
  }];
  return { items, containers, bikes, trips };
}

/* ---------- twelve weeks of riding and Fitbit days ---------- */
const act = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '07:30', start: `${day}T05:30:00Z`, name: `${P}Runde`, type: 'Ride', kind: 'bike', km: 40, hm: 400, movingS: 5400, elapsedS: 5600, hrAvg: 130, ...f });
function weekRows() {
  const activities = [];
  const long = new Set();
  for (let w = 1; w <= 11; w++) {
    const m = addDays(MON, -7 * w);
    activities.push(act(`t${w}`, addDays(m, 1)));
    const sat = addDays(m, 5);
    if (w % 2) {
      activities.push(act(`s${w}`, sat, { km: 110, movingS: 5 * 3600 }));
      long.add(sat);
    } else activities.push(act(`s${w}`, sat));
  }
  for (let i = 0; i < 5; i++) activities.push(act(`w${i}`, addDays(MON, i), { movingS: 4000 }));
  const ride = new Set(activities.map((a) => a.day));
  const healthDays = [];
  for (let d = addDays(TODAY, -90); d < TODAY; d = addDays(d, 1)) {
    const after = [1, 2, 3].some((k) => long.has(addDays(d, -k)));
    healthDays.push({ date: d, sleep: { asleepMin: ride.has(addDays(d, -1)) ? 480 + (d.endsWith('5') ? 5 : 0) : 420 + (d.endsWith('3') ? 6 : 0) }, restingHr: after ? 58 : 52 + (d.endsWith('7') ? 1 : 0), steps: 8000, src: 'file' });
  }
  return { activities, healthDays };
}

async function open(page, context, at) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(at) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow'); // the database is made, Aktiv seeds its activities once
  await expect(page.locator('main [data-week-glance]')).toBeVisible(); // «Aktiv neu» (22.10.2026): «Diese Woche» on Aktiv
  return errors;
}
const put = (page, data) =>
  page.evaluate(async (data) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(data), 'readwrite');
      for (const [t, list] of Object.entries(data)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, data);
const setting = (page, key) =>
  page.evaluate((key) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get(key);
      q.onsuccess = () => { r.result.close(); ok(q.result?.value ?? null); };
    };
  }), key);
const shot = (page, info, name) => (process.env.SHOTS ? page.screenshot({ path: `${process.env.SHOTS}/lernen-${name}-${info.project.name}.png`, fullPage: true }) : null);
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Quiz am Vorabend: the card on «Gepackt», three questions, the streak, own questions', async ({ page, context }, info) => {
  const errors = await open(page, context, `${TODAY}T19:30:00+02:00`);
  await put(page, tripRows());
  await page.goto(`./#/trip/${TRIP}/packed`);
  await page.reload(); // the app reads the rows written behind its back
  const main = page.locator('main');

  // the evening before: the small card in «Bis zum Start»
  const eve = main.locator('[data-quiz-eve]');
  await expect(eve).toContainText(T('Quiz the evening before · {n} questions', { n: 3 }));
  await fits(page, 'Gepackt');
  await shot(page, info, 'gepackt');
  await eve.getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`#/quiz/${TRIP}$`));
  await expect(main.getByRole('heading', { level: 1, name: T('Quiz the evening before') })).toBeVisible();
  await expect(main.getByRole('heading', { name: T('Quiz for {trip}', { trip: `${P}Jura` }) })).toBeVisible();

  // three questions, one at a time: two right, one wrong
  const quiz = main.locator('[data-quiz]');
  for (let n = 1; n <= 3; n++) {
    await expect(quiz).toContainText(T('Question {n} of {m}', { n, m: 3 }));
    await quiz.locator(`[data-quiz-a="${n === 2 ? 'wrong' : 'right'}"]`).first().click();
    await expect(quiz.locator('[data-quiz-feedback]')).toHaveAttribute('data-quiz-feedback', n === 2 ? 'wrong' : 'right');
    await quiz.locator('[data-quiz-next]').click();
  }
  await expect(quiz.locator('[data-quiz-end]')).toContainText(T('{n} of {m} right', { n: 2, m: 3 }));
  await expect(quiz.locator('[data-quiz-end]')).toContainText(T('Streak: {n} trip', { n: 1 }));
  await expect(main.locator('[data-quiz-streak]')).toHaveAttribute('data-quiz-streak', '1');
  await expect.poll(async () => (await setting(page, 'quiz'))?.log?.length).toBe(1);
  await fits(page, 'Quiz');

  // own questions: add two, order with the arrows, switch one off, delete one and bring it back
  for (const [q, a] of [[`${P}Wo ist der Schlüssel?`, `${P}Rahmentasche`], [`${P}Code vom Schloss?`, '4711']]) {
    await main.locator('[data-quiz-add]').click();
    const sheet = page.locator('[data-quiz-sheet]');
    await sheet.locator('[data-qo-text]').fill(q);
    await sheet.locator('[data-qo-right]').fill(a);
    if (a !== '4711') await sheet.locator('[data-qo-wrong="1"]').fill(`${P}Satteltasche`);
    if (a !== '4711') await sheet.locator('[data-qo-wrong="2"]').fill(`${P}Lenkerrolle`);
    await sheet.locator('[data-qo-save]').click();
    await expect(sheet).toBeHidden();
  }
  const own = main.locator('[data-quiz-own] > li');
  await expect(own).toHaveCount(2);
  await expect(own.nth(1)).toContainText(T('Know it? card'));
  await own.nth(1).getByRole('button', { name: T('Move {name} up', { name: `${P}Code vom Schloss?` }) }).click();
  await expect(own.first()).toContainText(`${P}Code vom Schloss?`);
  await own.first().locator('[data-own-on]').uncheck();
  await expect.poll(async () => (await setting(page, 'quiz'))?.own?.[0]?.on).toBe(false);
  await own.nth(1).locator('[data-own-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete') }).click();
  await expect(own).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(own).toHaveCount(2);
  await expect(own.nth(1)).toContainText(`${P}Wo ist der Schlüssel?`);
  await shot(page, info, 'quiz');

  // a kind of suggested questions switched off
  await main.locator('[data-quiz-type="weather"]').uncheck();
  await expect.poll(async () => (await setting(page, 'quiz'))?.offTypes).toEqual(['weather']);

  // the evening card: done today → gone; put away and switched off are respected too
  await page.goto(`./#/trip/${TRIP}/packed`);
  await expect(main.locator('[data-row="check"]')).toBeVisible();
  await expect(main.locator('[data-quiz-eve]')).toHaveCount(0);
  await put(page, { settings: [{ key: 'quiz', value: { ...(await setting(page, 'quiz')), log: [] } }] });
  await page.reload();
  await expect(main.locator('[data-quiz-eve]')).toBeVisible();
  await main.locator('[data-quiz-eve-hide]').click();
  await expect(main.locator('[data-quiz-eve]')).toHaveCount(0);
  await page.goto('./#/quiz');
  await main.locator('[data-quiz-on]').uncheck();
  await expect.poll(async () => (await setting(page, 'quiz'))?.on).toBe(false);
  expect(errors).toEqual([]);
});

test('3 Beobachtungen: three cards with charts on the week review, frozen, hide a kind, switch off', async ({ page, context }, info) => {
  const errors = await open(page, context, `${TODAY}T09:00:00+02:00`);
  await put(page, weekRows());
  await page.goto('./#/flow/review');
  await page.reload();
  const main = page.locator('main');
  const obs = main.locator('[data-wr="obs"]');
  await expect(obs.getByRole('heading', { name: T('3 observations') })).toBeVisible();
  const cards = obs.locator('[data-obs]');
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(cards.nth(i).locator('.say')).not.toBeEmpty();
    await expect(cards.nth(i).locator('[role="img"]')).toHaveAttribute('aria-label', /\S/);
  }
  const keys = await cards.evaluateAll((els) => els.map((e) => e.dataset.obsKey));
  expect(new Set(keys.map((k) => k.split('-')[0])).size).toBe(3);
  await expect.poll(async () => Object.keys((await setting(page, 'beobachtungen'))?.weeks ?? {})).toEqual(['2026-W42']);
  await fits(page, 'Wochenrückblick');
  await shot(page, info, 'wochenrueckblick');

  // frozen: the same three after a reload, even with the Fitbit days gone
  await page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('healthDays', 'readwrite');
      tx.objectStore('healthDays').clear();
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }));
  await page.reload();
  await expect(cards).toHaveCount(3);
  expect(await cards.evaluateAll((els) => els.map((e) => e.dataset.obsKey))).toEqual(keys);

  // «Diese Art nicht mehr zeigen», and back
  const kind = keys[0].split('-')[0];
  await obs.locator(`[data-obs-hide="${kind}"]`).click();
  await expect(cards).toHaveCount(2);
  await obs.locator(`[data-obs-show="${kind}"]`).click();
  await expect(cards).toHaveCount(3);

  // the running week waits for its Sunday; the week before is under «Ältere Wochen»
  await main.locator('[data-week-next]').click();
  await expect(obs.locator('[data-obs-state="waiting"]')).toBeVisible();
  await obs.getByText(T('Older weeks')).click();
  await expect(obs.locator('[data-obs-older] > li')).toHaveCount(1);

  // switched off
  await obs.locator('[data-obs-off]').click();
  await expect(obs.locator('[data-obs-state="off"]')).toBeVisible();
  await obs.locator('[data-obs-on]').click();
  await expect(obs.locator('[data-obs-state="waiting"]')).toBeVisible();
  expect(errors).toEqual([]);
});
