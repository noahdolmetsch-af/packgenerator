// Gesamttest round 2, part 2 (Noah 24.11.2026 «ja» to the lessons of the evening screenshot of «Wi gaht's? am Abend»):
//  1. other window sizes: the real laptop (1440x800 with a bookmarks bar), 1366x768, 1440x900, phone 390 and 320 (not only the width);
//  2. every window that opens by itself (and the sheets behind the buttons of Heute) is opened once and scrolled to the bottom:
//     the whole window sits inside the screen, the last line and the last button can be reached;
//  3. time of day: morning, midday, evening and night are played through, and every question has to fit the hour;
//  4. texts: a sentence starts with a capital, units are written the German way («Std.», not «5h»), no «das» without a noun.
// Part of the nightly Gesamttest (Noah 25.11.2026 «Ja, jede Nacht mitlaufen»). Option: GTP_SHOTS=<folder> saves a picture of every window.
//   PW_CHROMIUM=/opt/pw-browsers/chromium E2E_PORT=53xx npx playwright test tests/e2e/gesamttest/fenster-zeit.spec.js --project=desktop --workers=2
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, statSync, mkdirSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { settle } from '../settle.js';
import { openRoundIfDue } from '../runde-fixture.js';
import { fixture, prepare, importBackup, record, shot, table, day } from './lib.js';

const { data } = fixture();
// the window «Wi gaht's?» is on (settings 'abfragen', as a person who uses it has it), and last night was short (3 h 23 min), so the
// round also asks a question from the data (src/lib/datenfragen.js) with its reason. 40 Fitbit days are enough for «your usual».
const healthDays = Array.from({ length: 40 }, (_, i) => ({
  date: day(-i), azm: 40, restingHr: 50, hrvMs: 52, steps: 7000, spo2: 96, breath: 14, kcal: 2300, kcalActive: 550, hrMax: 150, src: 'google', at: `${day(-i)}T08:00:00Z`,
  sleep: { asleepMin: i === 0 ? 203 : 410, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 90 },
}));
const DATA2 = { ...data, tables: { ...data.tables, healthDays, settings: [...(data.tables.settings ?? []), { key: 'abfragen', value: { since: `${day(-3)}T21:00`, q: {}, own: [] } }] } };
const HASH = createHash('sha1').update(JSON.stringify(DATA2)).digest('hex').slice(0, 10);

/** The sizes: the real Mac laptop with a bookmarks bar (Noah's screenshot, 1440 x 800), a small laptop, a full screen, two phones. */
const SIZES = [
  { name: 'laptop-1440x800', w: 1440, h: 800, phone: false },
  { name: 'laptop-1366x768', w: 1366, h: 768, phone: false },
  { name: 'phone-390x844', w: 390, h: 844, phone: true },
  { name: 'phone-320x568', w: 320, h: 568, phone: true },
];
/** The four parts of the day (src/lib/dayclock.js): morning 05–11, day 11–18, evening 18–22, night 22–05. */
const HOURS = [
  { part: 'morning', hm: '07:30' },
  { part: 'day', hm: '12:30' },
  { part: 'evening', hm: '19:15' },
  { part: 'night', hm: '23:30' },
];

/** Europe/Zurich wall clock on the test day -> a Date (offset by the rules of that day). */
function zurich(d, hm) {
  const probe = new Date(`${d}T12:00:00Z`);
  const off = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', timeZoneName: 'longOffset' }).formatToParts(probe).find((p) => p.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  return new Date(`${d}T${hm}:00${off}`);
}

let statePath = null;
test.beforeAll(async ({ browser }, info) => {
  const dir = `${tmpdir()}/gesamttest-state/`;
  mkdirSync(dir, { recursive: true });
  const port = new URL(info.project.use.baseURL).port;
  statePath = `${dir}state2-${info.project.name}-${port}-${HASH}.json`;
  if (existsSync(statePath) && Date.now() - statSync(statePath).mtimeMs < 30 * 60_000) return;
  const u = info.project.use;
  const ctx = await browser.newContext({ baseURL: u.baseURL, viewport: u.viewport, isMobile: u.isMobile, hasTouch: u.hasTouch, timezoneId: u.timezoneId, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await prepare(page, ctx, 'de');
  await page.goto('./');
  await importBackup(page, info, DATA2, { lang: 'de', name: 'gesamttest2.json' });
  for (const t of ['healthDays']) {
    await expect.poll(async () => (await table(page, t)).length, { timeout: 20_000 }).toBeGreaterThanOrEqual(DATA2.tables[t].length);
  }
  await page.waitForTimeout(500);
  const tmp = `${statePath}.${info.workerIndex}.tmp`;
  await ctx.storageState({ path: tmp, indexedDB: true });
  renameSync(tmp, statePath);
  await ctx.close();
});

/**
 * The round window as it stands on the screen: where it is, whether the head and the foot stay in view, whether the middle scrolls.
 * Rule «Never cut off» (CLAUDE.md, Noah 24.11.2026 23:38): header and footer fixed, only the middle (.mid) scrolls, no button clipped.
 */
const measure = (page) =>
  page.evaluate(() => {
    const dlg = document.querySelector('dialog[data-section="abfragen"][open]');
    if (!dlg) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
    };
    const inside = (r, out) => !!r && r.top >= out.top - 1 && r.bottom <= out.bottom + 1 && r.left >= -1 && r.right <= vw + 1;
    const d = box(dlg);
    const screen = { top: 0, bottom: vh };
    const mid = dlg.querySelector('[data-ab-mid]');
    const close = dlg.querySelector('.vd-x');
    const foot = [...dlg.querySelectorAll('[data-ab-next], [data-ab-save], [data-ab-today], [data-ab-back]')].filter((e) => e.getClientRects().length);
    const problems = [];
    if (d.top < 0 || d.bottom > vh + 1 || d.left < -1 || d.right > vw + 1) problems.push(`window outside the screen (${JSON.stringify(d)}, screen ${vw}x${vh})`);
    // the middle scrolls: down to the end, then head and foot must still be there
    const scrolls = !!mid && mid.scrollHeight > mid.clientHeight + 1;
    if (mid) mid.scrollTop = mid.scrollHeight;
    if (close && !inside(box(close), screen)) problems.push('the ✕ is not in view when the middle is scrolled to the end');
    for (const f of foot) {
      const r = box(f);
      if (!inside(r, screen) || !inside(r, d)) problems.push(`button «${(f.innerText || f.getAttribute('aria-label') || '').trim().slice(0, 30)}» is clipped (${JSON.stringify(r)}, window ${JSON.stringify(d)})`);
    }
    if (!foot.length) problems.push('no button in the foot');
    // the last control of the middle can be reached
    const lastIn = [...(mid?.querySelectorAll('button, a, input, textarea') ?? [])].filter((e) => e.getClientRects().length).pop();
    if (lastIn && mid) {
      const lr = lastIn.getBoundingClientRect();
      const mr = mid.getBoundingClientRect();
      if (lr.bottom > mr.bottom + 1 || lr.top < mr.top - 1) problems.push(`the last control of the middle is not reachable (${Math.round(lr.bottom)} vs ${Math.round(mr.bottom)})`);
    }
    if (mid) mid.scrollTop = 0;
    return { problems, scrolls, text: dlg.innerText, step: dlg.querySelector('[data-ab-step]')?.innerText ?? '', title: dlg.querySelector('h2')?.innerText ?? '' };
  });

/** The sheets behind buttons of Heute are measured by their bottom edge only. */
const sheets = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('dialog[open]')].map((dlg) => {
      const r = dlg.getBoundingClientRect();
      return { bottom: Math.round(r.bottom), top: Math.round(r.top), vh: window.innerHeight, text: dlg.innerText };
    }),
  );

/** Text rules for German UI text: capital at the start of a heading, question or sentence; «5h» → «5 Std.»; a bare «das» as a whole question. */
function textProblems(text) {
  const bad = [];
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  for (const s of lines) {
    if (/^[a-zäöü]/.test(s) && s.length > 12 && /[?!.]$/.test(s)) bad.push(`starts with a small letter: «${s.slice(0, 70)}»`);
    if (/\b\d+([.,]\d+)?h\b/.test(s)) bad.push(`unit written «h»: «${s.slice(0, 70)}»`);
    if (/\bdas\b(?=[?.!]|$)/i.test(s) && s.length < 40 && /\?$/.test(s) && /^(Stimmt|Passt) das/.test(s)) bad.push(`question without a subject (what is «das»?): «${s}»`);
  }
  // a number in the question and another in the reason of the same card for the same thing (5 h vs 3 Std. 23 Min.)
  const q = text.match(/weniger als (\d+)\s?(h|Std)/i);
  const reason = text.match(/(\d+)\s?Std\.?\s?(\d+)?\s?Min/);
  if (q && reason && Math.abs(Number(q[1]) - Number(reason[1])) >= 1) bad.push(`question says ${q[0]} but the reason says ${reason[0]}`);
  return bad;
}

/** Words that tie a question to a part of the day: «last night», «this morning», «tonight». */
const MORNING_WORDS = /(letzte Nacht|heute Nacht|heute Morgen|geträumt|how well did you sleep|Wie gut hast du geschlafen)/i;
const EVENING_WORDS = /(heute Abend|heute Nacht schlafen|Gute Nacht)/i;

for (const size of SIZES) {
  for (const { part, hm } of HOURS) {
    test(`window ${size.name} ${part} ${hm}`, async ({ browser }, info) => {
      // each project runs the sizes that fit it (the phone project the phone sizes, the desktop project the laptops)
      test.skip(size.phone !== (info.project.name === 'phone'), 'size belongs to the other project');
      const u = info.project.use;
      const ctx = await browser.newContext({ baseURL: u.baseURL, viewport: { width: size.w, height: size.h }, isMobile: size.phone, hasTouch: size.phone, timezoneId: u.timezoneId, serviceWorkers: 'block', storageState: statePath });
      const page = await ctx.newPage();
      const errors = await prepare(page, ctx, 'de');
      await page.addInitScript(() => {
        try {
          localStorage.removeItem('pg.windows'); // the windows open by the clock (no 'quiet')
          localStorage.setItem('lang', 'de');
        } catch {
          /* ignore */
        }
      });
      const where = `${size.name} ${part} ${hm}`;
      try {
        await page.clock.setFixedTime(zurich(day(0), hm));
        await page.goto('./');
        await page.locator('main').waitFor();
        await settle(page);
        // «Wi gaht's?» opens only when asked: «Los» on Heute (Noah 24.11.2026, PR «Wi gaht's? am Abend: eine Frage pro Bildschirm»)
        const card = await openRoundIfDue(page);
        const seen = [];
        if (card) {
          // one question per screen: «Weiter» to the last one, looking at every screen
          for (let n = 0; n < 12; n++) {
            await page.waitForTimeout(n === 0 ? 700 : 300); // the window slides in on phones: measure when it stands still
            const w = await measure(page);
            if (!w) break;
            const label = `${where} question screen ${n + 1}`;
            seen.push(w.step);
            for (const p of w.problems) expect.soft(p, `${label}: ${p}`).toBe('');
            await shot(page, `${size.name}-${part}-frage${n + 1}`, { fullPage: false });
            for (const p of textProblems(w.text)) expect.soft(p, `${label}: text`).toBe('');
            // «Noch offen von heute Morgen» (19:15) says on purpose that the morning questions are still open
            if ((part === 'evening' || part === 'night') && !/Noch offen/.test(w.title)) {
              const hit = w.text.match(MORNING_WORDS)?.[0];
              expect.soft(hit ?? '', `${label}: a morning question («${hit}») in the ${part} round`).toBe('');
            }
            if (part === 'morning') {
              const hit = w.text.match(EVENING_WORDS)?.[0];
              expect.soft(hit ?? '', `${label}: an evening question («${hit}») in the morning round`).toBe('');
            }
            record('fenster', { where, screen: n + 1, step: w.step, title: w.title, scrolls: w.scrolls, text: w.text.slice(0, 300) });
            const next = card.locator('[data-ab-next]');
            if (!(await next.isVisible().catch(() => false))) break;
            // one tap, then wait until the screen has moved on; the browser can swallow a tap right after the last one (tests/e2e/runde-fixture.js, tap)
            let moved = false;
            for (let t = 0; t < 3 && !moved; t++) {
              await next.click();
              moved = await expect(card.locator('[data-ab-step]')).not.toHaveText(w.step, { timeout: 1500 }).then(() => true, () => false);
            }
            if (!moved) break;
          }
        } else {
          // the round is offered in the morning, the evening and the night with these data; at midday it can rest
          if (part !== 'day') expect.soft(card, `${where}: the round «Wi gaht's?» is not offered on Heute («Los» missing)`).not.toBeNull();
        }
        // the sheets behind the buttons of Heute: «Neu», the search, the help «?», «Verbessern»
        await page.keyboard.press('Escape');
        for (const sel of ['button[aria-label*="Neu" i]', 'button:has-text("Neu")', '[aria-label*="Suche" i]', 'button[aria-label="Hilfe"]', 'button:has-text("Verbessern")']) {
          const b = page.locator(sel).first();
          if (!(await b.count()) || !(await b.isVisible())) continue;
          await b.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(400);
          for (const w of await sheets(page)) {
            expect.soft(w.bottom, `${where} sheet behind «${sel}»: below the screen (${w.bottom} of ${w.vh})`).toBeLessThanOrEqual(w.vh + 1);
            for (const p of textProblems(w.text)) expect.soft(p, `${where} sheet behind «${sel}»: text`).toBe('');
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
        expect.soft(errors, `${where}: console errors`).toEqual([]);
        record('fenster-seen', { where, seen });
      } finally {
        await ctx.close();
      }
    });
  }
}
