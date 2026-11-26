// Impeccable-Nachtbericht (Noah «1-8» 26.11.2026, Schritt 7 des Test-Plans): every night a robot opens every address of the app
// list (docs/app-stand.md) on a phone (390×844), a laptop (1440×800) and a computer (1440×900), with the big fictional data
// (tests/fixtures/gesamttest) only, and measures: does it load, an error page, an error in the browser, the page pushes sideways,
// a control cut off, English text that has a German one, a very long page, small tap areas.
// It never fails because of a finding (no red): it writes test-results/impeccable/<project>.json and a few pictures of the pages
// with a finding, and scripts/impeccable-bericht.mjs turns them into a short German report (impeccable-nacht.yml).
// Only the nightly workflow runs it (IMPECCABLE=1, playwright.config.js); a pull request does not.
import { test } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { start, sideways, cutOff, untranslated } from '../gesamttest/lib.js';
import { routen } from '../../../scripts/impeccable-bericht.mjs';

const OUT = fileURLToPath(new URL('../../../test-results/impeccable/', import.meta.url));
const ROUTES = routen(readFileSync(new URL('../../../docs/app-stand.md', import.meta.url), 'utf8'));
const MAX_PICTURES = 30; // per size: only pages with a finding, small files
const SIZES = {
  phone: [{ size: 'phone', width: 390, height: 844 }],
  desktop: [
    { size: 'laptop', width: 1440, height: 800 },
    { size: 'desktop', width: 1440, height: 900 },
  ],
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(75 * 60_000);

test('Impeccable-Nachtbericht: every address, three sizes, only findings', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  errors.length = 0; // the start (import) is checked by the Gesamttest
  mkdirSync(`${OUT}bilder`, { recursive: true });
  const sizes = [];

  for (const s of SIZES[info.project.name] ?? []) {
    await page.setViewportSize({ width: s.width, height: s.height });
    const pages = [];
    const findings = [];
    let pictures = 0;
    for (const hash of ROUTES) {
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
        await page.waitForTimeout(400);
      } catch (e) {
        findings.push({ hash, what: 'lädt nicht', detail: String(e.message).split('\n')[0] });
        continue;
      }
      const found = [];
      if (await page.locator('[data-error-page]').count()) found.push(['Fehlerseite', (await page.locator('[data-error-page]').first().innerText()).slice(0, 160)]);
      for (const e of errors) found.push(['Fehler im Browser', e.slice(0, 200)]);
      const sw = await sideways(page);
      if (sw.sw > sw.w + 1) found.push(['schiebt seitlich', `${sw.sw} > ${sw.w} px: ${sw.wide.join(', ')}`]);
      for (const c of await cutOff(page)) found.push(['abgeschnitten', c]);
      const en = await untranslated(page);
      if (en.exact.length) found.push(['englisch', en.exact.slice(0, 5).join(' · ')]);
      const meas = await page.evaluate(() => ({
        h: document.documentElement.scrollHeight,
        small: [...document.querySelectorAll('main button, main a[href], main input, main select')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.height < 36 || r.width < 36) && el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'hidden';
        }).length,
      }));
      pages.push({ hash, ...meas });
      for (const [what, detail] of found) findings.push({ hash, what, detail });
      if (found.length && pictures < MAX_PICTURES) {
        pictures++;
        const slug = hash.replace(/^#\/?/, '').replace(/[^a-z0-9]+/gi, '-') || 'heute';
        await page.screenshot({ path: `${OUT}bilder/${s.size}-${slug}.png`, animations: 'disabled' }).catch(() => {});
      }
    }
    sizes.push({ size: s.size, routes: ROUTES.length, pages, findings });
  }

  // never red because of a finding: the file is the result
  writeFileSync(`${OUT}${info.project.name}.json`, JSON.stringify({ project: info.project.name, sizes }, null, 1));
});
