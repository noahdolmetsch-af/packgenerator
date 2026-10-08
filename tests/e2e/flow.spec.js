// v0.21.0 (Noah's decision 7a): the whole trip loop in a real browser, on phone and desktop, in
// English and German. Runs on every pull request (npm run e2e), so a broken step can't be merged.
// start page → import the fictional fixture → New → Packing list → Standard set → Create trip
// → packing day (everything ticked, ready check done) → ride day → End trip and debrief → saved.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));

/** The same lookup as t() in src/lib/i18n.svelte.js, so selectors follow the app's own texts. */
const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Today in Zurich as YYYY-MM-DD (the app and the browser run in Europe/Zurich). */
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

for (const lang of ['en', 'de']) {
  test(`trip loop, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `E2E ${info.project.name} ${lang}`;
    const width = page.viewportSize().width;

    // Offline and deterministic: no Google Fonts, no weather, nothing outside the preview server.
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());

    /** No page may scroll sideways (390 px phone and 1440 px desktop). */
    const fits = async (where) => {
      const { sw, wide } = await page.evaluate((w) => ({
        sw: document.documentElement.scrollWidth,
        // the elements that stick out on the right, to make a failure easy to fix
        wide: [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > w + 1)
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(el.getBoundingClientRect().right)} px)`),
      }), width);
      expect(sw, `${where}: page is ${sw} px wide, viewport ${width} px; sticking out: ${wide.join(', ')}`).toBeLessThanOrEqual(width);
    };

    // 1. Start page; import the fictional data through "Your data → Import backup → Replace all data".
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    const data = page.locator('details.data');
    // the app opens this panel by itself on an empty start: make sure it ends up open
    await expect(async () => {
      if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
      expect(await data.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
    await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
    await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'fixture.json' }))).toBeVisible();
    await fits('start page');

    // 2. New → Packing list → Standard set (desktop: "New" in the top bar; phone: "+" in the bottom bar).
    const newBtn = page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true });
    await expect(newBtn).toHaveCount(1);
    const box = await newBtn.boundingBox();
    if (info.project.name === 'phone') expect(box.y, '"+" sits in the bottom bar').toBeGreaterThan(page.viewportSize().height / 2);
    else expect(box.y, '"New" sits in the top bar').toBeLessThan(100);
    await newBtn.click();
    const sheet = page.getByRole('dialog', { name: T('New') });
    await sheet.getByRole('button', { name: T('Plan a trip') }).click();
    await page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }).click();

    // 3. The trip dialog: name + today's date → Create trip.
    const tripDlg = page.getByRole('dialog', { name: T('New trip') });
    await expect(tripDlg).toBeVisible();
    await tripDlg.getByLabel(T('Name')).fill(title);
    await tripDlg.getByLabel(T('Start date')).fill(today());
    await fits('trip dialog');
    await tripDlg.getByRole('button', { name: T('Create trip') }).click();
    await expect(tripDlg).toBeHidden();

    // 4. Pack: a day ride's big button packs everything at once (v0.24.1, Noah 2a); this test
    // goes through the packing day by the "Packing check" link next to it.
    await expect(page).toHaveURL(/#\/pack/);
    const go = page.locator('.next .go');
    await expect(go).toContainText(T("All packed, let's go"));
    await fits('Pack');
    await page.locator('.next .day-check').click();

    // 5. Packing day: tick every item bag by bag, then the whole ready check.
    const day = page.getByRole('dialog', { name: T('Packing day: {title}', { title }) });
    await expect(day).toBeVisible();
    const next = new RegExp(`^${esc(T('Next: {step}', { step: '' }))}`);
    for (let guard = 0; guard < 20; guard++) {
      // every item (and on the last step every check) that is not ticked yet; wait for each tick
      const rows = day.locator('ul.items button[aria-pressed]');
      for (let i = 0, n = await rows.count(); i < n; i++) {
        if ((await rows.nth(i).getAttribute('aria-pressed')) === 'true') continue;
        await rows.nth(i).click();
        await expect(rows.nth(i)).toHaveAttribute('aria-pressed', 'true');
      }
      await fits(`packing day, step ${guard + 1}`);
      const fwd = day.getByRole('button', { name: next });
      if (!(await fwd.count())) break;
      await fwd.click();
    }
    await expect(day.getByRole('heading', { name: T('Ready check') })).toBeVisible();
    await expect(day.getByText(T('Everything is in. Have a good ride!'))).toBeVisible();
    await day.getByRole('button', { name: T('Done'), exact: true }).click();
    await expect(day).toBeHidden();

    // 6. Back in Pack the big button now leads to the ride day.
    await expect(go).toContainText(T('Next: ride day'));
    await fits('Pack, after the packing day');
    await go.click();
    await expect(page).toHaveURL(/#\/ride/);
    await expect(page.getByText(title).first()).toBeVisible();
    await fits('ride day');

    // 7. Ride day → End trip and debrief.
    await page.getByRole('button', { name: T('End trip and debrief'), exact: true }).click();
    await expect(page).toHaveURL(/#\/debrief\/./);

    // 8. Debrief: three steps, then save.
    await expect(page.getByRole('heading', { name: T('How did it go?') })).toBeVisible();
    for (const q of ['Weather, compared to what you packed for', 'How much did you take?', 'Bags and bike'])
      await page.getByRole('group', { name: T(q) }).getByRole('button').first().click();
    await fits('debrief, step 1');
    await page.getByRole('button', { name: T('Next: go through the items') }).click();
    await expect(page.getByRole('heading', { name: T('What did you use?') })).toBeVisible();
    await page.getByRole('button', { name: T('Not used'), exact: true }).first().click();
    await fits('debrief, step 2');
    await page.getByRole('button', { name: T('Next: summary') }).click();
    await fits('debrief, step 3');
    await page.getByRole('button', { name: T('Save debrief') }).click();
    await expect(page.getByText(T('Debrief saved'))).toBeVisible();
    await expect(page.getByRole('heading', { name: T('Saved') })).toBeVisible();

    // 9. The trip no longer waits for a debrief; it is listed as done.
    await page.goto('./#/debrief');
    const todo = page.getByRole('region', { name: T('To debrief') });
    await expect(todo).toBeVisible();
    await expect(todo.getByText(title)).toHaveCount(0);
    await expect(page.getByRole('region', { name: T('Done') }).getByText(title)).toBeVisible();
    await fits('Debrief overview');

    expect(errors, 'no page errors').toEqual([]);
  });
}
