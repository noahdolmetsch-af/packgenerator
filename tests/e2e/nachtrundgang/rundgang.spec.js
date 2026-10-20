// Nacht-Rundgang (Noah 20.10.2026 «1a»): every night a robot walks through every page of the app,
// like the Gesamttest by hand on 20.10.2026, with the big fictional data (tests/fixtures/gesamttest).
// It starts on Today and follows every link inside the app (#/…) it finds, page by page, on a phone
// and on a computer. On every page it checks: no error in the browser, no error page, nothing that
// pushes the page sideways, and no English text that has a German one.
// Only the nightly workflow runs it (.github/workflows/nacht.yml, RUNDGANG=1); a pull request does not.
// The findings go to test-results/rundgang/<project>.md; the workflow turns them into an issue.
// Buttons that delete or send something are never pressed: the robot only opens addresses.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { start, sideways, untranslated } from '../gesamttest/lib.js';

const MAX = Number(process.env.RUNDGANG_MAX) || 400; // addresses per device
const PER_PATH = 4; // the same page with different ?… at most this often
const OUT = fileURLToPath(new URL('../../../test-results/rundgang/', import.meta.url));

// Addresses that leave the app or start something (a download, a login, a sign-out) are not opened.
const SKIP = /^#\/(logout|auth|connect|oauth|pay\/|paylink|share\/receive)/;

/** «#/bikes?tab=care&bike=b1» → the page part «#/bikes» and a key with the sorted ?… */
const norm = (hash) => {
  const [p, q = ''] = hash.split('?');
  const path = p.replace(/\/+$/, '') || '#/';
  const query = [...new URLSearchParams(q)].sort(([a], [b]) => a.localeCompare(b));
  return { path, key: `${path}?${new URLSearchParams(query)}` };
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(60 * 60_000);

test('Rundgang: every page the links reach, without errors', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  errors.length = 0; // the start (import) is checked by the Gesamttest
  const seen = new Set();
  const perPath = new Map();
  const queue = ['#/'];
  const findings = [];
  let visited = 0;

  while (queue.length && visited < MAX) {
    const hash = queue.shift();
    const { path, key } = norm(hash);
    if (seen.has(key)) continue;
    seen.add(key);
    if ((perPath.get(path) ?? 0) >= PER_PATH) continue;
    perPath.set(path, (perPath.get(path) ?? 0) + 1);
    visited++;

    errors.length = 0;
    try {
      await page.goto(`./${hash}`);
      await page.locator('main').waitFor({ timeout: 20_000 });
      await page
        .waitForFunction(() => {
          const m = document.querySelector('main');
          return !!m && m.innerText.trim().length > 0 && !m.querySelector('[aria-busy="true"]');
        }, null, { timeout: 20_000 })
        .catch(() => {});
      await page.waitForTimeout(300);
    } catch (e) {
      findings.push({ hash, what: 'lädt nicht', detail: String(e.message).split('\n')[0] });
      continue;
    }

    const problems = [];
    if (await page.locator('[data-error-page]').count()) problems.push(['Fehlerseite', (await page.locator('[data-error-page]').first().innerText()).slice(0, 160)]);
    for (const e of errors) problems.push(['Fehler im Browser', e.slice(0, 200)]);
    const sw = await sideways(page);
    if (sw.sw > sw.w + 1) problems.push(['schiebt seitlich', `${sw.sw} > ${sw.w} px: ${sw.wide.join(', ')}`]);
    const en = await untranslated(page);
    if (en.exact.length) problems.push(['englisch', en.exact.slice(0, 5).join(' · ')]);
    for (const [what, detail] of problems) findings.push({ hash, what, detail });

    // every link inside the app on this page
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href')));
    for (const l of links) if (!SKIP.test(l) && !seen.has(norm(l).key)) queue.push(l);
  }

  mkdirSync(OUT, { recursive: true });
  const name = info.project.name;
  const lines = [
    `## Rundgang ${name === 'phone' ? 'Handy (390 px)' : 'Computer (1440 px)'}`,
    '',
    `${visited} Adressen geöffnet, ${findings.length} Funde.`,
    '',
    ...(findings.length ? ['| Adresse | Was | Genau |', '|---|---|---|', ...findings.map((f) => `| \`${f.hash}\` | ${f.what} | ${f.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`)] : ['Alles in Ordnung.']),
    '',
  ];
  writeFileSync(`${OUT}${name}.md`, lines.join('\n'));
  writeFileSync(`${OUT}${name}.json`, JSON.stringify({ visited, findings }, null, 1));

  expect(visited, 'the robot reached many pages').toBeGreaterThan(80);
  expect(findings, lines.join('\n')).toEqual([]);
});
