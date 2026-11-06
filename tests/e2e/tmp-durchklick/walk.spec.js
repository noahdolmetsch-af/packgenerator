import { test } from '@playwright/test';
import { startE5, waitReady, checkPage, log, MODE, OUT } from './e5lib.js';

const PAGES = (process.env.PAGES || '').split(',').filter(Boolean).length ? process.env.PAGES.split(',') : [
  '#/flow', '#/flow/sports', '#/flow/training', '#/flow/training?view=list', '#/flow/plans', '#/flow/form', '#/flow/review',
  '#/flow/milestones', '#/flow/gipfelbuch', '#/flow/act/meditation', '#/flow/act/meditation/log', '#/flow/sport/act%3Atennis',
  '#/check/morning', '#/check/evening', '#/me/abfragen', '#/me/insights', '#/me/wohl', '#/routine', '#/timer',
  '#/auswerten', '#/auswerten/analyse', '#/debrief', '#/debrief/freude', '#/debrief/technik', '#/debrief/ride', '#/pack/past',
  '#/debrief/logbook', '#/debrief/tourenpass', '#/debrief/learnings', '#/debrief/pace', '#/debrief/paesse', '#/gelernt', '#/jahr',
  '#/heatmap', '#/neuland', '#/trips/dreams', '#/trips/vorschlaege', '#/inspiration', '#/me/reminders', '#/me/push', '#/flow/stats/hr', '#/flow/auswertung', '#/flow/impulse', '#/flow/rest', '#/check/insights', '#/check/history', '#/timer/log', '#/timer/faces', '#/flow/new', '#/flow/activity', '#/flow/week', '#/flow/trophies', '#/trips/rides', '#/flow/act/meditation/timer?new=1', '#/flow/act/meditation/mehr', '#/flow/act/meditation/rueckblick', '#/me/werte', '#/me/weight', '#/flow/plans/first', '#/auswerten/koerper',
];
const SKIPBTN = /lösch|entfern|zurücksetz|senden|teilen|verbind|bezahl|abmeld|import|export|leeren|reset|delete|remove|share/i;

test.setTimeout(40 * 60_000);
test(`walk ${MODE}`, async ({ page, context }, info) => {
  const proj = `${MODE}-${info.project.name}`;
  const errors = await startE5(page, context, info);
  for (const hash of PAGES) {
    const t0 = Date.now();
    await page.goto(`./${hash}`);
    await page.reload();
    await waitReady(page);
    const ms = Date.now() - t0;
    log('timing.jsonl', { project: proj, hash, ms });
    const probs = await checkPage(page, errors, hash, proj);
    const slug = hash.replace(/[^a-z0-9]+/gi, '_');
    await page.screenshot({ path: `${OUT}/shots/${proj}-${slug}.png`, fullPage: false }).catch(() => {});
    // robot: click up to 14 safe buttons, one at a time on a fresh load
    const names = await page.locator('main button:visible').evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40)));
    let n = 0;
    for (let i = 0; i < names.length && n < 8; i++) {
      if (SKIPBTN.test(names[i])) continue;
      n++;
      await page.goto(`./${hash}`); await waitReady(page);
      const btn = page.locator('main button:visible').nth(i);
      try { await btn.click({ timeout: 1500 }); } catch (e) { log('walk.jsonl', { project: proj, hash, what: 'Klick geht nicht', detail: `${names[i]}: ${String(e.message).split('\n')[0].slice(0, 80)}` }); continue; }
      await page.waitForTimeout(250);
      await checkPage(page, errors, `${hash} [klick: ${names[i]}]`, proj, true);
    }
  }
});
