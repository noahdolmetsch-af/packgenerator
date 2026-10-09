// Wächter: the Konsistenz-Test (skill packgenerator-einheitlich, part 3). Every main page, on a phone
// at 320 and 390 px and on a computer at 1440 px, with the fictional data of home0460-fixture.js
// (test_data_gtp_ records; the clock stands on Friday 9 October 2026, 09:00; Open-Meteo mocked).
// Per page and width it counts:
//   hscroll   the page scrolls sideways
//   wordbreak a word is broken mid-letter (one word whose letters sit on two lines, «Di ch tm ilc h»)
//   target    phone: a button or link smaller than 44 × 44 px (inline text links in a sentence allowed)
//   h1        not exactly one page title (h1)
//   primary   more than one main button (.btn.hi) in the page: reported only, never red
// Today's counts live in tests/guard-baseline.json ("layout": route@width → rule → count). A test
// fails only when a page gets MORE than its baseline. Update after a planned change (and say why in
// the PR): GUARD_UPDATE=1 npx playwright test tests/e2e/guard.spec.js; node scripts/style-lint.mjs --merge-e2e
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openHome } from './home0460-fixture.js';

const ROUTES = [
  ['#/', 'Heute'],
  ['#/trips', 'Touren'],
  ['#/pack', 'Packen'],
  ['#/pack/templates', 'Vorlagen'],
  ['#/pack/past', 'Vergangene Touren'],
  ['#/ride', 'Unterwegs'],
  ['#/debrief', 'Rückblick'],
  ['#/debrief/ride', 'Fahrt hochladen'],
  // v0.49.0 R1: #/review is part of the Rückblick now; its pages one level below are checked instead
  ['#/debrief/learnings', 'Gelernt'],
  ['#/debrief/pace', 'Tempo'],
  ['#/debrief/logbook', 'Logbuch'], // v0.58.0 R2
  ['#/gear', 'Material'],
  ['#/gear?tab=weigh', 'Material wiegen'],
  ['#/gear?tab=wishlist', 'Wunschliste'],
  ['#/gear/import', 'Import prüfen'],
  ['#/favorites', 'Favoriten'],
  ['#/blocks', 'Bausteine'],
  ['#/wardrobe', 'Kleiderschrank'],
  ['#/bikes', 'Velos Setup'],
  ['#/bikes?tab=care', 'Velos Pflege'],
  ['#/inbox', 'Inbox'],
  ['#/features', 'Funktionen'],
];
const FAIL_RULES = ['hscroll', 'wordbreak', 'target', 'h1'];
const REPORT_RULES = ['primary'];
const UPDATE = !!process.env.GUARD_UPDATE;
const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = JSON.parse(readFileSync(`${root}tests/guard-baseline.json`, 'utf8')).layout ?? {};

/** Runs in the page: the findings of the view as it is now. */
function measure(phone) {
  const W = window.innerWidth;
  const out = { hscroll: [], wordbreak: [], target: [], h1: [], primary: [] };
  const visible = (el) => {
    if (!el.isConnected || el.closest('[hidden], [inert]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
  };
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList].filter((c) => !c.startsWith('svelte-')).slice(0, 2).map((c) => `.${c}`).join('')}`;
  const where = (el) => {
    const p = el.parentElement?.closest('[class], [id]');
    return p ? `${name(p)} > ${name(el)}` : name(el);
  };
  // the page lives in <main>, open dialogs on top of it count too; the bars are the App's own
  const scopes = [document.querySelector('main'), ...document.querySelectorAll('dialog[open]')].filter(Boolean);

  const sw = document.documentElement.scrollWidth;
  if (sw > W + 1) out.hscroll.push(`page is ${sw} px wide at ${W} px`);

  // a word broken mid-letter: its characters sit on more than one line
  const rows = (rects) => {
    const tops = [...rects].filter((r) => r.width > 0.5).map((r) => r.top).sort((a, b) => a - b);
    let n = 0;
    let last = -1e9;
    for (const top of tops) if (top - last > 4) (n++, (last = top));
    return n;
  };
  const range = document.createRange();
  for (const scope of scopes) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent;
      if (!/\S{2}/.test(text)) continue;
      const el = node.parentElement;
      if (!el || !visible(el) || el.closest('.sr, svg, script, style')) continue;
      range.selectNodeContents(node);
      if (rows(range.getClientRects()) < 2) continue; // one line: nothing can be broken
      // words: split where a browser may break on its own (space, hyphen, slash, dash, soft hyphen)
      const re = /[^\s\-‐–—/­​]{2,}/g;
      for (let m = re.exec(text); m; m = re.exec(text)) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        if (rows(range.getClientRects()) > 1) out.wordbreak.push(`«${m[0].slice(0, 40)}» in ${where(el)} (${Math.round(el.getBoundingClientRect().width)} px wide)`);
      }
    }
  }

  if (phone) {
    // touch targets: buttons, links, summaries and [role=button] at least 44 × 44 px
    const inlineLink = (el) => {
      if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false;
      const block = el.parentElement?.closest('p, li, dd, td, small, span, div, label');
      if (!block) return false;
      const own = el.textContent.trim().length;
      return block.textContent.trim().length > own + 3; // a link inside a sentence
    };
    for (const scope of scopes) {
      for (const el of scope.querySelectorAll('button, a[href], summary, [role="button"], select')) {
        if (!visible(el) || inlineLink(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 43.5 || r.height < 43.5) out.target.push(`${where(el)} «${(el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 30)}» ${Math.round(r.width)} × ${Math.round(r.height)} px`);
      }
    }
  }

  const h1 = [...document.querySelectorAll('h1')].filter((h) => h.getClientRects().length > 0 && getComputedStyle(h).visibility !== 'hidden');
  if (h1.length !== 1) out.h1.push(`${h1.length} page titles (h1)${h1.length ? `: ${h1.map((h) => `«${h.textContent.trim().slice(0, 30)}»`).join(', ')}` : ''}`);
  // at most one main button: the extra ones are counted
  const hi = scopes.flatMap((s) => [...s.querySelectorAll('.btn.hi')]).filter(visible);
  for (const el of hi.slice(1)) out.primary.push(`${where(el)} «${el.textContent.trim().slice(0, 30)}» (${hi.length} main buttons)`);
  return out;
}

/** Measure until two readings agree (the page may still fill from the database). */
async function settle(page, phone) {
  let last = null;
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(i ? 250 : 400);
    const now = await page.evaluate(measure, phone);
    const sig = JSON.stringify(Object.fromEntries(Object.entries(now).map(([k, v]) => [k, v.length])));
    if (last === sig) return now;
    last = sig;
  }
  return page.evaluate(measure, phone);
}

const widthsOf = (project) => (project === 'phone' ? [320, 390] : [1440]);
// four groups per device so the routes run side by side
const GROUPS = 4;
for (let g = 0; g < GROUPS; g++) {
  const routes = ROUTES.filter((_, i) => i % GROUPS === g);
  test(`guard layout group ${g + 1}`, async ({ page, context }, info) => {
    test.setTimeout(120_000);
    const phone = info.project.name === 'phone';
    page.on('dialog', (d) => d.dismiss());
    await openHome(page, context, info);
    const height = page.viewportSize().height;
    const found = {};
    const failures = [];
    const reports = [];
    const listed = []; // GUARD_UPDATE: every finding, the cleanup list
    for (const w of widthsOf(info.project.name)) {
      await page.setViewportSize({ width: w, height });
      for (const [hash, label] of routes) {
        await page.goto(`./${hash}`);
        await page.reload();
        await expect(page.locator('main'), `${label} (${hash}) opens`).not.toBeEmpty();
        const now = await settle(page, phone);
        const key = `${hash}@${w}`;
        found[key] = Object.fromEntries([...FAIL_RULES, ...REPORT_RULES].map((r) => [r, now[r].length]));
        for (const rule of [...FAIL_RULES, ...REPORT_RULES]) {
          if (UPDATE && now[rule].length) listed.push(`${label} ${key} ${rule}: ${now[rule].length}`, ...now[rule].map((x) => `    ${x}`));
          const was = baseline[key]?.[rule] ?? 0;
          if (now[rule].length <= was) continue;
          const lines = [`${label} ${key}: ${now[rule].length} ${rule} (baseline ${was})`, ...now[rule].map((x) => `    ${x}`)];
          (FAIL_RULES.includes(rule) ? failures : reports).push(...lines);
        }
      }
    }
    if (UPDATE) {
      mkdirSync(`${root}test-results/guard`, { recursive: true });
      writeFileSync(`${root}test-results/guard/${info.project.name}-${g}.json`, JSON.stringify(found));
    }
    const total = Object.values(found).reduce((s, c) => s + FAIL_RULES.reduce((n, r) => n + c[r], 0), 0);
    console.log(`Wächter ${info.project.name} group ${g + 1}: ${Object.keys(found).length} views, ${total} findings (baseline ${Object.keys(found).reduce((s, k) => s + FAIL_RULES.reduce((n, r) => n + (baseline[k]?.[r] ?? 0), 0), 0)})`);
    if (listed.length) console.log(listed.join('\n'));
    if (reports.length) console.log(`More main buttons than the baseline (report only):\n${reports.join('\n')}`);
    if (!UPDATE) expect(failures, `New layout findings (fix the page, or update the baseline with a reason in the PR):\n${failures.join('\n')}`).toEqual([]);
  });
}
