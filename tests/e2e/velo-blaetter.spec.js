// v0.69.0 «Velo-Blätter»: the folder of sheets per bike (Velos › Setup and the open bike in Care),
// the Bike pass with values from the data and empty lines «eintragen», the Service plan, the
// Workshop order (jobs taken off, wishes) and the Pick-up check (ticks stored, work taken into care
// with a start point, Undo). Fictional data only (velo-blaetter-fixture.js).
import { test, expect } from '@playwright/test';
import { vbFile, TRAIL, REPAIR, P } from './velo-blaetter-fixture.js';
import { readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';

// the sheets in the folder's order, read from the app source (sheets.js imports the Svelte i18n, so it is read as text)
const SRC = readFileSync(new URL('../../src/lib/sheets.js', import.meta.url), 'utf8');
const SHEETS = [...SRC.slice(SRC.indexOf('export const SHEETS'), SRC.indexOf('];', SRC.indexOf('export const SHEETS'))).matchAll(/\{ key: '(\w+)', name: '([^']+)'/g)].map((m) => ({ key: m[1], name: m[2] }));

const SHOTS = process.env.VB_SHOTS;
const shot = async (page, info, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const stored = (page, name, key) =>
  page.evaluate(
    ([name, key]) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction(name).objectStore(name).get(key);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
    [name, key],
  );

async function start(page, context, info) {
  const file = vbFile(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    // the clipboard and the print dialog are replaced: the test reads what would have been copied or printed
    window.__copied = [];
    window.__printed = 0;
    Object.defineProperty(Navigator.prototype, 'clipboard', { value: { writeText: async (s) => window.__copied.push(s) }, configurable: true });
    window.print = () => (window.__printed += 1);
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}
// v0.70.0 (W1 a): «Demo Trail» has more than 500 km, so its folder shows every sheet but the Break-in plan
const OLD = SHEETS.filter((s) => s.key !== 'breakin');
const names = OLD.map((s) => DE[s.name]);

test('the folder of a bike: its sheets, each can be hidden and shown again; whole folder as PDF', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${TRAIL}`);
  const folder = page.locator('section.folder');
  await expect(folder.getByRole('heading', { name: `${OLD.length} Blätter zu diesem Velo` })).toBeVisible();
  await expect(folder.locator('a.sheet .nm')).toHaveText(names);
  await expect(folder.locator('[data-sheet="pickup"] .st')).toHaveText('noch nicht begonnen');
  await expect(folder.locator('[data-sheet="order"] .st')).toHaveText(/\d+ Arbeiten?/);
  await shot(page, info, 'mappe');
  await noSideways(page);

  // «Blätter wählen»: the Service plan off, then on again (stored on the bike)
  await folder.getByRole('button', { name: 'Blätter wählen' }).click();
  await folder.getByRole('checkbox', { name: 'Service-Plan' }).uncheck();
  await expect(folder.locator('a.sheet')).toHaveCount(OLD.length - 1);
  await expect(folder.getByText('1 Blatt ausgeblendet.', { exact: false })).toBeVisible();
  expect((await stored(page, 'bikes', TRAIL)).sheets.hidden).toEqual(['plan']);
  await folder.getByRole('checkbox', { name: 'Service-Plan' }).check();
  await expect(folder.locator('a.sheet')).toHaveCount(OLD.length);

  // the whole folder: every shown sheet one after the other, «Als PDF teilen» opens the print dialog
  await folder.getByRole('link', { name: 'Ganze Mappe als PDF' }).click();
  await expect(page.locator('article.paper')).toHaveCount(OLD.length);
  await page.getByRole('button', { name: 'Als PDF teilen' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  // only the paper prints: the toolbar and the page head are hidden in print
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.sheetview .bar')).toBeHidden();
  await expect(page.locator('.bikes > .head')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  expect(errors).toEqual([]);
});

test('the Bike pass: values from Setup and the parts, an empty line «eintragen» leads to where it is edited, copy as text', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${TRAIL}`);
  await page.locator('section.folder a[data-sheet="pass"]').click();
  const paper = page.locator('article.paper[data-sheet="pass"]');
  await expect(paper.getByRole('heading', { name: 'Velo-Pass' })).toBeVisible();
  const row = (label) => paper.locator('.vr').filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd');
  await expect(row('Gabeldruck')).toHaveText('72 psi');
  await expect(row('Sitzhöhe')).toHaveText('745 mm');
  await expect(row('Federweg Gabel')).toHaveText('140 mm');
  await expect(row('Reifen')).toHaveText('Demo Pneu 29 × 2.4');
  await expect(row('Tubeless')).toHaveText('ja');
  await expect(row('Lenkerbreite').getByRole('link', { name: 'eintragen' })).toBeVisible();
  await shot(page, info, 'velo-pass');
  await noSideways(page);

  await page.getByRole('button', { name: 'Text kopieren' }).click();
  await expect(page.getByText('Kopiert.', { exact: false })).toBeVisible();
  const text = (await page.evaluate(() => window.__copied)).at(-1);
  expect(text).toContain('Velo-Pass');
  expect(text).toContain('Gabeldruck: 72 psi');
  expect(text).toContain('Lenkerbreite: –');

  // «eintragen» goes to Setup, where the fit values are edited
  await row('Lenkerbreite').getByRole('link', { name: 'eintragen' }).click();
  await expect(page).toHaveURL(new RegExp(`#/bikes\\?bike=${TRAIL}$`));
  await expect(page.locator('section.fit')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the Service plan lists the parts with interval, last work and the next time', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${TRAIL}&sheet=plan`);
  const paper = page.locator('article.paper[data-sheet="plan"]');
  await expect(paper.getByRole('heading', { name: 'Service-Plan' })).toBeVisible();
  const chain = paper.locator('tbody tr').filter({ has: page.locator('th', { hasText: /^Kette$/ }) });
  await expect(chain.locator('td').first()).toHaveText(/alle 150 km · bei 0.5 % ersetzen/);
  await expect(paper.locator('tbody tr').filter({ has: page.locator('th', { hasText: /^Gabel$/ }) }).locator('td').first()).toHaveText('jährlich');
  await shot(page, info, 'service-plan');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Workshop order from Workshop & receipts: a job taken off and the wishes stay; the text for the shop', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=shop&bike=${TRAIL}`);
  await page.getByRole('link', { name: 'Werkstatt-Auftrag' }).click();
  const paper = page.locator('article.paper[data-sheet="order"]');
  await expect(paper.getByRole('heading', { name: 'Werkstatt-Auftrag' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Werkstatt & Belege' })).toBeVisible(); // back to where it was opened
  const jobs = paper.locator('.checks li');
  const n = await jobs.count();
  expect(n).toBeGreaterThan(1);
  const repair = jobs.filter({ hasText: `${P} Knacken im Tretlager` });
  await repair.getByRole('checkbox').uncheck();
  await expect(repair).toHaveClass(/off/);
  await expect.poll(async () => (await stored(page, 'bikes', TRAIL)).sheets?.orderOff).toEqual([`repair:${REPAIR}`]);
  await paper.getByRole('textbox').fill('Bitte vorher anrufen');
  await paper.getByRole('heading', { name: 'Werkstatt-Auftrag' }).click(); // leaving the field saves
  await expect.poll(async () => (await stored(page, 'bikes', TRAIL)).sheets?.wishes).toBe('Bitte vorher anrufen');
  await shot(page, info, 'werkstatt-auftrag');
  await noSideways(page);

  await page.getByRole('button', { name: 'Text kopieren' }).click();
  const text = (await page.evaluate(() => window.__copied)).at(-1);
  expect(text).toContain('Grüezi');
  expect(text).toContain('Wünsche: Bitte vorher anrufen');
  expect(text).toContain('Gabeldruck 72 psi');
  expect(text).not.toContain('Knacken');

  // after a reload the job is still off; ticking it again brings it back
  await page.reload();
  await expect(paper.locator('.checks li.off')).toHaveCount(1);
  await paper.locator('.checks li.off').getByRole('checkbox').check();
  await expect(paper.locator('.checks li.off')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Pick-up check from Care: ticks stay saved; the ticked work goes into care with a start point; Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${TRAIL}&open=1`);
  const care = page.locator(`#care-${TRAIL}`);
  await care.locator('nav.fline').getByRole('link', { name: 'Abhol-Check' }).click();
  const paper = page.locator('article.paper[data-sheet="pickup"]');
  await expect(paper.getByRole('heading', { name: 'Abhol-Check' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Pflege: / })).toBeVisible();
  await expect(paper.getByRole('heading', { name: '1 · Auftrag erledigt?' })).toBeVisible();
  const take = page.getByRole('button', { name: 'Abgehakte Arbeiten in die Pflege übernehmen' });
  await expect(take).toBeDisabled();

  const job = (re) => paper.locator('section').first().locator('.checks li').filter({ hasText: re });
  await job(/Gabel/).getByRole('checkbox').check();
  await paper.locator('.checks li').filter({ hasText: 'Bremsen ziehen' }).getByRole('checkbox').check();
  await expect.poll(async () => Object.values((await stored(page, 'bikes', TRAIL)).sheets?.pickup?.ticks ?? {}).filter(Boolean).length).toBe(2);
  await page.reload();
  await expect(paper.locator('input[type="checkbox"]:checked')).toHaveCount(2);
  await shot(page, info, 'abhol-check');
  await noSideways(page);

  const before = (await stored(page, 'bikes', TRAIL)).parts.find((p) => p.key === 'fork').history.length;
  await take.click();
  await expect(page.locator('p.notice')).toContainText('In die Pflege übernommen: Gabel');
  const fork = (await stored(page, 'bikes', TRAIL)).parts.find((p) => p.key === 'fork');
  expect(fork.history).toHaveLength(before + 1);
  expect(fork.history.at(-1)).toMatchObject({ action: 'service', result: 'done', by: 'shop' });
  await expect(paper.getByText('in die Pflege übernommen', { exact: false })).toBeVisible();
  await expect(paper.locator('input[type="checkbox"]:checked')).toHaveCount(2); // the ticks stay

  // Undo: the entry goes, the check is open again
  await page.locator('p.notice').getByRole('button', { name: 'Rückgängig' }).click();
  await expect.poll(async () => (await stored(page, 'bikes', TRAIL)).parts.find((p) => p.key === 'fork').history.length).toBe(before);
  await expect(take).toBeEnabled();
  expect(errors).toEqual([]);
});
