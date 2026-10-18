// FE1, FE13, FE14, FE16 (Noah 13.10.2026: FE1 «b», FE13/FE14/FE16 «a»): Daumen-Zone, Farbe nie allein,
// «?» an Ort und Stelle, passende Handy-Tastatur. The big fictional data set of the Gesamttest
// (test_data_gtp_), German, phone + desktop. FE_SHOTS=<dir> also writes screenshots.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { start, DE } from './gesamttest/lib.js';
import { SIGN, FIELD_HELP } from '../../src/lib/daumen.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const phoneOf = (info) => info.project.name === 'phone';

async function shot(page, info, name) {
  const dir = process.env.FE_SHOTS;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${dir}/${name}-${phoneOf(info) ? 390 : 1440}.png` });
}

/** The top edge of the bottom bar (the viewport's height on a computer, where there is none). */
const barTop = (page) =>
  page.evaluate(() => {
    const nav = document.querySelector('nav.bottom');
    return nav && nav.checkVisibility() ? nav.getBoundingClientRect().top : innerHeight;
  });

/** On a phone the main button sits at the bottom, just above the bottom bar; on a computer it stays up. */
async function expectThumb(page, info, button) {
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  if (phoneOf(info)) {
    const top = await barTop(page);
    expect(box.y + box.height).toBeLessThanOrEqual(top);
    expect(box.y + box.height).toBeGreaterThan(top - 80);
    // the page ends with room for the bar: its last content is not covered
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const last = await page.evaluate(() => {
      const els = [...document.querySelectorAll('main *')].filter((e) => e.checkVisibility() && !e.closest('.daumen') && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().height > 0);
      return Math.max(...els.map((e) => e.getBoundingClientRect().bottom));
    });
    const bar = await button.evaluate((b) => b.closest('.daumen').getBoundingClientRect().top);
    expect(last).toBeLessThanOrEqual(bar + 1);
  } else {
    expect(box.y).toBeLessThan(500);
    await expect(button.locator('xpath=..')).toHaveCSS('display', 'contents');
  }
}

test('FE1 Daumen-Zone: the main button at the bottom on a phone, Save stays in sight', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/gear');
  const add = page.locator('main .addb');
  await expectThumb(page, info, add);
  await shot(page, info, 'fe1-material');

  await page.goto('./#/trips');
  await expectThumb(page, info, page.locator('[data-plan-new]'));
  await page.goto('./#/pack/templates');
  await expectThumb(page, info, page.locator('main .daumen > .btn'));

  // The window «Teil hinzufügen»: with «Mehr Angaben» open the fields scroll, «Speichern» stays in sight.
  await page.goto('./#/gear');
  await page.locator('main .addb').click();
  const dlg = page.locator('dialog[open]');
  await dlg.locator('details.more > summary').click();
  const save = dlg.getByRole('button', { name: T('Save'), exact: true });
  await expect(save).toBeInViewport();
  if (phoneOf(info)) {
    await expect(dlg.locator('.daumen-foot')).toHaveCSS('position', 'sticky');
    const d = await dlg.boundingBox();
    const s = await save.boundingBox();
    expect(s.y + s.height).toBeLessThanOrEqual(d.y + d.height);
    expect(await dlg.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  } else {
    await expect(dlg.locator('.daumen-foot')).not.toHaveCSS('position', 'sticky');
  }
  await shot(page, info, 'fe1-dialog');
  expect(errors).toEqual([]);
});

test('FE13 Farbe nie allein: every coloured status carries a sign', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const signs = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.pill.ok, .pill.warn, .pill.bad, .udot, [data-sign]:not([data-sign=""]), .tp-badge.warn, .tp-badge.hi')]
        .filter((e) => e.checkVisibility())
        .map((e) => getComputedStyle(e, '::before').content),
    );
  // Velopflege: the dots of «Jetzt fällig»
  await page.goto('./#/care');
  await expect(page.locator('main .udot').first()).toBeVisible();
  const care = await signs();
  expect(care.length).toBeGreaterThan(0);
  for (const c of care) expect(c).toMatch(new RegExp(`[${SIGN.ok}${SIGN.warn}]`));
  await shot(page, info, 'fe13-pflege');
  // the sign is not part of the words: the dot stays hidden, a pill keeps its text as its name
  await expect(page.locator('main .udot').first()).toHaveAttribute('aria-hidden', 'true');
  expect(errors).toEqual([]);
});

test('FE14 help in place: a tap shows the sentence, again hides it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/gear');
  await page.locator('main .addb').click();
  const dlg = page.locator('dialog[open]');
  const q = dlg.getByRole('button', { name: T('Explain'), exact: true });
  const grams = dlg.locator('#it-grams');
  await expect(q).toHaveAttribute('aria-expanded', 'false');
  await q.click();
  await expect(q).toHaveAttribute('aria-expanded', 'true');
  const help = dlg.getByRole('note');
  await expect(help).toHaveText(T(FIELD_HELP.grams));
  const id = await help.getAttribute('id');
  await expect(grams).toHaveAttribute('aria-describedby', new RegExp(id));
  await expect(q).toHaveAttribute('aria-describedby', id);
  // the field keeps its own name (the «?» sits outside its label)
  await expect(dlg.getByLabel(T('Weight of one piece (g)'))).toHaveAttribute('id', 'it-grams');
  await shot(page, info, 'fe14-teil');
  await q.click();
  await expect(help).toHaveCount(0);
  await expect(grams).not.toHaveAttribute('aria-describedby', new RegExp(id));
  await page.keyboard.press('Escape');

  // Touren: «Fahrzeit» and «Verstrichen» explain themselves once above the list (Impeccable Touren 2)
  await page.goto('./#/trips');
  const vals = page.locator('[data-values-help]');
  const moving = vals.getByRole('button', { name: `${T('Explain: {what}').replace('{what}', T('Moving time|col'))}` });
  await moving.click();
  await expect(vals.getByRole('note')).toHaveText(T(FIELD_HELP.moving));
  await shot(page, info, 'fe14-touren');
  await moving.click();
  await expect(vals.getByRole('note')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('FE16 Handy-Tastatur: number pad, Next to the next field, Done on the last', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/gear');
  await page.locator('main .addb').click();
  const dlg = page.locator('dialog[open]');
  const name = dlg.getByRole('textbox', { name: new RegExp(`^${T('Name')}`) });
  const grams = dlg.locator('#it-grams');
  await name.focus();
  await expect(name).toHaveAttribute('enterkeyhint', 'next');
  await expect(grams).toHaveAttribute('enterkeyhint', 'done');
  await expect(grams).toHaveAttribute('inputmode', 'numeric');
  // Enter on the name goes on to the weight (the window stays open)
  await name.fill('test_data_gtp_ Daumen');
  await name.press('Enter');
  await expect(grams).toBeFocused();
  await expect(dlg).toBeVisible();
  // «Mehr Angaben» › «Marke, Modell, Notiz» open: the weight is no longer the last field, the quantity
  // has the number keyboard, Enter on the brand goes to the model
  await dlg.locator('details.more > summary').click();
  await dlg.locator('details summary', { hasText: T('Brand, model, note') }).click();
  const qty = dlg.getByRole('spinbutton', { name: T('Quantity') });
  await expect(qty).toHaveAttribute('inputmode', 'numeric');
  await grams.focus();
  await expect(grams).toHaveAttribute('enterkeyhint', 'next');
  const brand = dlg.getByRole('textbox', { name: T('Brand'), exact: true });
  await brand.fill('test_data_gtp_ Marke');
  await brand.press('Enter');
  await expect(dlg.getByRole('textbox', { name: T('Model / colour'), exact: true })).toBeFocused();
  await expect(dlg).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
