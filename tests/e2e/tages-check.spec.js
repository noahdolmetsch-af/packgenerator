// v0.127.0 «Tages-Check» 1 + 2 (mockups T1–T4, Noah 13.10.2026) and WG «Wi gaht's?» takes over the daily
// check (Noah 14.10.2026 «a) ja, alle drei übernehmen», «ok. freigabe»): on a phone and a computer, in
// German, with a fixed clock in Europe/Zurich. Back with Noah 18.10.2026 «1 a und b», «2b», «3 a und b»: the
// pages #/check/morning, …/evening and …/questions are there again (tests in tages-check-seiten.spec.js), the
// round on Heute leads to them, the big ring takes the place of the three Im-Flow rings, «Deine 15 Fragen» is
// back on Heute. The tests below:
// 1. WG morning (07:52, was «the morning check»): the Im Flow row and the round tile «Morgen-Runde» lead
//    to «Wi gaht's?»; the morning round asks sleep, battery, mood (moved from 08:00 to 07:00) and the goal
//    on Heute; saved, the tile shows when, the goal and the three numbers, Im Flow shows them too and the
//    day's check has them (the mirror). No sideways scroll, no page errors.
// 2. WG evening (21:00, was «the evening review»): «Abend-Runde», the satisfaction from «Wi gaht's?».
// 3. Check links: the three check pages open again, other #/check addresses lead to «Wi gaht's?».
// 4. Step 2 (T3): the big balance ring from the meditation and the answers of «Wi gaht's?», the round tile,
//    «Deine 15 Fragen» back; «Feste Runden» (was the catalogue of the 15 questions); the Sunday
//    question in the evening round (was question 15); the tip about the long press and the long press.
// Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ON_AT_START } from '../../src/lib/abfragen.js';
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

/**
 * WG: «Wi gaht's?» started yesterday evening, with only the questions of the two rounds on: sleep, battery,
 * mood (its own time 08:00, so the morning round asks it), the goal and the satisfaction.
 */
function abConfig() {
  const on = ['erholung.schlaf', 'erholung.akku', 'spass.stimmung', 'ziele.ziel', 'erreicht.zufrieden'];
  const q = Object.fromEntries([...ON_AT_START].map((id) => [id, { on: false }])); // the list of the app, all off
  for (const id of on) q[id] = { on: true };
  q['spass.stimmung'] = { on: true, every: { kind: 'daily', time: '08:00' } };
  return { key: 'abfragen', value: { since: `${addDays(DAY, -1)}T21:00`, q, own: [] } };
}
const answers = (page) =>
  page.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const g = r.result.transaction('abAnswers').objectStore('abAnswers').getAll();
          g.onsuccess = () => (res(g.result ?? []), r.result.close());
        };
      }),
  );

test('WG morning (was «the morning check»): the round of «Wi gaht\'s?» on Heute, the tile and Im Flow show its numbers', async ({ page, context }) => {
  const errors = await open(page, context, '07:52');
  await put(page, { ...rows(), settings: [abConfig()] });
  await page.reload();
  await ready(page);

  // the round tile leads to «Wi gaht's?»; v0.155.0 «Heute neu geordnet» (release analysis D3, changed on
  // purpose): the round shows once on Heute, in the day card; Im Flow leaves its row out there
  await expect(page.locator('[data-check-entry]')).toHaveCount(0);
  const entry = page.locator('[data-daycard] [data-section="morningcheck"]');
  await expect(entry).toContainText(T('Morning round'));
  await expect(entry).toContainText(T('Start|check'));
  await entry.click();
  // Noah 18.10.2026 «1 a und b» (changed on purpose): the round leads to the morning page again
  await expect(page).toHaveURL(/#\/check\/morning$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Good morning') })).toBeVisible();
  await page.goto('./#/');
  await ready(page);
  const mc = page.locator('[data-section="morningcheck"]');
  await expect(mc).toHaveAttribute('data-part', 'morning');
  await expect(mc).toHaveAttribute('data-done', 'false');
  await expect(mc.getByRole('heading', { name: T('Morning round') })).toBeVisible();
  await expect(mc).toContainText(T('{n} due now', { n: 4 }));
  await expect(mc).toContainText(T('Start|check'));

  // the morning round on Heute: all four at 07:00 (mood moved from its own 08:00)
  const card = page.locator('[data-section="abfragen"]');
  await expect(card.getByText(T('{n} due now', { n: 4 }))).toBeVisible();
  for (const qid of ['erholung.schlaf', 'erholung.akku', 'spass.stimmung', 'ziele.ziel']) await expect(card.locator(`[data-q="${qid}"]`)).toContainText('7:00');
  await card.locator('[data-q="erholung.schlaf"]').getByRole('button', { name: '6', exact: true }).click();
  await card.locator('[data-q="erholung.akku"]').getByRole('button', { name: '5', exact: true }).click();
  await card.locator('[data-q="spass.stimmung"]').getByRole('button', { name: '7', exact: true }).click();
  await card.locator('[data-q="ziele.ziel"]').getByRole('textbox').fill('Velo nach der Arbeit');
  await card.locator('[data-ab-save]').click();
  await expect(card).toHaveCount(0);

  // the tile: when, the goal, the three numbers, the evening round to come
  await expect(mc).toHaveAttribute('data-done', 'true');
  await expect(mc).toContainText(T('done {time}', { time: '07:52' }));
  await expect(mc).toContainText(T('Goal: {goal}', { goal: 'Velo nach der Arbeit' }));
  await expect(mc.locator('[data-val="sleep"] b')).toHaveText('6');
  await expect(mc.locator('[data-val="energy"] b')).toHaveText('5');
  await expect(mc.locator('[data-val="mood"] b')).toHaveText('7');
  await expect(mc).toContainText(T('From {time} the evening round comes here.', { time: '20:30' }));
  // the day's check (the mirror) has the three numbers
  await expect.poll(async () => (await row(page))?.mood).toBe(7);
  expect(await row(page)).toMatchObject({ sleep: 6, energy: 5, mood: 7 });
  expect((await answers(page)).map((a) => a.qid).sort()).toEqual(['erholung.akku', 'erholung.schlaf', 'spass.stimmung', 'ziele.ziel']);
  // the Im Flow page: today's values and the 7 days
  await page.goto('./#/flow');
  await expect(page.locator('[data-check-row="done"]')).toContainText(`${T('Sleep|flow')} 6`);
  await expect(page.locator('[data-check-row="done"]').getByRole('link', { name: T('Change') })).toHaveAttribute('href', '#/me/abfragen');
  await expect(page.locator('.avg')).toContainText(T('⌀ 7 days'));
  expect(await noScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('WG evening (was «the evening review»): «Abend-Runde» with the satisfaction from «Wi gaht\'s?»', async ({ page, context }) => {
  const errors = await open(page, context, '21:00');
  const at = (hm) => `${DAY}T${hm}`;
  const ab = (qid, area, kind, value, slot, when) => ({ id: `test_ab_${qid}`, qid, area, day: DAY, at: at(when), slot: at(slot), kind, value, note: null, unit: null, src: 'hand' });
  await put(page, {
    ...rows({ todayCheck: { sleep: 6, energy: 5, mood: 7 } }),
    settings: [abConfig()],
    abAnswers: [ab('erholung.schlaf', 'erholung', 'scale', 6, '07:00', '07:10'), ab('ziele.ziel', 'ziele', 'text', 'Fiktive Runde', '07:00', '07:11')],
  });
  await page.reload();
  await ready(page);

  const mc = page.locator('[data-section="morningcheck"]');
  await expect(mc).toHaveAttribute('data-part', 'evening');
  await expect(mc.getByRole('heading', { name: T('Evening round') })).toBeVisible();
  await expect(mc).toHaveAttribute('data-done', 'false');
  await expect(mc).toContainText(T('Start|check'));
  // v0.155.0 (D3, changed on purpose): the round once on Heute, in the day card's evening; it opens «Wi gaht's?»
  await expect(page.locator('[data-check-entry]')).toHaveCount(0);
  // Noah 18.10.2026 «1 a und b» (changed on purpose): it opens the evening page again
  await expect(page.locator('[data-daycard] [data-section="morningcheck"]')).toHaveAttribute('href', '#/check/evening');

  // the evening round on Heute: the satisfaction at 20:30
  const card = page.locator('[data-section="abfragen"]');
  await expect(card.locator('[data-q="erreicht.zufrieden"]')).toContainText('20:30');
  await card.locator('[data-q="erreicht.zufrieden"]').getByRole('button', { name: '8', exact: true }).click();
  await card.locator('[data-ab-save]').click();
  await expect(mc).toHaveAttribute('data-done', 'true');
  await expect(mc.locator('[data-sat]')).toContainText(T('Satisfaction {n} of 10', { n: 8 }));
  await expect(mc).toContainText(T('Goal: {goal}', { goal: 'Fiktive Runde' }));
  await expect(mc.locator('[data-val="sleep"] b')).toHaveText('6');
  expect(await noScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('check links: the three check pages are back (Noah 1ab, 3ab); other check addresses lead to Wi gahts', async ({ page, context }) => {
  await open(page, context, '21:00');
  for (const [h, name] of [['#/check/morning', 'Good morning'], ['#/check/evening', 'How was your day?'], ['#/check/questions', 'Your 15 questions']]) {
    await page.goto(`./${h}`);
    await expect(page).toHaveURL(new RegExp(`${h.replace(/\//g, '\\/')}$`));
    await expect(page.getByRole('heading', { level: 1, name: T(name) })).toBeVisible();
  }
  for (const h of ['#/check', '#/check/other']) {
    await page.goto(`./${h}`);
    await expect(page).toHaveURL(/#\/me\/abfragen$/);
    await expect(page.getByRole('heading', { level: 1, name: T('Your questions') })).toBeVisible();
  }
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

test('Heute: the big balance ring from the meditation and the answers of Wi gahts, the round tile, Deine 15 Fragen', async ({ page, context }) => {
  const errors = await open(page, context, '07:52');
  const y = addDays(DAY, -1);
  const ab = (qid, area, kind, value) => ({ id: `test_ab_${qid}`, qid, area, day: y, at: `${y}T20:35`, slot: `${y}T20:30`, kind, value, note: null, unit: null, src: 'hand' });
  // WG: yesterday's evening round: time with friends «a lot», fresh air 10, the time outside 30–90 min
  await put(page, { ...rows(), abAnswers: [ab('freunde.zeit', 'freunde', 'chips', 'much'), ab('natur.luft', 'natur', 'scale', 10), ab('natur.draussen', 'natur', 'chips', 'm90')] });
  await page.reload();
  await ready(page);

  const ring = page.locator('[data-section="balance"]');
  await expect(ring.getByRole('heading', { name: T('Your balance') })).toBeVisible();
  // v0.155.0 HN4b-1 (changed on purpose): the compact balance says «last 7 days» in its head
  await expect(ring.locator('.hd')).toContainText(T('last 7 days'));
  // Noah 18.10.2026 «2b» (T3b, changed on purpose): the big ring with the names around it
  await expect(ring.locator('[data-balance-big]')).toBeVisible();
  // meditation on 6 of the last 7 days: Achtsamkeit full; nothing about visions: empty, never invented
  await expect(ring.locator('[data-cat="mind"] .lv')).toHaveText('100');
  await expect(ring.locator('[data-cat="vision"] .lv')).toHaveText('–');
  // WG: the answers of «Wi gaht's?» count: Freunde 100; Natur: two old highlights «Natur» (1, 1), fresh
  // air 10 (1) and 30–90 min outside (2/3) → 92
  await expect(ring.locator('[data-cat="friends"] .lv')).toHaveText('100');
  await expect(ring.locator('[data-cat="nature"] .lv')).toHaveText('92');
  // one segment per category with a value; the strongest and the weakest beside the ring
  const known = await ring.locator('[data-cat] .lv').evaluateAll((els) => els.filter((e) => e.textContent !== '–').length);
  await expect(ring.locator('path[data-seg]')).toHaveCount(known);
  await expect(ring.locator('[data-least]')).toContainText(T('the weakest|balance'));
  await expect(ring.locator('[data-most]')).toContainText(T('the strongest|balance'));
  await expect(ring.getByRole('img')).toHaveAttribute('aria-label', new RegExp(T('Friends|cat') + ' 100'));

  // the round tile: «Morgen-Runde», not yet today; «Deine 15 Fragen» is back (Noah «3 a und b»)
  const mc = page.locator('[data-section="morningcheck"]');
  await expect(mc).toHaveAttribute('data-done', 'false');
  await expect(mc.getByRole('heading', { name: T('Morning round') })).toBeVisible();
  await expect(page.locator('[data-section="questions"]')).toHaveCount(1);
  await mc.click();
  await expect(page).toHaveURL(/#\/check\/morning$/);
  expect(errors).toEqual([]);
});

test('«Feste Runden» (was «Deine 15 Fragen»): a switch and the two times on Ich › «Wi gaht\'s?», kept and used on Heute', async ({ page, context }) => {
  const errors = await open(page, context, '07:52');
  await put(page, { settings: [abConfig()] });
  await page.goto('./#/me/abfragen');
  await ready(page);
  const sec = page.locator('[data-rounds]');
  await expect(sec.getByRole('heading', { name: T('Fixed rounds') })).toBeVisible();
  await expect(sec).toContainText(T('a suggestion, can be switched off'));
  const sw = sec.getByRole('switch', { name: T('Ask in two rounds') });
  await expect(sw).toBeChecked();
  await expect(sec.locator('[data-round="morning"]')).toHaveValue('07:00');
  await expect(sec.locator('[data-round="evening"]')).toHaveValue('20:30');
  expect(await noScroll(page)).toBe(true);

  // an own evening time: kept, and the round tile names it
  await sec.locator('[data-round="evening"]').fill('21:15');
  await sec.locator('[data-round="evening"]').blur();
  await expect.poll(async () => (await setting(page, 'abfragen'))?.rounds).toEqual({ on: true, morning: '07:00', evening: '21:15' });
  await page.goto('./#/');
  await ready(page);
  const card = page.locator('[data-section="abfragen"]');
  await card.locator('[data-q="erholung.schlaf"]').getByRole('button', { name: '6', exact: true }).click();
  await card.locator('[data-ab-save]').click();
  await expect(page.locator('[data-section="morningcheck"]')).toContainText(T('From {time} the evening round comes here.', { time: '21:15' }));

  // switched off: the questions keep their own times (the battery waits for 08:00), the times are hidden
  await page.goto('./#/me/abfragen');
  await sw.click();
  await expect(sw).not.toBeChecked();
  await expect(sec.locator('[data-round]')).toHaveCount(0);
  await expect.poll(async () => (await setting(page, 'abfragen'))?.rounds?.on).toBe(false);
  await page.reload();
  await expect(page.locator('[data-rounds]').getByRole('switch', { name: T('Ask in two rounds') })).not.toBeChecked();
  await page.goto('./#/');
  await ready(page);
  await expect(card.locator('[data-q="erholung.akku"]')).toHaveCount(0);
  await expect(card.locator('[data-q="ziele.ziel"]')).toHaveCount(0);
  // on again: the morning round asks them at 07:00
  await page.goto('./#/me/abfragen');
  const sw2 = page.locator('[data-rounds]').getByRole('switch', { name: T('Ask in two rounds') });
  await sw2.click();
  await expect(sw2).toBeChecked();
  // wait for the saved setting before leaving the page (else Heute may read the old one; phone CI 18.10.2026)
  await expect.poll(async () => (await setting(page, 'abfragen'))?.rounds?.on).toBe(true);
  await page.goto('./#/');
  await ready(page);
  await expect(card.locator('[data-q="ziele.ziel"]')).toContainText('7:00');
  expect(errors).toEqual([]);
});

test('the Sunday question (was question 15): «Näher an deiner Vision?» in the Sunday evening round at 20:30, saved', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date('2026-10-18T20:00:00+02:00') }); // a Sunday
  await page.goto('./#/');
  await ready(page);
  // only the Sunday question on (the list of the app, all others off), «Wi gaht's?» since this morning
  const q = { ...Object.fromEntries([...ON_AT_START].map((id) => [id, { on: false }])), 'visionen.vision': { on: true } };
  await put(page, { settings: [{ key: 'abfragen', value: { since: '2026-10-18T06:00', q, own: [] } }] });
  await page.reload();
  await ready(page);
  // 20:00: its own time (19:00) moved to the evening round, not yet
  await expect(page.locator('[data-q="visionen.vision"]')).toHaveCount(0);
  await page.clock.setSystemTime(new Date('2026-10-18T20:31:00+02:00'));
  await page.reload();
  await ready(page);
  const v = page.locator('[data-section="abfragen"] [data-q="visionen.vision"]');
  await expect(v).toContainText('20:30');
  await v.getByRole('button', { name: '7', exact: true }).click();
  await page.locator('[data-section="abfragen"] [data-ab-save]').click();
  await expect.poll(async () => (await answers(page)).find((a) => a.qid === 'visionen.vision')?.value).toBe(7);
  // not on a weekday
  await page.clock.setSystemTime(new Date('2026-10-19T20:31:00+02:00'));
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-q="visionen.vision"]')).toHaveCount(0);
});

test('the tip about the long press closes for good; a long press shows the sizes of the tile', async ({ page, context }, info) => {
  const errors = await open(page, context, '07:52');
  const hint = page.locator('[data-hint="longpress"]');
  // one hint on top at a time: while «Connect Strava» shows, the tip waits; «Later» brings it
  const sc = page.locator('[data-section="strava-connect"]');
  await expect(sc).toBeVisible();
  await expect(hint).toHaveCount(0);
  await sc.getByRole('button', { name: T('Later') }).click();
  await expect(hint).toContainText(T('Press a tile long to change its size. Or «{customise}».', { customise: T('Customise the start page') }));
  await hint.getByRole('button', { name: T('Close the tip') }).click();
  await expect(hint).toHaveCount(0);
  await expect.poll(() => setting(page, 'homeHintLongPress')).toBe(true);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-section="balance"]')).toBeVisible();
  await expect(hint).toHaveCount(0);

  // a long press (finger on a phone, mouse on a computer) on «Deine Balance»: its sizes at once
  const tile = page.locator('.wall [data-tile="balance"]');
  await tile.scrollIntoViewIfNeeded();
  const b = await tile.boundingBox();
  const ev = { pointerType: info.project.name === 'phone' ? 'touch' : 'mouse', clientX: b.x + 20, clientY: b.y + 20, isPrimary: true, button: 0 };
  await tile.dispatchEvent('pointerdown', ev);
  await page.waitForTimeout(700);
  await tile.dispatchEvent('pointerup', ev);
  await expect(page.getByRole('region', { name: T('Customise the start page') })).toBeVisible();
  const tools = page.locator('[data-tools="balance"]');
  await expect(tools).toBeVisible();
  await tools.getByRole('button', { name: T('Whole row|tile') }).click();
  await expect(tile).toHaveAttribute('data-size', 'long');
  // a short tap is still a tap: no customising
  await page.getByRole('button', { name: T('Done|customise') }).click();
  await expect(page.locator('[data-tools]')).toHaveCount(0);
  // v0.155.0: the round tile left the wall (it is in the day card); «This week» takes the short tap
  const mc = page.locator('.wall [data-tile="week"]');
  const m = await mc.boundingBox();
  await mc.dispatchEvent('pointerdown', { ...ev, clientX: m.x + 20, clientY: m.y + 20 });
  await mc.dispatchEvent('pointerup', { ...ev, clientX: m.x + 20, clientY: m.y + 20 });
  await page.waitForTimeout(700);
  await expect(page.getByRole('region', { name: T('Customise the start page') })).toHaveCount(0);
  expect(errors).toEqual([]);
});
