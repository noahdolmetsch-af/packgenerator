// v0.21.0 (package 5): a trip without a bike, on phone and desktop, in English and German.
// start page → import the fictional fixture → New → Plan a trip → area Weekend (in the New trip window)
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
    // the app opens this panel by itself on an empty start: make sure it ends up open
    await expect(async () => {
      if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
      expect(await data.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
    await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
    await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'fixture.json' }))).toBeVisible();

    // 2. New → Plan a trip → the area: Weekend (v0.30.0: in the New trip window; it starts with the area's items).
    await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
    await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
    const tripDlg = page.getByRole('dialog', { name: T('New trip') });
    await expect(tripDlg).toBeVisible();
    await tripDlg.getByRole('group', { name: T('Area') }).getByRole('button', { name: T('Weekend'), exact: true }).click();
    await fits('New packing list, weekend');

    // 3. The trip dialog keeps Weekend and asks no bike.
    await expect(tripDlg.getByRole('button', { name: T('Weekend'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(tripDlg.getByLabel(T('Bike'))).toHaveCount(0);
    await tripDlg.getByLabel(T('Name')).fill(title);
    await tripDlg.getByLabel(T('Start date')).fill(today());
    await fits('trip dialog, weekend');
    await tripDlg.getByRole('button', { name: T('Create trip') }).click();
    await expect(tripDlg).toBeHidden();

    // 4. Plan: no bike, no "On the way"; the weekend bags.
    await expect(page.locator('.trip-band .meta')).toContainText(T('Weekend'));
    const steps = page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link');
    await expect(steps).toHaveCount(3);
    await expect(page.getByRole('navigation', { name: T('Steps of this trip') })).not.toContainText(T('On the way'));
    await fits('Pack, weekend');

    // 5. Add an item of the area ("Paperback book" is optional, so not on the list yet).
    const addBtn = page.getByRole('button', { name: T('Add {name} to {bag}', { name: 'Paperback book', bag: T('Travel bag') }) });
    await page.getByRole('button', { name: T('Add material'), exact: true }).click();
    await page.getByLabel(T('Adding to'), { exact: true }).selectOption('bag');
    const grp = page.locator('.np .gh', { hasText: T('Comfort & luxury') });
    if (!(await addBtn.isVisible())) await grp.click();
    await addBtn.click();
    await expect(addBtn).toHaveCount(0);
    await page.getByRole('dialog', { name: T('Add material'), exact: true }).getByRole('button', { name: T('Done'), exact: true }).click();
    await page.getByRole('button', { name: new RegExp(esc(T('Travel bag'))) }).click();
    await expect(page.locator('.blist').getByText('Paperback book')).toBeVisible();

    // 6. Pack (v0.29.0, a normal page): tick everything bag by bag, then the ready check.
    const go = page.locator('.trip-band .go');
    await expect(go).toContainText(T('Next: Pack'));
    await go.click();
    await expect(page).toHaveURL(/#\/pack\?day/);
    // wait for the bags: on a slow CI machine the loop below found no rows yet and stopped at once (8.10.2026)
    await expect(page.locator('.pd .pbag').first()).toBeVisible();
    await expect(page.locator('.pd ul.items button').first()).toBeVisible();
    const missed = [];
    // what the page shows as done: packed rows, ticked checks and the bag that is open
    const pressed = () => page.locator('.pd').evaluate((el) => `${el.querySelector('.pbag.cur .bagh')?.innerText} ${el.querySelectorAll('[aria-pressed="true"]').length}`);
    for (let guard = 0; guard < 80; guard++) {
      const open = page.locator('.pd ul.items button[aria-pressed="false"]:not([disabled])');
      if (await open.count()) {
        // a full bag may just have closed: note why a click did not land, so a failure says it
        // wait until the tap shows before the next one: a second tap on a row that still looks open
        // would take the item out again (a slow CI machine did exactly that, 8.10.2026)
        const before = await pressed();
        await open.first().click({ timeout: 3000 }).catch((e) => missed.push(e.message.split('\n')[0]));
        await expect.poll(pressed, { timeout: 3000 }).not.toBe(before).catch(() => {});
        continue;
      }
      const closed = page.locator('.pd .pbag:not(.done):not(.cur) .bagh');
      if (await closed.count()) {
        await closed.first().click({ timeout: 3000 }).catch((e) => missed.push(e.message.split('\n')[0]));
        continue;
      }
      break;
    }
    const left = await page.locator('.pd').evaluate((el) => [...el.querySelectorAll('.pbag')].map((b) => `${b.className}: ${b.querySelector('.bagh')?.innerText.replace(/\s+/g, ' ')}`).join(' | '));
    expect(missed.length, `clicks that did not land: ${missed.slice(-3).join(' / ')}; bags: ${left}`).toBeLessThan(10);
    await fits('Pack, weekend');
    await expect(page.locator('.pd').getByText(T('Everything is in. Have a good trip!')), `bags after packing: ${left}; status: ${await page.locator('.pd p[role=status]').first().innerText()}`).toBeVisible();

    // 7. No "On the way": the one orange button goes straight to the debrief.
    await expect(go).toContainText(T('Next: Debrief'));
    await fits('Pack, weekend packed');
    await go.click();
    await expect(page).toHaveURL(/#\/debrief\/./);

    // 8. Debrief on one page: one exception, then save.
    await expect(page.getByRole('heading', { name: T('What was different?') })).toBeVisible();
    await expect(page.locator('.qa select')).toHaveCount(3); // no bike: no km
    await expect(page.locator('.qa select').nth(2)).toHaveValue('fine');
    await fits('debrief, weekend');
    const fold = page.locator('details.items-fold');
    if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
    await expect(fold.getByRole('region', { name: T('Travel bag') })).toBeVisible();
    await fold.locator('button.state').first().click();
    await expect(fold.locator('button.state.unused')).toHaveCount(1);
    await page.getByRole('button', { name: T('Save debrief') }).click();
    await expect(page.locator('.saved-card').getByText(T('Debrief saved'))).toBeVisible();
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
