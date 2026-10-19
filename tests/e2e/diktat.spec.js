// «Diktat» (Noah 19.10.2026 «1a 2a 3a 4 a oder b beides wählbar 5a», KI «a und b», «1a 2a»): dictation keeps listening
// after the browser ends until you tap stop, shows a red dot and the time, turns «Punkt» into a sign, and a question
// in the note gets the app's answer with «Weiter fragen bei …». The settings live under Bedienung; «Meine KI-Projekte»
// adds, renames and deletes with Undo. German UI, the clock fixed in Europe/Zurich, no network, a fictional speech
// recognition, fictional data only (an empty app).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, hash = '#/') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  // a fictional speech recognition: each start «hears» the next piece, then ends (as Chrome does after a pause)
  await context.addInitScript(() => {
    const pieces = ['Kette quietscht Punkt', 'was ist am Velo fällig'];
    window.__starts = 0;
    window.SpeechRecognition = class {
      start() {
        window.__starts++;
        const said = pieces.shift();
        if (!said) return; // nothing more to hear: it keeps listening
        setTimeout(() => {
          this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: said }], { isFinal: true })] });
          setTimeout(() => this.onend?.(), 20);
        }, 20);
      }
      stop() {
        setTimeout(() => this.onend?.(), 10);
      }
      abort() {
        setTimeout(() => this.onend?.(), 10);
      }
    };
  });
  await page.clock.install({ time: new Date('2026-10-19T10:00:00+02:00') });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await ready(page);
  return errors;
}

test('Notes: dictation runs until stop, «Punkt» becomes a sign, the question gets the app answer', async ({ page, context }) => {
  const errors = await open(page, context, '#/notes');
  const form = page.locator('form.cap');
  const mic = form.locator('[data-speak-field]');
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-speak-live="listening"]')).toBeVisible();
  // both pieces arrive although the browser ended after the first one
  await expect(form.locator('textarea')).toHaveValue('Kette quietscht. Was ist am Velo fällig');
  expect(await page.evaluate(() => window.__starts)).toBeGreaterThanOrEqual(3);
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-speak-live]')).toHaveCount(0);
  // «Nach dem Stopp» (default): the app answers the question from the data (an empty app: nothing is due)
  const ans = page.locator('[data-speak-answer]');
  await expect(ans.locator('[data-aa="care"]')).toContainText(T('Nothing is due on your bikes.'));
  const claude = ans.locator('[data-service="claude"]');
  await expect(claude).toHaveAttribute('href', /^https:\/\/claude\.ai\/new\?q=Was%20ist%20am%20Velo%20f%C3%A4llig/);
  await expect(claude).toHaveAttribute('target', '_blank');
  // «In Notiz übernehmen» appends the answer
  await ans.locator('[data-aa-adopt]').click();
  await expect(form.locator('textarea')).toHaveValue(new RegExp(`${T('Answer')}: ${T('Nothing is due on your bikes.').replace(/[.?]/g, '\\$&')}`));
  expect(errors).toEqual([]);
});

test('Bedienung: the dictation settings; a service switched off is gone under the answer', async ({ page, context }) => {
  const errors = await open(page, context, '#/me/look');
  const ds = page.locator('[data-dict-settings]');
  await expect(ds).toBeVisible();
  await expect(ds.getByRole('button', { name: T('Browser (Google)') })).toHaveAttribute('aria-pressed', 'true');
  await ds.getByRole('button', { name: T('Right away') }).click();
  await expect(ds.getByRole('button', { name: T('Right away') })).toHaveAttribute('aria-pressed', 'true');
  await ds.locator('[data-dict-service="copilot"]').uncheck();
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-dict-settings]').getByRole('button', { name: T('Right away') })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-dict-service="copilot"]')).not.toBeChecked();

  await page.goto('./#/assistent?q=Was%20ist%20am%20Velo%20f%C3%A4llig');
  const more = page.locator('[data-ask-elsewhere]');
  await expect(more.locator('[data-service="chatgpt"]')).toBeVisible();
  await expect(more.locator('[data-service="copilot"]')).toHaveCount(0);
  // the tick is off each time; with nothing that fits only the question goes along
  await expect(more.locator('[data-ask-with-data]')).not.toBeChecked();
  await more.locator('[data-ask-with-data]').check();
  await expect(more).toContainText(T('Nothing in your gear or learnings fits this question; only the question goes along.'));
  expect(errors).toEqual([]);
});

test('Meine KI-Projekte: add, rename, delete with Undo', async ({ page, context }) => {
  const errors = await open(page, context, '#/me/ki-projekte');
  await page.getByRole('textbox', { name: T('Name of the link') }).fill('Demo Projekt');
  await page.getByRole('textbox', { name: T('Web address') }).fill('claude.ai/project/demo');
  await page.getByRole('button', { name: T('Add') }).click();
  const row = page.locator('[data-aip]');
  await expect(row).toHaveCount(1);
  await expect(row.locator('a')).toHaveAttribute('href', 'https://claude.ai/project/demo');
  await expect(row).toContainText('Claude');
  await row.getByRole('button', { name: T('Rename {name}', { name: 'Demo Projekt' }) }).click();
  await row.getByRole('textbox', { name: T('Name of the link') }).fill('Demo Neu');
  await row.getByRole('button', { name: T('Save') }).click();
  await expect(row.locator('a')).toContainText('Demo Neu');
  await row.getByRole('button', { name: T('Delete {name}', { name: 'Demo Neu' }) }).click();
  await page.locator('dialog').getByRole('button', { name: T('Delete') }).last().click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-aip]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
