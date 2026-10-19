// Trello (Noah 19.10.2026 «1a 2a 3b 4a 5a», «1a 2a»): Kalender › Merken connects Trello, the to-dos go to the
// list «To-dos» on the board «Packgenerator», a Trello list comes in as an own list, a new to-do goes to Trello,
// a due card stands in «Heute wichtig», and a list can choose «Auch in Trello».
// The server (packgen-three.vercel.app/api/google?svc=trello) and Trello's permission page are answered by the test with a
// small board in memory; everything else outside the preview server is blocked. Fictional entries only.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const de = (en) => DE[en] ?? en;
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const hex = (n) => n.toString(16).padStart(24, '0');

test('Trello: connect, sync both ways, due card on Heute, a list also in Trello', async ({ page, context, baseURL }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let next = 100;
  const board = { board: { id: hex(1), name: 'Packgenerator', url: 'https://trello.example.test/b/pg' }, lists: [{ id: hex(2), name: 'Werkstatt' }], cards: [{ id: hex(3), list: hex(2), name: 'Licht prüfen', due: zurichToday(), done: false }] };
  const applied = [];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google\?svc=trello/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const step = new URL(req.url()).searchParams.get('step');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    const ok = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return ok({ url: 'https://trello.com/1/authorize?key=x&return_url=y' });
    if (step === 'board') return ok(JSON.parse(JSON.stringify(board)));
    if (step === 'apply') {
      const made = new Map();
      const results = body.ops.map((op) => {
        applied.push(op);
        if (op.op === 'list-new') {
          const id = hex(next++);
          board.lists.push({ id, name: op.name });
          made.set(op.ref, id);
          return { ref: op.ref, id };
        }
        if (op.op === 'card-new') {
          const id = hex(next++);
          board.cards.push({ id, list: op.list ?? made.get(op.listRef), name: op.name, due: op.due, done: op.done });
          return { ref: op.ref, id };
        }
        return { ref: null, id: op.id };
      });
      return ok({ results });
    }
    if (step === 'disconnect') return ok({});
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/trello\.com\/1\/authorize/, (route) => route.fulfill({ status: 302, headers: { location: `${baseURL}#/calendar?trello=connected` } }));
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', 'test_data_trello_key');
  });
  await page.goto('./');
  await ready(page);

  // Kalender › Merken: not connected yet, explained where nobody gets lost
  await page.goto('./#/calendar');
  const box = page.locator('section.tb');
  await expect(box.getByText(de('Needed once: a workspace «Packgenerator» in Trello. The app makes the board itself.'))).toBeVisible();
  await box.getByRole('button', { name: de('Connect Trello') }).click();

  // back from Trello: connected, the to-dos went to Trello, the list «Werkstatt» came in
  await expect(box.getByText(de('Connected with the board «{name}».').replace('{name}', 'Packgenerator'))).toBeVisible();
  await expect(page.getByText(de('Also in Trello: list «To-dos»'))).toBeVisible();
  await expect(page.getByRole('link', { name: /Werkstatt/ })).toContainText(de('Also in Trello'));
  expect(applied.some((o) => o.op === 'list-new' && o.name === 'To-dos')).toBe(true);

  // a new to-do goes to Trello with «Jetzt abgleichen»
  await page.getByRole('button', { name: de('Add a to-do') }).click();
  await page.getByLabel(de('What?')).fill('Pneu flicken');
  await page.getByRole('button', { name: de('Save'), exact: true }).click();
  await box.getByRole('button', { name: de('Sync now') }).click();
  await expect.poll(() => applied.some((o) => o.op === 'card-new' && o.name === 'Pneu flicken')).toBe(true);

  // the list's own window: «Auch in Trello» is chosen
  await page.getByRole('link', { name: /Werkstatt/ }).click();
  await expect(page.getByText('Licht prüfen')).toBeVisible();

  // Heute: the due Trello card stands in «Heute wichtig»
  await page.goto('./#/');
  await expect(page.locator('[data-row="trello"]')).toContainText('Licht prüfen');

  // a new list can choose «Auch in Trello»
  await page.goto('./#/calendar');
  await page.getByRole('button', { name: de('New list') }).click();
  const sheet = page.locator('dialog.lsheet');
  await expect(sheet.getByRole('button', { name: de('Also in Trello') })).toBeEnabled();
  await sheet.getByRole('button', { name: de('Also in Trello') }).click();
  await expect(sheet.getByText(de('A list on your Trello board «Packgenerator»; changes go both ways.'))).toBeVisible();
  expect(errors).toEqual([]);
});
