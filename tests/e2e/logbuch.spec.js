// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe», Schritt L1): Ich › Verbesserungs-Logbuch.
// Fictional entries only; German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/logbuch');
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

async function write(page, info, { art, text, urgent = '', pageText = '', block = '' }) {
  const sheet = page.locator('[data-logbuch-sheet]');
  await expect(sheet).toBeVisible();
  await press(sheet.locator(`[data-art="${art}"]`), info);
  await sheet.locator('[data-lb-text]').fill(text);
  if (urgent) await press(sheet.locator(`[data-urgent="${urgent}"]`), info);
  if (pageText) await sheet.locator('[data-lb-page]').fill(pageText);
  if (block) await sheet.locator('[data-lb-block]').fill(block);
  await press(sheet.locator('[data-lb-save]'), info);
  await expect(sheet).toBeHidden();
}

test('Logbuch: empty state, write, filter, done, change, delete and Undo, stays after a reload', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-logbuch]');
  await expect(pg.locator('h1')).toHaveText(T('Improvement log'));
  await expect(pg.locator('[data-empty]')).toContainText(T('Nothing written down yet'));
  await shot(page, info, 'logbuch-leer');

  // the first entry from the empty state: a small thing («Text ändern»)
  await press(pg.locator('[data-empty] .btn.hi'), info);
  await write(page, info, { art: 'text', text: 'Statt «4 Blöcke à 12 min» soll «4 × 12 min» stehen.', pageText: '#/flow/training', block: 'Woche 47' });
  const first = pg.locator('[data-lb-entry][data-art="text"]');
  await expect(first).toContainText('Woche 47');
  await expect(first).toContainText('4 × 12 min');
  await expect(first.locator('[data-lb-state]')).toHaveText(T('Open|logbuch'));

  // an error that bothers right now, and a note «Gut so»
  await press(pg.locator('[data-lb-new]'), info);
  await write(page, info, { art: 'fehler', text: 'Springt nach dem Speichern nach oben.', urgent: 'now', pageText: '#/flow/training', block: 'Letzte Wochen' });
  await press(pg.locator('[data-lb-new]'), info);
  await write(page, info, { art: 'gutso', text: 'Das Abhaken von Yoga ist perfekt, bitte nicht ändern.' });
  await expect(pg.locator('[data-lb-entry]')).toHaveCount(3);
  await expect(pg.locator('[data-lb-now]')).toHaveCount(1);
  // the urgent error stands first; the note is already «Notiert»
  await expect(pg.locator('[data-lb-entry]').first()).toHaveAttribute('data-art', 'fehler');
  await expect(pg.locator('[data-lb-entry][data-art="gutso"] [data-lb-state]')).toHaveText(T('Noted|logbuch'));
  await shot(page, info, 'logbuch-liste');

  // filter by group
  await press(pg.locator('[data-lb-group="wrong"]'), info);
  await expect(pg.locator('[data-lb-entry]')).toHaveCount(1);
  await press(pg.locator('[data-lb-group="all"]'), info);
  await expect(pg.locator('[data-lb-entry]')).toHaveCount(3);

  // done with one tap, and open again
  await press(first.locator('[data-lb-done]'), info);
  await expect(first.locator('[data-lb-state]')).toHaveText(T('Done|logbuch'));
  await press(first.locator('[data-lb-done]'), info);
  await expect(first.locator('[data-lb-state]')).toHaveText(T('Open|logbuch'));

  // change: the kind to «Anordnung» (needs a picture first)
  await press(first.locator('[data-lb-edit]'), info);
  const sheet = page.locator('[data-logbuch-sheet]');
  await press(sheet.locator('[data-art="anordnung"]'), info);
  await expect(sheet.locator('[data-lb-route]')).toContainText(T('First a picture of how it could look, then the change.'));
  await shot(page, info, 'logbuch-fenster');
  await press(sheet.locator('[data-lb-save]'), info);
  await expect(pg.locator('[data-lb-entry][data-art="anordnung"]')).toHaveCount(1);

  // it stays after a reload
  await page.reload();
  await ready(page);
  await expect(pg.locator('[data-lb-entry]')).toHaveCount(3);

  // delete asks first, then Undo brings it back
  const note = pg.locator('[data-lb-entry][data-art="gutso"]');
  await press(note.locator('[data-lb-edit]'), info);
  await press(page.locator('[data-logbuch-sheet] [data-lb-remove]'), info);
  await press(page.locator('[data-testid="ask-delete"] .btn.del'), info);
  await expect(pg.locator('[data-lb-entry]')).toHaveCount(2);
  await press(page.locator('.undo'), info);
  await expect(pg.locator('[data-lb-entry]')).toHaveCount(3);

  expect(errors).toEqual([]);
});

test('Logbuch: a row on Ich leads to it and the page sits under Ich', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me');
  await ready(page);
  await page.locator('[data-row="logbuch"]').scrollIntoViewIfNeeded();
  await shot(page, info, 'ich-zeile');
  await press(page.locator('[data-row="logbuch"]'), info);
  await expect(page.locator('[data-logbuch]')).toBeVisible();
  await expect(page).toHaveURL(/#\/me\/logbuch/);
});

test('Logbuch: the closed line «What you can do here» opens the help', async ({ page, context }, info) => {
  await open(page, context);
  await page.goto('./#/me/logbuch');
  await ready(page);
  const line = page.locator('[data-seiteninhalt-line]');
  await expect(line).toBeVisible();
  await press(line, info);
  await expect(page.locator('[data-logbuch-help], dialog[open]').first()).toBeVisible();
});

test('Logbuch: rename and order the kinds, Undo, back to standard, the entries follow (L5 step 1)', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-logbuch]');
  await press(pg.locator('[data-empty] .btn.hi'), info);
  await write(page, info, { art: 'fehler', text: 'Die Zahl im Kopf springt beim Laden.', pageText: '#/flow/training' });

  // the window from the card at the bottom
  await press(pg.locator('[data-lb-kinds]'), info);
  const win = page.locator('[data-kinds-sheet]');
  await expect(win).toBeVisible();
  await expect(win.locator('[data-kd-group]')).toHaveCount(4);
  await expect(win.locator('[data-kd-art]')).toHaveCount(13);
  await expect(win.locator('[data-kinds-reset]')).toBeDisabled();
  await expect(win.locator('[data-kd-art="fehler"]')).toContainText('1');
  if (SHOTS) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/arten-fenster-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }

  // rename a kind in the «⋯» menu
  await press(win.locator('[data-kd-art="fehler"] [data-row-menu]'), info);
  await press(page.locator('[data-menu="rename"]'), info);
  const field = page.locator('dialog[open] input').last();
  await field.fill('Kaputt');
  await field.press('Enter');
  await expect(win.locator('[data-kd-art="fehler"]')).toContainText('Kaputt');
  await expect(win.locator('[data-kinds-reset]')).toBeEnabled();
  // Undo inside the window
  await press(win.locator('[data-kinds-undo] button'), info);
  await expect(win.locator('[data-kd-art="fehler"]')).not.toContainText('Kaputt');

  // rename a group and move a kind one place down with the arrow
  await press(win.locator('[data-kd-group="wrong"] .kd-head [data-row-menu]'), info);
  await press(page.locator('[data-menu="rename"]'), info);
  const f2 = page.locator('dialog[open] input').last();
  await f2.fill('Schlecht');
  await f2.press('Enter');
  await expect(win.locator('[data-kd-group="wrong"] .kd-head')).toContainText('Schlecht');
  const first = win.locator('[data-kd-group="wrong"] [data-kd-art]').first();
  await expect(first).toHaveAttribute('data-kd-art', 'fehler');
  await press(first.locator('.sort-ar').nth(1), info);
  await expect(win.locator('[data-kd-group="wrong"] [data-kd-art]').first()).toHaveAttribute('data-kd-art', 'zahl');
  if (SHOTS) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/arten-umbenannt-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(win.locator('.vd-x'), info);
  await expect(win).toBeHidden();

  // the list, the filter and the entry follow; it stays after a reload
  await expect(pg.locator('[data-lb-group="wrong"]')).toContainText('Schlecht');
  await expect(pg.locator('[data-lb-entry][data-art="fehler"] .pill').first()).toContainText(T('Error|logbuch'));
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-lb-group="wrong"]')).toContainText('Schlecht');

  // back to standard
  await press(page.locator('[data-lb-kinds]'), info);
  await press(page.locator('[data-kinds-reset]'), info);
  await expect(page.locator('[data-kinds-reset]')).toBeDisabled();
  await press(page.locator('[data-kinds-sheet] .vd-x'), info);
  await expect(page.locator('[data-lb-group="wrong"]')).toContainText(T('Wrong'));
  expect(errors).toEqual([]);
});

test('Logbuch: delete a kind and a group, the question comes first, entries and kinds stay, Undo (L5 step 2)', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-logbuch]');
  await press(pg.locator('[data-empty] .btn.hi'), info);
  await write(page, info, { art: 'zahl', text: 'In der Wochensumme steht 9 statt 8.', pageText: '#/week' });
  await press(pg.locator('[data-lb-kinds]'), info);
  const win = page.locator('[data-kinds-sheet]');
  await expect(win).toBeVisible();

  // delete a kind: the window asks where its entry goes, «Ohne Art» is chosen
  await press(win.locator('[data-kd-art="zahl"] [data-row-menu]'), info);
  await press(page.locator('[data-menu="delete"]').last(), info);
  const ask = page.locator('dialog.gds[open]');
  await expect(ask).toBeVisible();
  await expect(ask).toContainText(T('No kind'));
  await expect(ask.locator('input[type="radio"]').first()).toBeChecked();
  if (SHOTS) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/arten-loeschen-frage-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(ask.locator('.btn.del'), info);
  await expect(win.locator('[data-kd-art="zahl"]')).toHaveCount(0);
  await expect(win.locator('[data-kd-art]')).toHaveCount(12);
  await expect(win.locator('[data-kinds-undo]')).toContainText('«Zahl falsch»');
  // Undo brings the kind back
  await press(win.locator('[data-kinds-undo] button'), info);
  await expect(win.locator('[data-kd-art="zahl"]')).toHaveCount(1);

  // delete the kind again, then the group «Falsch» with all its kinds: they go to «Ohne Gruppe»
  await press(win.locator('[data-kd-art="zahl"] [data-row-menu]'), info);
  await press(page.locator('[data-menu="delete"]').last(), info);
  await press(page.locator('dialog.gds[open] .btn.del'), info);
  await press(win.locator('[data-kd-group="wrong"] .kd-head [data-row-menu]'), info);
  await press(page.locator('[data-menu="delete"]').last(), info);
  const gask = page.locator('dialog.gds[open]');
  await expect(gask).toContainText(T('No group'));
  await press(gask.locator('.btn.del'), info);
  await expect(win.locator('[data-kd-group="wrong"]')).toHaveCount(0);
  await expect(win.locator('[data-kd-group="ohne"] [data-kd-art]')).toHaveCount(2); // Fehler, Zu langsam (Zahl falsch is gone)
  await expect(win.locator('[data-kd-group="ohne"] .kd-head [data-row-menu]')).toBeVisible();
  if (SHOTS) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/arten-geloescht-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(win.locator('.vd-x'), info);

  // the entry has no kind any more and can still be changed; the filter has the new group
  const entry = pg.locator('[data-lb-entry]').first();
  await expect(entry.locator('.pill').first()).toContainText(T('No kind'));
  await expect(pg.locator('[data-lb-group="ohne"]')).toContainText(T('No group'));
  await press(entry.locator('[data-lb-edit]'), info);
  const sheet = page.locator('[data-logbuch-sheet]');
  await sheet.locator('[data-lb-text]').fill('In der Wochensumme steht 9 statt 8 (geprüft).');
  await press(sheet.locator('[data-lb-save]'), info);
  await expect(sheet).toBeHidden();
  await expect(entry).toContainText('geprüft');
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-lb-entry]').first().locator('.pill').first()).toContainText(T('No kind'));
  expect(errors).toEqual([]);
});

test('Logbuch: make a new kind and a new group, change the way, back to standard keeps the entries (L5 step 3)', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-logbuch]');
  await press(pg.locator('[data-empty] .btn.hi'), info);
  await write(page, info, { art: 'idee', text: 'Platzhalter, damit die Liste nicht leer ist.', pageText: '#/week' });
  await press(pg.locator('[data-lb-kinds]'), info);
  const win = page.locator('[data-kinds-sheet]');

  // a new group, then a new kind in it, the way is chosen (standard: first a picture)
  await press(win.locator('[data-kd-add-group]'), info);
  const ng = page.locator('[data-new-kind-sheet="group"]');
  await ng.locator('[data-new-kind-name]').fill('Privat');
  await press(ng.locator('[data-new-kind-save]'), info);
  const grp = win.locator('[data-kd-group^="g-privat"]');
  await expect(grp).toContainText('Privat');
  await expect(grp).toContainText(T('No kind in this group yet.'));
  await press(grp.locator('[data-kd-add]'), info);
  const nk = page.locator('[data-new-kind-sheet="kind"]');
  await expect(nk.locator('[data-way="draft"]')).toBeChecked();
  await nk.locator('[data-new-kind-name]').fill('Zu laut');
  await press(nk.locator('[data-way="direct"]'), info);
  if (SHOTS) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/neue-art-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(nk.locator('[data-new-kind-save]'), info);
  await expect(grp.locator('[data-kd-art]')).toHaveCount(1);
  await expect(grp.locator('[data-kd-art]')).toContainText('Zu laut');
  if (SHOTS) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/arten-neu-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(win.locator('.vd-x'), info);

  // the kind is in the window «New entry» and the entry has its name
  await press(pg.locator('[data-lb-new]'), info);
  const key = await page.locator('[data-logbuch-sheet] [data-art^="k-zu-laut"]').getAttribute('data-art');
  await write(page, info, { art: key, text: 'Der Lüfter ist zu laut.', pageText: '#/gear' });
  const mine = pg.locator('[data-lb-entry][data-art^="k-zu-laut"]');
  await expect(mine.locator('.pill').first()).toContainText('Zu laut');
  await expect(mine.locator('[data-lb-state]')).toHaveText(T('Open|logbuch'));
  await expect(pg.locator('[data-lb-group^="g-privat"]')).toContainText('Privat');

  // change the way to «only a note»: the entry follows
  await press(pg.locator('[data-lb-kinds]'), info);
  await press(win.locator('[data-kd-art^="k-zu-laut"] [data-row-menu]'), info);
  await press(page.locator('[data-menu="way"]'), info);
  const way = page.locator('[data-new-kind-sheet="way"]');
  await expect(way.locator('[data-way="direct"]')).toBeChecked();
  await press(way.locator('[data-way="note"]'), info);
  await press(way.locator('[data-new-kind-save]'), info);
  await expect(win.locator('[data-kinds-undo]')).toContainText('Zu laut');
  await press(win.locator('.vd-x'), info);
  await expect(mine.locator('[data-lb-state]')).toHaveText(T('Noted|logbuch'));

  // back to standard: the new kind and group go, the entry stays without a kind; Undo brings it all back
  await press(pg.locator('[data-lb-kinds]'), info);
  await press(win.locator('[data-kinds-reset]'), info);
  await expect(win.locator('[data-kd-group^="g-privat"]')).toHaveCount(0);
  await expect(win.locator('[data-kd-art]')).toHaveCount(13);
  await press(win.locator('[data-kinds-undo] button'), info); // Undo brings the new group, the kind and the entry back
  await expect(win.locator('[data-kd-art^="k-zu-laut"]')).toHaveCount(1);
  await press(win.locator('[data-kinds-reset]'), info);
  await press(win.locator('.vd-x'), info);
  await expect(pg.locator('[data-lb-entry]', { hasText: 'Lüfter' }).locator('.pill').first()).toContainText(T('No kind'));
  await expect(pg.locator('[data-lb-group^="g-privat"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
