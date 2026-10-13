// v0.124.0 «Tages-Check» 1 (mockups T1 and T2, Noah 13.10.2026 «ich gebe hiermit alle mockups frei»):
// on a phone and a computer, in German, with a fixed clock in Europe/Zurich.
// 1. Morning (07:52): the check row on Heute opens #/check/morning; the four numbers (yesterday's
//    line under the number), «Worauf freust du dich?» with an own chip, the goal, «Gestern Abend»,
//    the suggestion («Nicht heute» and back), «Heute im Blick» with today's meditation, the night as a
//    placeholder; the answers stay after a reload; «Fertig» goes back to Heute, which shows the numbers.
// 2. Evening (21:00): the row on Heute offers the evening review; Q11 is filled in from today's ride,
//    Q14 found from today's meditation, Q10 asks about the morning's goal; the side shows the day in
//    numbers, morning → evening and the week; «Sprechen» only where the browser can; «Fertig» keeps
//    the filled-in answers. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { eveningTurn } from '../../src/lib/flowcheck.js';
import { ready } from './settle.js';
import { put, addDays } from './aktiv-fixture.js';

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
  await expect(page.locator('[data-section="flow"]')).toBeVisible(); // the flow seed is written
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

test('the morning check: four numbers, joy, goal, last night, the suggestion; saved at once', async ({ page, context }) => {
  const errors = await open(page, context, '07:52');
  await put(page, rows());
  await page.reload();
  await ready(page);

  const entry = page.locator('[data-check-entry="morning"]');
  await entry.getByRole('link', { name: T('Start|check') }).click();
  await expect(page).toHaveURL(/#\/check\/morning$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Good morning') })).toBeVisible();

  // 1–3: yesterday's answer is marked under its number
  await expect(page.locator('[data-q="sleep"] .sv.y')).toHaveText('7');
  for (const [k, v] of [['sleep', 6], ['energy', 5], ['mood', 7], ['extra', 6]]) await page.locator(`[data-q="${k}"] .sv`).nth(v - 1).click();
  await expect(page.locator('[data-q="mood"] .sv').nth(6)).toHaveAttribute('aria-pressed', 'true');
  // a tap on the chosen number takes it back (every question can be skipped)
  await page.locator('[data-q="extra"] .sv').nth(5).click();
  await expect(page.locator('[data-q="extra"] .sv[aria-pressed="true"]')).toHaveCount(0);

  // 6: two chips and an own one
  const joy = page.locator('[data-chips="joy"]');
  await joy.getByRole('button', { name: T('Nature|joy'), exact: true }).click();
  await joy.getByRole('button', { name: T('Sport|joy'), exact: true }).click();
  await joy.getByRole('button', { name: T('own|chip') }).click();
  await joy.getByRole('textbox').fill('Konzert');
  await joy.getByRole('button', { name: T('Add|chip') }).click();
  await expect(joy.getByRole('button', { name: 'Konzert' })).toHaveAttribute('aria-pressed', 'true');
  // 7: the goal; «Gestern Abend»
  await page.locator('[data-chips="goal"]').getByRole('button', { name: T('Ride after work') }).click();
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
  await expect(page.getByText(T('Comes with Fitbit/Google: sleep, resting pulse and HRV next to your feeling, with your normal. Until then this space stays small.'))).toBeVisible();
  expect(await noScroll(page)).toBe(true);

  // saved at once: a reload shows the answers
  await expect.poll(async () => (await row(page))?.last).toEqual(['phone']);
  await page.reload();
  await expect(page.locator('[data-q="sleep"] .sv').nth(5)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-chips="goal"]').getByRole('button', { name: T('Ride after work') })).toHaveAttribute('aria-pressed', 'true');
  expect(await row(page)).toMatchObject({ sleep: 6, energy: 5, mood: 7, extra: null, joy: ['nature', 'sport', 'Konzert'], goal: { id: 'ride' }, last: ['phone'] });

  // the 4th answered, «Fertig»: Heute shows the four numbers
  await page.locator('[data-q="extra"] .sv').nth(5).click();
  await page.locator('[data-check-done]').click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('[data-check-entry="morning"] .nums li')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('the evening review: filled in from the ride and the meditation, the day in numbers', async ({ page, context }) => {
  const errors = await open(page, context, '21:00');
  await put(page, { ...rows({ todayCheck: { sleep: 6, energy: 5, mood: 7, goal: { id: 'ride' } } }), rides: [{ id: 'test_ride_today', date: DAY, km: 24, movingH: 1.08, totalH: 1.1, tripId: null, name: 'Fiktive Feierabendrunde' }] });
  await page.reload();
  await ready(page);

  const entry = page.locator('[data-check-entry="evening"]');
  await expect(entry).toContainText(T('Evening review'));
  await entry.getByRole('link', { name: T('Start|check') }).click();
  await expect(page).toHaveURL(/#\/check\/evening$/);
  await expect(page.getByRole('heading', { level: 1, name: T('How was your day?') })).toBeVisible();

  // 8 and 9
  await page.locator('[data-q="sat"] .sv').nth(7).click();
  await page.locator('[data-chips="best"]').getByRole('button', { name: T('Nature|joy'), exact: true }).click();
  await page.locator('[data-story]').fill('Ein fiktiver Abend am See.');
  await page.locator('[data-story]').blur();
  await expect(page.locator('[data-speak]')).toHaveCount(0); // no speech recognition in this browser
  // 10: the goal of the morning
  await expect(page.locator('[data-q="goalDone"]')).toContainText(T('Goal from this morning: «{goal}»', { goal: T('Ride after work') }));
  await page.locator('[data-chips="goalDone"]').getByRole('button', { name: T('Yes|goal') }).click();
  // 11: filled in from today's ride (66 min → 30–90), changeable
  await expect(page.locator('[data-chips="outside"]').getByRole('button', { name: T('30–90 min') })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-q="outside"]')).toContainText(T('filled in from your ride, changeable'));
  // 12 or 13, by the day
  if (eveningTurn(DAY) === 'people') {
    await expect(page.locator('[data-q="fun"]')).toHaveCount(0);
    await page.locator('[data-chips="people"]').getByRole('button', { name: T('Briefly') }).click();
  } else {
    await expect(page.locator('[data-q="people"]')).toHaveCount(0);
    await page.locator('[data-q="fun"] .sv').nth(7).click();
  }
  // 14: found by itself
  await expect(page.locator('[data-mindful-auto]')).toContainText(T('found by itself: meditation {min} min at {time}', { min: 20, time: '06:40' }));

  // the side: the day in numbers, morning → evening, the week so far
  await expect(page.locator('[data-num="km"]')).toContainText('24 km');
  await expect(page.locator('[data-num="med"]')).toContainText(T('{min} min|check', { min: 20 }));
  await expect(page.locator('[data-cmp]')).toContainText('7 → 8');
  await expect(page.getByRole('region', { name: T('The week so far') })).toContainText(`${T('Nature|joy')}3×`);
  expect(await noScroll(page)).toBe(true);

  // «Fertig»: the filled-in answers are kept, back on Heute the row shows the satisfaction
  await page.locator('[data-check-done]').click();
  await expect(page).toHaveURL(/#\/$/);
  await expect.poll(async () => (await row(page))?.mindful).toBe('auto');
  expect(await row(page)).toMatchObject({ mood: 7, sat: 8, best: ['nature'], story: 'Ein fiktiver Abend am See.', goalDone: 'yes', outside: '30-90', mindful: 'auto' });
  await expect(page.locator('[data-check-entry="evening"]')).toContainText(T('Satisfaction {n} of 10', { n: 8 }));
  expect(errors).toEqual([]);
});

test('«Sprechen» shows where the browser can turn speech into text', async ({ page, context }) => {
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
