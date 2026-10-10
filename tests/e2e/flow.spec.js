// v0.21.0 (Noah's decision 7a): the whole trip loop in a real browser, on phone and desktop, in
// English and German. Runs on every pull request (npm run e2e), so a broken step can't be merged.
// start page → import the fictional fixture → New → Packing list → Standard set → Create trip
// → Pack (everything ticked bag by bag, ready check done) → On the way → Tour beendet → saved on one page.
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
    // v0.74.0 «Fünf Orte»: on a computer «+ Neu» sits at the top of the sidebar
    else expect(box.y, '"New" sits at the top of the sidebar').toBeLessThan(200);
    await newBtn.click();
    const sheet = page.getByRole('dialog', { name: T('New') });
    await sheet.getByRole('button', { name: T('Plan a trip') }).click(); // v0.30.0: the window starts with the standard set

    // 3. The trip dialog: name + today's date → Create trip.
    const tripDlg = page.getByRole('dialog', { name: T('New trip') });
    await expect(tripDlg).toBeVisible();
    await tripDlg.getByLabel(T('Name')).fill(title);
    await tripDlg.getByLabel(T('Start date')).fill(today());
    await fits('trip dialog');
    await tripDlg.getByRole('button', { name: T('Create trip') }).click();
    await expect(tripDlg).toBeHidden();

    // 4. Plan (v0.29.0): the band with the four tabs; a day ride's one orange button packs everything
    // at once (v0.24.1, Noah 2a); this test goes through Pack bag by bag (the "Pack" tab in the band).
    await expect(page).toHaveURL(/#\/pack/);
    const steps = page.getByRole('navigation', { name: T('Steps of this trip') });
    await expect(steps.getByRole('link')).toHaveText([T('Plan|stage'), T('Pack|stage'), T('On the way'), T('Debrief')].map((n) => new RegExp(`^${esc(n)}`)));
    const go = page.locator('.trip-band .go');
    await expect(go).toContainText(T("All packed, let's go"));
    await fits('Plan');
    await steps.getByRole('link', { name: new RegExp(`^${esc(T('Pack|stage'))}`) }).click();

    // 5. Pack: a normal page (Noah 2a). Tick every item; a full bag jumps to the next one by itself,
    // the ready check is the last "bag".
    await expect(page).toHaveURL(/#\/pack\?day/);
    await expect(steps.locator('[aria-current="page"]')).toContainText(T('Pack|stage'));
    const missed = [];
    // what the page shows as done: packed rows, ticked checks and the bag that is open
    const pressed = () => page.locator('.pd').evaluate((el) => `${el.querySelector('.pbag.cur .bagh')?.innerText} ${el.querySelectorAll('[aria-pressed="true"]').length}`);
    for (let guard = 0; guard < 60; guard++) {
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
    await fits('Pack');
    await expect(page.locator('.pd .pbag.cur .bagfoot, .pd').getByText(T('Everything is in. Have a good ride!')), `bags after packing: ${left}; status: ${await page.locator('.pd p[role=status]').first().innerText()}`).toBeVisible();

    // 6. The one orange button now finishes packing; a day ride goes straight on to On the way
    // (v0.67.0 «Übergänge 1», Ü5a: no «Gepackt» page for a day ride).
    await expect(go).toContainText(T('Finish packing'));
    await go.click();
    await expect(page).toHaveURL(/#\/ride/);
    await expect(page.getByText(title).first()).toBeVisible();
    await fits('On the way');

    // 7. On the way → «Tour abschliessen» (v0.67.0): before the planned end of the ride (the real clock
    // runs here) it asks first (U004); then «Tour beendet» and from there the whole debrief.
    await expect(go).toContainText(T('Finish the trip'));
    await go.click();
    const endSheet = page.locator('dialog.endsheet');
    const ended = page.getByRole('heading', { level: 1, name: T('Trip ended') });
    await expect(endSheet.or(ended)).toBeVisible();
    if (await endSheet.isVisible()) await endSheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
    await expect(ended).toBeVisible();
    await page.getByRole('link', { name: T('Debrief in detail') }).click();
    await expect(page).toHaveURL(/#\/debrief\/./);

    // 8. Debrief on one page (Noah 9a): everything filled in; one tap per exception, then save.
    await expect(page.getByRole('heading', { name: T('What was different?') })).toBeVisible();
    const fold = page.locator('details.items-fold');
    if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
    await fold.getByRole('button', { name: new RegExp(esc(T('{name}: {state}. Tap to change.', { name: '', state: T('Used') }).trim())) }).first().click();
    await expect(page.locator('ul.exc').first().getByRole('button', { name: new RegExp(esc(T('Not used'))) })).toHaveCount(1);
    await fits('debrief');
    await page.getByRole('button', { name: T('Save debrief') }).click();
    await expect(page.locator('.saved-card').getByText(T('Debrief saved'))).toBeVisible();
    await expect(page.getByRole('heading', { name: T('Saved') })).toBeVisible();

    // 9. The trip no longer waits for a debrief; it is listed as done.
    // v0.40.0 (Noah 3a): one list of past trips with the debrief state; the Debrief page links to it.
    await page.goto('./#/debrief');
    await expect(page.getByRole('heading', { name: T('Look back|page'), level: 1 })).toBeVisible();
    await fits('Debrief overview');
    await page.goto('./#/pack/past');
    // v0.49.0 R1: one table; a done trip has no «Debrief open» badge.
    const pastRow = page.locator('table.tt tbody tr').filter({ hasText: title });
    await expect(pastRow).toBeVisible();
    await expect(pastRow.locator('.nbadge')).toHaveCount(0);
    await fits('Past trips');

    expect(errors, 'no page errors').toEqual([]);
  });
}
