// Nacht-Roboter «Langes Wort» (Noah 06.11.2026 «4a»): every night a robot types a very long word
// without a break point into the text fields of the pages and saves it. Then it checks that no page
// became wider than the screen: not while typing, not after saving, not after a reload.
// Why: in Etappe 5 five pages (E5-001..005) pushed sideways because a long name had nowhere to break
// (a grid column with `auto` width, a paragraph without `overflow-wrap`). A user's own text can be as
// long as it likes; the page has to cope. Fix in CSS: `overflow-wrap: break-word` on the text and
// `grid-template-columns: minmax(0, 1fr)` plus `min-width: 0` on the grid.
// Only the nightly workflow runs it (.github/workflows/nacht.yml, RUNDGANG=1); a pull request does not.
// The findings go to test-results/rundgang/lang-wort-<project>.md; the workflow adds them to the issue.
// LWPAGES='#/flow,#/me/wohl' limits it to some pages (to look at one finding). Fictional data only (tests/fixtures/gesamttest). Buttons that delete, send, reset or leave the app are
// never pressed.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { start } from '../gesamttest/lib.js';

const OUT = fileURLToPath(new URL('../../../test-results/rundgang/', import.meta.url));
const LONG = 'Superkalifragilistischexpialigetischwiederholungsunterbrechungsmöglichkeit'.repeat(3);

// The pages with forms or lists of the user's own words (Aktiv, Training, Wohlbefinden, Auswerten,
// Erinnerungen from Etappe 5, plus the other pages where the user types names and notes).
const PAGES = (process.env.LWPAGES ? process.env.LWPAGES.split(',') : null) ?? [
  '#/flow', '#/flow/sports', '#/flow/training', '#/flow/plans', '#/flow/form', '#/flow/review', '#/flow/milestones',
  '#/flow/gipfelbuch', '#/flow/act/meditation', '#/flow/sport/act%3Atennis', '#/check/morning', '#/check/evening',
  '#/me/abfragen', '#/me/insights', '#/me/wohl', '#/routine', '#/timer', '#/auswerten', '#/auswerten/analyse', '#/debrief',
  '#/debrief/tourenpass', '#/gelernt', '#/neuland', '#/trips/dreams', '#/inspiration', '#/me/reminders', '#/me/push',
  '#/me/weight',
];
// Buttons that open an entry form / that save it / that are never pressed.
const ADD = /neu|hinzufüg|anlegen|eintrag|erfass|ergänz|\+|erstell|plan|notiz|schreib|frage|routine|sportart|ziel|ändern|umbenenn/i;
const SAVE = /speicher|hinzufüg|anlegen|eintrag|^ok$|übernehm|erstell|sichern|fertig/i;
const NEVER = /lösch|entfern|zurücksetz|senden|teilen|verbind|bezahl|abmeld|import|export|leeren|reset|backup|schliess|abbrech|zurück$|rückgängig/i;
const MAX_BUTTONS = 6; // entry forms tried per page
const FIELD = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=password]):not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled])';

test.describe.configure({ mode: 'serial' });
test.setTimeout(60 * 60_000);

/** Wider than the screen? The fixed width of the project, not clientWidth (a wide page widens that on a phone). */
const wider = (page) =>
  page.evaluate((vw) => {
    const sw = document.documentElement.scrollWidth;
    if (sw <= vw + 1) return null;
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.right <= vw + 1 || getComputedStyle(el).position === 'fixed') return false;
        // a row to swipe on purpose (overflow auto / scroll / hidden) holds its wide parts inside itself
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX)) return false;
        return true;
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`);
    return `${sw} > ${vw} px: ${wide.join(', ')}`;
  }, page.viewportSize().width);

test('Lang-Wort: a very long word in every text field does not push a page wider than the screen', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  errors.length = 0;
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  const findings = [];
  const seen = new Set();
  const note = (hash, button, what, detail) => {
    const key = `${hash}|${button}|${what}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ hash, button, what, detail });
  };
  const open = async (hash) => {
    await page.goto(`./${hash}`);
    await page.reload();
    await page.locator('main').waitFor({ timeout: 20_000 });
    await page
      .waitForFunction(() => {
        const m = document.querySelector('main');
        return !!m && m.innerText.trim().length > 0 && !m.querySelector('[aria-busy="true"]');
      }, null, { timeout: 20_000 })
      .catch(() => {});
    await page.waitForTimeout(300);
  };
  const label = (loc) => loc.evaluate((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 50)).catch(() => '');
  let tried = 0;

  for (const hash of PAGES) {
    try {
      await open(hash);
    } catch (e) {
      note(hash, '', 'lädt nicht', String(e.message).split('\n')[0]);
      continue;
    }
    const names = await page.locator('main button:visible').evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 50)));
    // the form that stands open on the page itself (no button to press first)
    const starts = [''];
    let n = 0;
    names.forEach((name) => {
      if (name && name.length <= 40 && !name.includes('\n') && ADD.test(name) && !NEVER.test(name) && n < MAX_BUTTONS) (starts.push(name), n++);
    });

    for (const name of starts) {
      if (name) {
        await open(hash);
        const idx = (await page.locator('main button:visible').evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 50)))).indexOf(name);
        if (idx < 0) continue;
        await page.locator('main button:visible').nth(idx).click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(300);
      }
      // a window that opened (dialog, sheet) is the place to type; otherwise the page itself
      const sheet = page.locator('dialog[open], [role=dialog], [data-sheet]').last();
      const scope = (await sheet.count()) ? sheet : page.locator('main');
      const fields = scope.locator(FIELD);
      const count = Math.min(await fields.count(), 6);
      let typed = 0;
      for (let j = 0; j < count; j++) {
        const el = fields.nth(j);
        if (!(await el.isVisible())) continue;
        const type = (await el.getAttribute('type')) || 'text';
        if (!['text', 'search', 'url', 'email'].includes(type) && (await el.evaluate((e) => e.tagName)) !== 'TEXTAREA') continue;
        // an email / url field cannot hold the word (the browser refuses it on saving), but it can be typed
        await el.fill(LONG, { timeout: 1000 }).then(() => typed++, () => {});
      }
      if (!typed) continue;
      tried++;
      let w = await wider(page);
      if (w) note(hash, name, 'schiebt seitlich beim Tippen', w);

      const buttons = scope.locator('button:visible');
      const texts = await buttons.evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim()));
      const si = texts.findIndex((x) => SAVE.test(x) && !NEVER.test(x));
      if (si >= 0) {
        await buttons.nth(si).click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
        w = await wider(page);
        if (w) note(hash, name, 'schiebt seitlich nach dem Speichern', `${texts[si]}: ${w}`);
        await page.reload();
        await page.locator('main').waitFor({ timeout: 20_000 });
        await page.waitForTimeout(500);
        w = await wider(page);
        if (w) note(hash, name, 'schiebt seitlich nach dem Neuladen', w);
      }
    }
  }

  mkdirSync(OUT, { recursive: true });
  const proj = info.project.name;
  const lines = [
    `## Langes Wort ${proj === 'phone' ? 'Handy (390 px)' : 'Computer (1440 px)'}`,
    '',
    `${PAGES.length} Seiten, ${tried} Formulare mit einem sehr langen Wort gefüllt, ${findings.length} Funde.`,
    '',
    ...(findings.length ? ['| Seite | Knopf | Was | Genau |', '|---|---|---|---|', ...findings.map((f) => `| \`${f.hash}\` | ${f.button || '(offen auf der Seite)'} | ${f.what} | ${f.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`)] : ['Alles in Ordnung.']),
    '',
  ];
  writeFileSync(`${OUT}lang-wort-${proj}.md`, lines.join('\n'));
  writeFileSync(`${OUT}lang-wort-${proj}.json`, JSON.stringify({ tried, findings }, null, 1));

  expect(tried, 'the robot filled many forms').toBeGreaterThan(20);
  expect(findings, lines.join('\n')).toEqual([]);
});
