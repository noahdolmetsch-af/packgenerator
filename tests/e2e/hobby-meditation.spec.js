// Hobby pages 2 «Kissenzeit» (mockups B1, B2, B7): on a phone and a computer, in German, with a
// fixed clock (page.clock). Aktiv › Aktivität → the Kissenzeit tile → the meditation page with its three
// suggested templates → a new template of 1 minute on the intervals page (a mark set on the dial and
// taken away again) → started → the running session in full (the navigation steps back) → the end gong
// → the session is saved (flowLog + flowSessions) → B3 opens: note and depth → the milestone «Hingebungsvoll»
// counts up → the log (B4) shows the row, filters, calendar and chart (B6) → the session (B5) → «Wieder so
// starten». A second session from «Heute vielleicht» is paused and ended early, saved as a template,
// deleted and brought back. No sideways scroll, no page errors.
// Fictional data only. No data import and no dialog of the app shell, so of tests/e2e/settle.js only
// ready() is needed: the start-up tidy-up has finished before the test acts.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { SEED_TEMPLATES } from '../../src/lib/flowmed.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:00:00+02:00'; // a Friday morning; the browser runs in Europe/Zurich

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

test('Kissenzeit: tile → page → a 1-minute template → the session runs → gong → saved → milestone', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/activity');
  const main = page.locator('main');
  const phone = page.viewportSize().width < 720;

  // the Kissenzeit tile opens the meditation page (no longer the editor)
  await expect(main.locator('[data-tile]')).toHaveCount(6);
  await main.locator('[data-tile="meditation"] a.tl').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);
  await expect(main.getByRole('heading', { level: 1, name: 'Meditation' })).toBeVisible();
  await expect(page.locator('.ptabs').getByRole('link', { name: T('Activity|tab'), exact: true })).toHaveAttribute('aria-current', 'page');

  // the three suggested templates, the kinds, the milestones, quotes, the planned Fitbit row
  await expect(main.locator('[data-tpl]')).toHaveCount(SEED_TEMPLATES.length);
  await expect(main.locator('[data-tpl="tpl-morning20"]')).toContainText('Morgen 20');
  await expect(main.locator('[data-art="omahhung"]')).toContainText('Om Ah Hung');
  const devoted = main.locator('[data-ms="meditation.devoted"]').last();
  await expect(devoted.locator('.v b')).toHaveText('0');
  await expect(main.locator('[data-quote="laozi-64"]')).toContainText('unter deinen Füssen');
  await expect(main.locator('.fitbit')).toContainText(T('planned'));
  await expect(main.getByText(T('No links yet. Add your own: a title and an address.'))).toBeVisible();
  await fits(page, 'Meditation');

  // B2: a new template; a mark set on the ring (5:00 of 20 min) and taken away; then 1 minute
  await main.getByRole('link', { name: T('new template') }).click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/timer\?new=1$/);
  await expect(main.getByRole('heading', { level: 1, name: T('Intervals') })).toBeVisible();
  await expect(main.getByRole('button', { name: '20', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tapRing(page, 90);
  await expect(main.getByRole('button', { name: T('own|marks'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('.dial [data-mark="300"]')).toHaveCount(1);
  await main.getByRole('button', { name: T('Remove the mark at {t}', { t: '5:00' }) }).click();
  await expect(main.locator('.dial [data-mark]')).toHaveCount(0);
  await fits(page, 'Intervalle');
  await main.getByRole('button', { name: T('Other duration') }).click();
  await main.locator('[data-min]').fill('1');
  await main.locator('[data-tpl-name]').fill('Test eine Minute');
  await main.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(page.locator('.ftoast')).toContainText(T('Template «{name}» saved', { name: 'Test eine Minute' }));
  await main.getByRole('link', { name: T('Back to {name}', { name: 'Meditation' }) }).click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);

  // the new template is the fourth: «alle 4 Vorlagen», then start it
  await main.getByRole('button', { name: T('all {n} templates', { n: 4 }) }).click();
  await main.getByRole('button', { name: T('Start {name}', { name: 'Test eine Minute' }) }).click();

  // B7: the full view; on a phone only «Beenden» on top, on a computer the narrow strip
  const sess = page.locator('dialog.sess[open]');
  await expect(sess).toBeVisible();
  const box = await sess.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(page.viewportSize().width - 1);
  expect(box.height).toBeGreaterThanOrEqual(page.viewportSize().height - 1);
  if (phone) await expect(sess.locator('.endtop')).toBeVisible();
  else await expect(sess.getByRole('button', { name: T('Open the sidebar') })).toBeVisible();
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '60');
  await expect(sess.getByText(T('During the session'))).toBeVisible();
  await page.clock.runFor(30_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '30');

  // the end gong: the session saves itself (log entry + details, the same id) and B3 opens (H11a)
  await page.clock.runFor(31_000);
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/done\/fl-s-/);
  await expect(page.locator('dialog.sess[open]')).toHaveCount(0);
  await expect.poll(() => count(page, 'flowSessions')).toBe(1);
  expect(await count(page, 'flowLog')).toBe(1);

  // B3: the big minutes, the note card (a sentence, depth 4, a mood), «Als Nächstes» with a calendar file
  await expect(main.getByRole('heading', { level: 1, name: T('{n} minute.', { n: 1 }) })).toBeVisible();
  await expect(main).toContainText(T('Template «{name}»', { name: 'Test eine Minute' }));
  await main.locator('[data-note]').fill('Am Anfang unruhig, dann still.');
  await main.locator('[data-depth="4"]').click();
  await expect(main.locator('[data-depth="4"]')).toHaveAttribute('aria-pressed', 'true');
  await main.locator('[data-mood="calm"]').click();
  await expect(main.locator('[data-next]')).toContainText(T('tomorrow'));
  const [dl] = await Promise.all([page.waitForEvent('download'), main.locator('[data-ics]').click()]);
  expect(dl.suggestedFilename()).toBe('meditation-2026-10-10.ics');
  await fits(page, 'B3 Auswertung');
  await main.locator('[data-save-note]').click();
  await expect(page.locator('.ftoast')).toContainText(T('Note saved'));
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);

  // the milestone counts up, the template shows its last use
  await expect(devoted.locator('.v b')).toHaveText('1');
  await expect(main.locator('[data-tpl]').filter({ hasText: 'Test eine Minute' })).toContainText(T('last {when}', { when: '' }).trim());

  // B4: the log lists the session with its note; the filter «mit Notiz» keeps it; calendar and chart views
  await main.getByRole('link', { name: T('Open the log') }).click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/log$/);
  await expect(main.getByRole('heading', { level: 1, name: T('Log') })).toBeVisible();
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
  await main.locator('[data-view="cal"]').click();
  await expect(main.locator('[data-day="2026-10-09"]')).toContainText('1');
  if (phone) expect((await main.locator('button[data-day="2026-10-09"]').boundingBox()).width, 'a day is a 44 px target').toBeGreaterThanOrEqual(43.5);
  await main.locator('[data-day="2026-10-09"]').click();
  await expect(main.locator('[data-session]')).toHaveCount(1);
  await fits(page, 'B6 Kalender');
  await main.locator('[data-view="chart"]').click();
  await expect(main.getByRole('heading', { name: T('Minutes per week') })).toBeVisible();
  await fits(page, 'B6 Grafik');
  await main.locator('[data-view="list"]').click();

  // B5: the session in full; «Wieder so starten» opens the same clock again
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/s\/fl-s-/);
  await expect(main).toContainText('Am Anfang unruhig, dann still.');
  await expect(main).toContainText(T('{n} of 5', { n: 4 }));
  await fits(page, 'B5 Sitzung');
  await main.locator('[data-again]').click();
  const again = page.locator('dialog.sess[open]');
  await expect(again.locator('[role="timer"]')).toHaveAttribute('data-left', '60');
  await again.locator('[data-end-session]').click();
  await expect(page.locator('.ftoast')).toContainText(T('Under a minute: not saved'));
  expect(await count(page, 'flowSessions')).toBe(1);
  expect(errors).toEqual([]);
});

test('Kissenzeit: a session from «Heute vielleicht», paused, ended early, saved with what ran', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/act/meditation');
  const main = page.locator('main');
  await expect(main.locator('[data-tpl]')).toHaveCount(SEED_TEMPLATES.length);

  // «Atemzüge zählen» starts its template «Morgen 20» (20 min, a bowl every 5)
  await main.locator('[data-art="count"] .fb').click();
  const sess = page.locator('dialog.sess[open]');
  await expect(sess.locator('.h')).toHaveText('Atemzüge zählen');
  await expect(sess).toContainText(T('Template «{name}»', { name: 'Morgen 20' }));
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1200');
  await expect(sess.locator('.next')).toContainText(T('Next gong at {t}', { t: '5:00' }));
  await page.clock.runFor(150_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1050');

  // pause holds the clock
  await sess.getByRole('button', { name: T('Pause'), exact: true }).click();
  await page.clock.runFor(60_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1050');
  await sess.getByRole('button', { name: T('Continue'), exact: true }).click();
  await page.clock.runFor(10_000);
  await expect(sess.locator('[role="timer"]')).toHaveAttribute('data-left', '1040');

  // «Beenden» saves what ran (2:40 → 3 min), without asking; B3 opens, «Ohne Notiz schliessen» goes back
  await sess.locator('[data-end-session]').click();
  await expect(page.locator('dialog.sess[open]')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/done\//);
  await expect(main.getByRole('heading', { level: 1, name: T('{n} minutes.', { n: 3 }) })).toBeVisible();
  await expect.poll(() => count(page, 'flowSessions')).toBe(1);
  await main.getByRole('button', { name: T('Close without a note') }).click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation$/);
  await expect(main.locator('[data-tpl="tpl-morning20"]')).toContainText(T('last {when}', { when: '' }).trim());
  // «Wie letztes Mal» offers it again
  await expect(main.locator('[data-start="last"]')).toBeVisible();
  await fits(page, 'Meditation after ending early');

  // B5: save it as a template, delete it, «Rückgängig» brings it back
  await main.getByRole('link', { name: T('Open the log') }).click();
  await main.locator('[data-session]').click();
  await expect(main.getByRole('heading', { level: 1, name: 'Atemzüge zählen' })).toBeVisible();
  await expect(main).toContainText(T('No note yet.'));
  await main.locator('[data-as-tpl]').click();
  await main.locator('[data-tpl-name]').fill('Zählen kurz');
  await main.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(page.locator('.ftoast')).toContainText(T('Template «{name}» saved', { name: 'Zählen kurz' }));
  await expect.poll(() => count(page, 'flowTemplates')).toBe(SEED_TEMPLATES.length + 1);
  await main.locator('[data-delete]').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/log$/);
  await expect(main.locator('[data-session]')).toHaveCount(0);
  expect(await count(page, 'flowLog')).toBe(0);
  await page.locator('.ftoast').getByRole('button', { name: T('Undo') }).click();
  await expect(main.locator('[data-session]')).toHaveCount(1);
  expect(await count(page, 'flowSessions')).toBe(1);
  expect(errors).toEqual([]);
});
