import { test } from '@playwright/test';
import { startE5, waitReady, log, OUT } from './e5lib.js';
import { sideways, table } from '../gesamttest/lib.js';

const LONG = 'Superkalifragilistischexpialigetischwiederholungsunterbrechungsmöglichkeit'.repeat(2);
const probe = async (page, label) => {
  const d = await page.evaluate(() => {
    const scope = document.querySelector('dialog[open]') || document.querySelector('[role=dialog]') || document.querySelector('main');
    const vis = (e) => e.getClientRects().length;
    return {
      inputs: [...scope.querySelectorAll('input, textarea, select')].filter(vis).map((e) => `${e.tagName}/${e.type}/${e.getAttribute('aria-label') || e.placeholder || e.name || ''}`.slice(0, 60)),
      buttons: [...scope.querySelectorAll('button')].filter(vis).map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)),
      text: scope.innerText.replace(/\s+/g, ' ').slice(0, 300),
    };
  });
  log('flows.jsonl', { label, ...d });
  return d;
};
const sw = async (page, label) => { const s = await sideways(page); if (s.sw > s.w + 1) log('flows.jsonl', { label, what: 'seitlich', detail: `${s.sw}>${s.w}: ${s.wide.slice(0, 2).join(',')}` }); };

test('flows', async ({ page, context }, info) => {
  test.setTimeout(30 * 60_000);
  const errors = await startE5(page, context, info);
  const P = info.project.name;
  const snapEntries = async () => (await table(page, 'settings')).filter((s) => /weight/i.test(s.key)).map((s) => JSON.stringify(s.value).slice(0, 300));

  // W1 Gewicht
  await page.goto('./#/me/weight'); await page.reload(); await waitReady(page);
  for (const v of ['', '0', '-5', '1,5', '29.9', '30', '75,55', '250', '250.1', '99999', 'abc', ' 70 ', '7e1', '1e9']) {
    await page.getByRole('button', { name: /Gewicht eintragen/ }).first().click();
    await page.waitForTimeout(150);
    const kg = page.locator('[data-weight-kg]');
    await kg.fill(v);
    await page.getByRole('button', { name: /^Speichern$/ }).click();
    await page.waitForTimeout(250);
    const open = await page.locator('dialog[open]').count();
    const txt = open ? await page.locator('dialog[open]').innerText() : (await page.locator('[role=status]').allInnerTexts()).join(' | ');
    log('flows.jsonl', { label: `W1 Gewicht «${v}»`, P, dialogOffen: open, text: txt.replace(/\s+/g, ' ').slice(0, 160) });
    if (open) await page.getByRole('button', { name: /^Abbrechen$/ }).click();
    await sw(page, `W1 ${v}`);
  }
  // double click save
  await page.getByRole('button', { name: /Gewicht eintragen/ }).first().click();
  await page.locator('[data-weight-kg]').fill('80');
  await page.getByRole('button', { name: /^Speichern$/ }).dblclick().catch((e) => log('flows.jsonl', { label: 'W1 dblclick', err: String(e.message).slice(0, 100) }));
  await page.waitForTimeout(400);
  log('flows.jsonl', { label: 'W1 nach Doppelklick', rows: await page.locator('[data-weight-day]').count() });
  await page.reload(); await waitReady(page);
  log('flows.jsonl', { label: 'W1 nach Neuladen', rows: await page.locator('[data-weight-day]').count() });
  // undo
  await page.locator('[data-weight-day]').first().click();
  await page.getByRole('button', { name: /Entfernen/ }).click();
  await page.waitForTimeout(300);
  log('flows.jsonl', { label: 'W1 entfernt', rows: await page.locator('[data-weight-day]').count(), toasts: (await page.locator('[role=status]').allInnerTexts()).join('|').slice(0, 120) });
  await page.getByRole('button', { name: /Rückgängig/ }).last().click().catch(() => {});
  await page.waitForTimeout(300);
  log('flows.jsonl', { label: 'W1 Rückgängig', rows: await page.locator('[data-weight-day]').count() });
  await page.screenshot({ path: `${OUT}/shots/flow-weight-${P}.png` });

  // W2 Wochenrückblick
  await page.goto('./#/flow/review'); await page.reload(); await waitReady(page);
  const ta = page.locator('main textarea').first();
  await ta.fill(LONG + ' <b>x</b> 😀');
  const inp = page.locator('main input[type=text]').first();
  await inp.fill(LONG);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await sw(page, 'W2 Review nach Eingabe');
  await page.reload(); await waitReady(page);
  log('flows.jsonl', { label: 'W2 Review nach Neuladen', ta: (await page.locator('main textarea').first().inputValue()).slice(0, 40), inp: (await page.locator('main input[type=text]').first().inputValue()).slice(0, 40) });
  await sw(page, 'W2 Review nach Neuladen');

  // W3 Training: Einheit planen
  await page.goto('./#/flow/training'); await page.reload(); await waitReady(page);
  await page.getByRole('button', { name: /^Einheit am Montag planen/ }).click().catch((e) => log('flows.jsonl', { label: 'W3', err: String(e.message).slice(0, 100) }));
  await page.waitForTimeout(300);
  const d3 = await probe(page, 'W3 Einheit-Fenster');
  await page.screenshot({ path: `${OUT}/shots/flow-training-sheet-${P}.png` });
  // W3b FTP eintragen
  await page.keyboard.press('Escape');
  await page.goto('./#/flow/training'); await page.reload(); await waitReady(page);
  await page.getByRole('button', { name: /FTP eintragen/ }).click().catch(() => {});
  await page.waitForTimeout(300);
  await probe(page, 'W3b FTP-Fenster');

  // W4 Wi gaht's am Morgen
  await page.goto('./#/check/morning'); await page.reload(); await waitReady(page);
  await probe(page, 'W4 Morgen-Seite');
  for (const [i, v] of [['0', 'a'], ['-3', 'b'], ['99999', 'c']].entries()) {}
  const nums = page.locator('main input[type=number]');
  log('flows.jsonl', { label: 'W4 number inputs', n: await nums.count() });

  // W5 Timer: Zeit eintippen
  await page.goto('./#/timer'); await page.reload(); await waitReady(page);
  const tf = page.getByPlaceholder(/Zeit eintippen/);
  for (const v of ['0', '-5', '99:99', '1,5', 'abc', '999999', '25', '1:30', '90 min']) {
    await tf.fill(v);
    await tf.press('Enter');
    await page.waitForTimeout(250);
    const t = await page.evaluate(() => document.querySelector('main').innerText.replace(/\s+/g, ' ').slice(0, 400));
    log('flows.jsonl', { label: `W5 Timer «${v}»`, bad: /NaN|undefined|Infinity/.test(t), snippet: (t.match(/\d{1,2}:\d{2}(:\d{2})?/g) || []).slice(0, 4).join(' ') });
    await sw(page, `W5 ${v}`);
  }
  for (const e of errors.splice(0)) log('flows.jsonl', { label: 'Konsole', e: e.slice(0, 200) });
});
