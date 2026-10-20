// Hobby pages 2 + 3, since v0.86.0 «Meditation einfach» (mockups A–E, Noah «1-5 a» 11.10.2026): on a
// phone and a computer, in German, with a fixed clock (page.clock).
// 1. Aktiv › «Heute abhaken»: a tap on Meditation opens the start sheet (A) → «andere» 1 minute → «Jetzt
//    1 Min» starts the calm clock (D: no «Beenden» on top, the settings behind «Einstellungen ›») → the end
//    gong → saved (flowLog + flowSessions) → after the gong (E): a sentence, depth 4, «mehr erfassen» →
//    mood and «Als Nächstes» with a calendar file → «Fertig» saves → the short page (B: «Wie letztes Mal»,
//    the rows) → «Mehr» (C: all folded; a sound with «anhören»; the milestone counts up) → the log (list,
//    filters, calendar, chart) → the session → «Wieder so starten».
// 2. The short page with a fresh database is at most ~2 phone screens; «+ neue» opens the intervals (a mark
//    set on the dial and taken away, a 1-minute template); a session from «Mehr › Arten» is paused, ended
//    early and saved; «Fertig» with nothing entered only closes; save as template, delete, «Rückgängig».
// 3. The start sheet: the chips change the minutes, «Nur abhaken» ticks with «Rückgängig», «Zur
//    Meditations-Seite» opens the page.
// 4. v0.93.0 «Meditation Wünsche» (mockup F): «Neue Sitzung»: the stars on top (→ «Alle Sterne»), the
//    durations 10–60 and «oder frei», «eigene · alle N» and «an Minute», an old «alle 5» template, the
//    folded sounds, «Als Vorlage speichern?» with the suggested name, «nicht jetzt».
// 5. v0.93.0 (mockups G, H): the four clocks; «Sanduhr» stays after a reload, its time can be hidden.
// No sideways scroll, no page errors. Fictional data only. No data import and no dialog of the app shell,
// so of tests/e2e/settle.js only ready() is needed: the start-up tidy-up has finished before the test acts.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { SEED_TEMPLATES, MED_DURATIONS, CLOCK_VIEWS } from '../../src/lib/flowmed.js';
import { SOUNDS } from '../../src/lib/flowsounds.js';
import { ready } from './settle.js';
import { TABS } from './placetab.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:00:00+02:00'; // a Friday morning; the browser runs in Europe/Zurich
const FIRST = SEED_TEMPLATES.find((x) => x.id === 'tpl-morning20'); // never used yet: the first by name

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await ready(page); // the data tidy-up has finished (tests/e2e/settle.js)
  return errors;
}
const count = (page, table) =>
  page.evaluate(async (table) => {
    const db = await new Promise((res) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
    });
    const n = await new Promise((res) => {
      const q = db.transaction(table).objectStore(table).count();
      q.onsuccess = () => res(q.result);
    });
    db.close();
    return n;
  }, table);
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}
/** Tap the dial's ring at an angle (0° on top, clockwise). */
async function tapRing(page, deg) {
  const box = await page.locator('main .dial svg').boundingBox();
  const a = (deg * Math.PI) / 180;
  const r = (96 / 240) * box.width;
  await page.mouse.click(box.x + box.width / 2 + r * Math.sin(a), box.y + box.height / 2 - r * Math.cos(a));
}

test('Meditation einfach: start sheet → calm clock → gong → a sentence and «Fertig» → short page → Mehr → log', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  const phone = page.viewportSize().width < 720;

  // A: a tap on Meditation in «Heute abhaken» opens the start sheet, it does not tick
  await page.locator('[data-act="meditation"]').click();
  const sheet = page.locator('dialog[data-med-sheet][open]');
  await expect(sheet.getByRole('heading', { name: 'Meditation' })).toBeVisible();
  await expect(page.locator('[data-act="meditation"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(sheet.locator('[data-start="sheet"]')).toHaveText(T('Now {n} min', { n: FIRST.minutes }));
  await expect(sheet).toContainText(T('Template «{name}»', { name: FIRST.nameDe }));
  await expect(sheet.locator(`[data-min-chip="${FIRST.minutes}"]`)).toHaveAttribute('aria-pressed', 'true');
  await fits(page, 'Startblatt');
  await expect(sheet.getByRole('button', { name: T('other|duration'), exact: true })).toHaveCount(0); // v0.93.0: «oder frei» instead
  await sheet.locator('[data-min-own]').fill('1');
  await expect(sheet.locator('[data-start="sheet"]')).toHaveText(T('Now {n} min', { n: 1 }));
  await sheet.locator('[data-start="sheet"]').click();

  // D: the calm clock: the time left once, no «Beenden» on top, one «Beenden» in the control row
  const sess = page.locator('dialog.sess[open]');
  await expect(sess).toBeVisible();
  await expect(page.locator('dialog[data-med-sheet][open]')).toHaveCount(0);
  // Bewegung (Paket D): the window pops in; measure it once its opening animation has ended
  await sess.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  const box = await sess.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(page.viewportSize().width - 1);
  expect(box.height).toBeGreaterThanOrEqual(page.viewportSize().height - 1);
  await expect(sess.locator('.endtop')).toHaveCount(0);
  await expect(sess.getByRole('button', { name: T('End|session') })).toHaveCount(1);
  if (!phone) await expect(sess.getByRole('button', { name: T('Open the sidebar') })).toBeVisible();
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '60');
  await expect(sess).not.toContainText(T('{a} of {b}', { a: '0:00', b: '1:00' }));
  await expect(sess.getByText(T('During the session'))).toHaveCount(0);
  await sess.locator('[data-session-settings]').click();
  await expect(sess.getByText(T('During the session'))).toBeVisible();
  await expect(sess.getByText(T('Gong volume'))).toBeVisible();
  await page.clock.runFor(30_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '30');

  // the end gong: the session saves itself (log entry + details, the same id); rule A (Noah 14.10.2026
  // «a a», nothing jumps by itself): a message with a link to E instead of opening it
  const before = page.url();
  await page.clock.runFor(31_000);
  await expect(page.locator('dialog.sess[open]')).toHaveCount(0);
  const link = page.locator('[data-toast-link]');
  await expect(link).toHaveText(T('How was it?|med'));
  await expect(page.locator('.ftoast')).toContainText(T('Done · {n} min saved', { n: 1 }));
  expect(page.url()).toBe(before);
  await page.clock.runFor(20_000);
  await expect(link).toBeVisible(); // it stays until tapped or closed
  await link.click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/done\/fl-s-/);
  await expect(page.locator('.ftoast')).toHaveCount(0);
  await expect.poll(() => count(page, 'flowSessions')).toBe(1);
  expect(await count(page, 'flowLog')).toBe(1);

  // E: the minutes, one muted line, the sentence and the depth; the rest behind «mehr erfassen»
  await expect(main.getByRole('heading', { level: 1, name: T('{n} minute.', { n: 1 }) })).toBeVisible();
  await expect(main).toContainText(`«${FIRST.nameDe}»`);
  await expect(main.getByRole('button', { name: T('Close without a note') })).toHaveCount(0);
  await expect(main.locator('[data-mood]').first()).toBeHidden();
  await main.locator('[data-note]').fill('Am Anfang unruhig, dann still.');
  await main.locator('[data-depth="4"]').click();
  await expect(main.locator('[data-depth="4"]')).toHaveAttribute('aria-pressed', 'true');
  await main.locator('[data-more] summary').click();
  await main.locator('[data-mood="calm"]').click();
  await expect(main.locator('[data-mood="calm"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('[data-next]')).toContainText(T('tomorrow'));
  const [dl] = await Promise.all([page.waitForEvent('download'), main.locator('[data-ics]').click()]);
  expect(dl.suggestedFilename()).toBe('meditation-2026-10-10.ics');
  await fits(page, 'E Nach dem Gong');
  await expect(main.locator('[data-save-note]')).toHaveText(T('Done'));
  await main.locator('[data-save-note]').click();
  await expect(page.locator('.ftoast')).toContainText(T('Note saved'));
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);

  // B: «Wie letztes Mal · 1 Min», the other templates, the rows
  await expect(main.getByRole('heading', { level: 1, name: 'Meditation' })).toBeVisible();
  await expect(page.locator(TABS).getByRole('link', { name: 'Meditation', exact: true })).toHaveAttribute('aria-current', 'page'); // ME2: the tab Meditation in Aktiv
  await expect(main.locator('[data-start="last"]')).toContainText(T('Like last time · {n} min', { n: 1 }));
  await expect(main.locator('[data-tpl]')).toHaveCount(SEED_TEMPLATES.length - 1);
  await expect(main.locator('[data-row="week"]')).toContainText(T('{n} of 7 days', { n: 1 }));
  await expect(main.locator('[data-row="log"]')).toContainText('Am Anfang unruhig');
  await fits(page, 'B Meditation kurz');

  // C: «Mehr»: every section folded; the sound opens with «anhören»; the milestone counts up
  await main.locator('[data-to="more"]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/mehr$/);
  await expect(page.locator(TABS).getByRole('link', { name: 'Meditation', exact: true })).toHaveAttribute('aria-current', 'page'); // ME2: the tab Meditation in Aktiv
  await expect(main.locator('details[data-fold]')).toHaveCount(7);
  await expect(main.locator('details[data-fold][open]')).toHaveCount(0);
  await main.locator('[data-fold="sound"] summary').click();
  await expect(main.locator('[data-sound]')).toHaveCount(SOUNDS.length);
  await expect(main.locator('[data-sound]').first().getByRole('button', { name: T('listen') })).toBeVisible();
  await main.locator('[data-fold="stars"] summary').click();
  await expect(main.locator('[data-ms="meditation.devoted"] .v b').last()).toHaveText('1');
  await main.locator('[data-fold="quotes"] summary').click();
  await expect(main.locator('[data-quote="laozi-64"]')).toContainText('unter deinen Füssen');
  await main.locator('[data-fold="links"] summary').click();
  await expect(main.getByText(T('No links yet. Add your own: a title and an address.'))).toBeVisible();
  await main.locator('[data-fold="templates"] summary').click();
  await expect(main.locator('[data-tpl]').filter({ hasText: FIRST.nameDe })).toContainText(T('last {when}', { when: '' }).trim());
  await fits(page, 'C Mehr');
  await page.goBack();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);

  // the log lists the session with its note; the filter «mit Notiz» keeps it; calendar and chart views
  await main.locator('[data-to="log"]').click(); // ME2: «Logbuch» above the last sessions
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/log$/);
  // Design-Refresh P8 (A14 «Logbuch neu»): the log opens on «Übersicht»; the list is the tab «Liste»
  await expect(main.getByRole('heading', { level: 1, name: T('Logbook') })).toBeVisible();
  await main.locator('[data-view="list"]').click();
  await expect(page).toHaveURL(/log\?view=list$/);
  const row = main.locator('[data-session]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Am Anfang unruhig');
  if (phone) await main.locator('[data-filters]').click(); // on a phone the filters fold behind one button
  await main.locator('[data-filter="note"]').click();
  await expect(page).toHaveURL(/log\?note=1$/);
  await expect(row).toHaveCount(1);
  await main.locator('[data-filter="tod"]').selectOption('evening');
  await expect(row).toHaveCount(0);
  await main.getByRole('button', { name: T('reset {n} filters', { n: 2 }) }).click();
  await expect(row).toHaveCount(1);
  await fits(page, 'B4 Liste');
  // Design-Refresh P8 (A14): calendar (13 weeks) and minutes per week are on «Übersicht»
  await main.locator('[data-view="over"]').click();
  // the day with the 1-minute session: «Fr 9.10.: 1 min» (the minutes in its label)
  expect(await main.locator('button[data-day="2026-10-09"]').getAttribute('aria-label')).toMatch(/: 1 \S+$/);
  if (phone) expect((await main.locator('button[data-day="2026-10-09"]').boundingBox()).width, 'a day is a 44 px target').toBeGreaterThanOrEqual(43.5);
  await main.locator('button[data-day="2026-10-09"]').click();
  await expect(main.locator('.dh + .rows [data-session]')).toHaveCount(1);
  await fits(page, 'B6 Kalender');
  await expect(main.getByRole('heading', { name: T('Minutes per week') })).toBeVisible();
  await fits(page, 'B6 Grafik');
  await main.locator('[data-view="list"]').click();

  // the session in full; «Wieder so starten» opens the same clock again
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/s\/fl-s-/);
  await expect(main).toContainText('Am Anfang unruhig, dann still.');
  await expect(main).toContainText(T('{n} of 5', { n: 4 }));
  await expect(main.getByText(T('planned'), { exact: true })).toHaveCount(0);
  await fits(page, 'B5 Sitzung');
  await main.locator('[data-again]').click();
  const again = page.locator('dialog.sess[open]');
  await expect(again.locator('[role="timer"]')).toHaveAttribute('data-left', '60');
  await again.locator('[data-end-session]').click();
  await expect(page.locator('.ftoast')).toContainText(T('Under a minute: not saved'));
  expect(await count(page, 'flowSessions')).toBe(1);
  expect(errors).toEqual([]);
});

test('Meditation einfach: the short page, a new template, a session from «Mehr › Arten» ended early', async ({ page, context }, info) => {
  const errors = await open(page, context, '#/flow/act/meditation');
  const main = page.locator('main');
  const phone = page.viewportSize().width < 720;

  // B with a fresh database: «Jetzt starten» with the first template, the two others as chips, short
  await expect(main.locator('[data-start="first"]')).toContainText(T('Start now · {n} min', { n: FIRST.minutes }));
  await expect(main.locator('[data-tpl]')).toHaveCount(SEED_TEMPLATES.length - 1);
  await expect(main.locator('[data-row="star"]')).toBeVisible();
  await expect(main.getByRole('heading', { name: T('This page can') })).toHaveCount(0);
  await expect(page.getByText(T('swipe for the next tab'))).toHaveCount(0);
  // Paket A (HT1–HT2 and «Mehr Inhalt», changed on purpose): the card «Was hier steht», the tip and «Das kann
  // die App hier» come on every page; the two screens are for Meditation's own content, measured without them
  const info0 = await page.addStyleTag({ content: 'main section.hint, main [data-hint-line], main .tipl, main details.can { display: none !important; }' });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await info0.evaluate((el) => el.remove());
  info.annotations.push({ type: 'height', description: `Meditation page ${page.viewportSize().width} px: ${height} px high` });
  if (phone) expect(height, 'the phone page is about two screens at most').toBeLessThanOrEqual(1800);
  await fits(page, 'B Meditation kurz');

  // «+ neue»: «Neue Sitzung»; a mark set on the ring (5:00 of 20 min) and taken away (on a phone the ring
  // stays away, mockup F: «an Minute» sets it); then 1 minute
  await main.locator('[data-to="new-tpl"]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/timer\?new=1$/);
  await expect(main.getByRole('heading', { level: 1, name: T('New session') })).toBeVisible();
  await expect(main.getByRole('button', { name: '20', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const ownChip = main.getByRole('button', { name: T('own|marks'), exact: true });
  if (phone) {
    await expect(main.locator('.dial')).toHaveCount(0);
    await ownChip.click();
    await main.locator('[data-marks]').fill('5');
    await expect(main.locator('[data-own="marks"]')).toBeChecked();
    await expect(main.locator('[data-when]')).toHaveText(T('Sounds at {list} · end {end}', { list: '5:00', end: '20:00' }));
    await main.locator('[data-marks]').fill('');
    await expect(main.locator('[data-when]')).toHaveText(T('Only start and end · end {end}', { end: '20:00' }));
  } else {
    await tapRing(page, 90);
    await expect(ownChip).toHaveAttribute('aria-pressed', 'true');
    await expect(main.locator('[data-own="marks"]')).toBeChecked();
    await expect(main.locator('.dial [data-mark="300"]')).toHaveCount(1);
    await expect(main.locator('[data-marks]')).toHaveValue('5');
    await tapRing(page, 90);
    await expect(main.locator('.dial [data-mark]')).toHaveCount(0);
  }
  await expect(main.getByRole('heading', { name: T('This page can') })).toHaveCount(0);
  await fits(page, 'Neue Sitzung');
  await main.locator('[data-min]').fill('1');
  await main.locator('[data-tpl-name]').fill('Test eine Minute');
  await main.locator('[data-tpl-save]').click();
  await expect(page.locator('.ftoast')).toContainText(T('Template «{name}» saved', { name: 'Test eine Minute' }));
  await main.locator('.back a').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);
  await expect(main.getByRole('button', { name: T('Start {name}', { name: 'Test eine Minute' }) })).toBeVisible();
  await expect.poll(() => count(page, 'flowTemplates')).toBe(SEED_TEMPLATES.length + 1);

  // C › Arten: «Atemzüge zählen» starts its template «Morgen 20» (20 min, a gong every 5)
  await main.locator('[data-to="more"]').click();
  await main.locator('[data-fold="kinds"] summary').click();
  await main.locator('[data-art="count"] .fb').click();
  const sess = page.locator('dialog.sess[open]');
  await expect(sess.locator('.h')).toHaveText('Atemzüge zählen');
  await expect(sess).toContainText(`«${FIRST.nameDe}»`);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1200');
  await expect(sess.locator('.next')).toHaveText(T('next gong in {t}', { t: '5:00' }));
  await page.clock.runFor(150_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1050');
  await expect(sess.locator('.next')).toHaveText(T('next gong in {t}', { t: '2:30' }));

  // pause holds the clock
  await sess.getByRole('button', { name: T('Pause'), exact: true }).click();
  await page.clock.runFor(60_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1050');
  await sess.getByRole('button', { name: T('Continue'), exact: true }).click();
  await page.clock.runFor(10_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1040');

  // «Beenden» saves what ran (2:40 → 3 min), without asking; E opens; «Fertig» with nothing entered only closes
  await sess.locator('[data-end-session]').click();
  await expect(page.locator('dialog.sess[open]')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/done\//);
  await expect(main.getByRole('heading', { level: 1, name: T('{n} minutes.', { n: 3 }) })).toBeVisible();
  await expect.poll(() => count(page, 'flowSessions')).toBe(1);
  await main.locator('[data-save-note]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);
  await expect(page.locator('.ftoast')).toHaveCount(0);
  // «Wie letztes Mal» offers it again
  await expect(main.locator('[data-start="last"]')).toContainText(T('Like last time · {n} min', { n: FIRST.minutes }));
  await fits(page, 'Meditation after ending early');

  // the session: save it as a template, delete it, «Rückgängig» brings it back
  await main.locator('[data-to="log"]').click(); // ME2: «Logbuch» above the last sessions
  await main.locator('[data-session]').click();
  await expect(main.getByRole('heading', { level: 1, name: 'Atemzüge zählen' })).toBeVisible();
  await expect(main).toContainText(T('No note yet.'));
  await main.locator('[data-as-tpl]').click();
  await main.locator('[data-tpl-name]').fill('Zählen kurz');
  await main.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(page.locator('.ftoast')).toContainText(T('Template «{name}» saved', { name: 'Zählen kurz' }));
  await expect.poll(() => count(page, 'flowTemplates')).toBe(SEED_TEMPLATES.length + 2);
  await main.locator('[data-delete]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/log$/);
  await expect(main.locator('[data-session]')).toHaveCount(0);
  expect(await count(page, 'flowLog')).toBe(0);
  await page.locator('.ftoast').getByRole('button', { name: T('Undo') }).click();
  await expect(main.locator('[data-session]')).toHaveCount(1);
  expect(await count(page, 'flowSessions')).toBe(1);
  expect(errors).toEqual([]);
});

test('Meditation einfach: the start sheet changes the minutes, «Nur abhaken» ticks with Undo, the link opens the page', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const med = page.locator('[data-act="meditation"]');
  const sheet = page.locator('dialog[data-med-sheet][open]');

  await med.click();
  // v0.93.0: the chips 10–60 and «oder frei» always next to them
  await expect(sheet.locator('[data-min-chip]')).toHaveCount(MED_DURATIONS.length);
  for (const m of MED_DURATIONS) await expect(sheet.locator(`[data-min-chip="${m}"]`)).toHaveText(String(m));
  await sheet.locator('[data-min-chip="15"]').click();
  await expect(sheet.locator('[data-min-own]')).toHaveValue('15');
  await sheet.locator('[data-min-own]').fill('25');
  await expect(sheet.locator('[data-start="sheet"]')).toHaveText(T('Now {n} min', { n: 25 }));
  await expect(sheet.locator('[data-min-chip][aria-pressed="true"]')).toHaveCount(0);
  await sheet.locator('[data-min-chip="30"]').click();
  await expect(sheet.locator('[data-min-chip="30"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet.locator('[data-start="sheet"]')).toHaveText(T('Now {n} min', { n: 30 }));
  await sheet.locator('[data-tick-only]').click();
  await expect(page.locator('dialog[data-med-sheet][open]')).toHaveCount(0);
  await expect(med).toHaveAttribute('aria-pressed', 'true');
  const toast = page.locator('.ftoast');
  await expect(toast).toContainText(T('{name} ticked', { name: 'Meditation' }));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(med).toHaveAttribute('aria-pressed', 'false');
  expect(await count(page, 'flowSessions')).toBe(0);

  // other activities still tick with one tap
  await page.locator('[data-act="pushups"]').click();
  await expect(toast).toContainText(T('{name} · {n} ticked', { name: 'Liegestütze', n: 10 }));
  await expect(page.locator('dialog[data-med-sheet][open]')).toHaveCount(0);

  await med.click();
  await sheet.locator('[data-to="meditation"]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);
  await expect(page.locator('dialog[data-med-sheet][open]')).toHaveCount(0);
  await expect(page.locator('main').getByRole('heading', { level: 1, name: 'Meditation' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Meditation Wünsche: «Neue Sitzung» with the stars on top, 10–60 or free, «eigene · alle N», «Als Vorlage speichern?»', async ({ page, context }, info) => {
  const errors = await open(page, context, '#/flow/act/meditation/timer?new=1');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: T('New session') })).toBeVisible();

  // the next star first, its bar and «noch …»; a tap opens «Alle Sterne»
  const ms = main.locator('[data-ms-row]');
  await expect(ms).toBeVisible();
  await expect(ms).toContainText(T('Next star: {name}', { name: '' }).trim());
  await expect(ms.locator('[role="progressbar"]')).toHaveCount(1);
  expect((await ms.boundingBox()).y, 'the stars come before the settings').toBeLessThan((await main.getByText(T('Duration'), { exact: true }).boundingBox()).y);
  await ms.click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/mehr\?open=stars$/);
  await expect(main.locator('details[data-fold="stars"]')).toHaveAttribute('open', '');
  await page.goBack();
  await expect(main.getByRole('heading', { level: 1, name: T('New session') })).toBeVisible();

  // the durations in one tap, or typed
  for (const m of MED_DURATIONS) await expect(main.locator(`[data-dur="${m}"]`)).toHaveText(String(m));
  await main.locator('[data-dur="45"]').click();
  await expect(main.locator('[data-dur="45"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('[data-min]')).toHaveValue('45');
  await expect(main.locator('[data-start="timer"]')).toHaveText(T('Start · {n} min', { n: 45 }));
  await main.locator('[data-min]').fill('17');
  await expect(main.locator('[data-dur][aria-pressed="true"]')).toHaveCount(0);
  await expect(main.locator('[data-start="timer"]')).toHaveText(T('Start · {n} min', { n: 17 }));
  await main.locator('[data-dur="15"]').click();

  // «Klänge dazwischen»: keine · zufällig · eigene; «eigene · alle 5» and the line when they come
  await expect(main.locator('[data-mode]')).toHaveCount(3);
  await expect(main.getByRole('button', { name: T('every 5 min'), exact: true })).toHaveCount(0);
  await main.locator('[data-mode="own"]').click();
  await expect(main.locator('[data-own="every"]')).toBeChecked();
  await main.locator('[data-every]').fill('5');
  await expect(main.locator('[data-when]')).toHaveText(T('Sounds at {list} · end {end}', { list: '5:00 · 10:00', end: '15:00' }));
  const kind = T('Om Ah Hung');
  const name = main.locator('[data-tpl-name]');
  await expect(name).toHaveValue(`${kind} 15 · ${T('every {n} min', { n: 5 })}`);
  // «an Minute» starts with the same times, typed ones follow
  await main.locator('[data-own="marks"]').check();
  await expect(main.locator('[data-marks]')).toHaveValue('5, 10');
  await main.locator('[data-marks]').fill('3, 7, 12');
  await expect(main.locator('[data-when]')).toHaveText(T('Sounds at {list} · end {end}', { list: '3:00 · 7:00 · 12:00', end: '15:00' }));
  await expect(name).toHaveValue(`${kind} 15 · ${T('{n} own sounds', { n: 3 })}`);
  await main.locator('[data-mode="random"]').click();
  await expect(name).toHaveValue(`${kind} 15 · ${T('sounds at random')}`);
  await main.locator('[data-mode="none"]').click();
  await expect(name).toHaveValue(`${kind} 15`);
  await main.locator('[data-mode="own"]').click();
  await main.locator('[data-own="every"]').check();
  await main.locator('[data-every]').fill('5');

  // the sounds fold into one line; «ändern» opens them
  await expect(main.getByRole('combobox', { name: T('Start and end') })).toHaveCount(0);
  await main.locator('[data-sounds]').click();
  await expect(main.getByRole('combobox', { name: T('Start and end') })).toBeVisible();
  await fits(page, 'F Neue Sitzung');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  info.annotations.push({ type: 'height', description: `Neue Sitzung ${page.viewportSize().width} px: ${height} px high` });

  // «Als Vorlage speichern?»: the suggested name, «Speichern» keeps it as a template
  const card = main.locator('[data-save-card]');
  await expect(card.getByRole('heading', { name: T('Save as a template?') })).toBeVisible();
  await card.locator('[data-tpl-save]').click();
  const saved = `${kind} 15 · ${T('every {n} min', { n: 5 })}`;
  await expect(page.locator('.ftoast')).toContainText(T('Template «{name}» saved', { name: saved }));
  await expect.poll(() => count(page, 'flowTemplates')).toBe(SEED_TEMPLATES.length + 1);
  await expect(main.locator('[data-save-card]')).toHaveCount(0);
  await expect(main.getByRole('heading', { level: 1, name: saved })).toBeVisible();
  await expect(main.getByRole('button', { name: T('Delete') })).toBeVisible();

  // «nicht jetzt» hides the card for this visit
  await page.reload();
  await ready(page);
  await expect(main.getByRole('heading', { level: 1, name: T('New session') })).toBeVisible();
  await expect(main.locator('[data-save-card]')).toBeVisible();
  await main.locator('[data-tpl-later]').click();
  await expect(main.locator('[data-save-card]')).toHaveCount(0);
  await expect(main.locator('[data-start="timer"]')).toBeVisible();

  // an old template «alle 5» opens as «eigene · alle 5»
  await page.goto('./#/flow/act/meditation/timer?tpl=tpl-oah30');
  await expect(main.getByRole('heading', { level: 1, name: 'Om Ah Hung 30' })).toBeVisible();
  await expect(main.locator('[data-mode="own"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('[data-own="every"]')).toBeChecked();
  await expect(main.locator('[data-every]')).toHaveValue('5');
  await expect(main.locator('[data-dur="30"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('[data-save-card]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Meditation Wünsche: four clocks, «Sanduhr» stays after a reload, its time can be hidden', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/act/meditation/timer?new=1');
  const main = page.locator('main');
  await main.locator('[data-dur="15"]').click();
  await main.locator('[data-mode="own"]').click();
  await main.locator('[data-start="timer"]').click();

  const sess = page.locator('dialog.sess[open]');
  const timer = sess.locator('[role="timer"]');
  await expect(sess.locator('[data-clock-view]')).toHaveCount(CLOCK_VIEWS.length);
  await expect(sess.locator('[data-clock-view="ring"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sess.locator('.dial')).toBeVisible();
  await expect(timer).toHaveAttribute('data-left', '900');

  // Sanduhr: the glass, the time below, «nächster Klang in …», the controls
  await sess.locator('[data-clock-view="glass"]').click();
  await expect(sess.locator('.glass > svg')).toBeVisible();
  await expect(sess.locator('.dial')).toHaveCount(0);
  await page.clock.runFor(120_000);
  await expect(timer).toHaveAttribute('data-left', '780');
  await expect(sess.locator('.next')).toHaveText(T('next gong in {t}', { t: '3:00' }));
  await expect(sess.locator('.stream')).toHaveCount(1);
  await sess.getByRole('button', { name: T('Pause'), exact: true }).click();
  await expect(sess.locator('.stream')).toHaveCount(0); // no stream while paused
  await sess.getByRole('button', { name: T('Continue'), exact: true }).click();
  await sess.locator('[data-hide-time]').click();
  await expect(timer).toBeHidden();
  await expect(sess.locator('[data-hide-time]')).toHaveText(T('Show the time'));
  await expect(sess.locator('.next')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

  // a reload: the session keeps running; the clock opens as Sanduhr with the time hidden
  await page.reload();
  await ready(page);
  await page.locator('.fmini .open').click();
  await expect(sess.locator('[data-clock-view="glass"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sess.locator('[role="timer"]')).toBeHidden();
  await sess.locator('[data-hide-time]').click();
  await expect(sess.locator('[role="timer"]')).toBeVisible();

  // Mond and Zahl show the time; Ring again
  await sess.locator('[data-clock-view="moon"]').click();
  await expect(sess.locator('[data-clock="moon"] .water')).toHaveCount(1);
  await expect(sess.locator('[role="timer"]')).toBeVisible();
  await sess.locator('[data-clock-view="digits"]').click();
  await expect(sess.locator('[data-clock="digits"] [role="timer"]')).toBeVisible();
  await sess.locator('[data-clock-view="ring"]').click();
  await expect(sess.locator('.dial')).toBeVisible();
  await sess.locator('[data-end-session]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/done\//);
  expect(errors).toEqual([]);
});
