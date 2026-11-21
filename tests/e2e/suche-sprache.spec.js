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
  await expect(page.locator('[data-aa="care"]:visible')).toContainText(T('No bikes yet, so there is no care data either.'));
  const claude = page.locator('[data-ask-elsewhere]:visible [data-service="claude"]');
  await expect(claude).toHaveAttribute('href', /^https:\/\/claude\.ai\/new\?q=was%20ist%20am%20Velo%20f%C3%A4llig/);
  // a tap also copies the question and says so, in case the service loses it after its sign-in
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await context.route('https://claude.ai/**', (r) => r.fulfill({ body: 'ok' }));
  const [tab] = await Promise.all([context.waitForEvent('page'), claude.click()]);
  await tab.close();
  await expect(page.locator('[data-ask-copied]:visible')).toContainText('Claude');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('was ist am Velo fällig');
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

// «Suche als Alleskönner» (Noah 21.10.2026 «1-8 alle»)
test('several values in one sentence, a reminder, a plan: each at once from the microphone', async ({ page, context }) => {
  const errors = await open(page, context, '#/');
  const say = (s) => page.evaluate((x) => window.__said.push(x), s);
  const done = page.locator('p.done:visible');
  // 7 + 1: two values in one sentence, one Undo for both
  let mic = await searchMic(page);
  await say('Gewicht 72 und Puls 48');
  await mic.click();
  await expect(done).toContainText(T('Entered: {list}', { list: `${T('Weight {v} kg', { v: '72' })} · ${T('Resting heart rate {v}', { v: '48' })}` }));
  // 8: a reminder goes to Merken
  mic = await searchMic(page);
  await say('Erinnere mich Freitag ans Reifen pumpen');
  await mic.click();
  await expect(done).toContainText('Reifen pumpen');
  // 4: a plan opens «Hilf mir planen» filled in
  mic = await searchMic(page);
  await say('Plane mir 3 Tage Jura');
  await mic.click();
  await expect(page).toHaveURL(/#\/assistent\/plan\?days=3&title=Jura/);
  await expect(page.locator('[data-plan-from-search]')).toContainText('Jura');
  await expect(page.locator('.ph-days input')).toHaveValue('3');
  expect(errors).toEqual([]);
});

test('typed: «Do it now» offers the value; Enter saves it, Undo takes it back', async ({ page, context }) => {
  const errors = await open(page, context, '#/');
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  const field = page.locator('input[type="search"]:visible').first();
  await field.fill('schlecht geschlafen');
  await expect(page.locator('[data-cmd="says"]:visible')).toContainText(T('Sleep {v} of 10', { v: '3' }));
  await field.press('Enter');
  const done = page.locator('p.done:visible');
  await expect(done).toContainText(T('Sleep {v} of 10', { v: '3' }));
  await done.getByRole('button', { name: T('Undo') }).click();
  await expect(done).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a spoken list: the sentence makes the list with three points; Open shows it, Undo takes it back (07.11.2026)', async ({ page, context }) => {
  const errors = await open(page, context, '#/');
  const say = (s) => page.evaluate((x) => window.__said.push(x), s);
  const mic = await searchMic(page);
  await say('Erstelle eine To-Do-Liste mit folgenden Inhalten. Erstens Aufräumen, zweitens Kette wachsen, drittens Anmeldung für das Rennen');
  await mic.click();
  const done = page.locator('p.done:visible');
  await expect(done).toContainText(T('List «{name}» with {n} points', { name: 'To-do', n: 3 }));
  await done.getByRole('link', { name: T('Open') }).click();
  await ready(page);
  await expect(page.getByText('Kette wachsen').first()).toBeVisible();
  await expect(page.locator('[data-list]')).toBeVisible();
  await expect(page.getByText('Anmeldung für das Rennen').first()).toBeVisible();
  // typed, then Undo
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  const field = page.locator('input[type="search"]:visible').first();
  await field.fill('Erstelle eine Einkaufsliste: Brot, Käse');
  await expect(page.locator('[data-cmd="says"]:visible')).toContainText(T('List «{name}» with {n} points', { name: 'Einkaufsliste', n: 2 }));
  await field.press('Enter');
  await page.locator('p.done:visible').getByRole('button', { name: T('Undo') }).click();
  await page.goto('./#/calendar');
  await ready(page);
  await expect(page.getByText('Einkaufsliste')).toHaveCount(0);
  await expect(page.getByText('Brot')).toHaveCount(0);
  expect(errors).toEqual([]);
});

/** Put a helper code on the device (as after Me › AI helper) and reload. A fictional code. */
async function putHelperCode(page) {
  await page.evaluate(
    () =>
      new Promise((res, rej) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => rej(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'helper', value: { code: 'test-code-not-real-0000' } });
          tx.oncomplete = () => (r.result.close(), res());
          tx.onerror = () => rej(tx.error);
        };
      }),
  );
  await page.reload();
  await ready(page);
}

test('Gemini understands a sentence: first «I would do this», written only after OK, Undo takes it back (07.11.2026)', async ({ page, context }) => {
  const errors = await open(page, context, '#/');
  const seen = [];
  await page.route('**/api/helper', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204 });
    const body = JSON.parse(route.request().postData() ?? '{}');
    seen.push({ body, auth: route.request().headers().authorization });
    const text = JSON.stringify({ actions: [{ kind: 'todo', text: 'Reifen pumpen', due: '2026-10-23' }, { kind: 'note', text: 'Bremse quietscht' }] });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, task: 'gemini', result: { text } }) });
  });
  const sentence = 'Trag mir bitte das Pumpen der Reifen auf Freitag ein und merk dir, dass die Bremse quietscht';
  const glass = page.getByRole('button', { name: T('Search everything') });
  const field = async () => {
    if (await glass.first().isVisible()) await glass.first().click();
    return page.locator('input[type="search"]:visible').first();
  };
  // without a helper code there is no offer
  await (await field()).fill(sentence);
  await expect(page.locator('[data-ai-offer]')).toHaveCount(0);
  await putHelperCode(page);
  await (await field()).fill(sentence);
  await page.locator('[data-ai-offer]:visible').click();
  const plan = page.locator('[data-ai-plan]:visible');
  await expect(plan).toContainText(T('I would do this'));
  await expect(plan).toContainText('Reifen pumpen');
  await expect(plan).toContainText('Bremse quietscht');
  // nothing written yet; only the sentence, today and the names went along, the code only in the header
  expect(seen).toHaveLength(1);
  expect(seen[0].auth).toBe('Bearer test-code-not-real-0000');
  expect(seen[0].body.input).toMatchObject({ mode: 'command', lang: 'de', question: sentence });
  expect(seen[0].body.input.context).toMatch(/^today: 2026-10-21\nbikes: \ntrips: $/);
  await page.locator('[data-ai-ok]').click();
  const done = page.locator('p.done:visible');
  await expect(done).toContainText('Reifen pumpen');
  await done.getByRole('button', { name: T('Undo') }).click();
  await expect(done).toHaveCount(0);
  await page.goto('./#/inbox');
  await ready(page);
  await expect(page.getByText('Bremse quietscht')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Gemini finds nothing to do in a sentence: it says so and writes nothing (07.11.2026)', async ({ page, context }) => {
  const errors = await open(page, context, '#/');
  await page.route('**/api/helper', (route) => (route.request().method() === 'OPTIONS' ? route.fulfill({ status: 204 }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, task: 'gemini', result: { text: '{"actions":[]}' } }) })));
  await putHelperCode(page);
  const glass = page.getByRole('button', { name: T('Search everything') });
  if (await glass.first().isVisible()) await glass.first().click();
  await page.locator('input[type="search"]:visible').first().fill('Heute war ein richtig schöner Tag');
  await page.locator('[data-ai-offer]:visible').click();
  await expect(page.locator('[data-ai-plan]:visible')).toContainText(T('Gemini found nothing to do in this sentence.'));
  expect(errors).toEqual([]);
});
