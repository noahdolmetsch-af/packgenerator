// «Freunde mit eigenem Strava» (Noah 27.10.2026 «jederzeit umstellen», 1a 2a 3a): on the owner's Strava
// page the list of friends with «Entfernen» (asks, then «Rückgängig»), «Freund einladen» with the link and
// Strava's own limit; on a friend's phone the invite link says «Du wurdest eingeladen» and the login
// carries the invite. The server is answered by the test. Fictional names only.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

async function start(page, context, server, { key = true } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/strava/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    server.log.push({ step, body: req.postData() ? JSON.parse(req.postData()) : null });
    const body = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return body({ url: 'https://www.strava.com/oauth/authorize?client_id=1&state=x' });
    if (step === 'status') return body({ connected: true, athlete: { firstname: 'Beispiel' } });
    if (step === 'gear') return body({ bikes: [] });
    if (step === 'activities') return body({ page: 1, more: false, activities: [] });
    if (step === 'friends') return body({ friends: server.friends });
    if (step === 'invite') return body({ code: `${P}invite01`, until: '2026-11-03T10:00:00.000Z' });
    if (step === 'friend-remove') {
      server.friends = server.friends.filter((f) => f.id !== server.log.at(-1).body.id);
      return body({ inVercel: false });
    }
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/www\.strava\.com\/oauth\/authorize/, (route) => route.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<p>Strava</p>' }));
  await context.addInitScript((k) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    if (k && !localStorage.getItem('pg.strava.key')) localStorage.setItem('pg.strava.key', k);
  }, key ? `${P}key` : null);
  await page.goto('./');
  await ready(page);
}

// the phone's top bar comes back on scrolling up: put the row in the middle first, then tap
async function tapRemove(sec) {
  const btn = sec.locator('[data-friend="7777"]').getByRole('button', { name: 'Entfernen' });
  await btn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await btn.click();
}

test('Strava friends: list, remove with Undo, invite link with the Strava note', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const server = { log: [], friends: [{ id: '7777', name: 'Mia', since: '2026-10-20', connected: true, inVercel: false }] };
  await start(page, context, server);
  await page.goto('./#/bikes?tab=care&view=strava');
  const sec = page.locator('[data-section="strava-friends"]');
  await expect(sec.getByRole('heading', { name: 'Freunde mit eigenem Strava' })).toBeVisible();
  await expect(sec.locator('[data-friend="7777"]')).toContainText('Mia');
  await expect(sec.locator('[data-friend="7777"]')).toContainText('verbunden seit');
  await shot(page, info, 'FR1-liste');

  // invite: the link, copy, and Strava's own limit
  await sec.getByRole('button', { name: 'Freund einladen' }).click();
  await expect(sec.locator('[data-invite-link]')).toHaveValue(new RegExp(`invite=${P}invite01$`));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await expect(sec.getByRole('button', { name: 'Link kopieren' })).toBeVisible();
  await expect(sec.locator('[data-strava-limit]')).toContainText('nur eine Person');
  await sec.locator('[data-invite-link]').scrollIntoViewIfNeeded();
  await shot(page, info, 'FR2-einladen');

  // remove: asks first; «Rückgängig» keeps the friend; then remove for real
  await tapRemove(sec);
  await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click();
  await expect(sec.locator('[data-friend="7777"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(sec.locator('[data-friend="7777"]')).toBeVisible();
  await page.waitForTimeout(4600);
  expect(server.log.some((x) => x.step === 'friend-remove')).toBe(false);

  await tapRemove(sec);
  await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click();
  await expect.poll(() => server.log.find((x) => x.step === 'friend-remove')?.body, { timeout: 8000 }).toEqual({ id: '7777' });
  await expect(sec).toContainText('Nur du bist verbunden');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Strava friends: an invite link on a friend\'s phone says so and goes with the login', async ({ page, context }, info) => {
  const server = { log: [], friends: [] };
  await start(page, context, server, { key: false });
  await page.goto(`./#/bikes?tab=care&view=strava&invite=${P}invite01`);
  await expect(page.locator('[data-invited]')).toContainText('Du wurdest eingeladen');
  expect(page.url()).not.toContain('invite=');
  await shot(page, info, 'FR3-eingeladen');
  await page.getByRole('button', { name: 'Mit Strava verbinden' }).click();
  await expect.poll(() => server.log.find((x) => x.step === 'start')?.body?.invite).toBe(`${P}invite01`);
});
