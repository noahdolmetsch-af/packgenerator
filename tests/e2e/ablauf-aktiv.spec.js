// «Aktiv fertig bauen» (Klick-Rundgang 22.10.2026, Noah «5a»: a robot plays it through before every release):
// a sample plan tried and taken back with Undo (A02), a planned session ticked by hand and back (A04), the
// plan page from this week on (A03), the FTP card with its way to type one (A07). Fictional data only.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await ready(page);
  return errors;
}
const setting = (page, key) =>
  page.evaluate(
    (k) =>
      new Promise((ok) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const g = o.result.transaction('settings').objectStore('settings').get(k);
          g.onsuccess = () => (o.result.close(), ok(g.result?.value ?? null));
        };
      }),
    key,
  );

test('Trainingsplan: weeks from today, «Ausprobieren» with Undo; a planned session «Gemacht» by hand', async ({ page, context }) => {
  const errors = await start(page, context);
  // a race 6 weeks away: a 12-week plan starts in the past, the list starts this week (A03)
  await page.goto('./#/flow/plans');
  await page.locator('[data-plan="multi"] a').click();
  await page.getByRole('button', { name: T('Back from the race day'), exact: true }).click();
  await page.locator('[data-plan-date]').fill(day(42));
  await expect(page.locator('[data-weeks-past]')).toBeVisible();
  const shown = await page.locator('[data-section="plan-weeks"] li').count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(12);
  // «Ausprobieren» writes the plan; Undo takes it back (A02)
  await page.locator('[data-plan-try]').click();
  await expect(page).toHaveURL(/#\/flow\/training$/);
  await expect.poll(async () => ((await setting(page, 'training.plan'))?.sessions ?? []).length).toBeGreaterThan(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => ((await setting(page, 'training.plan'))?.sessions ?? []).length).toBe(0);

  // a session planned by hand today, ticked «Gemacht» without Strava (A04), and back
  await page.locator(`[data-add="${zurichToday()}"]`).click();
  await page.locator('[data-session-form]').getByRole('button', { name: T('Save') }).click();
  const chip = page.locator('[data-planned]').first();
  await expect(chip).toBeVisible();
  await expect(chip).not.toHaveClass(/ok/);
  await chip.click();
  await page.locator('[data-session-done]').click();
  await expect(page.locator('[data-planned]').first()).toHaveClass(/ok/);
  await expect.poll(async () => (await setting(page, 'training.plan')).sessions[0].done).toBe(true);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await setting(page, 'training.plan')).sessions[0].done ?? false).toBe(false);
  // the FTP card shows the way to type one (A07)
  await expect(page.locator('[data-ftp-add]')).toHaveText(T('Enter FTP'));
  expect(errors).toEqual([]);
});
