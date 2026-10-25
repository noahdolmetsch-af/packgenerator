// Paket D «Mit Freunden» (Noah 24.10.2026 «3b»): Ich › Mit Freunden. An ask goes out as a link, the friend answers
// in the app, the answer comes back as a link and is kept as their own contribution; the lending shelf goes out, a
// friend asks, you say yes and hand it over (a lending list in Material › Ausgeliehen). Fictional data only
// (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js), every outside address blocked.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const setting = (page, key) =>
  page.evaluate(async (k) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    return new Promise((r) => {
      const g = db.transaction('settings').objectStore('settings').get(k);
      g.onsuccess = () => r(g.result?.value ?? null);
    });
  }, key);
const linkOf = async (page) => {
  const url = page.locator('[data-fr-url]').last();
  await expect(url).toHaveValue(/#\/me\/freunde\/in\//);
  return url.inputValue();
};

test('Freunde fragen: pack together, the friend answers, the answer is kept with name and date', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: homeFixture() });
  await page.goto('./#/me');
  await tap(page.locator('[data-row="freunde"]'), info);
  await expect(page).toHaveURL(/#\/me\/freunde$/);
  const fr = page.locator('[data-fr-page]');
  await expect(fr.getByRole('heading', { level: 1 })).toHaveText(T('With friends'));
  for (const k of ['Ask friends', 'Lending shelf for friends', 'Share a template']) await expect(fr.getByRole('button', { name: T(k) })).toBeVisible();
  expect(await noSideways(page)).toBe(0);

  await fr.locator('[data-fr-me]').fill('test_data_gtp_ Mara');
  await fr.locator('[data-fr-me]').blur();
  await tap(fr.locator('[data-fr-topic="duties"]'), info);
  const form = fr.locator('[data-fr-ask="duties"]');
  await form.locator('[data-fr-trip]').selectOption('test_data_gtp_Herbstrunde');
  await expect(form.locator('[data-fr-line]')).toHaveCount(6);
  const first = (await form.locator('[data-fr-line] .fr-tx').first().textContent()).trim();
  await tap(form.locator('[data-fr-make]'), info);
  const ask = await linkOf(page);
  expect(await noSideways(page)).toBe(0);

  // the friend opens the link: answers, ticks the first thing, makes the answer
  await page.goto(ask);
  const an = page.locator('[data-fr-answer="duties"]');
  await expect(an).toContainText(T('{name} asks you', { name: 'test_data_gtp_ Mara' }));
  await tap(an.getByRole('checkbox', { name: first }), info);
  await an.locator('[data-fr-name]').fill('test_data_gtp_ Jo');
  await tap(an.locator('[data-fr-reply]'), info);
  const reply = await linkOf(page);
  expect(await noSideways(page)).toBe(0);

  // back with the asker: the answer shows first, then it is kept
  await page.goto(reply);
  const box = page.locator('[data-fr-in="reply"]');
  await expect(box).toContainText(T('Answer from {name}', { name: 'test_data_gtp_ Jo' }));
  await tap(box.locator('[data-fr-keep]'), info);
  await expect(box).toHaveCount(0);
  const group = page.locator('[data-fr-group="duties"]');
  await expect(group).toContainText(`✓ ${first}`);
  await expect(group).toContainText('test_data_gtp_ Jo');
  const notes = await setting(page, 'friendNotes');
  expect(notes.map((n) => [n.kind, n.by, n.topic])).toEqual([['reply', 'test_data_gtp_ Jo', 'duties']]);
  // opened twice: kept once
  await page.goto(reply);
  await expect(page.locator('[data-fr-in="reply"]')).toContainText(T('Already kept.'));
  expect(errors).toEqual([]);
});

test('Leihregal: send the shelf, a friend asks, say yes and hand it over', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  const thing = data.tables.items.find((i) => i.ownership !== 'gone' && i.name);
  await openHome(page, context, info, { data });
  await page.goto('./#/me/freunde?tab=shelf');
  const fr = page.locator('[data-fr-page]');
  await fr.locator('[data-fr-me]').fill('test_data_gtp_ Mara');
  await fr.locator('[data-fr-me]').blur();
  await fr.locator('[data-fr-shelf-q]').fill(thing.nameDe ?? thing.name);
  await tap(fr.locator('[data-fr-shelf] .fr-check input').first(), info);
  await expect(fr.locator('[data-fr-shelf-row]')).toHaveCount(1);
  await tap(fr.locator('[data-fr-sendshelf]'), info);
  const shelf = await linkOf(page);
  expect(await noSideways(page)).toBe(0);

  await page.goto(shelf);
  const sh = page.locator('[data-fr-in="shelf"]');
  await expect(sh.locator('[data-fr-shelf-item]')).toHaveCount(1);
  await tap(sh.locator('[data-fr-shelf-item]').getByRole('button', { name: T('borrow') }), info);
  await sh.locator('[data-fr-name]').fill('test_data_gtp_ Kim');
  await tap(sh.locator('[data-fr-request]'), info);
  const req = await linkOf(page);

  await page.goto(req);
  const rq = page.locator('[data-fr-in="request"]');
  await expect(rq).toContainText(T('{name} would like something from your shelf', { name: 'test_data_gtp_ Kim' }));
  await tap(rq.locator('[data-fr-keep]'), info);
  const card = page.locator('[data-fr-request="new"]');
  await tap(card.getByRole('button', { name: T('Say yes') }), info);
  await tap(page.locator('[data-fr-request="promised"]').getByRole('button', { name: T('Handed over') }), info);
  await expect(page.locator('[data-fr-request]')).toHaveCount(0);
  const lends = await setting(page, 'lends');
  expect(lends.map((l) => [l.person, l.items.map((x) => x.itemId)])).toEqual([['test_data_gtp_ Kim', [thing.id]]]);
  const notes = await setting(page, 'friendNotes');
  expect(notes[0].log.map((x) => x.s)).toEqual(['new', 'promised', 'handed']);

  // shared gear: who has it when
  await tap(fr.getByRole('button', { name: T('Lending shelf for friends') }), info);
  await tap(fr.locator('[data-fr-addgear]'), info);
  await fr.locator('[data-fr-gear-who]').fill('test_data_gtp_ Jo');
  await fr.locator('[data-fr-gear] select').first().selectOption(thing.id);
  await tap(fr.locator('[data-fr-gear]').getByRole('button', { name: T('Save') }), info);
  await expect(fr.locator('[data-fr-gear-row]')).toContainText('test_data_gtp_ Jo');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
