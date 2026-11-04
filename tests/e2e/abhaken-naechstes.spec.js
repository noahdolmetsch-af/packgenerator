// «Aktiv und Auswerten» 7 (Noah 03.11.2026 Zusatz 5): after a tick the message says «Als Nächstes» with two taps:
// the history of that sport and the milestones. Fictional wall (wall-fixture.js), German UI, phone + desktop.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const D0 = '2026-10-09T07:52:00+02:00';
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await putWall(page);
  await expect(page.locator('[data-section="flow"] [data-act="pushups"]')).toBeVisible();
}

test('AN-1 after a tick the message offers the history of the sport and the milestones', async ({ page, context }, info) => {
  await open(page, context);
  await press(page.locator('[data-section="flow"] [data-act="pushups"]'), info);
  const next = page.locator('.ftoast [data-toast-next]');
  await expect(next).toBeVisible();
  await expect(next).toContainText(T('As next'));
  await expect(next.locator('a')).toHaveCount(2);
  await expect(next.locator('[data-next-to="#/flow/milestones"]')).toHaveText(T('Milestones'));
  await page.screenshot({ path: info.outputPath('an-abhaken.png') });
  await press(next.locator('a').first(), info);
  await expect(page).toHaveURL(/#\/flow\/sport\/act%3Apushups$/);
  await expect(page.locator('.ftoast')).toHaveCount(0); // a tap on a link closes the message
});

test('AN-2 «Rückgängig» still works with the new line', async ({ page, context }, info) => {
  await open(page, context);
  const push = page.locator('[data-section="flow"] [data-act="pushups"]');
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  await press(page.locator('.ftoast').getByRole('button', { name: T('Undo') }), info);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
});
