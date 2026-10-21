// «Kluge Suche» (Noah 14.10.2026 «alle 3 in einem schritt, ohne mockups»): similar words, a typo, a
// filter, «Für Claude kopieren» (the text on the clipboard, nothing sent) and the Chrome AI (a fake
// `LanguageModel`; without it the button stays away). Fictional v0.77.0 data, nothing goes out.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File, P } from './v0770-fixture.js';
import { openData, settle } from './settle.js';
import { sentOut } from './public-data.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function start(page, context, info, { chromeAi = false } = {}) {
  const file = v0770File(info);
  const out = [];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => (out.push(route.request().url()), route.abort()));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await context.addInitScript((fake) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    window.__copied = [];
    try {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (s) => void window.__copied.push(s) } });
    } catch {
      /* the real clipboard then */
    }
    if (fake) {
      window.__prompts = [];
      window.LanguageModel = {
        availability: async () => 'available',
        create: async () => ({ prompt: async (s) => (window.__prompts.push(s), 'Nimm die Regenjacke oben in die Satteltasche.'), destroy() {} }),
      };
    } else {
      // Newer test browsers bring Chrome's own AI along; «without Chrome AI» means it is not there.
      try {
        delete window.LanguageModel;
        Object.defineProperty(window, 'LanguageModel', { configurable: true, value: undefined });
      } catch {
        /* not there anyway */
      }
    }
  }, chromeAi);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./');
  return { errors, out };
}

async function field(page, info) {
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  return page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
}

test('similar words, a typo and a filter find the right things', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  const f = await field(page, info);
  const res = page.getByRole('region', { name: T('Search results') });
  await f.fill('hardshell');
  await expect(res.getByRole('button', { name: new RegExp(`${P} Regenjacke`) })).toBeVisible();
  await expect(res.locator('[data-ks="hint"]')).toContainText('regenjacke');
  await f.fill('winterhandschue');
  await expect(res.getByRole('button', { name: new RegExp(`${P} Winterhandschuhe`) })).toBeVisible();
  await expect(res.locator('[data-ks="hint"]')).toContainText(T('Nothing for «{q}». Searched: «{fixed}»', { q: 'winterhandschue', fixed: 'winterhandschuhe' }));
  await f.fill('material unter 40 g');
  await expect(res.getByRole('button', { name: new RegExp(`${P} Rücklicht`) })).toBeVisible();
  await expect(res.getByRole('button', { name: new RegExp(`${P} Zelt`) })).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('«Für Claude kopieren»: the question and the entries that fit on the clipboard, nothing sent; no Chrome AI without Chrome', async ({ page, context }, info) => {
  const { errors, out } = await start(page, context, info);
  const f = await field(page, info);
  const res = page.getByRole('region', { name: T('Search results') });
  await f.fill('Regen');
  await expect(res.getByRole('button', { name: T('Copy for Claude') })).toHaveCount(0); // only for a question
  await f.fill('Was nehme ich bei Regen mit?');
  await expect(res.getByText(T('Ask Claude or Chrome'))).toBeVisible();
  await expect(res.getByRole('button', { name: T('Ask Chrome AI') })).toHaveCount(0);
  await res.getByRole('button', { name: T('Copy for Claude') }).click();
  await expect(res.getByText(T('Copied. Now paste it in the Claude app.'))).toBeVisible();
  const copied = await page.evaluate(() => window.__copied);
  expect(copied).toHaveLength(1);
  expect(copied[0]).toContain(T('My question: {q}', { q: 'Was nehme ich bei Regen mit?' }));
  expect(copied[0]).toContain(`${P} Regenjacke`);
  expect(copied[0]).not.toMatch(/BELEG|data:image|Puls|Gewicht/);
  await expect(res.getByRole('link', { name: T('Copy and open Claude') })).toHaveAttribute('href', 'https://claude.ai/new');
  await noSideways(page);
  expect(sentOut(out)).toEqual([]); // only the app's own weather and lake value
  expect(errors).toEqual([]);
});

test('Chrome AI: where Chrome offers it, it answers right in the search, on the device', async ({ page, context }, info) => {
  const { errors, out } = await start(page, context, info, { chromeAi: true });
  const f = await field(page, info);
  const res = page.getByRole('region', { name: T('Search results') });
  await f.fill('Was nehme ich bei Regen mit?');
  await res.getByRole('button', { name: T('Ask Chrome AI') }).click();
  await expect(res.getByText(T('Chrome AI, on this device'))).toBeVisible();
  await expect(res.getByText('Nimm die Regenjacke oben in die Satteltasche.')).toBeVisible();
  await page.screenshot({ path: info.outputPath(`kisuche-${info.project.name}.png`) });
  const prompts = await page.evaluate(() => window.__prompts);
  expect(prompts[0]).toContain(`${P} Regenjacke`);
  await noSideways(page);
  expect(sentOut(out)).toEqual([]); // only the app's own weather and lake value
  expect(errors).toEqual([]);
});
