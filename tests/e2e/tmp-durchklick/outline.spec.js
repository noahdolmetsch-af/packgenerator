import { test } from '@playwright/test';
import { startE5, waitReady, OUT } from './e5lib.js';
import { writeFileSync } from 'node:fs';
const PAGES = ['#/flow', '#/flow/training', '#/flow/form', '#/auswerten', '#/auswerten/analyse', '#/flow/review', '#/check/morning', '#/me/abfragen', '#/timer', '#/routine', '#/flow/act/meditation', '#/flow/milestones', '#/flow/gipfelbuch', '#/debrief/learnings', '#/me/wohl', '#/flow/sports', '#/flow/plans', '#/me/weight', '#/auswerten/koerper', '#/debrief/tourenpass', '#/me/reminders'];
test('outline', async ({ page, context }, info) => {
  await startE5(page, context, info);
  const out = {};
  for (const h of PAGES) {
    await page.goto(`./${h}`); await page.reload(); await waitReady(page);
    out[h] = await page.evaluate(() => ({
      links: [...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href') + ' | ' + (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)).filter((v, i, a) => a.indexOf(v) === i),
      buttons: [...document.querySelectorAll('main button')].filter((b) => b.getClientRects().length).map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)),
      inputs: [...document.querySelectorAll('main input, main textarea, main select')].filter((b) => b.getClientRects().length).map((b) => `${b.tagName}/${b.type}/${b.getAttribute('aria-label') || b.placeholder || b.name || ''}`.slice(0, 60)),
    }));
  }
  writeFileSync(`${OUT}/outline-${info.project.name}.json`, JSON.stringify(out, null, 1));
});
