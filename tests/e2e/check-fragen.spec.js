// «Check-Fragen selbst bearbeiten» (Noah 20.10.2026 «frage überspringen button, sehr klein und dezent … editieren
// und löschen, neue pro Gruppe erstellen, Gruppen editieren, hinzufügen, löschen»), German UI, phone 390 and
// desktop 1440, fictional data (home0460-fixture.js, Friday 9 October 2026, 09:00):
// CF1 the Morgen-Check window: «Überspringen» puts one question away, the next one moves up;
// CF2 the morning check page: «Überspringen» hides a question, «wieder zeigen» brings it back;
// CF3 Ich › Deine Abfragen › «Fragen und Bereiche bearbeiten»: change a question's text, delete it (ask + Undo,
//     «Gelöschte Fragen» brings it back), a new question in a group, a new group, rename and delete a group.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { QUESTIONS, ON_AT_START } from '../../src/lib/abfragen.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

function data(keep) {
  const d = homeFixture();
  const q = Object.fromEntries(QUESTIONS.filter((x) => ON_AT_START.has(x.id) && !keep.includes(x.id)).map((x) => [x.id, { on: false }]));
  d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q, own: [] } });
  return d;
}

test.describe('Check-Fragen selbst bearbeiten', () => {
  test('CF1: skip one question in the Morgen-Check window', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(['erholung.akku', 'spass.emoji', 'erholung.schlaf', 'sport.beine']) });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card).toHaveJSProperty('open', true);
    await expect(card.locator('.dq')).toHaveCount(3);
    const firstQ = await card.locator('.dq').first().getAttribute('data-q');
    const skip = card.locator(`[data-q="${firstQ}"] [data-ab-skip]`);
    await expect(skip).toHaveText(T('Skip|question'));
    // small and quiet: the word is smaller than the question
    const fs = await skip.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const qfs = await card.locator('.dq b').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(fs).toBeLessThan(qfs);
    await card.screenshot({ path: '/tmp/claude-0/-home-user-packgenerator/5925335f-4f29-5d9a-ab44-6982c7e2bd10/scratchpad/skip-' + info.project.name + '.png' });
    await skip.click();
    await expect(card.locator(`[data-q="${firstQ}"]`)).toHaveCount(0);
    await expect(card.locator('.dq')).toHaveCount(3); // the fourth one moved up
    await noSideways(page);
  });

  test('CF2: skip a question on the morning check page and show it again', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data([]) });
    await page.goto('./#/check/morning');
    const sleep = page.locator('[data-q="sleep"]');
    await expect(sleep).toBeVisible();
    await sleep.locator('[data-skip="sleep"]').click();
    await expect(sleep).toBeHidden();
    const back = page.locator('[data-skip-back]').first();
    await expect(back).toHaveText(T('Show {n} skipped question again', { n: 1 }));
    await page.reload();
    await expect(page.locator('[data-q="sleep"]')).toBeHidden(); // kept for the day
    await page.locator('[data-skip-back]').first().click();
    await expect(page.locator('[data-q="sleep"]')).toBeVisible();
  });

  test('CF3: edit, delete and add questions and groups', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data([...ON_AT_START]) });
    await page.goto('./#/me/abfragen');
    await expect(page.getByText('10 Bereiche · 104 Fragen · 35 an')).toBeVisible();
    await page.locator('[data-ab-edit]').click();
    await expect(page.locator('[data-area-row]')).toHaveCount(11);
    await page.screenshot({ path: '/tmp/claude-0/-home-user-packgenerator/5925335f-4f29-5d9a-ab44-6982c7e2bd10/scratchpad/edit-' + info.project.name + '.png', fullPage: false });
    const erholung = page.locator('[data-area="erholung"]');
    // change the text of a question of the list
    await erholung.locator('[data-q="erholung.akku"] [data-q-edit]').click();
    let sheet = page.getByRole('dialog', { name: T('Change question') });
    await sheet.locator('[data-own-name]').fill('Wie voll ist dein Tank?');
    await sheet.locator('[data-own-save]').click();
    await expect(erholung.locator('[data-q="erholung.akku"]')).toContainText('Wie voll ist dein Tank?');
    // delete it: ask, then Undo; delete again and bring it back from «Gelöschte Fragen»
    await erholung.locator('[data-q="erholung.akku"] [data-q-delete]').click();
    await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
    await expect(erholung.locator('[data-q="erholung.akku"]')).toHaveCount(0);
    await expect(page.getByText('10 Bereiche · 103 Fragen')).toBeVisible();
    await page.locator('[data-ab-gone] summary').click();
    await page.locator('[data-q-restore="erholung.akku"]').click();
    await expect(erholung.locator('[data-q="erholung.akku"]')).toHaveCount(1);
    // a new question in a group
    await page.locator('[data-q-add="natur"]').click();
    sheet = page.getByRole('dialog', { name: T('Create your own question') });
    await sheet.locator('[data-own-name]').fill('Barfuss gelaufen?');
    await sheet.locator('[data-own-kind="yesno"]').click();
    await sheet.locator('[data-own-save]').click();
    await expect(page.locator('[data-area="natur"]')).toContainText('Barfuss gelaufen?');
    // a new group, renamed, then deleted: its question goes to «Eigene»
    await page.locator('[data-area-new]').fill('Arbeit');
    await page.locator('[data-area-add]').click();
    await expect(page.locator('[data-area-row]')).toHaveCount(12);
    const row = page.locator('[data-area-row]').filter({ hasText: 'Arbeit' });
    await row.locator('[data-area-rename]').click();
    const rn = page.getByRole('dialog', { name: T('Rename group|questions') });
    await rn.getByRole('textbox').fill('Büro');
    await rn.getByRole('button', { name: T('Save') }).click();
    await expect(page.locator('[data-area-row]').filter({ hasText: 'Büro' })).toHaveCount(1);
    // delete the group «Spass»: its 10 questions go to «Eigene», none is deleted
    await page.locator('[data-area-row="spass"] [data-area-delete]').click();
    const del = page.getByRole('dialog', { name: /Spass/ });
    await del.getByRole('button', { name: T('Delete') }).click();
    await expect(page.locator('[data-area="spass"]')).toHaveCount(0);
    await expect(page.locator('[data-area="eigene"] [data-q]')).toHaveCount(10);
    await expect(page.getByText(/· 105 Fragen ·/)).toBeVisible();
    await page.locator('[data-area="eigene"]').screenshot({ path: '/tmp/claude-0/-home-user-packgenerator/5925335f-4f29-5d9a-ab44-6982c7e2bd10/scratchpad/eigene-' + info.project.name + '.png' });
    await noSideways(page);
    await page.reload();
    await expect(page.locator('[data-area="spass"]')).toHaveCount(0);
  });

  test('CF4: Fitbit fills in the resting pulse and the movement; the check page shows the night (0.171)', async ({ page, context }, info) => {
    const d = data(['koerper.ruhepuls', 'sport.bewegung']);
    d.tables.healthDays = [
      { date: day(-1), restingHr: 54, sleep: { asleepMin: 400 }, steps: 13100, azm: 41, src: 'google' },
      { date: day(0), restingHr: 52.4, sleep: { asleepMin: 432 }, steps: 2100, hrvMs: 48, azm: 3, src: 'google' },
    ];
    const T = await openHome(page, context, info, { data: d });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card).toHaveJSProperty('open', true);
    // no «Fitbit · später» any more
    await expect(card.getByText(T('Fitbit · later'))).toHaveCount(0);
    const rhr = card.locator('[data-q="koerper.ruhepuls"]');
    await expect(rhr.getByRole('textbox')).toHaveValue('52');
    await expect(rhr.locator('[data-fitbit="rhr"]')).toContainText(T('Fitbit: resting pulse {v}', { v: 52 }));
    // yesterday evening's movement: 41 active zone minutes → mountain goat, chosen and changeable
    const move = card.locator('[data-q="sport.bewegung"]');
    await expect(move.getByRole('button', { name: T('Mountain goat'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="koerper.ruhepuls"]')).toHaveCount(0);
    // the morning check page: the night from Fitbit
    await page.goto('./#/check/morning');
    const night = page.locator('[data-night]');
    await expect(night.locator('[data-num="sleep"]')).toContainText('7 h 12 min');
    await expect(night.locator('[data-num="rhr"]')).toContainText('52');
    await expect(night.locator('[data-num="hrv"]')).toContainText('48 ms');
  });
});
