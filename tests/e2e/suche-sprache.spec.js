// «Suche mit Sprache und Antworten» (Noah 21.10.2026 «1a 2a 3a+b 4b+a 5b»): the microphone in the top search,
// a spoken note goes into the Inbox at once with Undo, a spoken question gets the app's answer and «Ask further at»,
// Ich › Suche switches the microphone and every answer. German UI, the clock fixed in Europe/Zurich, no network,
// a fictional speech recognition, fictional data only (an empty app).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, hash = '#/', said = []) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  // a fictional speech recognition: each start «hears» the next sentence, then the browser ends it
  await context.addInitScript((pieces) => {
    window.__said = pieces;
    window.SpeechRecognition = class {
      start() {
        const s = window.__said.shift();
        if (!s) return; // nothing more to hear: it keeps listening
        setTimeout(() => {
          this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: s }], { isFinal: true })] });
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
  }, said);
  await page.clock.install({ time: new Date('2026-10-21T10:00:00+02:00') });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await ready(page);
  return errors;
}

/** The search as it shows on this screen (phone: the magnifier opens it first). */
async function searchMic(page) {
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  return page.locator('[data-search-mic]:visible').first();
}

test('a spoken note goes into the Inbox at once; Undo takes it back', async ({ page, context }) => {
  const errors = await open(page, context, '#/');
  const say = (s) => page.evaluate((x) => window.__said.push(x), s);
  let mic = await searchMic(page);
  await say('Notiz Bremse quietscht');
  await mic.click();
  await expect(page.locator('[data-search-heard]:visible')).toContainText('Notiz Bremse quietscht');
  const done = page.locator('p.done:visible');
  await expect(done).toContainText(T('Note saved in the Inbox: «{text}»', { text: 'Bremse quietscht' }));
  // the second one: Undo
  mic = await searchMic(page);
  await say('Notiz Sattel knarzt');
  await mic.click();
  await expect(done).toContainText('Sattel knarzt');
  await done.getByRole('button', { name: T('Undo') }).click();
  await expect(done).toHaveCount(0);
  await page.goto('./#/inbox');
  await ready(page);
  await expect(page.getByText('Bremse quietscht').first()).toBeVisible();
  await expect(page.getByText('Sattel knarzt')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a spoken question: the app answers and «Ask further at» opens Claude with it', async ({ page, context }) => {
  const errors = await open(page, context, '#/', ['was ist am Velo fällig']);
  const mic = await searchMic(page);
  await mic.click();
  const field = page.locator('input[type="search"]:visible').first();
  await expect(field).toHaveValue('was ist am Velo fällig');
  await expect(page.locator('[data-aa="care"]:visible')).toContainText(T('Nothing is due on your bikes.'));
  const claude = page.locator('[data-ask-elsewhere]:visible [data-service="claude"]');
  await expect(claude).toHaveAttribute('href', /^https:\/\/claude\.ai\/new\?q=was%20ist%20am%20Velo%20f%C3%A4llig/);
  // no helper code: no Gemini button, only the links
  await expect(page.locator('[data-ask-gemini]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Ich › Suche: switch off the microphone and «Ask further at»', async ({ page, context }) => {
  const errors = await open(page, context, '#/me');
  await page.locator('[data-me-row="suche"]').click();
  const s = page.locator('[data-suche-settings]');
  await expect(s).toBeVisible();
  await expect(s.locator('[data-suche="mic"]')).toBeChecked();
  await s.locator('[data-suche="mic"]').uncheck();
  await s.locator('[data-suche="links"]').uncheck();
  await expect(s.locator('[data-suche-service]')).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-suche="mic"]')).not.toBeChecked();
  await expect(page.locator('[data-suche="links"]')).not.toBeChecked();
  await page.goto('./#/');
  await ready(page);
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  await expect(page.locator('[data-search-mic]:visible')).toHaveCount(0);
  const field = page.locator('input[type="search"]:visible').first();
  await field.fill('was ist am Velo fällig?');
  await expect(page.locator('[data-aa="care"]:visible')).toBeVisible();
  await expect(page.locator('[data-ask-elsewhere]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
