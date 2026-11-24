// Neu-Menü nach vorn (Noah 23.11.2026 «1-5a», «5a»): Tour planen und Schnellstart zuerst, «Taschen wiegen», Textfeld und Notfall am Ende
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('the New menu: trips first, Weigh bags, quick field and emergency at the end', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/gear');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:new')));
  const sheet = page.locator('dialog.sheet.new');
  await expect(sheet).toBeVisible();
  // order in the page: first row = Plan a trip, then Quick start, then Weigh bags; the quick field and the emergency come after the last group
  const order = await sheet.evaluate((el) => {
    const pos = (s) => {
      const n = el.querySelector(s);
      return n ? [...el.querySelectorAll('*')].indexOf(n) : -1;
    };
    return { weigh: pos('[data-new-weigh]'), check: pos('[data-new-check]'), quick: pos('form.quick'), sos: pos('[data-new-sos]'), firstOpt: [...el.querySelectorAll('.opt, .sos, form.quick')].map((n) => n.className.split(' ')[0] + ':' + (n.textContent || '').trim().slice(0, 14)) };
  });
  expect(order.firstOpt[0]).toContain(T('Plan a trip').slice(0, 8));
  expect(order.weigh).toBeGreaterThan(0);
  expect(order.weigh).toBeLessThan(order.check);
  expect(order.quick).toBeGreaterThan(order.check);
  expect(order.sos).toBeGreaterThan(order.quick);
  await expect(sheet.locator('[data-new-weigh]')).toContainText(T('Weigh bags'));
  await sheet.locator('[data-new-weigh]').click();
  await expect(page).toHaveURL(/#\/pack(\?|$)/) // the page takes «?weigh» and opens the first bag you have not weighed;
});
