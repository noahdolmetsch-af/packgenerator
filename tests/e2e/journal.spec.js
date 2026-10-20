// «Tagebuch» (Noah 20.10.2026, like Day One): Ich › Tagebuch, writing an entry with a tag, reading it, the
// calendar and the photo wall, the question of the day, the lock with a code, and renaming and deleting a tag.
// German, phone 390 and desktop 1440, a fixed clock in Europe/Zurich, fictional data only. SHOTS=<folder> saves shots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { QUESTIONS, questionOf } from '../../src/lib/tagebuch/fragen.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-20';
const P = 'test_data_tb_';

async function open(page, context, hash = './#/tagebuch') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T20:30:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function writeEntry(page, { title, text, tag }, info = null) {
  await page.locator('[data-tb-new]').click();
  const ed = page.locator('[data-tb-editor]');
  await expect(ed).toBeVisible();
  await ed.locator('[data-tb-title]').fill(title);
  await ed.locator('[data-tb-text]').fill(text);
  if (tag) {
    await ed.locator('[data-tb-tag-in]').fill(tag);
    await ed.locator('[data-tb-tag-add]').click();
    await expect(ed.locator(`[data-tb-tag-on="${tag}"]`)).toBeVisible();
  }
  if (info) await shot(page, info, 'tagebuch-schreiben');
  await ed.locator('[data-tb-save]').click();
  await expect(ed).toBeHidden();
}

test('Ich leads to the diary; write, read, change, search, calendar and photos', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me');
  await page.locator('[data-me-tagebuch] a').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Diary') })).toBeVisible();
  await expect(page.locator('[data-tb-empty]')).toBeVisible();
  // the question of the day is the one of today
  await expect(page.locator('[data-tb-question]')).toContainText(T(QUESTIONS[questionOf(DAY)][0]));
  await shot(page, info, 'tagebuch-leer');

  await writeEntry(page, { title: `${P}Herbstabend`, text: 'Nebel über dem See.\nZweite Zeile.', tag: 'Natur' }, info);
  const card = page.locator('[data-tb-entry]').first();
  await expect(card).toContainText(`${P}Herbstabend`);
  await expect(card).toContainText('#Natur');
  await expect(page.locator('[data-tb-sentence]')).toContainText(T('You have written {n} entry', { n: 1 }));
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'tagebuch-liste');

  // read it, then change it
  await card.click();
  await expect(page.getByRole('heading', { level: 1, name: `${P}Herbstabend` })).toBeVisible();
  await expect(page.locator('.tb-body')).toContainText('Nebel über dem See.');
  await page.locator('[data-tb-edit]').click();
  await page.locator('[data-tb-editor] [data-tb-text]').fill('Nebel über dem See, dann Sonne.');
  await page.locator('[data-tb-editor] [data-tb-save]').click();
  await expect(page.locator('.tb-body')).toContainText('dann Sonne');
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'tagebuch-eintrag');

  // a second one, search and tag filter
  await page.goto('./#/tagebuch');
  await writeEntry(page, { title: `${P}Werkstatt`, text: 'Kette gewechselt.' });
  await expect(page.locator('[data-tb-entry]')).toHaveCount(2);
  await page.locator('[data-tb-search]').fill('kette');
  await expect(page.locator('[data-tb-entry]')).toHaveCount(1);
  await page.locator('[data-tb-search]').fill('');
  await page.locator('[data-tb-filter-tag="Natur"]').click();
  await expect(page.locator('[data-tb-entry]')).toHaveCount(1);
  await page.locator('[data-tb-filter-tag="Natur"]').click();

  // calendar: today has entries; photos: none yet
  await page.getByRole('radio', { name: T('Calendar') }).or(page.getByRole('button', { name: T('Calendar'), exact: true })).first().click();
  await expect(page.locator(`[data-tb-day="${DAY}"]`)).toHaveClass(/has/);
  await expect(page.locator('[data-tb-calendar] [data-tb-entry]')).toHaveCount(2);
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'tagebuch-kalender');
  await page.getByRole('radio', { name: T('Photos') }).or(page.getByRole('button', { name: T('Photos'), exact: true })).first().click();
  await expect(page.getByText(T('No photos yet. Add one to an entry.'))).toBeVisible();
  expect(errors).toEqual([]);
});

test('the question of the day: answer it, or «Not today»', async ({ page, context }) => {
  const errors = await open(page, context);
  const q = page.locator('[data-tb-question]');
  await page.locator('[data-tb-question-next]').click();
  await expect(q).toContainText(T(QUESTIONS[questionOf(DAY, 1)][0]));
  await page.locator('[data-tb-question-hide]').click();
  await expect(q).toBeHidden();
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-tb-question]')).toBeHidden(); // only for today
  expect(errors).toEqual([]);
});

test('the lock: a code, the lock screen, a wrong and the right code', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await writeEntry(page, { title: `${P}Geheim`, text: 'Nur für mich.' });
  await page.locator('[data-tb-settings-open]').click();
  const s = page.locator('[data-tb-settings]');
  await s.locator('[data-tb-code1]').fill('2468');
  await s.locator('[data-tb-code2]').fill('1357');
  await s.locator('[data-tb-lock-set]').click();
  await expect(s.getByText(T('The two codes are not the same.'))).toBeVisible();
  await s.locator('[data-tb-code2]').fill('2468');
  await s.locator('[data-tb-lock-set]').click();
  await expect(s.locator('[data-tb-lock-off]')).toBeVisible();
  await s.getByRole('button', { name: T('Close') }).click();

  // leaving the diary locks it again
  await page.goto('./#/me');
  await page.goto('./#/tagebuch');
  await expect(page.locator('[data-tb-lock]')).toBeVisible();
  await expect(page.getByText(`${P}Geheim`)).toHaveCount(0);
  await shot(page, info, 'tagebuch-sperre');
  await page.locator('[data-tb-code]').fill('1111');
  await page.locator('[data-tb-open]').click();
  await expect(page.locator('[data-tb-wrong]')).toBeVisible();
  await page.locator('[data-tb-code]').fill('2468');
  await page.locator('[data-tb-open]').click();
  await expect(page.locator('[data-tb-entry]')).toContainText(`${P}Geheim`);
  expect(errors).toEqual([]);
});

test('tags are groups: rename one, then delete it; the entries stay', async ({ page, context }) => {
  const errors = await open(page, context);
  await writeEntry(page, { title: `${P}Eins`, text: 'a', tag: 'Velo' });
  await page.locator('[data-tb-settings-open]').click();
  const s = page.locator('[data-tb-settings]');
  await s.locator('[data-tb-tagrow="Velo"] [data-tb-tag-rename]').click();
  await page.locator('#rn-in').fill('Rad');
  await page.locator('#rn-in').press('Enter');
  await expect(s.locator('[data-tb-tagrow="Rad"]')).toBeVisible();
  await s.locator('[data-tb-tagrow="Rad"] [data-tb-tag-delete]').click();
  await page.getByRole('button', { name: T('Delete'), exact: true }).last().click();
  await expect(s.locator('[data-tb-tagrow]')).toHaveCount(0);
  await s.getByRole('button', { name: T('Close') }).click();
  await expect(page.locator('[data-tb-entry]')).toHaveCount(1);
  await expect(page.locator('[data-tb-entry]')).not.toContainText('#Rad');
  expect(errors).toEqual([]);
});

test('mood, review with cloud and series, Gemini only with a tick, evening reminder, year book', async ({ page, context }, info) => {
  const errors = await open(page, context);
  // an entry for yesterday with a mood, written from the calendar
  await page.locator('[data-tb-new]').click();
  await page.locator('[data-tb-editor] [data-tb-text]').fill('Velo und Berge, dann Velo und Kaffee.');
  await page.locator('[data-tb-editor] [data-tb-mood="4"]').click();
  await expect(page.locator('[data-tb-editor] [data-tb-mood="4"]')).toHaveAttribute('aria-pressed', 'true');
  // Gemini buttons wait for the tick
  await expect(page.locator('[data-tb-editor] [data-tb-ai-title]')).toBeDisabled();
  await page.locator('[data-tb-editor] [data-tb-ai-ok]').check();
  await page.locator('[data-tb-editor] [data-tb-ai-title]').click();
  await expect(page.locator('[data-tb-editor] [data-tb-ai-msg]')).toBeVisible(); // no helper code here: a calm line
  await expect(page.locator('[data-tb-editor] [data-tb-ai-ok]')).not.toBeChecked(); // the tick goes off again
  await shot(page, info, 'tagebuch-stimmung');
  await page.locator('[data-tb-editor] [data-tb-day]').fill('2026-10-19');
  await page.locator('[data-tb-editor] [data-tb-save]').click();
  await expect(page.locator('[data-tb-editor]')).toBeHidden();
  await expect(page.locator('[data-tb-card-mood="4"]')).toBeVisible();

  // Rückblick: curve hint, word cloud of October, series
  await page.locator('.tb-bar button[data-key="look"]').click();
  await expect(page.locator('[data-tb-review]')).toBeVisible();
  await expect(page.locator('[data-tb-mood-curve]')).toContainText(T('Choose a smiley when you write. After a few days, your mood curve shows here.'));
  await expect(page.locator('[data-tb-word="velo"]')).toBeVisible();
  await expect(page.locator('[data-tb-milestone="entries-1"]')).toHaveText(T('First entry'));
  await expect(page.locator('[data-tb-ai-ask]')).toBeDisabled();
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'tagebuch-rueckblick');

  // settings: evening reminder and the year book
  await page.locator('[data-tb-settings-open]').click();
  await expect(page.locator('[data-tb-remind-on]')).toBeChecked();
  await expect(page.locator('[data-tb-remind-time]')).toHaveValue('21:00');
  const down = page.waitForEvent('download');
  await page.locator('[data-tb-book]').click();
  expect((await down).suggestedFilename()).toBe('tagebuch-2026.pdf');
  await page.keyboard.press('Escape');

  // the evening window: today has no entry, after 21:00 on another page
  await page.goto('./#/me');
  await ready(page);
  await page.clock.fastForward('40:00');
  const win = page.getByRole('dialog', { name: T('A few lines for your diary?') });
  await expect(win).toBeVisible();
  await shot(page, info, 'tagebuch-erinnerung');
  await win.locator('[data-cw-main]').click();
  await expect(page.locator('[data-tb-editor]')).toBeVisible();
  expect(errors).toEqual([]);
});
