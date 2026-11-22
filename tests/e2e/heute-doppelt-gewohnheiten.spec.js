// Noah 04.11.2026 «1a» (thread «Bereinigen: Doppeltes und Fehler auf Heute»): an activity that stands on top of Heute as a habit
// card is not shown a second time in «Aktiv heute»; a quiet line says which ones are up there. Without that habit it is back.
// Fictional data only (home0460-fixture.js, clock on Friday 9 October 2026).
import { test, expect } from './clock.js';
import { homeFixture, openHome } from './home0460-fixture.js';

const withHabits = (habits) => {
  const data = homeFixture();
  data.tables.settings.push({ key: 'homeHabits', value: habits });
  return data;
};

test('Aktiv heute leaves out the habits on top and names them in one line', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withHabits([{ kind: 'act', id: 'yoga' }, { kind: 'act', id: 'pushups' }]), hour: 9 });
  const habits = page.locator('[data-habits]');
  await expect(habits).toBeVisible();
  const acts = page.locator('[data-section="acts"]');
  await expect(acts).toBeVisible();
  await expect(acts.locator('[data-act="yoga"]')).toHaveCount(0);
  await expect(acts.locator('[data-act="pushups"]')).toHaveCount(0);
  await expect(acts.locator('[data-act]').first()).toBeVisible(); // the rest is still there
  await expect(acts.locator('[data-acts-up]')).toContainText(/Yoga/);
  if (process.env.SHOTS) {
    await acts.scrollIntoViewIfNeeded();
    await acts.screenshot({ path: `${process.env.SHOTS}/doppelt1-acts-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
});

test('without that habit the activity is back in Aktiv heute and no line stands', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: withHabits([{ kind: 'act', id: 'pushups' }]), hour: 9 });
  const acts = page.locator('[data-section="acts"]');
  await expect(acts.locator('[data-act="yoga"]')).toHaveCount(1);
  await expect(acts.locator('[data-act="pushups"]')).toHaveCount(0);
  await expect(acts.locator('[data-acts-up]')).toContainText(/Liegestütze/);
});
