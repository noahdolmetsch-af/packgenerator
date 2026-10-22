// «Wochenrückblick» W1–W6 (Noah 15.10.2026 «1-5 a»): Aktiv › Woche › Wochenrückblick (#/flow/review) on a
// phone and a computer, in German. On a Monday the page shows the week just finished; every card draws from
// fictional activities, Aktiv ticks, «Wi gaht's?» answers and a training plan written straight into
// IndexedDB. ‹ › step the weeks, «Kopieren für Claude» only shows with the KI-Helfer switched on and sends
// nothing. No sideways scroll, no page errors. SHOTS=<dir> saves wochenrueckblick-390.png / -1440.png.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TABS } from './placetab.js';

// the keys as the app stores them (weekreview.js SLEEP_Q / MOOD_Q, training.js PLAN_KEY, helper HELPER_KEY);
// written out here because those modules load the app's runes, which the test runner cannot
const SLEEP_Q = 'erholung.schlaf';
const MOOD_Q = 'spass.stimmung';
const PLAN_KEY = 'training.plan';
const HELPER_KEY = 'helper';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const P = 'test_data_gtp_';
const TODAY = '2026-10-19'; // a Monday; the browser runs in Europe/Zurich
const MON = '2026-10-12'; // the week shown by default: the one just finished
const D0 = `${TODAY}T09:00:00+02:00`;
/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const HIST = { 105: 2400, 125: 2400, 145: 600, 160: 120 };
const ride = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '08:00', start: `${day}T06:00:00Z`, name: `${P}Runde ${id}`, type: 'GravelRide', kind: 'bike', km: 42.3, hm: 610, movingS: 5400, elapsedS: 5700, gearId: null, hrAvg: 132, hrMax: 165, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, effort: 60, hist: HIST, ...f });

/** Four calm weeks before, then a fuller week: a long ride with power, a run, a hilly one. All made up. */
function rows() {
  const activities = [];
  for (let w = 1; w <= 4; w++) {
    activities.push(ride(`p${w}a`, addDays(MON, -7 * w + 1), { effort: 40 + w }));
    activities.push(ride(`p${w}b`, addDays(MON, -7 * w + 5), { km: 35.1, movingS: 4500, effort: 35 + w }));
  }
  activities.push(
    ride('w1', MON, { km: 38.4, hm: 420, movingS: 4800, effort: 70 }),
    ride('w2', addDays(MON, 2), { name: `${P}Lauf am See`, type: 'Run', kind: 'run', km: 9.6, hm: 80, movingS: 3000, effort: 50 }),
    ride('w3', addDays(MON, 5), { name: `${P}Lange Runde`, km: 96.2, hm: 1240, movingS: 15000, wDevice: true, wAvg: 182, w20: 246, effort: 160 }),
  );
  const flowLog = [
    { id: `${P}log1`, actId: 'sauna', day: addDays(MON, 3), at: `${addDays(MON, 3)}T18:00:00.000Z`, n: 1 },
    { id: `${P}log2`, actId: 'meditation', day: addDays(MON, 1), at: `${addDays(MON, 1)}T06:30:00.000Z`, n: 1, min: 10 },
    { id: `${P}log3`, actId: 'meditation', day: addDays(MON, 4), at: `${addDays(MON, 4)}T06:30:00.000Z`, n: 1, min: 10 },
  ];
  const abAnswers = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(MON, i);
    abAnswers.push({ id: `${P}s${i}`, qid: SLEEP_Q, area: 'erholung', day: d, at: `${d}T07:00`, slot: null, kind: 'scale', value: [6, 7, 5, 6, 8, 7, 7][i], note: null, unit: null, src: 'hand' });
    if (i % 2 === 0) abAnswers.push({ id: `${P}m${i}`, qid: MOOD_Q, area: 'spass', day: d, at: `${d}T13:00`, slot: null, kind: 'scale', value: [7, 0, 8, 0, 6, 0, 9][i], note: null, unit: null, src: 'hand' });
  }
  const settings = [
    { key: PLAN_KEY, value: { sessions: [{ id: `${P}pl1`, day: addDays(MON, 5), kind: 'bike', name: '', mins: 240, zone: 2 }, { id: `${P}pl2`, day: addDays(MON, 3), kind: 'run', name: '', mins: 40, zone: 2 }, { id: `${P}pl3`, day: addDays(TODAY, 2), kind: 'bike', name: '', mins: 90, zone: 2 }] } },
    { key: HELPER_KEY, value: { code: '', show: true, capChf: 5 } },
  ];
  return { activities, flowLog, abAnswers, settings };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow'); // Aktiv seeds its activities (sauna, meditation, …) once
  await expect(page.locator('main [data-week-glance]')).toBeVisible(); // «Aktiv neu» (22.10.2026): «Diese Woche» on Aktiv
  return errors;
}
/** Write rows straight into the app's IndexedDB (then reload, so the app reads them). */
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
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Wochenrückblick: five numbers, strip, sentences, highlights, next week and the text for Claude', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const sent = [];
  page.on('request', (r) => {
    if (/vercel\.app\/api\/helper/.test(r.url())) sent.push(r.url());
  });
  await put(page, rows());
  await page.reload();
  const main = page.locator('main');

  // from Aktiv › Woche, one quiet link
  await main.locator('[data-more="week"]').click();
  await expect(page).toHaveURL(/#\/flow\/week$/);
  await main.locator('[data-to-review]').click();
  await expect(page).toHaveURL(/#\/flow\/review$/);
  await expect(main.getByRole('heading', { level: 1, name: T('Week in review') })).toBeVisible();
  await expect(page.locator(TABS).getByRole('link', { name: T('Today|active'), exact: true })).toHaveAttribute('aria-current', 'page');

  // on a Monday: the week just finished
  await expect(main.locator('[data-week]')).toHaveAttribute('data-week', MON);
  await expect(main.locator('[data-week]')).toContainText('KW 42');

  // W1 five numbers, each with its change
  const five = main.locator('[data-wr="five"]');
  await expect(five.getByRole('heading', { name: T('Your week in 5 numbers') })).toBeVisible();
  await expect(five.locator('[data-five]')).toHaveCount(5);
  await expect(five.locator('[data-five="hours"]')).toContainText('6:20');
  await expect(five.locator('[data-five="hours"]')).toContainText('+3:35 h');
  await expect(five.locator('[data-five="km"]')).toContainText('144.2');
  await expect(five.locator('[data-five="hm"]')).toContainText('1’740');
  await expect(five.locator('[data-five="goals"]')).toContainText(T('Goals reached'));

  // W2 the strip, with sleep and mood
  const strip = main.locator('[data-wr="strip"]');
  await expect(strip.locator('[data-strip-day]')).toHaveCount(7);
  await expect(strip.locator(`[data-strip-day="${MON}"] .k-train`)).toHaveCount(1);
  await expect(strip.locator(`[data-strip-day="${addDays(MON, 3)}"] .k-rest`)).toHaveCount(1);
  await expect(strip.locator(`[data-strip-day="${addDays(MON, 1)}"] .k-mind`)).toHaveCount(1);
  await expect(strip.locator(`[data-strip-day="${addDays(MON, 1)}"]`)).toHaveAttribute('aria-label', /Schlaf 7/);
  await expect(strip).toContainText(T('first line: sleep 1–10'));

  // W3 calm sentences: the run on Thursday stayed open
  const notes = main.locator('[data-wr="notes"]');
  await expect(notes.getByRole('heading', { name: T('Went well · missing') })).toBeVisible();
  await expect(notes.locator('[data-note="plan-open"]')).toContainText('Donnerstag blieb offen');
  expect(await notes.locator('[data-note]').count()).toBeLessThanOrEqual(3);

  // W4 highlights: the long ride, its best 20 minutes, new best values
  const highs = main.locator('[data-wr="highs"]');
  await expect(highs.locator('[data-high="longest"]')).toContainText(`${P}Lange Runde`);
  await expect(highs.locator('[data-high="w20"]')).toContainText('246 W');
  await expect(highs.locator('[data-high="best-km"]')).toContainText('96.2 km');

  // W5 one suggestion and the plan of next week
  const ahead = main.locator('[data-wr="ahead"]');
  await expect(ahead.getByRole('heading', { name: T('Looking ahead') })).toBeVisible();
  await expect(ahead).toContainText('KW 43: 1 Einheit schon geplant (1:30 Std.).');
  await expect(ahead.locator('[data-to-plan]')).toHaveAttribute('href', '#/flow/training');

  // W6 only with the KI-Helfer on: the text first, copied only on a tap, nothing sent
  const ask = main.locator('[data-wr="ask"]');
  await expect(ask.locator('[data-ask-text]')).toHaveValue(/^Meine Woche vom 12\. Oktober bis 18\. Oktober \(KW 42\):/);
  await expect(ask.locator('[data-ask-text]')).not.toHaveValue(new RegExp(P));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ask.locator('[data-ask-copy]').click();
  await expect(ask.locator('[data-ask-copy]')).toContainText(T('Copied'));
  expect(sent).toEqual([]);

  // German only, readable at 390
  expect(await main.innerText()).not.toMatch(/\b(Hours|Sessions|Week strip|Highlights|Looking ahead|Goals reached|Went well|until today|Copy for)\b/);
  await fits(page, 'review');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/wochenrueckblick-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });

  // ‹ an older week, › back, › on to the running week (no › there)
  await main.locator('[data-week-prev]').click();
  await expect(page).toHaveURL(/#\/flow\/review\?w=2026-10-05$/);
  await expect(main.locator('[data-week]')).toContainText('KW 41');
  await expect(main.locator('[data-wr="highs"]')).toBeVisible();
  await main.locator('[data-week-next]').click();
  await expect(page).toHaveURL(/#\/flow\/review$/);
  await main.locator('[data-week-next]').click();
  await expect(main.locator('[data-week]')).toHaveAttribute('data-week', TODAY);
  await expect(main.locator('[data-week-next]')).toHaveCount(0);
  await fits(page, 'running week');

  expect(errors).toEqual([]);
});

test('Wochenrückblick: without the KI-Helfer no «Wie war meine Woche?»; Training › Rückblick links here', async ({ page, context }) => {
  const errors = await open(page, context);
  const data = rows();
  data.settings = data.settings.filter((s) => s.key !== HELPER_KEY);
  await put(page, data);
  await page.goto('./#/flow/training');
  await page.reload();
  const main = page.locator('main');
  const back = main.locator('section[aria-labelledby="back-h"]');
  await back.getByRole('link', { name: T('Week in review') }).click();
  await expect(page).toHaveURL(/#\/flow\/review$/);
  await expect(main.locator('[data-wr="five"]')).toBeVisible();
  await expect(main.locator('[data-wr="highs"]')).toBeVisible();
  await expect(main.locator('[data-wr="ask"]')).toHaveCount(0);
  await fits(page, 'review without helper');
  expect(errors).toEqual([]);
});
