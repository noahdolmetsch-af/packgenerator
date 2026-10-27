// «Gruppen überall» (Noah 18.10.2026): the topics of «Gelernt» can be renamed and deleted; deleting asks
// where the learnings go («Ohne Thema» first), then Undo. Fictional learnings only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));
const P = 'test_data_gtp_';
const LEARN = [
  { id: 'gl1', topic: `${P}Essen`, rule: `${P} mehr Riegel`, priority: 'high' },
  { id: 'gl2', topic: `${P}Essen`, rule: `${P} Wasser früh auffüllen` },
  { id: 'gl3', topic: `${P}Schlafen`, rule: `${P} Mütze mitnehmen` },
];

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
  await page.evaluate((rows) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const tx = req.result.transaction('learnings', 'readwrite');
      for (const r of rows) tx.objectStore('learnings').put(r);
      tx.oncomplete = () => { req.result.close(); done(); };
    };
  }), LEARN);
}
const topics = (page) =>
  page.evaluate(() => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction('learnings').objectStore('learnings').getAll();
      get.onsuccess = () => { req.result.close(); done(Object.fromEntries(get.result.filter((l) => l.id.startsWith('gl')).map((l) => [l.id, l.topic]))); };
    };
  }));

test('Gruppen ueberall: a learnings topic is renamed, then deleted into another topic, Undo brings it back', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/debrief/learnings');
  await page.reload(); // the learnings were written past the app's database layer
  await settle(page);
  const sec = page.locator('#learnings');
  await sec.getByRole('button', { name: T('Rename topic {name}', { name: `${P}Essen` }) }).click();
  const rn = page.locator('dialog.rename[open]');
  await rn.getByLabel(T('Name'), { exact: true }).fill(`${P}Verpflegung`);
  await rn.getByRole('button', { name: T('Save') }).click();
  await expect.poll(() => topics(page)).toEqual({ gl1: `${P}Verpflegung`, gl2: `${P}Verpflegung`, gl3: `${P}Schlafen` });

  await sec.getByRole('button', { name: T('Delete topic {name}', { name: `${P}Verpflegung` }) }).click();
  const ask = page.getByRole('dialog', { name: T('Delete topic «{name}»?', { name: `${P}Verpflegung` }) });
  await expect(ask.getByRole('radio', { name: new RegExp(T('No topic')) })).toBeChecked();
  await ask.getByRole('radio', { name: new RegExp(`^${P}Schlafen$`, 'i') }).check(); // the page shows a topic with a capital first letter
  await ask.getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect.poll(() => topics(page)).toEqual({ gl1: `${P}Schlafen`, gl2: `${P}Schlafen`, gl3: `${P}Schlafen` });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(() => topics(page)).toEqual({ gl1: `${P}Verpflegung`, gl2: `${P}Verpflegung`, gl3: `${P}Schlafen` });
});
