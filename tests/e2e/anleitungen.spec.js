// «Anleitungen überall» (Noah 19.10.2026): every page with a new guide shows it as one line; a tap opens the
// three steps, «Einklappen» folds it again, × hides it. Empty app, German UI, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { GUIDE_INTROS, GUIDE_LATER } from '../../src/lib/guides.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

// the address of each page with a guide (the pages of Paket 2/3 come with their branches)
const WHERE = {
  planweek: '#/week/plan',
  away: '#/week/away',
  blockcheck: '#/blocks/check',
  lists: '#/me/lists',
  timer: '#/timer',
  routine: '#/routine',
  dreams: '#/trips/dreams',
  compass: '#/me/compass',
  supplies: '#/gear/supplies',
  lend: '#/gear/lend',
  toolbox: '#/me/tools',
  connections: '#/me/connections',
  docs: '#/me/docs',
  docscan: '#/me/docs/scan',
  merken: '#/calendar',
  reminders: '#/me/reminders',
  mountain: '#/mountain',
  alerts: '#/me/hinweise',
  checks: '#/me/checks',
  equipment: '#/equipment',
  chronik: '#/chronik',
  neuland: '#/neuland',
  quiz: '#/quiz',
  sports: '#/flow/sport/trip%3Agravel', // «Aktiv neu» (22.10.2026): the guide «Sportarten» is on a sport's page
  frei: '#/me/frei',
  tagebuch: '#/tagebuch',
};

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('every guide has its page', () => {
  expect(Object.keys(WHERE).sort()).toEqual(Object.keys(GUIDE_INTROS).filter((k) => !GUIDE_LATER.includes(k)).sort());
});

test('Guides: one line first, a tap opens the steps, fold again', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  for (const [place, hash] of Object.entries(WHERE)) {
    await page.goto(`./${hash}`);
    const line = page.locator(`[data-intro="${place}"][data-open="false"]`);
    await expect(line, place).toBeVisible();
    // Gesamttest 20.10.2026 «2a» (changed on purpose): one quiet line «So geht's» on every page
    await expect(line, place).toContainText(T('How it works|help'));
    await line.click();
    const card = page.locator(`[data-intro="${place}"][data-open="true"]`);
    await expect(card, place).toContainText(T(GUIDE_INTROS[place].title));
    await expect(card, place).toContainText(T(GUIDE_INTROS[place].things[0].title));
    await card.getByRole('button', { name: T('Fold') }).click();
    await expect(line, place).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('× hides a guide; the Handbook brings it back', async ({ page }) => {
  await page.goto('./#/gear/supplies');
  await page.locator('[data-intro="supplies"][data-open="false"]').click();
  await page.locator('[data-intro="supplies"][data-open="true"]').getByRole('button', { name: T('Hide the introduction') }).click();
  await expect(page.locator('[data-intro="supplies"]')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: T('Supplies'), level: 1 })).toBeVisible();
  await expect(page.locator('[data-intro="supplies"]')).toHaveCount(0);
});
