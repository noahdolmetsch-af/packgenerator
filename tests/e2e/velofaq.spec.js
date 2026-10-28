// «Velo-FAQ» (Noah 19.10.2026), German UI: the link on a bike's care card, the question of the day and
// «Andere Frage», the search, a question opens with its wink and its link, an own question added, changed,
// deleted and back with Undo. Fictional fixture plus test_data_gtp_ data; nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { FAQ } from '../../src/lib/velofaq.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));
const BIKE = JSON.parse(readFileSync(FIXTURE, 'utf8')).tables.bikes[0];
const SQUEAL = FAQ.find((f) => f.key === 'squeal');
const CREAK = FAQ.find((f) => f.key === 'creak');

const own = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('faqOwn');
      q.onsuccess = () => { r.result.close(); ok(q.result?.value ?? []); };
    };
  }));

test.beforeEach(async ({ page, context }) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('Velo-FAQ: from the bike card, question of the day, search, a question with its link', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  await page.locator('[data-velo-card] [data-link-faq]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Bike FAQ') })).toBeVisible();

  const day = page.locator('[data-faq-day]');
  const first = await day.getAttribute('data-faq-day');
  await page.locator('[data-faq-next]').click();
  await expect(day).not.toHaveAttribute('data-faq-day', first);

  await page.locator('[data-faq-search]').fill('quietschen');
  await expect(page.locator('[data-faq="squeal"]')).toBeVisible();
  await expect(page.locator('[data-faq="wash"]')).toHaveCount(0);
  await page.locator('[data-faq="squeal"] summary').click();
  await expect(page.locator('[data-faq="squeal"]')).toContainText(T(SQUEAL.wink));

  await page.locator('[data-faq-search]').fill('xyzzy');
  await expect(page.locator('[data-faq-none]')).toBeVisible();

  await page.locator('[data-faq-search]').fill('');
  await page.locator('[data-faq="creak"] summary').click();
  await page.locator('[data-faq="creak"] [data-faq-link]').click();
  await expect(page.getByRole('heading', { level: 1, name: T(CREAK.link.label) })).toBeVisible();
});

test('Velo-FAQ: own question added, changed, deleted and back with Undo', async ({ page }) => {
  await page.goto('./#/bikes?tab=care&view=faq');
  await page.locator('[data-faq-add]').click();
  await expect(page.getByRole('alert')).toContainText(T('Type a question.'));

  await page.locator('[data-faq-newq]').fill('test_data_gtp_ Welches Öl?');
  await page.locator('[data-faq-newa]').fill('test_data_gtp_ Nassöl im Herbst');
  await page.locator('[data-faq-add]').click();
  await expect.poll(async () => await own(page)).toMatchObject([{ q: 'test_data_gtp_ Welches Öl?', a: 'test_data_gtp_ Nassöl im Herbst' }]);

  await page.locator('[data-faq-own] [data-faq-edit]').click();
  await expect(page.locator('[data-faq-newq]')).toHaveValue('test_data_gtp_ Welches Öl?');
  await page.locator('[data-faq-newq]').fill('test_data_gtp_ Welches Kettenöl?');
  await page.locator('[data-faq-add]').click();
  await expect.poll(async () => (await own(page))[0]?.q).toBe('test_data_gtp_ Welches Kettenöl?');

  await page.locator('[data-faq-own] [data-faq-delete]').click();
  await page.getByRole('dialog', { name: T('Delete "{name}"?', { name: 'test_data_gtp_ Welches Kettenöl?' }) }).getByRole('button', { name: T('Delete') }).click();
  await expect.poll(async () => (await own(page)).length).toBe(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await own(page)).length).toBe(1);
});
