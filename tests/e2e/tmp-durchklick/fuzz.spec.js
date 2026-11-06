import { test } from '@playwright/test';
import { startE5, waitReady, checkPage, log, MODE, OUT } from './e5lib.js';
import { sideways } from '../gesamttest/lib.js';

const PAGES = (process.env.PAGES || '').split(',').filter(Boolean).length ? process.env.PAGES.split(',') : [
  '#/flow', '#/flow/sports', '#/flow/training', '#/flow/plans', '#/flow/form', '#/flow/review', '#/flow/milestones', '#/flow/gipfelbuch',
  '#/flow/act/meditation', '#/flow/act/meditation/log', '#/flow/sport/act%3Atennis', '#/check/morning', '#/check/evening', '#/me/abfragen',
  '#/me/insights', '#/me/wohl', '#/routine', '#/timer', '#/auswerten', '#/auswerten/analyse', '#/debrief/freude', '#/debrief/technik',
  '#/debrief/logbook', '#/debrief/tourenpass', '#/debrief/learnings', '#/debrief/paesse', '#/neuland', '#/trips/dreams', '#/inspiration', '#/me/reminders', '#/me/weight',
];
const LONG = 'Superkalifragilistischexpialigetischwiederholungsunterbrechungsmöglichkeit'.repeat(5);
const ROUNDS = {
  langesWort: () => LONG,
  html: () => '<b>Fett</b> "x" \'y\' &amp; 😀 ä ö ü',
  null: () => '0',
  negativ: () => '-5',
  komma: () => '1,5',
  gross: () => '99999999999',
  leer: () => '',
};
const SAVE = /speicher|hinzufüg|anlegen|eintrag|^ok$|übernehm|erstell|sichern|buchen|fertig|starten/i;
const NOCLICK = /lösch|entfern|zurücksetz|senden|teilen|verbind|bezahl|abmeld|import|export|leeren|reset|backup/i;

test.setTimeout(60 * 60_000);
test(`fuzz ${MODE}`, async ({ page, context }, info) => {
  const proj = `${MODE}-${info.project.name}`;
  const errors = await startE5(page, context, info);
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  for (const hash of PAGES) {
    for (const [rname, val] of Object.entries(ROUNDS)) {
      await page.goto(`./${hash}`); await page.reload(); await waitReady(page);
      const inputs = page.locator('main :is(input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]), textarea):visible');
      const n = Math.min(await inputs.count(), 8);
      if (!n) break;
      for (let i = 0; i < n; i++) {
        const el = inputs.nth(i);
        const type = (await el.getAttribute('type')) || 'text';
        let v = val();
        if (type === 'date') v = rname === 'null' ? '2026-02-29' : rname === 'gross' ? '2029-11-05' : '2026-11-04';
        else if (type === 'time') v = '08:30';
        else if (type === 'number' || type === 'range') v = rname === 'langesWort' || rname === 'html' ? '5' : rname === 'komma' ? '1.5' : v;
        else if (type === 'email' || type === 'url') v = rname === 'leer' ? '' : 'a@b.ch';
        await el.fill(v, { timeout: 1500 }).catch(() => {});
      }
      await page.waitForTimeout(150);
      const sw = await sideways(page);
      if (sw.sw > sw.w + 1) log('fuzz.jsonl', { project: proj, hash, round: rname, what: 'seitlich', detail: `${sw.sw}>${sw.w}: ${sw.wide.join(',')}`.slice(0, 200) });
      // save: buttons that look like save, one by one
      const btns = page.locator('main button:visible');
      const names = await btns.evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim()));
      for (let i = 0; i < names.length; i++) {
        if (!SAVE.test(names[i]) || NOCLICK.test(names[i])) continue;
        await btns.nth(i).click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(250);
        const sw2 = await sideways(page);
        if (sw2.sw > sw2.w + 1) log('fuzz.jsonl', { project: proj, hash, round: rname, what: 'seitlich nach Speichern', detail: `${names[i]}: ${sw2.sw}>${sw2.w}: ${sw2.wide.join(',')}`.slice(0, 200) });
        const snap = await page.evaluate(() => document.querySelector('main')?.innerText.slice(0, 20000) ?? '');
        if (/undefined|NaN|\[object|Infinity/.test(snap)) log('fuzz.jsonl', { project: proj, hash, round: rname, what: 'undefined/NaN auf Seite', detail: `${names[i]}: ${(snap.match(/.{0,30}(undefined|NaN|\[object|Infinity).{0,30}/) || [''])[0].replace(/\n/g, ' ')}` });
        if (errors.length) { for (const e of errors.splice(0)) log('fuzz.jsonl', { project: proj, hash, round: rname, what: 'Konsole', detail: `${names[i]}: ${e.slice(0, 200)}` }); }
      }
      // reload after: is the page still fine?
      await page.reload(); await waitReady(page);
      await checkPage(page, errors, `${hash} [nach ${rname}]`, proj);
    }
  }
});
