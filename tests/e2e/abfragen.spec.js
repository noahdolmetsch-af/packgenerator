// AB «Deine Abfragen» (Noah 14.10.2026 «freigabe», mockups design/deine-abfragen AB1–AB5), German UI,
// phone 390 and desktop 1440, fictional data (home0460-fixture.js; the clock on Friday 9 October 2026, 09:00):
// AB1/AB5 Ich › Deine Abfragen: 54 questions in 10 areas (Paket P: 4 evening questions), 35 on, Erholung open with its 6 questions, a
//         switch, an interval chosen in its window, «Alle aufklappen»;
// AB2     «Eigene Frage anlegen»: Kaffee, number with «Tassen», twice a day; it shows under «Eigene»;
// AB3     the card on Heute with what is due (a battery 1–10, the weight with «zuletzt»), «Speichern» and
//         «Jetzt nicht»; since Noah 19.10.2026 its own window (Morgen-Check) with «Später» and «Heute nicht»;
// AB4     Ich › Daten › Verlauf: the answers and an old daily check, filter by area and source, change an answer.
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, D0, day } from './home0460-fixture.js';
import { QUESTIONS, ON_AT_START } from '../../src/lib/abfragen.js';

const SHOTS = '/tmp/claude-0/sn-shots/ab';
const shot = async (page, info, name, fullPage = true) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const KEEP = ['erholung.akku', 'koerper.waage', 'spass.emoji'];
/** The fixture with «Deine Abfragen» started yesterday at 19:00, only three questions on, an old daily check and a weight. */
function data({ keep = KEEP } = {}) {
  const d = homeFixture();
  const q = Object.fromEntries(QUESTIONS.filter((x) => ON_AT_START.has(x.id) && !keep.includes(x.id)).map((x) => [x.id, { on: false }]));
  d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q, own: [] } });
  d.tables.flowChecks = [{ day: day(-1), sleep: 6, energy: 5, mood: 7, q: 'food', extra: 8 }];
  d.tables.abAnswers = [{ id: 'test_data_gtp_w1', qid: 'koerper.waage', area: 'koerper', day: day(-7), at: `${day(-7)}T08:10`, slot: `${day(-7)}T08:00`, kind: 'number', value: 72.4, note: null, unit: 'kg', src: 'hand' }];
  return d;
}

test.describe('AB Deine Abfragen', () => {
  test('AB3: the card on Heute, answer, save, not now', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data() });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card).toBeVisible();
    // Noah 19.10.2026 (changed on purpose): Heute no longer starts with the questions; they come as a window
    await expect(card.getByRole('heading', { name: T('Morning check') })).toBeVisible();
    await expect(card).toHaveJSProperty('open', true);
    await expect(card.getByText(T('{n} due now', { n: 3 }))).toBeVisible();
    // the battery 1–10 and the weight with the last value
    const akku = card.locator('[data-q="erholung.akku"]');
    await expect(akku.getByText(T('How full is your battery right now?'))).toBeVisible();
    // Noah 2a: missed yesterday evening, it stays and says when (WG: its 20:00 is asked in the evening round at 20:30)
    await expect(akku.getByText(/Erholung · Do\., 8\. Okt\. 20:30/)).toBeVisible();
    const w = card.locator('[data-q="koerper.waage"]');
    await expect(w.getByText(/zuletzt 72.4 kg am/)).toBeVisible();
    await expect(w.getByText(T('not checked yet · by hand until then'))).toBeVisible();
    const save = card.locator('[data-ab-save]');
    await expect(save).toBeDisabled();
    await shot(page, info, 'AB3-abfrage-heute');
    await noSideways(page);
    await akku.getByRole('button', { name: '6', exact: true }).click();
    await expect(akku.getByText('6 von 10 · gespeichert wird die Zahl')).toBeVisible();
    await w.getByRole('textbox').fill('72.0');
    await save.click();
    await expect(card.locator('[data-q="erholung.akku"]')).toHaveCount(0);
    await expect(card.locator('[data-q="koerper.waage"]')).toHaveCount(0);
    await expect(card.getByText(T('{n} due now', { n: 1 }))).toBeVisible();
    // «Heute nicht» (was «Jetzt nicht»): the window goes until the next question time
    await card.locator('[data-ab-today]').click();
    await expect(card).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-section="greeting"]')).toBeVisible();
    await expect(page.locator('[data-section="abfragen"]')).toHaveCount(0);
    // the answers are in the history, the weight also as the body weight
    const kg = await page.evaluate(() => new Promise((res) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => {
        const g = r.result.transaction('settings').objectStore('settings').get('riderWeightG');
        g.onsuccess = () => res(g.result?.value ?? null);
      };
    }));
    expect(kg).toBe(72000);
    await page.goto('./#/me/history');
    await expect(page.locator('[data-row="erholung.akku"]').first()).toContainText('6');
  });

  test('AB1/AB5 and AB2: the questions by area, a switch, an interval, an own question', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data({ keep: [...ON_AT_START] }) });
    await viaTab(page, 'active', '#/me/abfragen'); // UI-Ziele #6: Auswerten › Wi gaht's?
    await expect(page).toHaveURL(/#\/me\/abfragen$/);
    await expect(page.getByRole('heading', { level: 1, name: T('Your questions') })).toBeVisible();
    // Impeccable Runde 2 (on purpose): the head says how often a day the app asks
    await expect(page.locator('.vhead .vsub')).toHaveText(/^35 Fragen an · etwa [0-9]+ Mal pro Tag gefragt, in 2 Runden [(]07:00 und 20:30[)]/);
    await expect(page.getByText('10 Bereiche · 54 Fragen · 35 an')).toBeVisible();
    const areas = page.locator('[data-area]');
    await expect(areas).toHaveCount(11); // 10 areas and «Eigene»
    const erholung = page.locator('[data-area="erholung"]');
    await expect(erholung.locator('[data-q]')).toHaveCount(6);
    // Impeccable Runde 2 (on purpose): «bisher: …» only in the interval sheet of the question
    await expect(erholung.getByText('bisher: Wie viel Energie hast du?')).toHaveCount(0);
    await expect(page.locator('[data-area="spass"]').getByText('5 Fragen · 4 an')).toBeVisible();
    await expect(erholung.locator('[data-q="erholung.akku"]').getByRole('button', { name: /3× täglich · 8:00, 13:00, 20:00/ })).toBeVisible();
    await shot(page, info, 'AB5-fragen-bereiche');
    await noSideways(page);
    // a switch: «Sofa oder Sattel» on → 36 on
    const sofa = erholung.locator('[data-q="erholung.sofa"]');
    await sofa.getByRole('switch').check();
    await expect(page.getByText('10 Bereiche · 54 Fragen · 36 an')).toBeVisible();
    // the interval of «Akku»: twice a day
    await erholung.locator('[data-q="erholung.akku"]').getByRole('button', { name: /täglich/ }).click();
    const sheet = page.getByRole('dialog', { name: T('How often to ask?') });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('bisher: Wie viel Energie hast du?')).toBeVisible();
    await sheet.getByRole('button', { name: '13:00 entfernen' }).click();
    await sheet.locator('[data-iv-save]').click();
    await expect(erholung.locator('[data-q="erholung.akku"]').getByRole('button', { name: /2× täglich · 8:00, 20:00/ })).toBeVisible();
    // «Alle aufklappen»
    await page.getByRole('button', { name: T('Expand all') }).click();
    await expect(page.locator('[data-q]')).toHaveCount(54);

    // AB2: an own question
    await page.locator('[data-own-add]').click();
    const own = page.getByRole('dialog', { name: T('Create your own question') });
    await expect(own).toBeVisible();
    await own.locator('[data-own-name]').fill('Kaffee');
    await own.locator('[data-own-kind="number"]').click();
    await own.locator('[data-own-unit]').fill('Tassen');
    await own.getByRole('button', { name: T('Several times a day') }).click();
    await expect(own.getByText(T('How Today asks'))).toBeVisible();
    await shot(page, info, 'AB2-eigene-frage', false);
    await own.locator('[data-own-save]').click();
    await expect(own).toHaveCount(0);
    const mine = page.locator('[data-area="eigene"]');
    await expect(mine.locator('[data-q] b').getByText('Kaffee')).toBeVisible();
    await expect(mine.getByText('Tassen')).toBeVisible();
    await expect(page.getByText('10 Bereiche · 55 Fragen · 37 an')).toBeVisible();
    // and away again
    await mine.getByRole('button', { name: /Kaffee/ }).click();
    await page.getByRole('dialog').locator('[data-own-delete]').click();
    await expect(mine.getByText('Kaffee')).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('10 Bereiche · 54 Fragen · 36 an')).toBeVisible();
  });

  test('AB4: the history with an old daily check, filters, change an answer', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data() });
    await page.goto('./#/me/history');
    await expect(page.getByRole('heading', { level: 1, name: T('History') })).toBeVisible();
    // the old daily check of yesterday stays readable, with its four answers
    const old = page.locator('[data-row="erholung.schlaf"]');
    await expect(old).toHaveCount(1);
    await expect(old.getByText(T('from the daily check'))).toBeVisible();
    await expect(page.locator('[data-row="koerper.essen"]')).toContainText('8');
    await expect(page.locator('[data-row="koerper.waage"]')).toContainText('72.4 kg');
    await shot(page, info, 'AB4-verlauf-daten');
    await noSideways(page);
    // filter by area and by source
    await page.getByRole('group', { name: T('Value') }).getByRole('button', { name: 'Körper und Werte' }).click();
    await expect(page.locator('[data-row]')).toHaveCount(2); // the weight and «Essen»
    await page.getByRole('button', { name: 'Fitbit', exact: true }).click();
    await expect(page.locator('[data-row]')).toHaveCount(0);
    await expect(page.getByText(T('Nothing from Fitbit yet: the values come with the connection to Fitbit, later.'))).toBeVisible();
    await page.getByRole('group', { name: T('Source') }).getByRole('button', { name: 'Alle' }).click();
    // change the old «Schlaf»: an answer of the same day in front of it
    await page.getByRole('group', { name: T('Value') }).getByRole('button', { name: 'Alle' }).click();
    await page.locator('[data-row="erholung.schlaf"]').getByRole('button', { name: /ändern/ }).click();
    const dlg = page.getByRole('dialog', { name: T('Change the answer') });
    await dlg.getByRole('button', { name: '8', exact: true }).click();
    await dlg.locator('[data-edit-save]').click();
    await expect(page.locator('[data-row="erholung.schlaf"]')).toHaveCount(1);
    await expect(page.locator('[data-row="erholung.schlaf"]').getByText(T('from the daily check'))).toHaveCount(0);
    await expect(page.locator('[data-row="erholung.schlaf"]')).toContainText('8');
    expect(D0).toBe('2026-10-09');
  });

  test('AB6: the analysis under Ich Daten Auswertung and on Deine Abfragen (Noah 4ab)', async ({ page, context }, info) => {
    const d = data();
    // fictional answers of the last days: battery and satisfaction
    for (let n = 1; n <= 8; n++) {
      d.tables.abAnswers.push({ id: `test_data_gtp_a${n}`, qid: 'erholung.akku', area: 'erholung', day: day(-n), at: `${day(-n)}T13:00`, slot: null, kind: 'scale', value: 4 + (n % 4), note: null, unit: null, src: 'hand' });
    }
    const T = await openHome(page, context, info, { data: d });
    await page.goto('./#/me/analysis');
    await expect(page.getByRole('heading', { level: 1, name: T('How it is analysed') })).toBeVisible();
    for (const h of ['History and your own normal', 'With and without', 'Felt next to measured', 'Your week by area', 'An observation', 'Where the values come from']) {
      await expect(page.getByRole('heading', { level: 2, name: T(h) })).toBeVisible();
    }
    await expect(page.getByRole('img', { name: /die letzten 30 Tage mit deinem Normal/ })).toBeVisible();
    await expect(page.locator('[data-area-value]')).toHaveCount(10);
    await expect(page.getByText(T('Everything stays on the device and is in the backup. Nothing goes to a service.'))).toBeVisible();
    await shot(page, info, 'AB6-auswertung');
    await noSideways(page);
    await page.goto('./#/me/abfragen');
    const part = page.locator('[data-analysis]');
    await expect(part.getByRole('heading', { name: T('History and your own normal') })).toBeVisible();
    await part.getByRole('link', { name: T('The whole analysis') }).click();
    await expect(page).toHaveURL(/#\/me\/analysis$/);
  });
});
