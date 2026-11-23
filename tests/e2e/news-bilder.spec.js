// «Bilder bei jeder Neuheit» (Noah 23.11.2026 «1b 2a 3a 4b 5a», thread «Neuheiten in der App besser zeigen»): makes the
// pictures of «What is new». This is a tool, not a check: it runs only when NEWS_BILDER is set (names of news files without
// «.js», separated by blanks, or «all») and is skipped otherwise. `npm run news:bilder` sets it up (scripts/news-bilder.mjs).
//
// For every line of a news file that has an exact place (`go` with steps, or a function of the catalogue) it takes
//   public/news/<name>/<line>-nachher.jpg   the lit spot after the change, from «Try it» on the phone (390 px, fictional data)
//   public/news/<name>/<line>-vorher.jpg    the same cut of the same page in the app before the change (BASE_URL), only when
//                                           the place existed there and looks different
// <line> counts the lines of the news file, main points first, then the small things, from 1. At most MAX_LINES per file.
// Fictional data only (gesamttest fixture), light mode, German, clock at noon.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { NEWS, NEWS_DE } from '../../src/lib/news/index.gen.js';

const T0 = tr('de');
const T = (en) => NEWS_DE[en] ?? T0(en);
const WANT = process.env.NEWS_BILDER;
const BASE = process.env.BASE_URL || '';
const OUT = new URL('../../public/news/', import.meta.url).pathname;
const MAX_LINES = 3;
const QUALITY = 70;

const names = !WANT ? [] : WANT === 'all' ? NEWS.map((e) => e.id) : WANT.split(/\s+/).filter(Boolean);

test.skip(!WANT, 'Only with NEWS_BILDER=<names>|all (npm run news:bilder)');
test.setTimeout(30 * 60_000);

/** The lines of a news entry with a place a picture can show: [{ line, go }] */
function linesOf(e) {
  const items = [...e.points, ...(e.small ?? [])];
  const out = [];
  items.forEach((p, i) => {
    const g = Object.hasOwn(p, 'go') ? p.go : null;
    if (typeof g === 'string' || (g && typeof g === 'object' && g.steps?.length && !g.where)) out.push({ line: i + 1, text: p.text, go: g });
  });
  return out.slice(0, MAX_LINES);
}

/** Taps the steps of a go in a page (a CSS selector, a shown text or an aria-label), not the last one; false when one is missing. */
async function tapSteps(page, steps) {
  return page.evaluate(async (list) => {
    const visible = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
      }
      return el.getClientRects().length > 0;
    };
    const find = (s) => {
      if (s.sel) return [...document.querySelectorAll(s.sel)].find(visible) ?? null;
      const re = new RegExp(s.re, 'i');
      const said = (e) => (s.aria ? e.getAttribute('aria-label') : e.innerText) || '';
      return [...document.querySelectorAll(s.aria ? '[aria-label]' : 'button, a, summary, [role="button"], [role="tab"], li, h2, h3, label, div, span')].find((e) => visible(e) && re.test(said(e).trim())) ?? null;
    };
    for (const s of list) {
      let el = null;
      for (let i = 0; i < 20 && !(el = find(s)); i++) await new Promise((r) => setTimeout(r, 150));
      if (!el) return false;
      el.click();
      await new Promise((r) => setTimeout(r, 400));
    }
    return true;
  }, steps);
}

const shown = (s) => {
  if (s.sel) return s;
  const text = T(s.text ?? s.aria);
  return { ...s, re: '^' + text.split(/\{[^}]+\}/).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+?') };
};

test('pictures of the news', async ({ page, context, browser }, info) => {
  expect(info.project.name, 'run it with --project=phone').toBe('phone');
  await start(page, context, info);
  let before = null; // { page, context } on the app before the change
  const baseCtx = async () => {
    if (!BASE) return null;
    if (!before) {
      const ctx = await browser.newContext({ ...info.project.use, baseURL: BASE, serviceWorkers: 'block' });
      const pg = await ctx.newPage();
      await start(pg, ctx, info);
      before = { page: pg, context: ctx };
    }
    return before;
  };
  const made = [];
  for (const id of names) {
    const e = NEWS.find((n) => n.id === id);
    if (!e) throw new Error(`no news file «${id}»`);
    const dir = `${OUT}${id}/`;
    for (const { line, text, go } of linesOf(e)) {
      // «Try it» of that line, the way a reader taps it (as tests/e2e/ausprobieren.spec.js does)
      await page.goto('./#/');
      await page.goto('./#/me/news');
      await page.locator('main h1').first().waitFor({ timeout: 8000 }).catch(() => {});
      await settle(page);
      await page.getByRole('searchbox', { name: T('Find an update') }).fill(e.version);
      await page.locator(`[data-row="${e.version}"]`).first().click().catch(() => {});
      const box = page.locator(`[data-newest="${e.version}"], .wn-vopen`).first();
      await page.evaluate(() => document.querySelector('.spot-note')?.remove());
      await box.getByRole('link', { name: T(text), exact: false }).first().click();
      const lit = page.locator('[data-spot-on]').first();
      try {
        await lit.waitFor({ state: 'visible', timeout: 10_000 });
      } catch {
        made.push(`${id} line ${line}: nothing lit, no picture`);
        continue;
      }
      await page.waitForTimeout(1000);
      const b = await lit.boundingBox();
      const vp = page.viewportSize();
      if (!b) continue;
      // the cut: the full width of the phone, the spot in the middle with some room above and below
      const y = Math.max(0, Math.floor(b.y - 90));
      const h = Math.min(vp.height - y, Math.min(440, Math.max(260, Math.ceil(b.height + 180))));
      const clip = { x: 0, y, width: vp.width, height: h };
      const scrollY = await page.evaluate(() => window.scrollY);
      // the app's own ring pulses and may be gone: the picture carries a steady orange frame round the new place
      await lit.evaluate((el) => {
        el.style.outline = '3px solid #b83e08';
        el.style.outlineOffset = '3px';
      });
      await page.evaluate(() => document.querySelectorAll('.spot-note').forEach((n) => (n.style.display = 'none')));
      mkdirSync(dir, { recursive: true });
      const after = await page.screenshot({ type: 'jpeg', quality: QUALITY, clip, animations: 'disabled' });
      writeFileSync(`${dir}${line}-nachher.jpg`, after);
      rmSync(`${dir}${line}-vorher.jpg`, { force: true });
      made.push(`${id} line ${line}: nachher`);
      // before: the same page in the app before the change, same steps but the last, same scroll and cut
      const steps = go && typeof go === 'object' ? go.steps : null;
      const b0 = steps && (await baseCtx());
      if (b0) {
        try {
          const href = go.href;
          await b0.page.goto(`./${href}`);
          await b0.page.locator('main').waitFor({ timeout: 8000 });
          await settle(b0.page);
          const ok = await tapSteps(b0.page, steps.slice(0, -1).map(shown));
          if (ok) {
            await b0.page.waitForTimeout(600);
            await b0.page.evaluate((y0) => window.scrollTo(0, y0), scrollY);
            await b0.page.waitForTimeout(300);
            const was = await b0.page.screenshot({ type: 'jpeg', quality: QUALITY, clip, animations: 'disabled' });
            if (!was.equals(after)) {
              writeFileSync(`${dir}${line}-vorher.jpg`, was);
              made.push(`${id} line ${line}: vorher`);
            }
          }
        } catch {
          /* the place did not exist before: only «nachher» */
        }
      }
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-spot-on]')).toHaveCount(0, { timeout: 6000 }).catch(() => {});
    }
  }
  if (before) await before.context.close();
  console.log(made.join('\n'));
  expect(existsSync(OUT) || made.length === 0).toBe(true);
});
