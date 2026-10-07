// v0.21.0 (package 5): a trip without a bike, on phone and desktop, in English and German.
// start page → import the fictional fixture → New → Packing list → area Weekend → Items of this area
// → Create trip → add an item → packing day → Next: debrief (ends the trip) → saved.
// Then Gear filtered by area and the page "All my favourite things".
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));

/** The same lookup as t() in src/lib/i18n.svelte.js. */
const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

for (const lang of ['en', 'de']) {
  test(`weekend trip loop, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `E2E weekend ${info.project.name} ${lang}`;
    const width = page.viewportSize().width;
    const phone = info.project.name === 'phone';

    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    const fits = async (where) => {
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, `${where}: page is ${sw} px wide, viewport ${width} px`).toBeLessThanOrEqual(width);
    };

    // 1. Import the fictional data.
    await page.goto('./');
    const data = page.locator('details.data');
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
    await data.getByRole('button', { name: T('Replace all data') }).click();
    await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'fixture.json' }))).toBeVisible();

    // 2. New → Packing list → the area first: Weekend → Items of this area.
    await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
    await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Packing list') }).click();
    const list = page.getByRole('dialog', { name: T('New packing list') });
    await list.getByRole('group', { name: T('Area') }).getByRole('button', { name: T('Weekend'), exact: true }).click();
    await fits('New packing list, weekend');
    await list.getByRole('button', { name: T('Items of this area') }).click();

    // 3. The trip dialog keeps Weekend and asks no bike.
    const tripDlg = page.getByRole('dialog', { name: T('New trip') });
    await expect(tripDlg).toBeVisible();
    await expect(tripDlg.getByRole('button', { name: T('Weekend'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(tripDlg.getByLabel(T('Bike'))).toHaveCount(0);
    await tripDlg.getByLabel(T('Name')).fill(title);
    await tripDlg.getByLabel(T('Start date')).fill(today());
    await fits('trip dialog, weekend');
    await tripDlg.getByRole('button', { name: T('Create trip') }).click();
    await expect(tripDlg).toBeHidden();

    // 4. Pack: no bike, no ride day; the weekend bags.
    await expect(page.locator('.head .tags')).toContainText(T('Weekend'));
    const steps = page.locator('.next .steps li');
    await expect(steps).toHaveCount(3);
    await expect(page.locator('.next .steps')).not.toContainText(T('Ride day'));
    await expect(page.locator('.stage .bike')).toHaveCount(0);
    await fits('Pack, weekend');

    // 5. Add an item of the area ("Paperback book" is optional, so not on the list yet).
    const addBtn = page.getByRole('button', { name: T('Add {name} to {bag}', { name: 'Paperback book', bag: T('Travel bag') }) });
    if (phone) await page.getByRole('tab', { name: new RegExp(`^${esc(T('Add'))}`) }).click();
    const grp = page.locator('.np .gh', { hasText: T('Comfort & luxury') });
    if (!(await addBtn.isVisible())) await grp.click();
    await addBtn.click();
    await expect(addBtn).toHaveCount(0);
    if (phone) await page.getByRole('tab', { name: new RegExp(`^${esc(T('Pack'))}`) }).click();
    await expect(page.locator('.blist').getByText('Paperback book')).toBeVisible();

    // 6. Packing day: tick everything, then the ready check.
    const go = page.locator('.next .go');
    await expect(go).toContainText(T('Next: packing day'));
    await go.click();
    const day = page.getByRole('dialog', { name: T('Packing day: {title}', { title }) });
    await expect(day).toBeVisible();
    const next = new RegExp(`^${esc(T('Next: {step}', { step: '' }))}`);
    for (let guard = 0; guard < 10; guard++) {
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
    await expect(day.getByText(T('Everything is in. Have a good trip!'))).toBeVisible();
    await day.getByRole('button', { name: T('Done'), exact: true }).click();
    await expect(day).toBeHidden();

    // 7. No ride day: the big button goes straight to the debrief.
    await expect(go).toContainText(T('Next: debrief'));
    await fits('Pack, weekend packed');
    await go.click();
    await expect(page).toHaveURL(/#\/debrief\/./);

    // 8. Debrief: three steps, then save.
    await expect(page.getByRole('heading', { name: T('How did it go?') })).toBeVisible();
    for (const q of ['Weather, compared to what you packed for', 'How much did you take?', 'Bags'])
      await page.getByRole('group', { name: T(q), exact: true }).getByRole('button').first().click();
    await fits('debrief, weekend');
    await page.getByRole('button', { name: T('Next: go through the items') }).click();
    await expect(page.getByRole('heading', { name: T('Travel bag') })).toBeVisible();
    await page.getByRole('button', { name: T('Not used'), exact: true }).first().click();
    await page.getByRole('button', { name: T('Next: summary') }).click();
    await page.getByRole('button', { name: T('Save debrief') }).click();
    await expect(page.getByText(T('Debrief saved'))).toBeVisible();
    await page.goto('./#/debrief');
    await expect(page.getByRole('region', { name: T('Done') }).getByText(title)).toBeVisible();

    // 9. Gear: the area filter shows only weekend items.
    await page.goto('./#/gear');
    await page.getByLabel(T('Area'), { exact: true }).selectOption('weekend');
    await expect(page.locator('.rows').getByText('Paperback book')).toBeVisible();
    await expect(page.locator('.rows').getByText('Bib shorts')).toHaveCount(0);
    await fits('Gear');

    // 10. All my favourite things, by area.
    await page.goto('./#/favorites');
    await expect(page.getByRole('heading', { name: T('All my favourite things') })).toBeVisible();
    const wk = page.getByRole('region', { name: new RegExp(`^${esc(T('Weekend'))}`) });
    await expect(wk.getByRole('link', { name: 'Paperback book' })).toHaveAttribute('href', '#/gear?q=Paperback%20book');
    await expect(wk.getByText('Always one chapter before sleep')).toBeVisible();
    await fits('favourites');

    expect(errors, 'no page errors').toEqual([]);
  });
}
