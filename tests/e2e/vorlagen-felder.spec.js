// Vorlagen mit Feldern (Noah 27.10.2026 «3b 4a 5a», 19:18 «ca. 20 Vorlagen zur Auswahl im Frontend»):
// choose templates, fill one in Notizen (the note keeps text and values), change a template's fields, and a
// fitting template in the input bar of the diary. German, phone 390 and desktop 1440, fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { FORMS, DEFAULT_ON } from '../../src/lib/notes/forms.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-20';
const P = 'test_data_vf_';
const nameOf = (key) => T(FORMS.find((x) => x.key === key).name);
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(`${DAY}T20:30:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const shots = process.env.VF_SHOTS;
const w = (info) => (info.project.name === 'phone' ? 390 : 1440);

test('Notizen: choose a template, fill it in, the note keeps the values; change its fields', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/notes');
  const chips = page.locator('[data-templates]');
  for (const k of DEFAULT_ON) await expect(chips.locator(`[data-form-chip="${k}"]`)).toBeVisible();
  await expect(chips.locator('[data-form-chip="vision"]')).toHaveCount(0);
  if (shots) await page.screenshot({ path: `${shots}/notizen-chips-${w(info)}.png` });

  // the selection: all templates in groups; «Vision» is chosen
  await chips.locator('[data-form-choose]').click();
  const gal = page.locator('[data-form-gallery]');
  await expect(gal).toBeVisible();
  await expect(gal.locator('[data-form-row]')).toHaveCount(FORMS.length);
  await expect(gal).toContainText(T('{n} templates with fields. Tap «Use» on the ones you want: they show in Notes and where they fit.', { n: FORMS.length }));
  if (shots) await gal.screenshot({ path: `${shots}/auswahl-${w(info)}.png` });
  await gal.locator('[data-form-use="vision"]').click();
  await expect(gal.locator('[data-form-use="vision"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(gal.locator('[data-form-use="vision"]')).toContainText(T('In use'));
  expect(await noScroll(page)).toBe(true);

  // change a template: a new field «Kosten» (number) in «Idee»
  await gal.locator('[data-form-change="idea"]').click();
  const ed = gal.locator('[data-form-edit="idea"]');
  await ed.locator('[data-form-newfield]').fill(`${P}Kosten`);
  await ed.locator('select').selectOption('number');
  await ed.locator('[data-form-addfield]').click();
  await expect(ed.locator('[data-form-field-row]')).toHaveCount(FORMS.find((x) => x.key === 'idea').fields.length + 1);
  if (shots) await gal.screenshot({ path: `${shots}/aendern-${w(info)}.png` });
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(gal).toBeHidden();
  await expect(chips.locator('[data-form-chip="vision"]')).toBeVisible();

  // fill in «Tourenbericht»: text, a choice, 1–5
  await chips.locator('[data-form-chip="report"]').click();
  const sh = page.locator('[data-form-sheet="report"]');
  await expect(sh).toBeVisible();
  await expect(sh.locator('[data-form-take]')).toBeDisabled();
  await sh.locator('[data-form-field="route"] input').fill(`${P}Seerunde`);
  await sh.locator('[data-form-field="weather"]').getByRole('button', { name: T('rain') }).click();
  await sh.locator('[data-form-field="feel"]').getByRole('button', { name: '4', exact: true }).click();
  await sh.locator('[data-form-field="best"] textarea').fill(`${P}Nebel über dem See`);
  if (shots) await sh.screenshot({ path: `${shots}/ausfuellen-${w(info)}.png` });
  await sh.locator('[data-form-take]').click();
  await expect(sh).toBeHidden();
  const field = page.locator('form.cap textarea');
  await expect(field).toHaveValue(new RegExp(`^${nameOf('report')}\\n`));
  await expect(field).toHaveValue(new RegExp(`${T('How it felt')}: 4/5`));
  await page.locator('form.cap button[type="submit"]').click();
  let note;
  await expect.poll(async () => (note = (await table(page, 'notes')).find((n) => n.form))?.form?.key).toBe('report');
  expect(note.title).toBe(nameOf('report'));
  expect(note.form.values).toEqual({ route: `${P}Seerunde`, best: `${P}Nebel über dem See`, weather: T('rain'), feel: 4 }); // the list became your own when «Idee» changed: its words are German now
  const stored = (await table(page, 'settings')).find((s) => s.key === 'noteForms').value;
  expect(stored.on).toContain('vision');
  expect(stored.list.find((x) => x.key === 'idea').fields.at(-1)).toMatchObject({ label: `${P}Kosten`, type: 'number' });
  expect(errors).toEqual([]);
});

test('Tagebuch: the input bar offers the templates that fit, filled in under the text', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/tagebuch');
  await page.locator('[data-tb-new]').click();
  const ed = page.locator('[data-tb-editor]');
  await ed.locator('[data-tb-text]').fill(`${P}Ruhiger Tag.`);
  const bar = ed.locator('[data-input-bar="diary"]');
  await bar.locator('[data-in-tool="template"]').click();
  await expect(bar.locator('[data-in-form="daynote"]')).toBeVisible();
  await expect(bar.locator('[data-in-form="bikestate"]')).toHaveCount(0); // fits Velopflege, not the diary
  await bar.locator('[data-in-form="daynote"]').click();
  const sh = page.locator('[data-form-sheet="daynote"]');
  await sh.locator('[data-form-field="energy"]').getByRole('button', { name: '3', exact: true }).click();
  await sh.locator('[data-form-field="tomorrow"] textarea').fill(`${P}früh los`);
  await sh.locator('[data-form-take]').click();
  await expect(ed.locator('[data-tb-text]')).toHaveValue(new RegExp(`Ruhiger Tag\\.[\\s\\S]*${nameOf('daynote')}[\\s\\S]*${T('Energy')}: 3/5[\\s\\S]*${P}früh los`));
  if (shots) await ed.screenshot({ path: `${shots}/tagebuch-${w(info)}.png` });
  expect(await noScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});
