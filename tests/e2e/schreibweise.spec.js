// «Schreibweise» (Noah 25.11.2026, Gesamttest C8): saving the text of a rule shows a quiet suggestion for the spelling;
// the text stays as typed until «Use it». German UI, phone 390 and desktop 1440, fictional data.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { QUESTIONS, ON_AT_START } from '../../src/lib/abfragen.js';

function data() {
  const d = homeFixture();
  const q = Object.fromEntries(QUESTIONS.filter((x) => ON_AT_START.has(x.id)).map((x) => [x.id, { on: false }]));
  d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q, own: [] } });
  d.tables.healthDays = [...Array.from({ length: 20 }, (_, i) => ({ date: day(-(i + 1)), restingHr: 51 + (i % 3) })), { date: day(0), restingHr: 52 }];
  return d;
}

test.describe('Schreibweise', () => {
  test('a rule text: the hint comes after saving, your text stays until Use it', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data() });
    await page.goto('./#/me/abfragen');
    await page.locator('[data-datenfragen]').evaluate((d) => (d.open = true)); // the rules sit in a closed line
    const field = page.locator('[data-rule-text="schlaf"]');
    await expect(field).toBeVisible();
    // nothing to suggest on opening the page
    await expect(page.locator('[data-spell]')).toHaveCount(0);
    await field.fill('warum hast du letzte nacht weniger als 5h geschlafen?');
    await field.blur();
    const hint = page.locator('[data-spell]');
    await expect(hint).toBeVisible();
    await expect(page.locator('[data-spell-text]')).toHaveText('Warum hast du letzte nacht weniger als 5 Std. geschlafen?');
    // the saved text is still the typed one
    await expect(field).toHaveValue('warum hast du letzte nacht weniger als 5h geschlafen?');
    await page.screenshot({ path: `/tmp/claude-0/sn-shots/spell-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: false }).catch(() => {});
    await page.locator('[data-spell-take]').click();
    await expect(field).toHaveValue('Warum hast du letzte nacht weniger als 5 Std. geschlafen?');
    await expect(hint).toHaveCount(0);
    // the new text is kept after a reload, and no hint comes up on its own
    await page.reload();
    await expect(page.locator('[data-rule-text="schlaf"]')).toHaveValue('Warum hast du letzte nacht weniger als 5 Std. geschlafen?');
    await expect(page.locator('[data-spell]')).toHaveCount(0);
  });

  test('Keep mine hides the line and keeps the text; a text that is fine gets no line', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data() });
    await page.goto('./#/me/abfragen');
    await page.locator('[data-datenfragen]').evaluate((d) => (d.open = true)); // the rules sit in a closed line
    const field = page.locator('[data-rule-text="schlaf"]');
    await field.fill('was hat dich wachgehalten?');
    await field.blur();
    await expect(page.locator('[data-spell]')).toBeVisible();
    await page.locator('[data-spell-keep]').click();
    await expect(page.locator('[data-spell]')).toHaveCount(0);
    await expect(field).toHaveValue('was hat dich wachgehalten?');
    await field.fill('Was hat dich wachgehalten?');
    await field.blur();
    await expect(page.locator('[data-spell]')).toHaveCount(0);
  });
});
