// Bedienung (Noah 13.10.2026 23:52 and 23:56, without mockups): the small helps in Ich › Darstellung ›
// Bedienung, each one a switch. On a computer: «?» shows the shortcuts and «n» opens «Neu»; switched
// off, the keys do nothing. Night quiet: at 23:00 Today keeps its tip back, switched off it shows. The search offers «Daten und
// Backup» on top and Enter opens it. The start place «Packen» opens the packing list after a reload.
// German UI, the clock fixed in Europe/Zurich, no network, fictional data only (an empty app).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, time = '10:00', hash = '#/') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`2026-10-15T${time}:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await ready(page);
  return errors;
}

/** The switch of one help on Ich › Darstellung. */
const sw = (page, key) => page.locator(`[data-ops] input[data-op="${key}"]`);

test('shortcuts on a computer: ? shows the list, n opens «Neu»; switched off nothing happens', async ({ page, context }, info) => {
  test.skip(info.project.name === 'phone', 'keyboard shortcuts are for a computer');
  const errors = await open(page, context);
  await page.locator('body').click({ position: { x: 700, y: 10 } });
  await page.keyboard.press('?');
  const keys = page.locator('dialog.keys');
  await expect(keys).toBeVisible();
  await expect(keys.locator('#keys-h')).toHaveText(T('Keyboard shortcuts'));
  await page.keyboard.press('Escape');
  await expect(keys).toBeHidden();
  await page.keyboard.press('n');
  const neu = page.locator('dialog.sheet.new');
  await expect(neu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(neu).toBeHidden();

  // switched off in Ich › Darstellung › Bedienung: the keys do nothing
  await page.goto('./#/me/look');
  await expect(sw(page, 'keys')).toBeChecked();
  await sw(page, 'keys').uncheck();
  await page.goto('./#/');
  await ready(page);
  await page.locator('body').click({ position: { x: 700, y: 10 } });
  await page.keyboard.press('?');
  await page.keyboard.press('n');
  await expect(keys).toBeHidden();
  await expect(neu).toBeHidden();
  expect(errors).toEqual([]);
});

test('night quiet: at 23:00 Today keeps the tip back; switched off it shows', async ({ page, context }) => {
  const errors = await open(page, context, '23:00');
  const hint = page.locator('[data-hint="longpress"]');
  const sc = page.locator('[data-section="strava-connect"]');
  await expect(sc).toBeVisible();
  await sc.getByRole('button', { name: T('Later') }).click();
  await expect(sc).toHaveCount(0);
  await expect(page.locator('[data-section="balance"]')).toBeVisible();
  await expect(hint).toHaveCount(0);

  await page.goto('./#/me/look');
  await expect(sw(page, 'quiet')).toBeChecked();
  await sw(page, 'quiet').uncheck();
  await page.goto('./#/');
  await ready(page);
  await expect(hint).toBeVisible();
  expect(errors).toEqual([]);
});

test('the search can act: «backup» offers «Daten und Backup» on top, Enter opens it', async ({ page, context }, info) => {
  const errors = await open(page, context);
  if (info.project.name === 'phone') await page.locator('header.top .search button.icon').click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).first();
  await field.fill('backup');
  const act = page.locator('[data-cmd="backup"]').first();
  await expect(act).toContainText(T('Data and backup'));
  await expect(page.locator('.res .cmds li').first().locator('[data-cmd]')).toHaveAttribute('data-cmd', 'backup');
  await field.press('Enter');
  await expect(page).toHaveURL(/#\/me\/data$/);
  expect(errors).toEqual([]);
});

test('start place: «Packen» opens the packing list after a reload; a link to a page still wins', async ({ page, context }) => {
  const errors = await open(page, context, '10:00', '#/me/look');
  const seg = page.getByRole('group', { name: T('Open the app at') });
  await expect(seg.locator('[data-key="today"]')).toHaveAttribute('aria-pressed', 'true');
  await seg.locator('[data-key="pack"]').click();
  await expect(seg.locator('[data-key="pack"]')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./');
  await ready(page);
  await expect(page).toHaveURL(/#\/pack$/);
  await page.goto('./#/gear');
  await page.reload();
  await ready(page);
  await expect(page).toHaveURL(/#\/gear$/);

  // «Wo ich zuletzt war»: the last page, never a dialog
  await page.goto('./#/me/look');
  await seg.locator('[data-key="last"]').click();
  await page.goto('./#/bikes');
  await ready(page);
  await page.goto('./');
  await ready(page);
  await expect(page).toHaveURL(/#\/bikes$/);
  expect(errors).toEqual([]);
});

test('speak instead of type: the microphone in the quick note appends what was said; switched off it is gone', async ({ page, context }) => {
  // a fictional speech recognition: it «hears» one sentence right after the start
  await context.addInitScript(() => {
    window.SpeechRecognition = class {
      start() {
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: 'Sattel knarzt' }]] });
          this.onend?.();
        }, 20);
      }
      stop() {}
      abort() {}
    };
  });
  const errors = await open(page, context, '10:00', '#/inbox/new');
  const note = page.locator('dialog.sheet[aria-labelledby="qn-h"]');
  await expect(note).toBeVisible();
  await note.locator('textarea').fill('Notiz:');
  await note.locator('[data-speak-field]').click();
  await expect(note.locator('textarea')).toHaveValue('Notiz: Sattel knarzt');
  await note.locator('textarea').fill('');
  await page.keyboard.press('Escape');
  await expect(note).toBeHidden();

  await page.goto('./#/me/look');
  await sw(page, 'speak').uncheck();
  await page.goto('./#/inbox/new');
  await expect(note).toBeVisible();
  await expect(note.locator('textarea')).toBeVisible();
  await expect(note.locator('[data-speak-field]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
