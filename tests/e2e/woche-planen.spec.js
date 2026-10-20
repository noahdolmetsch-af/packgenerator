// «Woche planen» WP1–WP4 (Noah 15.10.2026 21:11 «1a 2a 3b 4a 5a»): the place «Woche», the Sunday
// planning, the holidays and «Diese Woche» on Heute. Fictional data (home0460-fixture.js, test_data_gtp_);
// the clock stands on Friday 9 October 2026, 09:00 (week of Monday 5 October).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { BAR_PLACES } from '../../src/lib/nav.js';
import { KINDS } from '../../src/lib/woche/kinds.js';

/** The fixture with a week: training sessions (one today, one last Tuesday as «like last week»), a date, two to-dos. */
function weekFixture() {
  const data = homeFixture();
  data.tables.settings.push(
    { key: 'training.plan', value: { sessions: [
      { id: 'test_data_gtp_s1', day: day(0), kind: 'bike', name: 'test_data_gtp_ Intervalle', mins: 60, zone: 4 },
      { id: 'test_data_gtp_s2', day: day(-10), kind: 'run', name: 'test_data_gtp_ Lauf', mins: 45, zone: 2 },
      { id: 'test_data_gtp_s3', day: day(2), kind: 'bike', name: 'test_data_gtp_ Lange Ausfahrt', mins: 180, zone: 2 },
    ] } },
    { key: 'week.items', value: [
      { id: 'test_data_gtp_d1', kind: 'date', title: 'test_data_gtp_ Zahnarzt', day: day(0), time: '07:45' },
      { id: 'test_data_gtp_t1', kind: 'todo', title: 'test_data_gtp_ Schlauch bestellen', day: day(0) },
      { id: 'test_data_gtp_t2', kind: 'todo', title: 'test_data_gtp_ Fotos sichern', day: null },
    ] },
  );
  return data;
}

test('Woche: the days with their kinds, chips hide a kind, a to-do is ticked, a date added', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: weekFixture() });
  const phone = info.project.name === 'phone';
  // the phone bar keeps five places, Woche instead of Material (Noah 1a); Material sits under Ich
  if (phone) {
    const bar = page.locator('nav.bottom a[data-place]');
    await expect(bar).toHaveCount(BAR_PLACES.length);
    for (const [i, p] of BAR_PLACES.entries()) await expect(bar.nth(i)).toContainText(T(p.label));
    await page.goto('./#/me');
    await expect(page.locator('[data-me-gear] a[href="#/gear"]')).toBeVisible();
    await page.locator('nav.bottom a[data-place="week"]').click();
  } else {
    await page.locator('.side li[data-place="week"] > a.pa').click();
  }
  await expect(page).toHaveURL(/#\/week$/);
  await expect(page.locator('h1')).toHaveText(T('This week'));
  const fri = page.locator(`[data-day="${day(0)}"]`);
  await expect(fri.locator('[data-entry]')).toHaveCount(4); // the session, the dentist, the to-do and the fixture's test trip
  await expect(fri.locator('[data-entry]').first()).toContainText('07:45');
  await expect(page.locator('[data-filter]')).toHaveCount(KINDS.length);
  // the to-do without a day waits under «Still to plan»
  await expect(page.locator('[data-sugg="todo:test_data_gtp_t2"]')).toBeVisible();
  // hide the to-dos, show them again
  await page.locator('[data-filter="todo"]').click();
  await expect(fri.locator('[data-kind="todo"]')).toHaveCount(0);
  await expect(page.locator('[data-sugg="todo:test_data_gtp_t2"]')).toHaveCount(0);
  await page.locator('[data-filter="todo"]').click();
  // tick the to-do
  const todo = fri.locator('[data-entry="test_data_gtp_t1"]');
  await todo.getByRole('button', { name: T('Done: {title}', { title: 'test_data_gtp_ Schlauch bestellen' }) }).click();
  await expect(todo).toHaveClass(/done/);
  // add a date for tomorrow
  await page.locator('[data-add="date"]').click();
  const form = page.locator('[data-week-form]');
  await form.getByLabel(T('Date|week')).fill('test_data_gtp_ Tennis');
  await form.getByLabel(T('Day')).fill(day(1));
  await form.getByLabel(T('Time')).fill('18:00');
  await form.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator(`[data-day="${day(1)}"] [data-kind="date"]`)).toContainText('test_data_gtp_ Tennis');
  // take the suggestion: the to-do gets a day
  await page.locator('[data-sugg="todo:test_data_gtp_t2"]').getByRole('button', { name: T('Take') }).click();
  await expect(page.locator('[data-entry="test_data_gtp_t2"]')).toHaveCount(1);
});

test('Heute: the week card shows the dots of the plan, today by the plan and the way to the week', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: weekFixture() });
  const card = page.locator('[data-section="week"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('[data-today-plan]')).toContainText(T('Today by the plan'));
  await expect(card.locator('[data-today-plan] [data-entry]')).toHaveCount(4);
  await expect(card.locator(`li[data-day="${day(0)}"] [data-plan-dots] i`)).toHaveCount(4); // sport, date, to-do, trip
  await expect(card.locator('[data-tomorrow]')).toContainText('test_data_gtp_ Herbstrunde');
  await card.locator('[data-to-week]').click();
  await expect(page).toHaveURL(/#\/week$/);
});

test('Woche planen: four steps, last week as proposals, the bike before the trip, done', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: weekFixture() });
  await page.goto('./#/week/plan');
  await expect(page.locator('h1')).toHaveText(T('Plan the week'));
  // 1 what is fixed: the dentist and the trip of the fixture
  await expect(page.locator('[data-step="1"]')).toContainText('test_data_gtp_ Zahnarzt');
  await page.locator('[data-next]').click();
  // 2 training: today's session is planned; last week's run comes as a proposal («like last week»)
  const st = page.locator('[data-step="2"]');
  await expect(st.locator('[data-session="test_data_gtp_s1"]')).toBeVisible();
  const prop = st.locator('[data-proposal]');
  await expect(prop).toHaveCount(1);
  await prop.getByRole('button', { name: T('Take {name}', { name: 'test_data_gtp_ Lauf' }) }).click();
  await expect(st.locator('[data-proposal]')).toHaveCount(0);
  await expect(st.locator('[data-session]')).toHaveCount(3);
  await page.locator('[data-next]').click();
  // 3 to-dos: the one without a day is taken
  const todo = page.locator('[data-step="3"] [data-sugg="todo:test_data_gtp_t2"]');
  await todo.getByRole('button', { name: T('Take {name}', { name: 'test_data_gtp_ Fotos sichern' }) }).click();
  await expect(todo).toHaveCount(0);
  await page.locator('[data-next]').click();
  // 4 bike: the chain of the fixture's Scale is due
  const bike = page.locator('[data-step="4"] [data-sugg^="bike:bike-test:"]').first();
  await expect(bike).toBeVisible();
  await bike.getByRole('button', { name: /übernehmen|^Take/ }).click();
  await page.locator('[data-finish]').click();
  await expect(page.locator('[data-plan-done]')).toContainText(T('Your week is planned'));
  await page.locator('[data-plan-done] a').click();
  await expect(page.locator('[data-kind="bike"]')).not.toHaveCount(0);
  await expect(page.locator('[data-plan-week]')).toHaveText(T('Plan the week again'));
});

test('Ferien: entered once, the training plan pauses and the packing list comes the day before', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: weekFixture() });
  await page.goto('./#/week/away');
  await expect(page.locator('h1')).toHaveText(T('Holidays and time away'));
  await page.locator('[data-add-away]').click();
  const form = page.locator('[data-away-form]');
  await form.getByLabel(T('From|away')).fill(day(1));
  await form.getByLabel(T('To|away')).fill(day(2));
  await form.getByLabel(T('Name')).fill('test_data_gtp_ Jura');
  for (const k of ['pause', 'service', 'pack']) await expect(form.locator(`[data-switch="${k}"]`)).toBeChecked();
  await expect(form.locator('[data-switch="shift"]')).not.toBeChecked();
  await form.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('[data-away]')).toContainText('test_data_gtp_ Jura');
  await page.goto('./#/week');
  // Sunday's long ride falls on the holidays: no entry, a suggestion to leave it out
  await expect(page.locator('[data-entry="tr:test_data_gtp_s3"]')).toHaveCount(0);
  await expect(page.locator('[data-sugg="drop:test_data_gtp_s3"]')).toBeVisible();
  // the packing list as a to-do today (the day before)
  await expect(page.locator(`[data-day="${day(0)}"] [data-kind="todo"]`).filter({ hasText: 'test_data_gtp_ Jura' })).toHaveCount(1);
  await expect(page.locator(`[data-day="${day(1)}"] [data-kind="away"]`).filter({ hasText: 'test_data_gtp_ Jura' })).toHaveCount(1);
});

test('Content: weather per day, the rainy long ride moves, last week, load hints and trip to-dos', async ({ page, context }, info) => {
  // the home forecast: rain on Sunday (the long ride), dry otherwise
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => {
    const days = [...Array(16).keys()].map((n) => day(n));
    return route.fulfill({ json: { daily: { time: days, temperature_2m_min: days.map(() => 6), temperature_2m_max: days.map((d, n) => 12 + n), precipitation_sum: days.map((d, n) => (n === 2 ? 12 : 0)), precipitation_probability_max: days.map((d, n) => (n === 2 ? 90 : 5)) } } });
  });
  const data = weekFixture();
  data.tables.settings.find((s) => s.key === 'training.plan').value.sessions.push({ id: 'test_data_gtp_s4', day: day(-1), kind: 'bike', name: 'test_data_gtp_ Schwellen', mins: 75, zone: 4 });
  data.tables.settings.find((s) => s.key === 'training.plan').value.sessions[0].zone = 4;
  const T = await openHome(page, context, info, { data });
  await page.goto('./#/week');
  await expect(page.locator(`[data-day="${day(2)}"] [data-wx="wet"]`)).toBeVisible();
  await expect(page.locator(`[data-day="${day(1)}"] [data-wx="dry"]`)).toBeVisible();
  // 3b last week in one line, 2a the hint on two hard days
  await expect(page.locator('[data-review]')).toContainText(T('Last week: {list}', { list: '' }).trim());
  await expect(page.locator('[data-load-hint="twoHard"]')).toBeVisible();
  // 5a the trip tomorrow: packing list, weather and bike check today
  // «Handy kürzer» (Noah 20.10.2026 «4b»): a phone shows five suggestions first; open the rest
  if (await page.locator('[data-sugg-more]').count()) await page.locator('[data-sugg-more]').click();
  for (const what of ['pack', 'wx', 'bike']) await expect(page.locator(`[data-sugg="tour:test_data_gtp_Herbstrunde:${what}"]`)).toBeVisible();
  const pack = page.locator('[data-sugg="tour:test_data_gtp_Herbstrunde:pack"]');
  await pack.getByRole('button', { name: T('Take') }).click();
  await expect(page.locator(`[data-day="${day(0)}"] [data-kind="todo"]`).filter({ hasText: T('Packing list: {trip}', { trip: 'test_data_gtp_ Herbstrunde' }) })).toHaveCount(1);
  await expect(pack).toHaveCount(0);
  // 1a the long ride on rainy Sunday moves to dry Saturday
  const wx = page.locator('[data-sugg="wx:test_data_gtp_s3"]');
  await wx.getByRole('button', { name: T('Move|week') }).click();
  await expect(page.locator(`[data-day="${day(1)}"] [data-entry="tr:test_data_gtp_s3"]`)).toHaveCount(1);
  await expect(wx).toHaveCount(0);
});
