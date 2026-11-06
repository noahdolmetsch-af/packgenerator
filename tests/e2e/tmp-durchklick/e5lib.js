// Etappe 5 helpers (temporary, not committed)
import { expect } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { prepare, fixture, importBackup, table, sideways, cutOff, brokenWords, untranslated } from '../gesamttest/lib.js';
import { openData, settle } from '../settle.js';
import DE from '../../../src/lib/i18n/de/index.js';

export const MODE = process.env.DATA || 'fixture'; // 'real' | 'fixture' | 'empty'
export const REAL = process.env.REAL_BACKUP;
export const OUT = process.env.OUT || '/tmp/claude-0/e5out';
mkdirSync(OUT, { recursive: true });
export const log = (file, obj) => appendFileSync(`${OUT}/${file}`, `${JSON.stringify(obj)}\n`);

export async function startE5(page, context, info) {
  const errors = await prepare(page, context, 'de');
  await page.goto('./');
  if (MODE === 'fixture') {
    await importBackup(page, info, fixture().data);
  } else if (MODE === 'real') {
    const t0 = Date.now();
    const data = await openData(page);
    await data.getByLabel(DE['Import backup'] ?? 'Import backup').setInputFiles(REAL);
    await data.getByRole('button', { name: DE['Replace all data'] ?? 'Replace all data' }).press('Enter');
    await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'update.templatesLinked2026'), { timeout: 240_000 }).toBe(true);
    log('timing.jsonl', { what: 'import-real', ms: Date.now() - t0 });
  }
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'flowSeeded'), { timeout: 60_000 }).toBe(true).catch(() => {});
  for (let i = 0; i < 3; i++) {
    await page.goto('./#/');
    await page.locator('main').waitFor();
    await settle(page).catch(() => {});
    if (await page.evaluate(() => /^#?\/?(\?.*)?$/.test(location.hash))) break;
  }
  errors.length = 0;
  return errors;
}

export const small = (page) =>
  page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('main :is(button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch])')) {
      if (!el.getClientRects().length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4) continue;
      if (r.height < 44 && r.width < 44 || r.height < 24) out.push(`${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 28)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return [...new Set(out)].slice(0, 8);
  });

export async function waitReady(page) {
  await page.locator('main').waitFor({ timeout: 30_000 });
  await page
    .waitForFunction(() => {
      const m = document.querySelector('main');
      return !!m && m.innerText.trim().length > 0 && !m.querySelector('[aria-busy="true"]');
    }, null, { timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(250);
}

export async function checkPage(page, errors, hash, project, noSmall = false) {
  const probs = [];
  if (await page.locator('[data-error-page]').count()) probs.push(['Fehlerseite', (await page.locator('[data-error-page]').first().innerText()).slice(0, 160)]);
  for (const e of errors.splice(0)) probs.push(['Konsole', e.slice(0, 220)]);
  const sw = await sideways(page);
  if (sw.sw > sw.w + 1) probs.push(['seitlich', `${sw.sw} > ${sw.w}: ${sw.wide.join(', ')}`]);
  const en = await untranslated(page);
  if (en.exact.length) probs.push(['englisch', en.exact.slice(0, 5).join(' · ')]);
  const cut = await cutOff(page);
  if (cut.length) probs.push(['abgeschnitten', cut.slice(0, 4).join(' · ')]);
  const bw = await brokenWords(page);
  if (bw.length) probs.push(['Wort getrennt', bw.slice(0, 3).join(' · ')]);
  const sm = noSmall ? [] : await small(page);
  if (sm.length) probs.push(['klein', sm.join(' · ')]);
  for (const [what, detail] of probs) log('walk.jsonl', { project, hash, what, detail });
  return probs;
}
