// Tages-Check pages back (Noah 18.10.2026 «T1, T2, T3b, T3c, T4 freigegeben», then «1 a und b», «2b», «3 a und b»):
// the morning check (T1) and the evening review (T2) as own pages again, reached from the round in the day card;
// «Deine 15 Fragen» back on Heute as a folded tile (T3c) with its own page (T4); the big balance ring (T3b) in
// tages-check.spec.js and heute-neu.spec.js. The answers also stay in «Wi gaht's?» (read along there).
// On a phone and a computer, in German, with a fixed clock in Europe/Zurich. Fictional data only.
// SHOTS=<folder> saves full-page screenshots (light).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { eveningTurn } from '../../src/lib/flowcheck.js';
import { ON_AT_START } from '../../src/lib/abfragen.js';
import { ready } from './settle.js';
import { put, addDays } from './aktiv-fixture.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-15'; // a Thursday

async function open(page, context, time, { speech = false } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((speech) => {
    localStorage.setItem('lang', 'de');
    if (!speech) {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    }
  }, speech);
  await page.clock.install({ time: new Date(`${DAY}T${time}:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await flowSeeded(page); // the flow seed is written
  // «Heute neu» A (0.165.0): the day card and «Deine 15 Fragen» left the ready wall; a wall with them
  await putWall(page);
  await ready(page);
  await expect(page.locator('[data-section="flow"]')).toBeVisible();
  return errors;
}

/** Fictional rows: meditation today and yesterday, yesterday's check, a few evenings of the week. */
function rows({ todayCheck = null } = {}) {
  const flowLog = [];
  for (let i = 0; i <= 5; i++) flowLog.push({ id: `test_med_${i}`, actId: 'meditation', day: addDays(DAY, -i), at: `${addDays(DAY, -i)}T06:40:00+02:00`, min: 20 });
  const flowChecks = [
    { day: addDays(DAY, -1), sleep: 7, energy: 7, mood: 6, sat: 6, best: ['nature', 'sport'] },
    { day: addDays(DAY, -2), sleep: 6, energy: 5, mood: 6, best: ['nature', 'calm'] },
    { day: addDays(DAY, -9), best: ['friends'] }, // older than a week
  ];
  if (todayCheck) flowChecks.push({ day: DAY, ...todayCheck });
  return { flowLog, flowChecks };
}

// A closed dialog takes its history entry away a moment later with history.back() (src/lib/ui/backclose.js).
// A reload in that moment is cut off («page.reload: net::ERR_ABORTED»): wait until the entry is gone first.
const dialogEntryGone = (page) => expect.poll(() => page.evaluate(() => history.state?.pgDialog ?? null)).toBeNull();
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const row = (page) =>
  page.evaluate(
    (day) =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction('flowChecks').objectStore('flowChecks').get(day);
          g.onsuccess = () => (res(g.result ?? null), r.result.close());
        };
      }),
    DAY,
  );

const abRows = (page) =>
  page.evaluate(
    (day) =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction('abAnswers').objectStore('abAnswers').getAll();
          g.onsuccess = () => (res((g.result ?? []).filter((x) => x.day === day)), r.result.close());
        };
      }),
    DAY,
  );

async function shot(page, name) {
  if (!process.env.SHOTS) return;
  const w = page.viewportSize().width;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${w <= 500 ? 390 : 1440}.png`, fullPage: true });
}

test('T1 morning check page: the questions of the window, joy, last night, the suggestion; saved at once', async ({ page, context }) => {
  const errors = await open(page, context, '07:52');
  await put(page, rows());
  await page.reload();
  await ready(page);

  // the round in the day card leads to the page (Noah 18.10.2026 «1 a und b»)
  await page.locator('[data-daycard] [data-section="morningcheck"]').click();
  await expect(page).toHaveURL(/#\/check\/morning$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Good morning') })).toBeVisible();

  // Noah 04.11.2026 «ein Fragebogen»: the page asks what the window asks (Deine Abfragen), in five steps; yesterday's answer is marked
  const rq = page.locator('[data-round-questions="morning"]');
  await expect(rq.locator('[data-q="erholung.schlaf"] [data-step="8"]')).toHaveClass(/yd/); // yesterday 7 → nearest step 8
  await rq.locator('[data-q="erholung.schlaf"] [data-step="6"]').click();
  await rq.locator('[data-q="erholung.akku"] [data-step="4"]').click();
  await expect(rq.locator('[data-q="erholung.akku"] [data-step="4"]')).toHaveAttribute('aria-pressed', 'true');
  // a tap on the chosen answer takes it back (every question can be skipped)
  await rq.locator('[data-q="erholung.koerper"] [data-step="8"]').click();
  await rq.locator('[data-q="erholung.koerper"] [data-step="8"]').click();
  await expect(rq.locator('[data-q="erholung.koerper"] [aria-pressed="true"]')).toHaveCount(0);
  // the goal is the window's text question
  await rq.locator('[data-q="ziele.ziel"]').getByRole('textbox').fill('Velo nach der Arbeit');

  // 6: two chips and an own one
  const joy = page.locator('[data-chips="joy"]');
  await joy.getByRole('button', { name: T('Nature|joy'), exact: true }).click();
  await joy.getByRole('button', { name: T('Sport|joy'), exact: true }).click();
  await joy.getByRole('button', { name: T('own|chip') }).click();
  await joy.getByRole('textbox').fill('Konzert');
  await joy.getByRole('button', { name: T('Add|chip') }).click();
  await expect(joy.getByRole('button', { name: 'Konzert' })).toHaveAttribute('aria-pressed', 'true');
  // «Gestern Abend»
  await page.locator('[data-chips="last"]').getByRole('button', { name: T('Phone in bed') }).click();

  // the suggestion: never mandatory, «Nicht heute» puts it away, it can come back
  const sugg = page.locator('[data-sugg]');
  await expect(sugg).toContainText(T('Suggestion for today'));
  await sugg.getByRole('button', { name: T('Not today|sugg') }).click();
  await expect(sugg).toContainText(T('Not today. Fine.'));
  await sugg.getByRole('button', { name: T('Show the suggestion again') }).click();
  await expect(sugg.getByRole('button', { name: T('Not today|sugg') })).toBeVisible();

  // what the app already knows: today's meditation; the night as a small placeholder
  await expect(page.locator('[data-row="med"]')).toContainText(T('today {min} min', { min: 20 }));
  await expect(page.locator('[data-row="med"]')).toContainText(T('{n} days in a row', { n: 6 }));
  // 0.171 (on purpose): the night comes from Fitbit; without a Fitbit day the card says how to connect it
  await expect(page.getByText(T('Connect Fitbit once and your sleep, resting pulse and HRV show here.'))).toBeVisible();
  expect(await noScroll(page)).toBe(true);
  await shot(page, 'T1-morgen-check');

  // saved at once: a reload shows the answers
  await expect.poll(async () => (await row(page))?.last).toEqual(['phone']);
  await expect.poll(async () => (await row(page))?.energy).toBe(4);
  await expect.poll(async () => (await abRows(page)).map((r) => r.qid)).toEqual(expect.arrayContaining(['erholung.schlaf', 'ziele.ziel']));
  await page.reload();
  await expect(page.locator('[data-round-questions="morning"] [data-q="erholung.schlaf"] [data-step="6"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-round-questions="morning"] [data-q="ziele.ziel"]').getByRole('textbox')).toHaveValue('Velo nach der Arbeit');
  expect(await row(page)).toMatchObject({ sleep: 6, energy: 4, joy: ['nature', 'sport', 'Konzert'], last: ['phone'] });

  // «Fertig»: Heute shows the numbers
  await page.locator('[data-check-done]').click();
  await expect(page).toHaveURL(/#\/$/);
  // the answers count in «Wi gaht's?» too: the round on Heute is done and shows the numbers
  const mc = page.locator('[data-section="morningcheck"]');
  await expect(mc).toHaveAttribute('data-done', 'true');
  await expect(mc.locator('[data-val="sleep"] b')).toHaveText('6');
  await shot(page, 'heute-nach-morgen-check');
  expect(errors).toEqual([]);
});

test('T2 evening review page: filled in from the ride and the meditation, the day in numbers', async ({ page, context }) => {
  const errors = await open(page, context, '21:00');
  await put(page, { ...rows({ todayCheck: { sleep: 6, energy: 5, mood: 7, goal: { id: 'ride' } } }), rides: [{ id: 'test_ride_today', date: DAY, km: 24, movingH: 1.08, totalH: 1.1, tripId: null, name: 'Fiktive Feierabendrunde' }] });
  await page.reload();
  await ready(page);

  const entry = page.locator('[data-daycard] [data-section="morningcheck"]');
  await expect(entry).toHaveAttribute('data-part', 'evening');
  await entry.click();
  await expect(page).toHaveURL(/#\/check\/evening$/);
  await expect(page.getByRole('heading', { level: 1, name: T('How was your day?') })).toBeVisible();

  // Noah 04.11.2026 «ein Fragebogen»: the page asks what the window asks (Deine Abfragen)
  const rq = page.locator('[data-round-questions="evening"]');
  await rq.locator('[data-q="erreicht.zufrieden"] [data-step="8"]').click();
  await rq.locator('[data-q="spass.coolstes"]').getByRole('button', { name: T('Nature'), exact: true }).click();
  await page.locator('[data-story]').fill('Ein fiktiver Abend am See.');
  await page.locator('[data-story]').blur();
  await expect(page.locator('[data-speak]')).toHaveCount(0); // no speech recognition in this browser
  // the goal of the morning (the daily check's goal «Ride after work» is not asked again here: the window asks «reached?»)
  await rq.locator('[data-q="erreicht.ziel"] .ab-opt').first().click();
  // filled in from today's ride (66 min → 30–90), changeable
  await expect(rq.locator('[data-q="natur.draussen"] .ab-opt').nth(2)).toHaveAttribute('aria-pressed', 'true');
  await expect(rq.locator('[data-auto="natur.draussen"]')).toContainText(T('filled in from your ride, changeable'));
  // the mindful moment: found by itself from the meditation
  await expect(rq.locator('[data-auto="achtsamkeit.moment"]')).toContainText(T('found by itself: meditation {min} min at {time}', { min: 20, time: '06:40' }));
  await expect(rq.locator('[data-q="achtsamkeit.moment"] .ab-opt').first()).toHaveAttribute('aria-pressed', 'true');

  // the side: the day in numbers, morning → evening, the week so far
  await expect(page.locator('[data-num="km"]')).toContainText('24 km');
  await expect(page.locator('[data-num="med"]')).toContainText(T('{min} min|check', { min: 20 }));
  await expect(page.locator('[data-cmp]')).toContainText('7 → 8');
  await expect(page.getByRole('region', { name: T('The week so far') })).toContainText(`${T('Nature|joy')}3×`);
  expect(await noScroll(page)).toBe(true);
  await shot(page, 'T2-abend-rueckblick');

  // «Fertig»: the filled-in answers are kept, back on Heute the row shows the satisfaction
  await page.locator('[data-check-done]').click();
  await expect(page).toHaveURL(/#\/$/);
  await expect.poll(async () => (await abRows(page)).map((r) => r.qid)).toEqual(expect.arrayContaining(['achtsamkeit.moment', 'erreicht.zufrieden', 'erreicht.ziel', 'natur.draussen', 'spass.coolstes']));
  expect((await abRows(page)).find((r) => r.qid === 'natur.draussen')).toMatchObject({ value: 'm90', day: DAY });
  expect(await row(page)).toMatchObject({ mood: 7, story: 'Ein fiktiver Abend am See.' });
  await expect(page.locator('[data-section="morningcheck"] [data-sat]')).toContainText(T('Satisfaction {n} of 10', { n: 8 }));
  expect(errors).toEqual([]);
});

test('T2 Sprechen shows where the browser can turn speech into text', async ({ page, context }) => {
  await context.addInitScript(() => {
    window.SpeechRecognition = class {
      start() {}
      stop() {}
      abort() {}
    };
  });
  await open(page, context, '21:00', { speech: true });
  await page.goto('./#/check/evening');
  await expect(page.locator('[data-speak]')).toHaveText(T('Speak'));
});

/* ---------- v0.127.0 «Tages-Check» 2 (mockups T3, T4, Noah 13.10.2026 «T1–T4 freigegeben») ---------- */
const setting = (page, key) =>
  page.evaluate(
    (key) =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction('settings').objectStore('settings').get(key);
          g.onsuccess = () => (res(g.result?.value ?? null), r.result.close());
        };
      }),
    key,
  );

test('T4 questions page from the tile: the table by part, a switch hides the question in the check and stays', async ({ page, context }, info) => {
  const errors = await open(page, context, '07:52');
  // T3c: the tile folded in one line; unfolded the questions by when they come, then «Fragen anpassen»
  const tile = page.locator('[data-section="questions"]');
  await expect(tile).toContainText(T('Your 15 questions'));
  await expect(tile.locator('.chip')).toHaveCount(0);
  await tile.locator('[data-questions-toggle]').click();
  await expect(tile.locator('[data-questions-toggle]')).toHaveAttribute('aria-expanded', 'true');
  // Noah 04.11.2026 «ein Fragebogen»: only «Worauf freust du dich?» is left; the others are the window's questions now
  await expect(tile.locator('[data-part="morning"]')).toBeVisible();
  await expect(tile.locator('[data-part="evening"]')).toHaveCount(0);
  expect(await noScroll(page)).toBe(true);
  await shot(page, 'T3c-fragen-offen');
  await tile.locator('[data-questions-page]').click();
  await expect(page).toHaveURL(/#\/check\/questions$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Your 15 questions') })).toBeVisible();
  // Noah 04.11.2026 «ein Fragebogen»: 1–5 and 7 are asked like in the window now (Deine Abfragen): only question 6 stays in this table
  await expect(page.locator('[data-moved]')).toBeVisible();
  await expect(page.locator('tr[data-question]')).toHaveCount(1);
  await expect(page.getByText(T('Comes by itself'))).toBeVisible();
  await expect(page.getByText(T('from Fitbit, shown in the check'))).toBeVisible(); // 0.171: Fitbit is there
  // a phone leaves the columns «Wie oft» and «Antwort» away
  await expect(page.getByRole('columnheader', { name: T('How often') })).toHaveCount(info.project.name === 'phone' ? 0 : 1);
  await expect(page.getByRole('columnheader', { name: T('Answer|table') })).toHaveCount(info.project.name === 'phone' ? 0 : 1);
  expect(await noScroll(page)).toBe(true);
  await shot(page, 'T4-fragen-seite');

  // question 6 off: the morning check no longer asks it; the choice stays after a reload
  const sw = page.locator('tr[data-question="6"]').getByRole('switch');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('tr.g').first()).toContainText(T('Morning · {n} taps', { n: 0 }));
  await expect.poll(() => setting(page, 'checkQuestionsOff')).toEqual([6]);
  await page.reload();
  await expect(page.locator('tr[data-question="6"]').getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await page.goto('./#/check/morning');
  await expect(page.locator('[data-round-questions="morning"] [data-q="erholung.schlaf"]')).toBeVisible();
  await expect(page.locator('[data-q="joy"]')).toHaveCount(0);
  // the morning page leads to the catalogue too; on again, the question is back
  await page.locator('[data-all-questions]').click();
  await expect(page).toHaveURL(/#\/check\/questions$/);
  await page.locator('tr[data-question="6"]').getByRole('switch').click();
  await page.goto('./#/check/morning');
  await expect(page.locator('[data-q="joy"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('T2 the Sunday question on the evening page: 1 to 10 and one sentence, saved; not on a weekday', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date('2026-10-18T21:00:00+02:00') }); // a Sunday
  await page.goto('./#/check/evening');
  // Noah 04.11.2026 «ein Fragebogen»: it is the window's weekly question «Näher an deiner Vision?» (Deine Abfragen), not a card of its own
  const v = page.locator('[data-round-questions="evening"] [data-q="visionen.vision"]');
  await expect(v).toBeVisible();
  await v.locator('[data-step="6"]').click(); // five steps with words, stored as 2 … 10
  await v.getByRole('textbox').fill('Ein fiktiver Schritt.');
  await v.getByRole('textbox').blur();
  await expect
    .poll(() => page.evaluate(() => new Promise((res) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => {
        const g = r.result.transaction('abAnswers').objectStore('abAnswers').getAll();
        g.onsuccess = () => (res((g.result ?? []).filter((x) => x.qid === 'visionen.vision' && x.day === '2026-10-18').map((x) => ({ value: x.value, note: x.note }))), r.result.close());
      };
    })))
    .toEqual([{ value: 6, note: 'Ein fiktiver Schritt.' }]);
  // not on a weekday
  await page.clock.setSystemTime(new Date('2026-10-19T21:00:00+02:00'));
  await page.reload();
  await expect(page.locator('[data-round-questions="evening"] [data-q="erreicht.zufrieden"]')).toBeVisible();
  await expect(page.locator('[data-q="visionen.vision"]')).toHaveCount(0);
});


/* ---------- Noah 19.10.2026: the round as its own window, «Später» (1 hour) and «Heute nicht» ---------- */
function abConfig() {
  const on = ['erholung.schlaf', 'erholung.akku', 'spass.stimmung', 'ziele.ziel', 'erreicht.zufrieden'];
  const q = Object.fromEntries([...ON_AT_START].map((id) => [id, { on: false }]));
  for (const id of on) q[id] = { on: true };
  return { key: 'abfragen', value: { since: `${addDays(DAY, -1)}T21:00`, q, own: [] } };
}

test('mask: the morning check comes as a window; Later brings it back after one hour, the X keeps it away until the evening check', async ({ page, context }) => {
  const errors = await open(page, context, '07:52');
  await put(page, { ...rows(), settings: [abConfig()] });
  await page.reload();
  await ready(page);

  // Heute does not start with the questions: they come in their own window
  const mask = page.locator('dialog[data-section="abfragen"]');
  await expect(mask).toHaveJSProperty('open', true);
  await expect(mask).toHaveAttribute('data-round', 'morning');
  await expect(mask.getByRole('heading', { name: T('Morning check') })).toBeVisible();
  await expect(mask.locator('[data-q="erholung.schlaf"]')).toBeVisible();
  await expect(mask.getByRole('link', { name: T('Whole morning check') })).toHaveAttribute('href', '#/check/morning');
  expect(await noScroll(page)).toBe(true);
  await shot(page, 'maske-morgen-check');

  // «Später»: gone, also after a reload; back after one hour
  await mask.locator('[data-ab-later]').click();
  await expect(mask).toBeHidden();
  await dialogEntryGone(page);
  await page.reload();
  await ready(page);
  await expect(mask).toBeHidden();
  await expect(page.locator('[data-daycard] [data-section="morningcheck"]')).toBeVisible(); // the round stays one tap away
  await page.clock.fastForward('01:01:00');
  await expect(mask).toHaveJSProperty('open', true);

  // Noah 21.10.2026 «nie mehr eine Erinnerung»: ✕ counts as «Heute nicht»: the window stays away after a reload
  // and an hour later. Noah 26.10.2026 «1a» (changed on purpose): in the morning it waits only until the evening
  // check, which then comes as usual
  await mask.getByRole('button', { name: T('Not today|mask') }).first().click();
  await expect(mask).toHaveCount(0);
  await dialogEntryGone(page);
  await page.reload();
  await ready(page);
  await expect(mask).toHaveCount(0);
  await page.clock.fastForward('01:01:00');
  await expect(mask).toHaveCount(0);
  await page.clock.fastForward('11:00:00');
  await expect(page.locator('[data-daycard] [data-section="morningcheck"]')).toHaveAttribute('data-part', 'evening');
  await expect(mask).toHaveJSProperty('open', true);
  await expect(mask).toHaveAttribute('data-round', 'evening');
  expect(errors).toEqual([]);
});

test('mask: the evening check at 20:30, the link to the whole evening review', async ({ page, context }) => {
  const errors = await open(page, context, '20:40');
  await put(page, { ...rows({ todayCheck: { sleep: 6, energy: 5, mood: 7 } }), settings: [abConfig()] });
  await page.reload();
  await ready(page);
  const mask = page.locator('dialog[data-section="abfragen"]');
  await expect(mask).toHaveJSProperty('open', true);
  await expect(mask).toHaveAttribute('data-round', 'evening');
  await expect(mask.getByRole('heading', { name: T('Evening check') })).toBeVisible();
  // Noah 20.10.2026 «2» (changed on purpose): 3 questions first, the others on «Show more questions»
  expect(await mask.locator('[data-q]').count()).toBeLessThanOrEqual(3);
  if (await mask.locator('[data-ab-more]').count()) await mask.locator('[data-ab-more]').click();
  await expect(mask.locator('[data-q="erreicht.zufrieden"]')).toBeVisible();
  await shot(page, 'maske-abend-check');
  await mask.getByRole('link', { name: T('Whole evening review') }).click();
  await expect(page).toHaveURL(/#\/check\/evening$/);
  await expect(page.getByRole('heading', { level: 1, name: T('How was your day?') })).toBeVisible();
  expect(errors).toEqual([]);
});
