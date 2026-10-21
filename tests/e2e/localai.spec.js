// «KI im Gerät» (Noah 20.10.2026 «1a 2a 3 beide 4b 5a und b», «a weitere modelle»): choose a model, load
// it on a tap, check the speed, ask in the search without internet. The model library is a fake module
// served at the CDN address (nothing real is downloaded); fictional v0.77.0 data, nothing goes out.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File } from './v0770-fixture.js';
import { openData, settle } from './settle.js';
import { TRANSFORMERS_URL } from '../../src/lib/whisper.js';
import { LOCAL_MODELS } from '../../src/lib/localai/models.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// A tiny stand-in for Transformers.js: «loads» (puts one file in the model cache) and streams an answer.
const FAKE = `
export const env = { backends: { onnx: { wasm: {} } } };
export class TextStreamer { constructor(tok, o) { this.o = o; } }
export async function pipeline(task, id, o) {
  window.__loads = (window.__loads ?? []).concat([[task, id, o.device, o.dtype]]);
  o.progress_callback?.({ status: 'progress', file: 'model.onnx', loaded: 1, total: 2 });
  const c = await caches.open('transformers-cache');
  await c.put('https://huggingface.co/' + id + '/resolve/main/onnx/model_q4.onnx', new Response('x', { headers: { 'content-length': '734003200' } }));
  const gen = async (messages, opts) => {
    window.__asked = (window.__asked ?? []).concat([messages]);
    for (const p of ['Regenhose, ', 'Überschuhe ', 'und Ersatzsocken.']) opts.streamer.o.callback_function(p);
    return [{ generated_text: [...messages, { role: 'assistant', content: 'Regenhose, Überschuhe und Ersatzsocken.' }] }];
  };
  gen.tokenizer = {};
  return gen;
}`;

async function start(page, context, info) {
  const file = v0770File(info);
  const out = [];
  await context.route(TRANSFORMERS_URL, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: FAKE }));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => (route.request().url() === TRANSFORMERS_URL ? route.fallback() : (out.push(route.request().url()), route.abort())));
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    try {
      Object.defineProperty(window, 'LanguageModel', { configurable: true, value: undefined });
    } catch {
      /* not there anyway */
    }
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return { errors, out };
}

test.setTimeout(180_000);

test('choose a model, load it on a tap, check the speed, ask in the search without internet', async ({ page, context }, info) => {
  const { errors, out } = await start(page, context, info);

  // Before loading: the search offers the way to load it
  await page.goto('./');
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  const f = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') });
  await f.fill('Was nehme ich bei Regen mit?');
  const res = page.getByRole('region', { name: T('Search results') });
  await expect(res.locator('[data-local-setup]')).toBeVisible();
  await expect(res.locator('[data-local-go]')).toHaveCount(0);

  await page.goto('./#/me/look');
  const box = page.locator('[data-local-ai]');
  await expect(box.getByRole('heading', { name: T('AI on this device') })).toBeVisible();
  await expect(box.locator('[data-local-model]')).toHaveCount(LOCAL_MODELS.length);
  await box.locator('[data-local-model="gemma1"]').check();
  await box.getByRole('button', { name: T('Load to this device') }).click();
  await expect(box.locator('[data-local-ready]')).toContainText(T('On this device'));
  await expect(box.locator('[data-local-ready]')).toContainText('734 MB');
  expect(await page.evaluate(() => window.__loads[0][1])).toBe(LOCAL_MODELS.find((m) => m.key === 'gemma1').id);
  await box.getByRole('button', { name: T('Check the speed') }).click();
  await expect(box.locator('[data-local-speedline]')).toBeVisible();
  await expect(box.getByText('Regenhose, Überschuhe und Ersatzsocken.')).toBeVisible();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath(`localai-settings-${info.project.name}.png`), fullPage: false });

  // The choice stays after a reload
  await page.reload();
  await expect(page.locator('[data-local-model="gemma1"]')).toBeChecked();
  await expect(page.locator('[data-local-ready]')).toBeVisible();

  // Without internet: the AI on this device answers in the search, with the entries that fit
  await page.goto('./');
  await context.setOffline(true);
  if (info.project.name === 'phone') await page.getByRole('button', { name: /Search everything|Alles durchsuchen/ }).click();
  await f.fill('Was nehme ich bei Regen mit?');
  await res.getByRole('button', { name: T('Ask the AI on this device') }).click();
  await expect(res.getByText(T('AI on this device (small; check what matters)'))).toBeVisible();
  await expect(res.getByText('Regenhose, Überschuhe und Ersatzsocken.')).toBeVisible();
  const asked = await page.evaluate(() => window.__asked.at(-1));
  expect(asked[1].content).toContain('Was nehme ich bei Regen mit?');
  await noSideways(page);
  await context.setOffline(false);

  // Delete asks first in the app's window; the other models stay untouched
  await page.goto('./#/me/look');
  await page.reload(); // a fresh start: pages that could not load while offline load now
  await page.getByRole('button', { name: T('Delete from this device') }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Löschen|Delete/ }).click();
  await expect(page.getByRole('button', { name: T('Load to this device') })).toBeVisible();

  expect(out.filter((u) => !u.startsWith('https://api.open-meteo.com/'))).toEqual([]);
  expect(errors).toEqual([]);
});
