import { test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';
const GTP = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
test('probe', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, GTP);
  await page.goto('./#/debrief');
  await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const out = [];
    const d = (el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}${[...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => '[' + a.name + ']').join('')} w=${Math.round(el.getBoundingClientRect().width)} disp=${getComputedStyle(el).display}`;
    let el = document.querySelector('[data-card-line]');
    for (let i = 0; el && i < 6; i++) { out.push('UP ' + d(el)); el = el.parentElement; }
    const main = document.querySelector('main');
    for (const c of main.children) out.push('MAIN> ' + d(c));
    const q = document.querySelector('[data-quick-links]');
    if (q) { out.push('QL ' + d(q) + ' parent ' + d(q.parentElement) + ' ovx=' + getComputedStyle(q).overflowX + ' minw=' + getComputedStyle(q).minWidth); }
    return out.join('\n') + '\nSW=' + document.documentElement.scrollWidth;
  });
  console.log('PROBE\n' + r);
});
