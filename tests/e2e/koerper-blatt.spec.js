// «Neuer Schwung» Blatt von unten (Noah 27.10.2026 «a»): on a phone «Dein Körper heute» opens a sheet with a ring
// per value, this week next to the week before and «Alle Körperwerte»; the computer keeps the link to the page.
// Fictional data (home0460-fixture.js; Friday 9 October 2026, 09:00).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// 14 fictional Fitbit days: pulse 50 the week before, 54 this week, today 56
function days() {
  const out = [];
  for (let i = 0; i < 14; i++) out.push({ date: day(-i), restingHr: i === 0 ? 56 : i < 7 ? 54 : 50, azm: i < 7 ? 30 : 20, sleep: { asleepMin: i < 7 ? 450 : 420, efficiency: 90 } });
  return out;
}

async function open(page, context, info) {
  const d = homeFixture();
  d.tables.healthDays = days();
  const T = await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  return T;
}

test.describe('KB Koerper Blatt', () => {
  test('KB1: phone opens a sheet with rings and the week, computer keeps the link', async ({ page, context }, info) => {
    const T = await open(page, context, info);
    const body = page.locator('[data-section="body"]');
    if (info.project.name !== 'phone') {
      await expect(body.getByRole('link', { name: new RegExp(T('Details|body')) })).toHaveAttribute('href', '#/me/insights');
      await expect(page.locator('[data-body-sheet]')).toHaveCount(0);
      return;
    }
    await body.locator('[data-body-open]').click();
    const sheet = page.locator('[data-body-sheet]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: T('Your body today') })).toBeVisible();
    await expect(sheet.locator('[data-sheet-body]')).toHaveCount(4);
    const pulse = sheet.locator('[data-sheet-body="pulse"]');
    await expect(pulse.locator('b')).toHaveText('56');
    // mean of the last 7 days (54.3, the pulse shown whole) next to the 7 before (50)
    await expect(pulse.locator('[data-sheet-week]')).toHaveText(/54\D+50/);
    // the ring of the pulse is full: today is the highest of the last 4 weeks
    await expect.poll(() => pulse.locator('.fg').evaluate((c) => getComputedStyle(c).strokeDashoffset)).toMatch(/^0(px)?$/);
    // the exact range stands next to the ring, with today's 56 as the highest
    await expect(pulse.locator('[data-sheet-range]')).toContainText(T('4 weeks: {min} to {max}|body').split('{')[0]);
    await expect(pulse.locator('[data-sheet-range]')).toHaveText(/\D56$/);
    await noSideways(page);
    // tapping the values opens it too; «Alle Körperwerte» goes to the page
    await sheet.getByRole('button', { name: T('Close') }).first().click();
    await expect(sheet).toBeHidden();
    await body.locator('.vals').click();
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-sheet-all]').click();
    await expect(page).toHaveURL(/#\/me\/insights/);
    await expect(sheet).toHaveCount(0);
  });

  test('KB2: reduce motion, the rings stand still', async ({ page, context }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, context, info);
    if (info.project.name !== 'phone') return expect(page.locator('[data-body-open]')).toHaveCount(0);
    await page.locator('[data-section="body"] [data-body-open]').click();
    const fg = page.locator('[data-body-sheet] [data-sheet-body="pulse"] .fg');
    expect(await fg.evaluate((c) => getComputedStyle(c).animationName)).toBe('none');
  });
});
