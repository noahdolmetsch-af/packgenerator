import { test } from '@playwright/test';
import { startE5, waitReady, log, MODE, OUT } from './e5lib.js';
import { sideways } from '../gesamttest/lib.js';

const PAGES = (process.env.PAGES || '').split(',').filter(Boolean).length ? process.env.PAGES.split(',') : [
  '#/flow', '#/flow/sports', '#/flow/training', '#/flow/plans', '#/flow/form', '#/flow/review', '#/flow/milestones', '#/flow/gipfelbuch',
  '#/flow/act/meditation', '#/flow/act/meditation/log', '#/flow/sport/act%3Atennis', '#/check/morning', '#/check/evening', '#/me/abfragen',
  '#/me/insights', '#/me/wohl', '#/routine', '#/timer', '#/auswerten', '#/debrief/freude', '#/debrief/technik',
  '#/debrief/logbook', '#/debrief/tourenpass', '#/debrief/learnings', '#/debrief/paesse', '#/neuland', '#/trips/dreams', '#/inspiration', '#/me/reminders', '#/me/weight', '#/me/push', '#/pack/past', '#/debrief',
];
const LONG = 'Superkalifragilistischexpialigetischwiederholungsunterbrechungsmöglichkeit'.repeat(5);
const ADD = /neu|hinzufüg|anlegen|eintrag|erfass|ergänz|\+|erstell|plan|notiz|schreib|stempel|abstempeln|frage|routine|sportart|ziel/i;
const BAD = /lösch|entfern|zurücksetz|senden|teilen|verbind|bezahl|abmeld|import|export|leeren|reset|backup|schliess|abbrech|zurück$/i;
const SAVE = /speicher|hinzufüg|anlegen|eintrag|^ok$|übernehm|erstell|sichern|fertig|^\+? ?hinzu/i;

test.setTimeout(60 * 60_000);
test(`fuzz2 ${MODE}`, async ({ page, context }, info) => {
  const proj = `${MODE}-${info.project.name}`;
  const errors = await startE5(page, context, info);
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  const issues = new Set();
  for (const hash of PAGES) {
    await page.goto(`./${hash}`); await page.reload(); await waitReady(page);
    const names = await page.locator('main button:visible').evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 50)));
    let n = 0;
    for (let i = 0; i < names.length && n < 6; i++) {
      if (!ADD.test(names[i]) || BAD.test(names[i]) || !names[i]) continue;
      n++;
      for (const [rname, val] of [['lang', LONG], ['html', '<b>x</b> "q" &amp; 😀 ä']]) {
        await page.goto(`./${hash}`); await page.reload(); await waitReady(page);
        const b = page.locator('main button:visible').nth(i);
        if ((await b.evaluate((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 50)).catch(() => '')) !== names[i]) continue;
        await b.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(300);
        const scope = page.locator('dialog[open], [role=dialog], [data-sheet], form').last();
        const inputs = (await scope.count()) ? scope.locator('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]), textarea') : page.locator('main input:visible');
        const k = Math.min(await inputs.count(), 6);
        if (!k) continue;
        for (let j = 0; j < k; j++) {
          const el = inputs.nth(j);
          const type = (await el.getAttribute('type')) || 'text';
          if (!(await el.isVisible())) continue;
          let v = val;
          if (type === 'number') v = '7'; else if (type === 'date') v = '2026-11-04'; else if (type === 'time') v = '08:30'; else if (type === 'email' || type === 'url') v = 'a@b.ch';
          await el.fill(v, { timeout: 1000 }).catch(() => {});
        }
        const sb = (await scope.count()) ? scope.locator('button:visible') : page.locator('main button:visible');
        const sn = await sb.evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim()));
        const si = sn.findIndex((x) => SAVE.test(x) && !BAD.test(x));
        const rec = (what, detail) => { const key = `${hash}|${names[i]}|${rname}|${what}`; if (!issues.has(key)) { issues.add(key); log('fuzz2.jsonl', { project: proj, hash, button: names[i], round: rname, what, detail }); } };
        let sw = await sideways(page);
        if (sw.sw > sw.w + 1) rec('seitlich beim Tippen', `${sw.sw}>${sw.w}: ${sw.wide.slice(0, 2).join(',')}`);
        if (si >= 0) {
          await sb.nth(si).click({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(500);
          sw = await sideways(page);
          if (sw.sw > sw.w + 1) rec('seitlich nach Speichern', `${sn[si]}: ${sw.sw}>${sw.w}: ${sw.wide.slice(0, 2).join(',')}`);
          const snap = await page.evaluate(() => document.body.innerText.slice(0, 40000));
          if (/undefined|NaN|\[object|Infinity/.test(snap)) rec('undefined/NaN', (snap.match(/.{0,30}(undefined|NaN|\[object|Infinity).{0,30}/) || [''])[0].replace(/\n/g, ' '));
          await page.reload(); await waitReady(page);
          sw = await sideways(page);
          if (sw.sw > sw.w + 1) rec('seitlich nach Neuladen', `${sw.sw}>${sw.w}: ${sw.wide.slice(0, 2).join(',')}`);
        }
        for (const e of errors.splice(0)) rec('Konsole', e.slice(0, 200));
      }
    }
  }
});
