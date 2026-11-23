// «Fitbit immer aktuell» (Noah 2.11.2026 «1a 2a 3a 4a 5a»): Heute shows «Stand …» under the Fitbit tiles and, when
// nothing new has come, the last values with «von gestern». German UI, fictional data (home0460-fixture.js).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('FS1: Heute keeps the last values and says when they were fetched', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.healthDays = [{ date: day(-1), restingHr: 52, azm: 30, sleep: { asleepMin: 420, efficiency: 91 } }];
  d.tables.settings.push({ key: 'health', value: { connected: true, values: ['sleep', 'steps', 'azm', 'restingHr', 'hrvMs'], fetch: 'manual', lastSync: `${day(0)}T05:42:00.000Z` } });
  const T = await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const body = page.locator('[data-section="body"]');
  await expect(body.locator('[data-body-last] [data-body="pulse"] b')).toHaveText('52');
  await expect(body.locator('[data-body-last]')).toContainText('von gestern');
  await expect(body.locator('[data-fitbit-stand]')).toContainText(/Stand \d\d[:.]\d\d/);
  if (process.env.SHOTS) await body.scrollIntoViewIfNeeded(), await body.screenshot({ path: `${process.env.SHOTS}/heute-${info.project.name}.png` });
});

test('FS2: three days without values: the last ones show, marked with their day', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.healthDays = [{ date: day(-3), restingHr: 49, azm: 20, sleep: { asleepMin: 400, efficiency: 90 } }];
  d.tables.settings.push({ key: 'health', value: { connected: true, values: ['sleep', 'steps', 'azm', 'restingHr', 'hrvMs'], fetch: 'manual', lastSync: `${day(0)}T05:42:00.000Z` } });
  await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const last = page.locator('[data-section="body"] [data-body-last]');
  await expect(last.locator('[data-body="pulse"] b')).toHaveText('49');
  await expect(last).not.toContainText('von gestern');
  if (process.env.SHOTS) await last.locator('xpath=ancestor::section').screenshot({ path: `${process.env.SHOTS}/alt-${info.project.name}.png` });
});

test('FS3: only the active zone minutes are of today: the other values show the last one with its day, never a dash (Noah 7.11.2026 1a 2a)', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.healthDays = [
    { date: day(-1), restingHr: 54, sleep: { asleepMin: 180, efficiency: 94 } },
    { date: day(0), azm: 10 },
  ];
  d.tables.settings.push({ key: 'health', value: { connected: true, values: ['sleep', 'steps', 'azm', 'restingHr', 'hrvMs'], fetch: 'manual', lastSync: `${day(0)}T05:42:00.000Z` } });
  await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const body = page.locator('[data-section="body"]');
  await expect(body.locator('[data-body="pulse"] b')).toHaveText('54');
  await expect(body.locator('[data-body="pulse"]')).toContainText('von gestern');
  await expect(body.locator('[data-body="sleep"] b')).toHaveText('3 h 00');
  await expect(body.locator('[data-body="azm"] b')).toHaveText('10');
  await expect(body.locator('[data-body="azm"]')).toContainText('heute');
  await expect(body.locator('[data-body-hint]')).toContainText('Fitbit hat noch nicht alle Werte von heute geliefert');
  await expect(body.locator('[data-body-fetch]')).toHaveText('Jetzt holen');
  await expect(body.locator('dl b', { hasText: /^–$/ })).toHaveCount(0);
  if (process.env.SHOTS) await body.scrollIntoViewIfNeeded(), await body.screenshot({ path: `${process.env.SHOTS}/gemischt-${info.project.name}.png` });
});

// «Dein Körper heute» als Band, Schritt 3 (Noah 23.11.2026 «1-4a»): one quiet line when something stands out, «Heute nicht» sends it away.
// The 40 fictional days are written straight into the database (a backup of that size is not needed for this).
test('FS4: the resting pulse above the usual: one quiet line under the values, «Heute nicht» hides it for the day', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await ready(page);
  await put(page, {
    healthDays: Array.from({ length: 40 }, (_, i) => ({ date: addDays(TODAY, -i), restingHr: i < 3 ? 60 : 52, azm: 20, sleep: { asleepMin: 420, efficiency: 91 }, at: `${addDays(TODAY, -i)}T07:00:00Z` })),
    settings: [{ key: 'health', value: { connected: true, values: ['sleep', 'steps', 'azm', 'restingHr', 'hrvMs'], fetch: 'manual', lastSync: `${TODAY}T05:42:00.000Z` } }],
  });
  await page.reload();
  await ready(page);
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const body = page.locator('[data-section="body"]');
  const note = body.locator('[data-body-note]');
  await expect(note).toHaveCount(1);
  await expect(note).toHaveAttribute('data-body-note', 'pulse');
  await expect(note).toContainText('Ruhepuls');
  await expect(note).toContainText('über deinem Üblichen');
  if (process.env.SHOTS) await body.scrollIntoViewIfNeeded(), await body.screenshot({ path: `${process.env.SHOTS}/hinweis-${info.project.name}.png` });
  await note.locator('[data-body-note-no]').click();
  await expect(body.locator('[data-body-note]')).toHaveCount(0);
});
