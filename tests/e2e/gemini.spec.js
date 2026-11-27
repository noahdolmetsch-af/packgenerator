// «Frag Gemini» (Noah 23.11.2026 «1a 2a 3a 4b»): the third tab of the Assistant. Gemini is answered by the test itself;
// nothing goes to the real server. Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };

async function start(page, context, answer) {
  const asked = [];
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await context.route(/packgen-three\.vercel\.app\/api\/ask/, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const body = JSON.parse(route.request().postData() ?? '{}');
    asked.push(body);
    const a = await answer(body);
    return route.fulfill({ status: a.status ?? 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(a.body) });
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/assistent/gemini');
  return { asked, errors };
}

test('a question gets Gemini’s answer; only the question goes out; the hint says what goes out', async ({ page, context }) => {
  const { asked, errors } = await start(page, context, () => ({ body: { ok: true, text: 'Zwei dünne Schichten und eine Regenjacke.' } }));
  const g = page.locator('[data-gemini]');
  await expect(g.getByRole('heading', { name: T('Ask Gemini') })).toBeVisible();
  await expect(g.locator('[data-gemini-empty]')).toBeVisible();
  await expect(g.locator('[data-gemini-privacy]')).toContainText('Nur deine Frage');
  await g.locator('[data-gemini-q]').fill('Was ziehe ich bei 5 Grad an?');
  await g.locator('[data-gemini-ask]').click();
  await expect(g.locator('[data-gemini-answer]')).toContainText('Zwei dünne Schichten');
  await expect(g.locator('[data-gemini-answer]').getByText(T('Ask further at'))).toBeVisible();
  expect(asked).toHaveLength(1);
  expect(Object.keys(asked[0]).sort()).toEqual(['lang', 'mode', 'text', 'today']);
  expect(asked[0]).toMatchObject({ mode: 'ask', text: 'Was ziehe ich bei 5 Grad an?', lang: 'de' });
  expect(errors).toEqual([]);
});

test('a photo is made small, shown, sent and can be removed', async ({ page, context }) => {
  const { asked } = await start(page, context, () => ({ body: { ok: true, text: 'Das ist ein Bremsbelag.' } }));
  const g = page.locator('[data-gemini]');
  // a plain 2000 × 1500 picture made in the page, as a file
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 2000;
    c.height = 1500;
    const x = c.getContext('2d');
    x.fillStyle = '#7a8';
    x.fillRect(0, 0, 2000, 1500);
    const b = await new Promise((r) => c.toBlob(r, 'image/png'));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  await g.locator('[data-gemini-file]').setInputFiles({ name: 'teil.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await expect(g.locator('[data-gemini-thumb] img')).toBeVisible();
  await expect(g.locator('[data-gemini-privacy]')).toContainText('und dein Foto');
  await g.locator('[data-gemini-q]').fill('Was ist das?');
  await g.locator('[data-gemini-ask]').click();
  await expect(g.locator('[data-gemini-answer]')).toContainText('Bremsbelag');
  expect(asked[0].image.mime).toBe('image/jpeg');
  expect(asked[0].image.data.length).toBeGreaterThan(100);
  expect(asked[0].image.preview).toBeUndefined();
  await g.getByRole('button', { name: T('Remove the photo') }).click();
  await expect(g.locator('[data-gemini-thumb]')).toHaveCount(0);
});

test('when Gemini is busy the page says so and offers «Weiter fragen bei»', async ({ page, context }) => {
  await start(page, context, () => ({ status: 429, body: { ok: false, code: 'busy' } }));
  const g = page.locator('[data-gemini]');
  await g.locator('[data-gemini-q]').fill('Was hilft gegen eine quietschende Kette?');
  await g.locator('[data-gemini-ask]').click();
  await expect(g.locator('[data-gemini-error="busy"]')).toContainText('ausgelastet');
  await expect(g.locator('[data-gemini-error="busy"]').getByText(T('Ask further at'))).toBeVisible();
});

test('when Gemini cannot answer the page shows what the server saw, and the floating «Improve» button covers no service button', async ({ page, context }, info) => {
  await context.addInitScript(() => localStorage.setItem('ops.improve', '1')); // browser tests start without the floating button, this one wants it
  await start(page, context, () => ({ status: 502, body: { ok: false, code: 'ai_unavailable', tried: ['gemini-x:404', 'list:403'] } }));
  const g = page.locator('[data-gemini]');
  await g.locator('[data-gemini-q]').fill('Was war meine längste Tour?');
  await g.locator('[data-gemini-ask]').click();
  await expect(g.locator('[data-gemini-error="failed"]')).toContainText('gemini-x:404 list:403');
  await expect(g.locator('[data-gemini-detail]')).toContainText('502 ai_unavailable');
  if (info.project.name !== 'phone') return;
  // the result comes to the top of the screen, so the first service button is clear of the floating button (bottom left, above the bar)
  const fab = page.locator('[data-improve]');
  await expect(fab).toBeVisible();
  const service = g.locator('[data-service]').first();
  await expect.poll(async () => (await service.boundingBox()).y + (await service.boundingBox()).height, { timeout: 5000 }).toBeLessThan((await fab.boundingBox()).y);
});

test('«Mach es für mich» shows the plan first, writes only after «Ja, machen», and Undo takes it back', async ({ page, context }) => {
  await start(page, context, () => ({ body: { ok: true, actions: [{ kind: 'remind', text: 'Reifen pumpen', due: '2030-01-04' }, { kind: 'list', name: 'Wochenende', points: ['Sonnencreme', 'Snacks'] }] } }));
  const g = page.locator('[data-gemini]');
  await g.locator('[data-gemini-q]').fill('Erinnere mich am Freitag an die Reifen und mach eine Wochenende-Liste');
  await g.locator('[data-gemini-do]').click();
  const plan = g.locator('[data-gemini-plan]');
  await expect(plan).toContainText(T('I would do this:'));
  await expect(plan.locator('li')).toHaveCount(2);
  await expect(page.locator('.ftoast')).toHaveCount(0); // nothing is written, nothing is said yet
  await plan.locator('[data-gemini-no]').click();
  await expect(plan).toHaveCount(0);
  await g.locator('[data-gemini-do]').click();
  await g.locator('[data-gemini-ok]').click();
  await expect(plan).toHaveCount(0);
  const toast = page.locator('.ftoast');
  await expect(toast).toContainText('Reifen pumpen');
  await expect(toast).toContainText('Wochenende');
  await toast.locator('.undo').click();
  await expect(toast).toHaveCount(0);
});

test('the tab is in the Assistant and the answers of «Frag die App» can be read aloud', async ({ page, context }) => {
  await start(page, context, () => ({ body: { ok: true, text: 'x' } }));
  await expect(page.getByRole('tab', { name: T('Ask Gemini') })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: T('Ask the app') }).click();
  await expect(page).toHaveURL(/#\/assistent$/);
  await expect(page.getByRole('tab', { name: T('Ask Gemini') })).toHaveAttribute('aria-selected', 'false');
});
