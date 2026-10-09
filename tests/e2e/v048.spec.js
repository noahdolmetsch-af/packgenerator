// v0.48.0 «Pflege-Übersicht + Teile pro Velo + Eingang/Notizen»: focused checks with the fictional
// v048 fixture (four bikes, the «Bergziege» without part data, problems, a receipt note, kept notes).
import { test, expect } from '@playwright/test';
import { v048File, P, SPARK, SCALE, GOAT } from './v048-fixture.js';

const SHOTS = process.env.V048_SHOTS;
const shot = async (page, info, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
    name,
  );

async function start(page, context, info) {
  const file = v048File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
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

test('Velos vergleichen: every bike a column, empty cells «–» to fill, two taps from Setup', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes');
  await page.getByRole('link', { name: 'Velos vergleichen', exact: true }).click();
  const region = page.getByRole('region', { name: 'Velos vergleichen' });
  await expect(region).toBeVisible();
  await expect(region.locator('thead')).toContainText(`${P} Bergziege 29`);
  // A value of the Spark, an empty cell of the Bergziege; tap it, fill it in, it is stored.
  await expect(region.getByRole('button', { name: new RegExp(`^${P} Scott Spark 960: Stack`) }).first()).toHaveText(/622/);
  const goat = region.getByRole('button', { name: new RegExp(`^${P} Bergziege 29: Stack`) }).first();
  await expect(goat).toHaveText('–');
  await goat.click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('textbox').fill('631');
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(goat).toHaveText(/631/);
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === GOAT).geometry?.stack).toBe(631);
  await noSideways(page);
  await shot(page, info, 'compare');
  expect(errors).toEqual([]);
});

test('Pflege overview: a ring per bike, at most 3 due cards, problems as one flat list', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=care');
  const ov = page.getByRole('region', { name: 'Pflege-Übersicht' });
  await expect(ov).toBeVisible();
  await expect(ov.locator('.ring')).toHaveCount(4);
  await expect(ov.getByRole('button', { name: `${P} Bergziege 29: noch keine Daten` })).toBeVisible();
  expect(await ov.locator('.dcard').count()).toBeLessThanOrEqual(3);
  await expect(ov.locator('.btn.hi')).toHaveCount(1);
  for (const p of ['Bremse hinten schleift', 'Kette knackt am Berg', 'Steuersatz hat Spiel']) await expect(ov).toContainText(p);
  // The Bergziege has no part data: its section offers the start values.
  await page.goto(`./#/bikes?tab=care&bike=${GOAT}&open=1`);
  await expect(page.locator(`#care-${GOAT}`).getByRole('button', { name: 'Startwerte erfassen' })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'pflege');
  expect(errors).toEqual([]);
});

test('Eingang: day groups, filed today stays faint with its target; a receipt becomes a workshop visit', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/inbox');
  await expect(page.getByRole('heading', { name: 'Eingang', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  // Filed today: faint, with the chip where it went and Undo.
  const filed = page.locator('li.filed').filter({ hasText: 'Bremse hinten schleift' });
  await expect(filed.locator('.tchip')).toContainText('Velopflege');
  await expect(filed.getByRole('button', { name: 'Rückgängig: zurück in den Eingang' })).toBeVisible();
  // The receipt photo: the suggestion is «Rechnungsbeleg».
  const rc = page.locator('li[data-note-id]').filter({ hasText: `${P} Foto Rechnung` });
  await expect(rc.locator('.sug')).toContainText('Vorschlag: Rechnungsbeleg');
  await rc.getByRole('button', { name: 'Ablegen' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.locator('.targets li')).toHaveCount(7);
  await expect(sheet.locator('.targets li').first()).toContainText('Vorschlag');
  await sheet.locator('[data-target=receipt]').click();
  await sheet.getByRole('button', { name: `${P} Bergziege 29` }).click();
  await expect(sheet.getByRole('button', { name: new RegExp(`${P} Velo shop`) })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByLabel('Betrag CHF').fill('127.50');
  await sheet.getByRole('button', { name: 'Kette ersetzt' }).click();
  await noSideways(page);
  await shot(page, info, 'ablegen-beleg');
  await sheet.getByRole('button', { name: 'Als Werkstattbesuch ablegen' }).click();
  await expect(sheet).toBeHidden();
  await expect.poll(async () => (await table(page, 'visits')).find((v) => v.bikeId === GOAT)).toMatchObject({ totalChf: 127.5, parts: [{ part: 'chain', action: 'replace' }] });
  const v = (await table(page, 'visits')).find((x) => x.bikeId === GOAT);
  expect(v.photos[0]).toMatch(/^data:image/);
  // The row stays, faint, its chip opens «Werkstatt & Belege» with the visit.
  const done = page.locator('li.filed').filter({ hasText: `${P} Foto Rechnung` });
  await expect(done.locator('.tchip')).toContainText(`Beleg · ${P} Bergziege 29`);
  await done.locator('a.tchip').click();
  await expect(page.getByRole('dialog')).toContainText(`${P} Velo shop`);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Werkstatt & Belege' })).toBeVisible();
  // «Abgelegt» finds it by the amount.
  await page.goto('./#/inbox');
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: /Abgelegt/ }).click();
  await page.getByPlaceholder('Suchen: Text, Laden, Velo, Betrag').fill('127.50');
  await expect(page.locator('.frow')).toHaveCount(1);
  // Undo takes the visit back.
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: /Offen/ }).click();
  await page.locator('li.filed').filter({ hasText: `${P} Foto Rechnung` }).getByRole('button', { name: 'Rückgängig: zurück in den Eingang' }).click();
  await expect.poll(async () => (await table(page, 'visits')).filter((x) => x.bikeId === GOAT).length).toBe(0);
  await shot(page, info, 'eingang');
  expect(errors).toEqual([]);
});

test('Notizen: capture with a checklist, a wish made from a note, one line on Today', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/notes');
  await expect(page.getByRole('heading', { name: 'Notizen', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Angeheftet/ })).toBeVisible();
  // Capture: the topic follows the text, a checklist line becomes a point.
  await page.getByLabel('Neue Notiz').fill(`${P} Isomatte vergleichen\n- 180 g leichter\n- Preis`);
  await expect(page.locator('.tools .hint')).toContainText('Thema: Material');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect.poll(async () => (await table(page, 'notes')).find((n) => n.title === `${P} Isomatte vergleichen`)).toMatchObject({ status: 'kept', topic: 'gear', checklist: [{ text: '180 g leichter', done: false }, { text: 'Preis', done: false }] });
  // Open it, make a wish from it: the note stays and links to the wish.
  await page.locator('article.ncard').filter({ hasText: `${P} Isomatte vergleichen` }).getByRole('button', { name: `${P} Isomatte vergleichen` }).click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('[data-make=wish]').click();
  await dlg.getByRole('button', { name: 'Auf die Wunschliste' }).click();
  await expect.poll(async () => (await table(page, 'items')).filter((i) => i.ownership === 'wishlist' && i.name === `${P} Isomatte vergleichen`).length).toBe(1);
  await expect.poll(async () => (await table(page, 'notes')).find((n) => n.title === `${P} Isomatte vergleichen`)?.links?.[0]?.kind).toBe('wish');
  await dlg.getByRole('button', { name: 'Fertig' }).click();
  await expect(dlg).toBeHidden();
  await noSideways(page);
  await shot(page, info, 'notizen');
  // Today: one line for the pinned note with an open checklist.
  await page.goto('./');
  const all = page.getByRole('region', { name: 'Heute wichtig' }).getByRole('button', { name: /^Alle \d+ zeigen/ });
  await all.click();
  await expect(page.getByText(`Notiz «${P} Jura-Wochenende: noch besorgen»: 1 Punkt offen`)).toBeVisible();
  expect(errors).toEqual([]);
});

test('no sideways scroll at 320 and 390 px on the new pages', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone widths');
  await start(page, context, info);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const hash of ['#/inbox', '#/notes', '#/bikes?tab=care', '#/bikes?tab=compare', '#/bikes?tab=shop', `#/bikes?tab=care&bike=${SPARK}&open=1`, `#/bikes?tab=care&bike=${SCALE}&open=1`]) {
      await page.goto(`./${hash}`);
      await page.waitForTimeout(300);
      await noSideways(page);
    }
  }
});
