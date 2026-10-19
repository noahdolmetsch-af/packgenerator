// Einheitliche Formulare (Noah 19.10.2026 «1b 2a 3a 4b 5a»): the first form built from Form, Field and
// ChipChoice: «Aus Notiz wird …» in the note window. Fictional v048 fixture only.
import { test, expect } from '@playwright/test';
import { v048File, P } from './v048-fixture.js';
import { openData, settle } from './settle.js';

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
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(v048File(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

async function openTripIdea(page) {
  await page.goto('./#/notes');
  await page.getByLabel('Neue Notiz').fill(`${P} Formular-Notiz`);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await page.locator('li.ncard').filter({ hasText: `${P} Formular-Notiz` }).getByRole('button', { name: `${P} Formular-Notiz` }).click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('details.turn > summary').click();
  await dlg.locator('[data-make=trip]').click();
  return dlg;
}

test('Formular: labels, optional, examples, errors at the field only after saving, keyboard', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const dlg = await openTripIdea(page);
  const name = dlg.getByLabel('Name', { exact: true });
  const days = dlg.getByLabel('Tage', { exact: true });
  // 2a: only the optional field is marked; the examples stay visible under the fields
  await expect(dlg.locator('[data-field=nm-when] .lbl')).toContainText('freiwillig');
  await expect(dlg.locator('[data-field=nm-name] .lbl')).not.toContainText('freiwillig');
  await expect(dlg.getByText('z. B. Jura-Wochenende')).toBeVisible();
  await expect(dlg.getByText('1 bis 60')).toBeVisible();
  // 4b: nothing is red while typing
  await name.fill('');
  await days.fill('0');
  await expect(dlg.locator('.fieldmsg')).toHaveCount(0);
  // 3a: «Save» is pressable; it shows the messages at the fields, counts them and jumps to the first
  const save = dlg.getByRole('button', { name: 'Tour-Idee anlegen' });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(dlg.locator('[data-field=nm-name] .fieldmsg')).toHaveText('Gib einen Namen ein, zum Beispiel Jura-Wochenende.');
  await expect(dlg.locator('[data-field=nm-days] .fieldmsg')).toHaveText('Tage: ganze Zahl von 1 bis 60, zum Beispiel 2.');
  await expect(dlg.getByText('2 Angaben fehlen oder stimmen nicht. Sie sind rot markiert.')).toBeVisible();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription(/Gib einen Namen ein/);
  // a message leaves as soon as its field is right
  await name.fill(`${P} Formular-Tour`);
  await expect(dlg.locator('[data-field=nm-name] .fieldmsg')).toHaveCount(0);
  await expect(dlg.getByText('1 Angabe fehlt oder stimmt nicht. Sie ist rot markiert.')).toBeVisible();
  // keyboard: Enter in a field saves
  await days.fill('3');
  await days.press('Enter');
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.title === `${P} Formular-Tour`)?.days).toBe(3);
  await expect(dlg.getByRole('button', { name: 'Fertig' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Formular: bike chips work with arrow keys, «Back» returns to the note, no sideways scroll', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const dlg = await openTripIdea(page);
  const chips = dlg.getByRole('radiogroup', { name: 'Velo' });
  await expect(chips).toBeVisible();
  const chosen = chips.getByRole('radio', { checked: true });
  await expect(chosen).toHaveCount(1);
  const first = await chosen.textContent();
  await chosen.focus();
  await page.keyboard.press('ArrowRight');
  await expect(chips.getByRole('radio', { checked: true })).not.toHaveText(first);
  await expect(chips.getByRole('radio', { checked: true })).toBeFocused();
  for (const width of info.project.name === 'phone' ? [320, 390] : []) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await dlg.getByRole('button', { name: 'Zurück' }).click();
  await expect(dlg.getByRole('button', { name: 'Fertig' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Formular: Teil bearbeiten, every message at its field, a folded row opens for it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/gear');
  const name = `${P} Formular-Teil`;
  // DK6 (Wörter, in Paket D): «Material» everywhere, the search says «Material suchen»
  await page.getByRole('searchbox', { name: 'Material suchen' }).fill(name);
  await page.getByRole('button', { name: `«${name}» als neues Material erfassen` }).click();
  const dlg = page.getByRole('dialog', { name: 'Teil hinzufügen' });
  // 2a: only optional fields are marked; the weight keeps its «?»
  await expect(dlg.locator('[data-field=it-grams] .lbl')).toContainText('freiwillig');
  await expect(dlg.locator('[data-field=it-name] .lbl')).not.toContainText('freiwillig');
  await expect(dlg.getByText('ganze Gramm, z. B. 320')).toBeVisible();
  // 4b: no message while typing; 3a: «Save» shows them all at once
  await dlg.getByRole('textbox', { name: /Gewicht pro Stück/ }).fill('viel');
  await expect(dlg.locator('.fieldmsg')).toHaveCount(0);
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(dlg.locator('[data-field=it-cat] .fieldmsg')).toHaveText('Wähle eine Kategorie, zum Beispiel Kleider auf dem Velo.');
  await expect(dlg.locator('[data-field=it-grams] .fieldmsg')).toHaveText('Gewicht: ganze Zahl von 1 bis 30000, zum Beispiel 320. Oder leer lassen.');
  await expect(dlg.getByText('2 Angaben fehlen oder stimmen nicht. Sie sind rot markiert.')).toBeVisible();
  await expect(dlg.getByLabel('Kategorie', { exact: true })).toBeFocused();
  await dlg.getByLabel('Kategorie', { exact: true }).selectOption('cook');
  await dlg.getByRole('textbox', { name: /Gewicht pro Stück/ }).fill('85');
  await expect(dlg.locator('.fieldmsg')).toHaveCount(0);
  await dlg.getByRole('button', { name: 'Speichern' }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.name === name)?.weightG).toBe(85);

  // An existing item: a wrong value in a folded row; «Save» opens the row and goes to the field.
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
  const edit = page.getByRole('dialog', { name: new RegExp(name) });
  const details = edit.locator('details[data-fold=details]');
  await details.locator('> summary').click();
  await edit.getByLabel('Anzahl', { exact: true }).fill('0');
  await details.locator('> summary').click();
  await expect(details).toHaveJSProperty('open', false);
  await edit.getByRole('button', { name: 'Speichern' }).click();
  await expect(details).toHaveJSProperty('open', true);
  await expect(edit.getByLabel('Anzahl', { exact: true })).toBeFocused();
  await expect(edit.locator('[data-field=it-qty] .fieldmsg')).toHaveText('Anzahl: ganze Zahl von 1 bis 999, zum Beispiel 2.');
  expect(errors).toEqual([]);
});
